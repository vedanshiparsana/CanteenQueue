const GroupOrder = require("../models/GroupOrder");
const User = require("../models/User");
const Menu = require("../models/Menu");
const Order = require("../models/Order");

function generateGroupCode() {
    return "GRP" + Math.floor(1000 + Math.random() * 9000);
}


// CREATE GROUP
const createGroupOrder = async (req, res) => {
    try {
        const user = await User.findOne({
            userId: req.user.userId
        });

        if (!user) {
            return res.status(404).json({
                message: "User not found"
            });
        }

        let groupCode;

        while (true) {
            groupCode = generateGroupCode();

            const existing = await GroupOrder.findOne({ groupCode });

            if (!existing) {
                break;
            }
        }

        const group = await GroupOrder.create({
            groupCode,
            createdBy: user._id,
            members: [user._id],
            memberPayments: [{
                userId: user._id,
                amount: 0,
                paid: false
            }]
        });

        res.status(201).json({
            message: "Group order created",
            groupCode: group.groupCode,
            groupId: group._id
        });

    } catch (error) {
        res.status(500).json({
            message: "Error creating group order",
            error: error.message
        });
    }
};


// JOIN GROUP
const joinGroupOrder = async (req, res) => {
    try {
        const { groupCode } = req.body;

        const user = await User.findOne({
            userId: req.user.userId
        });

        if (!user) {
            return res.status(404).json({
                message: "User not found"
            });
        }

        const group = await GroupOrder.findOne({ groupCode });

        if (!group) {
            return res.status(404).json({
                message: "Group not found"
            });
        }

        if (group.status !== "Open") {
            return res.status(400).json({
                message: "Group is no longer open"
            });
        }

        const alreadyMember = group.members.some(
            member => member.toString() === user._id.toString()
        );

        if (alreadyMember) {
            return res.status(400).json({
                message: "You are already a member of this group"
            });
        }

        group.members.push(user._id);

        group.memberPayments.push({
            userId: user._id,
            amount: 0,
            paid: false
        });

        await group.save();

        res.json({
            message: "Joined group successfully",
            groupCode: group.groupCode
        });

    } catch (error) {
        res.status(500).json({
            message: "Error joining group",
            error: error.message
        });
    }
};


// GET GROUP
const getGroupOrder = async (req, res) => {
    try {
        const { groupCode } = req.params;

        const group = await GroupOrder.findOne({ groupCode })
            .populate("createdBy", "userId name email")
            .populate("members", "userId name email")
            .populate("items.menuId", "menuId name price");

        if (!group) {
            return res.status(404).json({
                message: "Group not found"
            });
        }

        res.json(group);

    } catch (error) {
        res.status(500).json({
            message: "Error getting group",
            error: error.message
        });
    }
};


// ADD ITEM TO GROUP
const addGroupItem = async (req, res) => {
    try {
        const { groupCode } = req.params;
        const { menuId, quantity } = req.body;

        const user = await User.findOne({
            userId: req.user.userId
        });

        if (!user) {
            return res.status(404).json({
                message: "User not found"
            });
        }

        const group = await GroupOrder.findOne({ groupCode });

        if (!group) {
            return res.status(404).json({
                message: "Group not found"
            });
        }

        const isMember = group.members.some(
            member => member.toString() === user._id.toString()
        );

        if (!isMember) {
            return res.status(403).json({
                message: "You are not a member of this group"
            });
        }

        if (group.status !== "Open") {
            return res.status(400).json({
                message: "Group is no longer open"
            });
        }

        const menu = await Menu.findById(menuId);

        if (!menu) {
            return res.status(404).json({
                message: "Menu item not found"
            });
        }

        if (!menu.isAvailable) {
            return res.status(400).json({
                message: "Menu item is not available"
            });
        }

        const item = group.items.find(
            item =>
                item.userId.toString() === user._id.toString() &&
                item.menuId.toString() === menuId
        );

        if (item) {
            item.quantity += quantity;
        } else {
            group.items.push({
                userId: user._id,
                menuId,
                quantity,
                price: menu.price
            });
        }

        group.totalAmount = group.items.reduce(
            (total, item) => total + item.price * item.quantity,
            0
        );

        const payment = group.memberPayments.find(
            payment =>
                payment.userId.toString() === user._id.toString()
        );

        if (payment) {
            payment.amount = group.items
                .filter(item =>
                    item.userId.toString() === user._id.toString()
                )
                .reduce(
                    (total, item) =>
                        total + item.price * item.quantity,
                    0
                );

            payment.paid = false;
        }

        await group.save();

        res.json({
            message: "Item added to group order",
            totalAmount: group.totalAmount
        });

    } catch (error) {
        res.status(500).json({
            message: "Error adding group item",
            error: error.message
        });
    }
};


