const GroupOrder = require("../models/Group");
const User = require("../models/User");
const Menu = require("../models/Menu");
const Order = require("../models/Order");
const Transaction = require("../models/Transaction");
const { randomUUID } = require("crypto");
const {
    reservePickupSlot,
    releasePickupSlot
} = require("../utils/pickupSlotReservation");

function generateGroupCode() {
    return "GRP" + Math.floor(1000 + Math.random() * 9000);
}

function updateEqualMemberShares(group) {
    group.totalAmount = Number(group.items.reduce(
        (total, item) => total + item.price * item.quantity,
        0
    ).toFixed(2));

    const memberIds = group.members.map(member =>
        (member._id || member).toString()
    );
    const existingPayments = new Map(
        group.memberPayments
            .filter(payment => payment.userId)
            .map(payment => [
                (payment.userId._id || payment.userId).toString(),
                payment
            ])
    );
    const totalCents = Math.round(group.totalAmount * 100);
    const baseShareCents = Math.floor(totalCents / memberIds.length);
    const extraCents = totalCents % memberIds.length;

    group.memberPayments = memberIds.map((memberId, index) => {
        const payment = existingPayments.get(memberId) || {
            userId: memberId,
            paid: false
        };

        payment.userId = memberId;
        payment.amount = (
            baseShareCents + (index < extraCents ? 1 : 0)
        ) / 100;
        return payment;
    });
}


// =========================================================
// CREATE GROUP
// =========================================================