// REMOVE OWN ITEM
const removeGroupItem = async (req, res) => {
    try {
        const { groupCode, menuId } = req.params;

        const user = await User.findOne({
            userId: req.user.userId
        });

        if (!user) {
            return res.status(404).json({
                message: "User not found"
            });
        }

        const group = await GroupOrder.findOne({ groupCode });

        if (!group) {
            return res.status(404).json({
                message: "Group not found"
            });
        }

        if (group.status !== "Open") {
            return res.status(400).json({
                message: "Group is no longer open"
            });
        }

        const oldLength = group.items.length;

        group.items = group.items.filter(item =>
            !(
                item.userId.toString() === user._id.toString() &&
                item.menuId.toString() === menuId
            )
        );

        if (group.items.length === oldLength) {
            return res.status(404).json({
                message: "Item not found"
            });
        }

        group.totalAmount = group.items.reduce(
            (total, item) => total + item.price * item.quantity,
            0
        );

        const payment = group.memberPayments.find(
            payment =>
                payment.userId.toString() === user._id.toString()
        );

        if (payment) {
            payment.amount = group.items
                .filter(item =>
                    item.userId.toString() === user._id.toString()
                )
                .reduce(
                    (total, item) =>
                        total + item.price * item.quantity,
                    0
                );

            payment.paid = false;
        }

        await group.save();

        res.json({
            message: "Item removed",
            totalAmount: group.totalAmount
        });

    } catch (error) {
        res.status(500).json({
            message: "Error removing item",
            error: error.message
        });
    }
};


// PAY OWN SHARE
const payGroupShare = async (req, res) => {
    try {
        const { groupCode } = req.body;

        const user = await User.findOne({
            userId: req.user.userId
        });

        if (!user) {
            return res.status(404).json({
                message: "User not found"
            });
        }

        const group = await GroupOrder.findOne({ groupCode });

        if (!group) {
            return res.status(404).json({
                message: "Group not found"
            });
        }

        const payment = group.memberPayments.find(
            payment =>
                payment.userId.toString() === user._id.toString()
        );

        if (!payment) {
            return res.status(403).json({
                message: "You are not a member of this group"
            });
        }

        if (payment.amount <= 0) {
            return res.status(400).json({
                message: "You have no items to pay for"
            });
        }

        if (payment.paid) {
            return res.status(400).json({
                message: "Your share is already paid"
            });
        }

        if (user.wallet < payment.amount) {
            return res.status(400).json({
                message: "Insufficient wallet balance"
            });
        }

        user.wallet -= payment.amount;

        payment.paid = true;

        await user.save();
        await group.save();

        const allPaid = group.memberPayments.every(
            payment => payment.paid || payment.amount === 0
        );

        if (allPaid) {
            group.status = "PaymentPending";
            await group.save();
        }

        res.json({
            message: "Your share paid successfully",
            paidAmount: payment.amount,
            remainingBalance: user.wallet,
            allMembersPaid: allPaid
        });

    } catch (error) {
        res.status(500).json({
            message: "Error processing payment",
            error: error.message
        });
    }
};


// CREATE FINAL ORDER
const createFinalGroupOrder = async (req, res) => {
    try {
        const {
            groupCode,
            pickupSlot
        } = req.body;

        const user = await User.findOne({
            userId: req.user.userId
        });

        if (!user) {
            return res.status(404).json({
                message: "User not found"
            });
        }

        const group = await GroupOrder.findOne({ groupCode });

        if (!group) {
            return res.status(404).json({
                message: "Group not found"
            });
        }

        if (
            group.createdBy.toString() !== user._id.toString()
        ) {
            return res.status(403).json({
                message: "Only group creator can create final order"
            });
        }

        if (group.items.length === 0) {
            return res.status(400).json({
                message: "Group order has no items"
            });
        }

        const allPaid = group.memberPayments.every(
            payment => payment.paid || payment.amount === 0
        );

        if (!allPaid) {
            return res.status(400).json({
                message: "All members must pay their share first"
            });
        }

        if (group.orderId) {
            return res.status(400).json({
                message: "Final order already created"
            });
        }

        const finalItems = group.items.map(item => ({
            menuId: item.menuId,
            quantity: item.quantity,
            price: item.price
        }));

        const orderId = "GRPORD" + Date.now();
        
        const order = await Order.create({
            orderId,
            userId: group.createdBy,
            isGroupOrder: true,
            groupCode: group.groupCode,
            participants: group.members,
            items: finalItems,
            totalAmount: group.totalAmount,
            paymentStatus: "paid",
            orderStatus: "Received",
            pickupSlot
        });

        group.orderId = order.orderId;
        group.status = "Completed";

        await group.save();

        res.status(201).json({
            message: "Group order created successfully",
            orderId: order.orderId,
            totalAmount: order.totalAmount,
            paymentStatus: order.paymentStatus,
            orderStatus: order.orderStatus
        });

    } catch (error) {
        res.status(500).json({
            message: "Error creating final group order",
            error: error.message
        });
    }
};


module.exports = {
    createGroupOrder,
    joinGroupOrder,
    getGroupOrder,
    addGroupItem,
    removeGroupItem,
    payGroupShare,
    createFinalGroupOrder
};