const createGroupOrder = async (req, res) => {
    try {
        const { groupName } = req.body;

        if (!groupName || !groupName.trim()) {
            return res.status(400).json({
                message: "Group name is required"
            });
        }

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

            const existing =
                await GroupOrder.findOne({ groupCode });

            if (!existing) {
                break;
            }
        }

        const group = await GroupOrder.create({
            groupName: groupName.trim(),
            groupCode,
            createdBy: user.id,
            members: [user.id],
            memberPayments: [{
                userId: user.id,
                amount: 0,
                paid: false
            }]
        });

        res.status(201).json({
            message: "Group order created",
            groupName: group.groupName,
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


// =========================================================
// JOIN GROUP
// =========================================================

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

        const group = await GroupOrder.findOne({
            groupCode: groupCode.trim().toUpperCase()
        });

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

        if (group.memberPayments.some(payment => payment.paid)) {
            return res.status(400).json({
                message: "The group is locked because a member has already paid"
            });
        }

        const alreadyMember = group.members.some(
            member =>
                member.toString() === user.id.toString()
        );

        if (alreadyMember) {
            return res.status(400).json({
                message: "You are already a member of this group"
            });
        }

        group.members.push(user.id);

        updateEqualMemberShares(group);

        await group.save();

        res.json({
            message: "Joined group successfully",
            groupName: group.groupName,
            groupCode: group.groupCode,
            groupId: group._id
        });

    } catch (error) {
        res.status(500).json({
            message: "Error joining group",
            error: error.message
        });
    }
};


// =========================================================
// GET MY GROUPS
// =========================================================

const getMyGroups = async (req, res) => {
    try {
        const user = await User.findOne({
            userId: req.user.userId
        });

        if (!user) {
            return res.status(404).json({
                success: false,
                message: "User not found"
            });
        }

        const groups = await GroupOrder.find({
            $or: [
                { createdBy: user._id },
                { members: user._id }
            ]
        })
            .select(
                "groupName groupCode createdBy members totalAmount status orderId items memberPayments createdAt"
            )
            .populate(
                "createdBy",
                "name userId email"
            )
            .populate(
                "members",
                "name userId email"
            )
            .sort({
                createdAt: -1
            });

        res.json({
            success: true,
            data: groups
        });

    } catch (error) {
        console.error(
            "getMyGroups:",
            error
        );

        res.status(500).json({
            success: false,
            message: "Unable to load your groups"
        });
    }
};

const deleteGroup = async (req, res) => {
    try {
        const user = await User.findOne({
            userId: req.user.userId
        });

        if (!user) {
            return res.status(404).json({
                success: false,
                message: "User not found"
            });
        }

        const group = await GroupOrder.findOne({
            groupCode: req.params.groupCode.trim().toUpperCase()
        });

        if (!group) {
            return res.status(404).json({
                success: false,
                message: "Group not found"
            });
        }

        if (group.createdBy.toString() !== user._id.toString()) {
            return res.status(403).json({
                success: false,
                message: "Only the group creator can delete this group."
            });
        }

        const hasPaidShares = (group.memberPayments || []).some(payment => payment.paid);
        if (hasPaidShares) {
            return res.status(409).json({
                success: false,
                message: "This group cannot be deleted because members have already paid."
            });
        }

        const hasOrders = Boolean(group.orderId) || await Order.exists({
            isGroupOrder: true,
            groupCode: group.groupCode
        });

        if (hasOrders) {
            return res.status(409).json({
                success: false,
                message: "This group cannot be deleted because it has order history."
            });
        }

        const deletion = await GroupOrder.deleteOne({
            _id: group._id,
            createdBy: user._id,
            orderId: null,
            "memberPayments.paid": { $ne: true }
        });

        if (deletion.deletedCount !== 1) {
            return res.status(409).json({
                success: false,
                message: "The group changed before it could be deleted. Refresh and try again."
            });
        }

        return res.json({
            success: true,
            message: "Group deleted successfully."
        });
    } catch (error) {
        console.error("deleteGroup:", error);
        return res.status(500).json({
            success: false,
            message: "Unable to delete this group."
        });
    }
};


// =========================================================
// GET GROUP
// =========================================================

const getGroupOrder = async (req, res) => {
    try {
        const user = req.user;

        const group = await GroupOrder.findOne({
            groupCode:
                req.params.groupCode
                    .trim()
                    .toUpperCase()
        })
            .populate(
                "createdBy",
                "name userId email"
            )
            .populate(
                "members",
                "name userId email"
            )
            .populate(
                "items.menuId",
                "name price category description isAvailable"
            )
            .populate(
                "items.userId",
                "name userId"
            )
            .populate(
                "memberPayments.userId",
                "name userId email"
            )
            .populate(
                "pickupSlot.slotId",
                "date startTime endTime capacity bookedCount isActive"
            );

        if (!group) {
            return res.status(404).json({
                success: false,
                message: "Group not found."
            });
        }

        const isMember =
            group.members.some(
                member =>
                    member._id.toString() ===
                    user.id.toString()
            );

        const isCreator =
            group.createdBy?._id?.toString() ===
            user.id.toString();

        const isPrivileged =
            ["admin", "staff"].includes(
                user.role
            );

        if (
            !isMember &&
            !isCreator &&
            !isPrivileged
        ) {
            return res.status(403).json({
                success: false,
                message:
                    "You are not allowed to view this group."
            });
        }

        const orders = await Order.find({
            groupCode: group.groupCode
        })
            .populate("userId", "name userId email")
            .populate("participants", "name userId email")
            .populate("memberPayments.userId", "name userId email")
            .populate(
                "items.menuId",
                "name price category description isAvailable"
            )
            .populate(
                "pickupSlot.slotId",
                "date startTime endTime capacity bookedCount isActive"
            )
            .sort({ createdAt: -1 });

        if (
            ["Open", "PaymentPending"].includes(group.status) &&
            !group.orderId
        ) {
            updateEqualMemberShares(group);
        }

        const groupData = group.toObject();
        const currentMemberPayment = group.memberPayments.find(
            payment => {
                const paymentUserId = payment.userId?._id || payment.userId;
                return paymentUserId?.toString() === user.id.toString();
            }
        );
        groupData.currentMemberPayment = currentMemberPayment || null;
        groupData.orders = orders;

        return res.json({
            success: true,
            data: groupData
        });

    } catch (error) {
        console.error(
            "getGroupOrder:",
            error
        );

        return res.status(500).json({
            success: false,
            message: "Unable to load group."
        });
    }
};


// =========================================================
// ADD ITEM TO GROUP
// =========================================================

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

        const group = await GroupOrder.findOne({
            groupCode
        });

        if (!group) {
            return res.status(404).json({
                message: "Group not found"
            });
        }

        const isMember = group.members.some(
            member =>
                member.toString() ===
                user.id.toString()
        );

        if (!isMember) {
            return res.status(403).json({
                message:
                    "You are not a member of this group"
            });
        }

        if (group.status !== "Open") {
            return res.status(400).json({
                message: "Group is no longer open"
            });
        }

        if (group.memberPayments.some(payment => payment.paid)) {
            return res.status(400).json({
                message: "The group is locked because a member has already paid"
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
                message:
                    "Menu item is not available"
            });
        }

        const item = group.items.find(
            item =>
                item.userId.toString() ===
                    user.id.toString() &&
                item.menuId.toString() ===
                    menuId
        );

        if (item) {
            item.quantity += quantity;
        } else {
            group.items.push({
                userId: user.id,
                menuId,
                quantity,
                price: menu.price
            });
        }

        updateEqualMemberShares(group);

        await group.save();

        res.json({
            message:
                "Item added to group order",
            totalAmount:
                group.totalAmount
        });

    } catch (error) {
        res.status(500).json({
            message:
                "Error adding group item",
            error: error.message
        });
    }
};


// =========================================================
// REMOVE OWN ITEM
// =========================================================

const removeGroupItem = async (req, res) => {
    try {
        const {
            groupCode,
            menuId
        } = req.params;

        const user = await User.findOne({
            userId: req.user.userId
        });

        if (!user) {
            return res.status(404).json({
                message: "User not found"
            });
        }

        const group =
            await GroupOrder.findOne({
                groupCode
            });

        if (!group) {
            return res.status(404).json({
                message: "Group not found"
            });
        }

        if (group.status !== "Open") {
            return res.status(400).json({
                message:
                    "Group is no longer open"
            });
        }

        if (group.memberPayments.some(payment => payment.paid)) {
            return res.status(400).json({
                message: "The group is locked because a member has already paid"
            });
        }

        const oldLength =
            group.items.length;

        group.items =
            group.items.filter(item =>
                !(
                    item.userId.toString() ===
                        user.id.toString() &&
                    item.menuId.toString() ===
                        menuId
                )
            );

        if (
            group.items.length ===
            oldLength
        ) {
            return res.status(404).json({
                message: "Item not found"
            });
        }

        updateEqualMemberShares(group);

        await group.save();

        res.json({
            message: "Item removed",
            totalAmount:
                group.totalAmount
        });

    } catch (error) {
        res.status(500).json({
            message:
                "Error removing item",
            error: error.message
        });
    }
};


// =========================================================
// PAY OWN SHARE
// =========================================================

const payGroupShare = async (req, res) => {
    try {
        const groupCode = String(req.body.groupCode || "")
            .trim()
            .toUpperCase();

        if (!groupCode) {
            return res.status(400).json({
                message: "Group code is required"
            });
        }

        const user = await User.findOne({
            userId: req.user.userId
        });

        if (!user) {
            return res.status(404).json({
                message: "User not found"
            });
        }

        const group =
            await GroupOrder.findOne({
                groupCode
            });

        if (!group) {
            return res.status(404).json({
                message: "Group not found"
            });
        }

        if (group.status !== "Open" || group.orderId) {
            return res.status(400).json({
                message: "Group shares can only be paid before the order is placed"
            });
        }

        updateEqualMemberShares(group);
        const payment =
            group.memberPayments.find(
                payment =>
                    payment.userId.toString() ===
                    user.id.toString()
            );

        if (!payment) {
            return res.status(403).json({
                message:
                    "You are not a member of this group"
            });
        }

        if (payment.amount <= 0) {
            return res.status(400).json({
                message:
                    "You have no items to pay for"
            });
        }

        if (payment.paid) {
            return res.status(400).json({
                message:
                    "Your share is already paid"
            });
        }

        if (
            user.wallet <
            payment.amount
        ) {
            return res.status(400).json({
                message:
                    "Insufficient wallet balance"
            });
        }

        await group.save();

        const debitedUser = await User.findOneAndUpdate(
            {
                _id: user._id,
                wallet: { $gte: payment.amount }
            },
            {
                $inc: { wallet: -payment.amount }
            },
            { new: true }
        );

        if (!debitedUser) {
            return res.status(400).json({
                message: "Insufficient wallet balance"
            });
        }

        const paymentResult = await GroupOrder.updateOne(
            {
                _id: group._id,
                status: "Open",
                memberPayments: {
                    $elemMatch: {
                        userId: user._id,
                        paid: false
                    }
                }
            },
            {
                $set: {
                    "memberPayments.$.paid": true
                }
            }
        );

        if (paymentResult.modifiedCount !== 1) {
            await User.updateOne(
                { _id: user._id },
                { $inc: { wallet: payment.amount } }
            );
            return res.status(409).json({
                message: "Your share was already paid or the group is no longer accepting payments"
            });
        }

        const updatedGroup = await GroupOrder.findById(group._id);
        const allPaid = updatedGroup.memberPayments.every(
            memberPayment => memberPayment.paid || memberPayment.amount === 0
        );

        if (allPaid) {
            await GroupOrder.updateOne(
                { _id: group._id, status: "Open" },
                { $set: { status: "PaymentPending" } }
            );
        }

        await Transaction.create({
            transactionId: randomUUID(),
            userId: user._id,
            groupCode: group.groupCode,
            amount: payment.amount,
            paymentMethod: "group_split"
        });

        res.json({
            message:
                "Your share paid successfully",
            paidAmount:
                payment.amount,
            remainingBalance:
                debitedUser.wallet,
            allMembersPaid:
                allPaid
        });

    } catch (error) {
        res.status(500).json({
            message:
                "Error processing payment",
            error: error.message
        });
    }
};


// =========================================================
// CREATE FINAL ORDER
// =========================================================

const createFinalGroupOrder = async (req, res) => {
    try {
        const {
            groupCode,
            pickupSlot
        } = req.body;
        const normalizedGroupCode = String(groupCode || "")
            .trim()
            .toUpperCase();

        if (!normalizedGroupCode || !pickupSlot?.slotId) {
            return res.status(400).json({
                message: "Group code and pickup slot are required"
            });
        }

        const user = await User.findOne({
            userId: req.user.userId
        });

        if (!user) {
            return res.status(404).json({
                message: "User not found"
            });
        }

        const group =
            await GroupOrder.findOne({
                groupCode: normalizedGroupCode
            });

        if (!group) {
            return res.status(404).json({
                message: "Group not found"
            });
        }

        const isMember = group.members.some(
            member => member.toString() === user.id.toString()
        );

        if (!isMember) {
            return res.status(403).json({
                message: "Only group members can place this order"
            });
        }

        if (group.status !== "PaymentPending") {
            return res.status(400).json({
                message: "All group members must pay their share before placing the order"
            });
        }

        if (group.items.length === 0) {
            return res.status(400).json({
                message:
                    "Group order has no items"
            });
        }

        if (group.orderId) {
            return res.status(400).json({
                message: "This group order has already been placed"
            });
        }

        const menuIds = [...new Set(
            group.items.map(item => item.menuId.toString())
        )];
        const availableMenuItems = await Menu.find({
            _id: { $in: menuIds },
            isAvailable: true
        }).select("_id");

        if (availableMenuItems.length !== menuIds.length) {
            return res.status(400).json({
                message: "One or more group items are no longer available"
            });
        }

        const allPaid =
            group.memberPayments.every(
                payment =>
                    payment.paid ||
                    payment.amount === 0
            );

        if (!allPaid) {
            return res.status(400).json({
                message: "All group members must pay their share before placing the order"
            });
        }

        const finalItems =
            group.items.map(item => ({
                menuId: item.menuId,
                quantity: item.quantity,
                price: item.price
            }));
        const totalAmount = finalItems.reduce(
            (total, item) => total + item.price * item.quantity,
            0
        );
        const roundedTotalAmount = Number(totalAmount.toFixed(2));
        const orderMemberPayments = group.memberPayments.map(payment => ({
            userId: payment.userId,
            amount: payment.amount,
            paid: payment.paid
        }));

        const orderId =
            "GRPORD" + Date.now();

        await reservePickupSlot(pickupSlot.slotId);

        let order;
        try {
            order = await Order.create({
                orderId,
                userId: user.id,
                isGroupOrder: true,
                groupCode:
                    group.groupCode,
                participants:
                    group.members,
                memberPayments: orderMemberPayments,
                items: finalItems,
                totalAmount: roundedTotalAmount,
                paymentStatus: "paid",
                orderStatus: "Received",
                pickupSlot
            });

            const updateResult = await GroupOrder.updateOne(
                {
                    _id: group._id,
                    orderId: null,
                    status: "PaymentPending"
                },
                {
                    $set: {
                        orderId: null,
                        status: "Open",
                        totalAmount: 0,
                        items: [],
                        memberPayments: group.members.map(userId => ({
                            userId,
                            amount: 0,
                            paid: false
                        })),
                        "pickupSlot.slotId": pickupSlot.slotId
                    }
                }
            );

            if (updateResult.modifiedCount !== 1) {
                const error = new Error("This group order has already been placed");
                error.status = 409;
                throw error;
            }

        } catch (error) {
            if (order) {
                await Order.deleteOne({ _id: order._id });
            }
            await releasePickupSlot(pickupSlot.slotId);
            throw error;
        }

        res.status(201).json({
            message:
                "Group order placed successfully",
            orderId:
                order.orderId,
            totalAmount:
                roundedTotalAmount,
            paymentStatus:
                order.paymentStatus,
            orderStatus:
                order.orderStatus
        });

    } catch (error) {
        res.status(error.status || 500).json({
            message:
                "Error creating final group order",
            error: error.message
        });
    }
};


module.exports = {
    createGroupOrder,
    joinGroupOrder,
    getMyGroups,
    deleteGroup,
    getGroupOrder,
    addGroupItem,
    removeGroupItem,
    payGroupShare,
    createFinalGroupOrder
};