const mongoose = require("mongoose");

const Order = require("../models/Order");
const User = require("../models/User");
const Menu = require("../models/Menu");
const Cart = require("../models/Cart");
const Transaction = require("../models/Transaction");
const { randomUUID } = require("crypto");
const {
    reservePickupSlot,
    releasePickupSlot
} = require("../utils/pickupSlotReservation");


// =========================================================
// POPULATE ORDER
// =========================================================

const populateOrder = (query) => {
    return query
        .populate(
            "userId",
            "name userId email phone_no role"
        )
        .populate(
            "participants",
            "name userId email"
        )
        .populate(
            "memberPayments.userId",
            "name userId email"
        )
        .populate(
            "items.menuId",
            "name price category description isAvailable"
        )
        .populate(
            "pickupSlot.slotId",
            "date startTime endTime capacity bookedCount isActive"
        );
};


// =========================================================
// CREATE ORDER
// POST /api/orders
// =========================================================

const createOrder = async (
    req,
    res
) => {

    try {

        const user = req.user;


        const {
            orderId,
            items,
            pickupSlot
        } = req.body;


        // -------------------------------------------------
        // ORDER ID
        // -------------------------------------------------

        if (!orderId) {

            return res.status(400).json({

                success: false,

                message:
                    "Order ID is required."
            });
        }


        // -------------------------------------------------
        // ITEMS
        // -------------------------------------------------

        if (
            !Array.isArray(items) ||
            items.length === 0
        ) {

            return res.status(400).json({

                success: false,

                message:
                    "At least one order item is required."
            });
        }


        // -------------------------------------------------
        // PICKUP SLOT
        // -------------------------------------------------

        if (!pickupSlot?.slotId) {

            return res.status(400).json({

                success: false,

                message:
                    "Pickup slot is required."
            });
        }


        // -------------------------------------------------
        // GET MENU ITEMS
        // -------------------------------------------------

        const menuIds = items.map(
            (item) =>
                item.menuId
        );


        const menuItems =
            await Menu.find({
                _id: {
                    $in: menuIds
                },

                isAvailable: true
            });


        if (
            menuItems.length !==
            menuIds.length
        ) {

            return res.status(400).json({

                success: false,

                message:
                    "One or more menu items are unavailable."
            });
        }


        // -------------------------------------------------
        // NORMALIZE ITEMS
        // -------------------------------------------------

        const normalizedItems = [];

        let totalAmount = 0;


        for (
            const item of items
        ) {

            const menuItem =
                menuItems.find(
                    (menu) =>
                        menu._id.toString() ===
                        item.menuId.toString()
                );


            const quantity =
                Number(
                    item.quantity
                );


            if (
                !menuItem ||
                !Number.isInteger(
                    quantity
                ) ||
                quantity < 1
            ) {

                return res.status(400).json({

                    success: false,

                    message:
                        "Invalid order item."
                });
            }


            const price =
                Number(
                    menuItem.price
                );


            totalAmount +=
                price * quantity;


            normalizedItems.push({

                menuId:
                    menuItem._id,

                quantity,

                price
            });
        }


        // -------------------------------------------------
        // RESERVE PICKUP SLOT
        // -------------------------------------------------

        await reservePickupSlot(
            pickupSlot.slotId
        );


        // -------------------------------------------------
        // CREATE ORDER
        // -------------------------------------------------

        try {

            const order =
                await Order.create({

                    orderId,

                    userId:
                        user.id,

                    isGroupOrder:
                        false,

                    items:
                        normalizedItems,

                    totalAmount,

                    paymentStatus:
                        "pending",

                    orderStatus:
                        "AwaitingPayment",

                    pickupSlot: {

                        slotId:
                            pickupSlot.slotId
                    }
                });


            // -------------------------------------------------
            // CLEAR CART
            // -------------------------------------------------

            await Cart.findOneAndUpdate(
                {
                    userId:
                        user.id
                },
                {
                    $set: {

                        items: [],

                        runningTotal: 0
                    }
                }
            );


            // -------------------------------------------------
            // POPULATE ORDER
            // -------------------------------------------------

            const populatedOrder =
                await populateOrder(
                    Order.findById(
                        order._id
                    )
                );


            return res.status(201).json({

                success: true,

                message:
                    "Order created successfully.",

                data:
                    populatedOrder
            });


        } catch (error) {

            // Order creation failed after slot
            // was reserved, so release it.

            await releasePickupSlot(
                pickupSlot.slotId
            );

            throw error;
        }


    } catch (error) {

        console.error(
            "createOrder:",
            error
        );


        return res.status(400).json({

            success: false,

            message:
                error.message ||
                "Unable to create order."
        });
    }
};


// =========================================================
// GET MY ORDERS
// GET /api/orders/my
// =========================================================

const getMyOrders = async (
    req,
    res
) => {

    try {

        const user = req.user;


        const orders =
            await populateOrder(
                Order.find({

                    $or: [

                        {
                            userId:
                                user.id
                        },

                        {
                            participants:
                                user.id
                        }
                    ]

                }).sort({
                    createdAt: -1
                })
            );


        return res.json({

            success: true,

            count:
                orders.length,

            data:
                orders
        });


    } catch (error) {

        console.error(
            "getMyOrders:",
            error
        );


        return res.status(500).json({

            success: false,

            message:
                "Unable to load orders."
        });
    }
};


// =========================================================
// GET ORDER BY ID
// GET /api/orders/:id
// =========================================================

const getOrderById = async (
    req,
    res
) => {

    try {

        const user = req.user;

        const orderIdParam =
            req.params.id;

        let orderQuery;


        // -------------------------------------------------
        // FIND ORDER
        // -------------------------------------------------
        // Custom IDs look like:
        // ORD1791043351404
        //
        // MongoDB _id looks like:
        // 68xxxxxxxxxxxxxxxxxxxxxx
        //
        // Do not send a custom orderId into the _id
        // condition because Mongoose will try to cast it
        // to ObjectId and throw a CastError.
        // -------------------------------------------------

        if (
            mongoose.Types.ObjectId.isValid(
                orderIdParam
            )
        ) {

            orderQuery =
                Order.findOne({

                    $or: [

                        {
                            _id:
                                orderIdParam
                        },

                        {
                            orderId:
                                orderIdParam
                        }
                    ]
                });

        } else {

            orderQuery =
                Order.findOne({

                    orderId:
                        orderIdParam
                });
        }


        const order =
            await populateOrder(
                orderQuery
            );


        // -------------------------------------------------
        // ORDER NOT FOUND
        // -------------------------------------------------

        if (!order) {

            return res.status(404).json({

                success: false,

                message:
                    "Order not found."
            });
        }


        // -------------------------------------------------
        // CHECK OWNER
        // -------------------------------------------------

        const isOwner =
            order.userId?._id?.toString() ===
            user.id.toString();


        // -------------------------------------------------
        // CHECK PARTICIPANT
        // -------------------------------------------------

        const isParticipant =
            order.participants?.some(
                (participant) =>
                    participant?._id?.toString() ===
                    user.id.toString()
            );


        // -------------------------------------------------
        // CHECK ADMIN / STAFF
        // -------------------------------------------------

        const isPrivileged =
            [
                "admin",
                "staff"
            ].includes(
                user.role
            );


        // -------------------------------------------------
        // AUTHORIZATION
        // -------------------------------------------------

        if (
            !isOwner &&
            !isParticipant &&
            !isPrivileged
        ) {

            return res.status(403).json({

                success: false,

                message:
                    "You are not allowed to view this order."
            });
        }


        // -------------------------------------------------
        // RESPONSE
        // -------------------------------------------------

        return res.json({

            success: true,

            data:
                order
        });


    } catch (error) {

        console.error(
            "getOrderById:",
            error
        );


        return res.status(500).json({

            success: false,

            message:
                "Unable to load order."
        });
    }
};


// =========================================================
// GET ALL ORDERS
// GET /api/orders
// =========================================================

const getAllOrders = async (
    req,
    res
) => {

    try {

        const orders =
            await populateOrder(
                Order.find().sort({
                    createdAt: -1
                })
            );


        return res.json({

            success: true,

            count:
                orders.length,

            data:
                orders
        });


    } catch (error) {

        console.error(
            "getAllOrders:",
            error
        );


        return res.status(500).json({

            success: false,

            message:
                "Unable to load orders."
        });
    }
};


// =========================================================
// UPDATE ORDER STATUS
// PUT /api/orders/:id/status
// =========================================================

const updateOrderStatus = async (
    req,
    res
) => {

    try {

        const {
            status
        } = req.body;


        const validStatuses = [

            "Received",

            "Preparing",

            "Ready",

            "Completed",

            "Cancelled"
        ];


        if (
            !validStatuses.includes(
                status
            )
        ) {

            return res.status(400).json({

                success: false,

                message:
                    "Invalid order status."
            });
        }


        const orderIdParam =
            req.params.id;

        let order;


        // -------------------------------------------------
        // FIND ORDER
        // -------------------------------------------------

        if (
            mongoose.Types.ObjectId.isValid(
                orderIdParam
            )
        ) {

            order =
                await Order.findOne({

                    $or: [

                        {
                            _id:
                                orderIdParam
                        },

                        {
                            orderId:
                                orderIdParam
                        }
                    ]
                });

        } else {

            order =
                await Order.findOne({

                    orderId:
                        orderIdParam
                });
        }


        if (!order) {

            return res.status(404).json({

                success: false,

                message:
                    "Order not found."
            });
        }


        const previousStatus =
            order.orderStatus;


        // -------------------------------------------------
        // UPDATE STATUS
        // -------------------------------------------------

        order.orderStatus =
            status;


        // -------------------------------------------------
        // SAVE
        // -------------------------------------------------

        await order.save();


        // -------------------------------------------------
        // RELEASE SLOT WHEN CANCELLED
        // -------------------------------------------------

        if (
            status === "Cancelled" &&
            previousStatus !== "Cancelled"
        ) {

            await releasePickupSlot(
                order.pickupSlot?.slotId
            );
        }


        // -------------------------------------------------
        // GET UPDATED ORDER
        // -------------------------------------------------

        const updatedOrder =
            await populateOrder(
                Order.findById(
                    order._id
                )
            );


        return res.json({

            success: true,

            message:
                "Order status updated.",

            data:
                updatedOrder
        });


    } catch (error) {

        console.error(
            "updateOrderStatus:",
            error
        );


        return res.status(400).json({

            success: false,

            message:
                error.message ||
                "Unable to update order status."
        });
    }
};


// =========================================================
// UPDATE PICKUP SLOT
// PUT /api/orders/:id/pickup-slot
// =========================================================

const updatePickupSlot = async (
    req,
    res
) => {

    try {

        const user = req.user;


        const {
            slotId
        } = req.body;


        if (!slotId) {

            return res.status(400).json({

                success: false,

                message:
                    "Pickup slot is required."
            });
        }


        const orderIdParam =
            req.params.id;

        let order;


        // -------------------------------------------------
        // FIND ORDER
        // -------------------------------------------------

        if (
            mongoose.Types.ObjectId.isValid(
                orderIdParam
            )
        ) {

            order =
                await Order.findOne({

                    $or: [

                        {
                            _id:
                                orderIdParam
                        },

                        {
                            orderId:
                                orderIdParam
                        }
                    ]
                });

        } else {

            order =
                await Order.findOne({

                    orderId:
                        orderIdParam
                });
        }


        if (!order) {

            return res.status(404).json({

                success: false,

                message:
                    "Order not found."
            });
        }


        // -------------------------------------------------
        // CHECK OWNER
        // -------------------------------------------------

        const isOwner =
            order.userId.toString() ===
            user.id.toString();

        // -------------------------------------------------
        // CHECK ADMIN / STAFF
        // -------------------------------------------------

        const isPrivileged =
            [
                "admin",
                "staff"
            ].includes(
                user.role
            );


        if (
            !isOwner &&
            !isPrivileged
        ) {

            return res.status(403).json({

                success: false,

                message:
                    "You are not allowed to update this order."
            });
        }


        // -------------------------------------------------
        // ONLY RECEIVED ORDERS
        // -------------------------------------------------

        if (order.orderStatus !== "Received" || order.paymentStatus !== "paid") {

            return res.status(400).json({

                success: false,

                message:
                    "Pickup slot can only be changed for a paid order that is Received."
            });
        }


        const oldSlotId =
            order.pickupSlot?.slotId;


        // -------------------------------------------------
        // SAME SLOT
        // -------------------------------------------------

        if (
            oldSlotId?.toString() ===
            slotId.toString()
        ) {

            return res.json({

                success: true,

                message:
                    "Pickup slot is already selected.",

                data:
                    order
            });
        }


        // -------------------------------------------------
        // RESERVE NEW SLOT
        // -------------------------------------------------

        await reservePickupSlot(
            slotId
        );


        try {

            order.pickupSlot = {

                slotId:
                    slotId
            };


            await order.save();


            // Release old slot after successful save.

            await releasePickupSlot(
                oldSlotId
            );


        } catch (error) {

            // New slot was reserved but order update failed.

            await releasePickupSlot(
                slotId
            );

            throw error;
        }


        // -------------------------------------------------
        // GET UPDATED ORDER
        // -------------------------------------------------

        const updatedOrder =
            await populateOrder(
                Order.findById(
                    order._id
                )
            );


        return res.json({

            success: true,

            message:
                "Pickup slot updated.",

            data:
                updatedOrder
        });


    } catch (error) {

        console.error(
            "updatePickupSlot:",
            error
        );


        return res.status(400).json({

            success: false,

            message:
                error.message ||
                "Unable to update pickup slot."
        });
    }
};


// =========================================================
// CANCEL ORDER
// PUT /api/orders/:id/cancel
// =========================================================

const cancelOrder = async (
    req,
    res
) => {

    try {

        const user = req.user;

        const orderIdParam =
            req.params.id;

        let order;


        // -------------------------------------------------
        // FIND ORDER
        // -------------------------------------------------

        if (
            mongoose.Types.ObjectId.isValid(
                orderIdParam
            )
        ) {

            order =
                await Order.findOne({

                    $or: [

                        {
                            _id:
                                orderIdParam
                        },

                        {
                            orderId:
                                orderIdParam
                        }
                    ]
                });

        } else {

            order =
                await Order.findOne({

                    orderId:
                        orderIdParam
                });
        }


        // -------------------------------------------------
        // ORDER NOT FOUND
        // -------------------------------------------------

        if (!order) {

            return res.status(404).json({

                success: false,

                message:
                    "Order not found."
            });
        }


        // -------------------------------------------------
        // CHECK OWNER
        // -------------------------------------------------

        const isOwner =
            order.userId.toString() ===
            user.id.toString();

        const isParticipant = order.isGroupOrder &&
            order.participants?.some(
                participant => participant.toString() === user.id.toString()
            );


        // -------------------------------------------------
        // CHECK ADMIN / STAFF
        // -------------------------------------------------

        const isPrivileged =
            [
                "admin",
                "staff"
            ].includes(
                user.role
            );


        // -------------------------------------------------
        // AUTHORIZATION
        // -------------------------------------------------

        if (
            !isOwner &&
            !isParticipant &&
            !isPrivileged
        ) {

            return res.status(403).json({

                success: false,

                message:
                    "You are not allowed to cancel this order."
            });
        }


        // -------------------------------------------------
        // ALREADY CANCELLED
        // -------------------------------------------------

        const wasAlreadyCancelled = order.orderStatus === "Cancelled";


        // -------------------------------------------------
        // ONLY RECEIVED ORDERS CAN BE CANCELLED
        // -------------------------------------------------

        if (!wasAlreadyCancelled && !["Received", "AwaitingPayment"].includes(order.orderStatus)) {

            return res.status(400).json({

                success: false,

                message:
                    "Order cannot be cancelled after preparation has started."
            });
        }


        // -------------------------------------------------
        // CANCEL ORDER
        // -------------------------------------------------
        //
        // Do NOT use order.save() here.
        //
        // Older orders may not contain pickupSlot.slotId.
        // Because pickupSlot.slotId is required in the
        // schema, order.save() would validate the complete
        // document and fail.
        //
        // updateOne() changes only orderStatus.
        // -------------------------------------------------

        if (!wasAlreadyCancelled) {
            const cancellation = await Order.updateOne(
                {
                    _id: order._id,
                    orderStatus: { $in: ["Received", "AwaitingPayment"] }
                },
                {
                    $set: { orderStatus: "Cancelled" }
                }
            );

            if (cancellation.modifiedCount !== 1) {
                return res.status(409).json({
                    success: false,
                    message: "Order status changed before it could be cancelled."
                });
            }
        } else if (!order.isGroupOrder) {
            return res.status(400).json({
                success: false,
                message: "Order is already cancelled."
            });
        }


        // -------------------------------------------------
        // RELEASE PICKUP SLOT
        // -------------------------------------------------

        if (!wasAlreadyCancelled) {
            await releasePickupSlot(order.pickupSlot?.slotId);
        }

        let refundedShares = 0;
        if (order.isGroupOrder) {
            const paidShares = order.memberPayments.filter(
                payment => payment.paid && !payment.refunded && payment.amount > 0
            );

            for (const share of paidShares) {
                const claim = await Order.updateOne(
                    {
                        _id: order._id,
                        orderStatus: "Cancelled",
                        memberPayments: {
                            $elemMatch: {
                                userId: share.userId,
                                paid: true,
                                refunded: { $ne: true }
                            }
                        }
                    },
                    {
                        $set: { "memberPayments.$.refunded": true }
                    }
                );

                if (claim.modifiedCount !== 1) {
                    continue;
                }

                let walletCredited = false;
                try {
                    const refundedUser = await User.findByIdAndUpdate(
                        share.userId,
                        { $inc: { wallet: share.amount } },
                        { new: true }
                    );

                    if (!refundedUser) {
                        throw new Error("A group member account was not found for a refund.");
                    }
                    walletCredited = true;

                    await Transaction.create({
                        transactionId: randomUUID(),
                        userId: share.userId,
                        orderId: order._id,
                        amount: share.amount,
                        paymentMethod: "refund"
                    });
                    refundedShares += 1;
                } catch (refundError) {
                    if (walletCredited) {
                        await User.updateOne(
                            { _id: share.userId },
                            { $inc: { wallet: -share.amount } }
                        );
                    }

                    await Order.updateOne(
                        {
                            _id: order._id,
                            memberPayments: {
                                $elemMatch: {
                                    userId: share.userId,
                                    refunded: true
                                }
                            }
                        },
                        {
                            $set: { "memberPayments.$.refunded": false }
                        }
                    );
                    throw refundError;
                }
            }

            const updatedGroupOrder = await Order.findById(order._id);
            const allPaidSharesRefunded = updatedGroupOrder.memberPayments.every(
                payment => !payment.paid || payment.refunded
            );

            if (allPaidSharesRefunded) {
                await Order.updateOne(
                    { _id: order._id, orderStatus: "Cancelled" },
                    { $set: { paymentStatus: "refunded" } }
                );
            }
        }


        // -------------------------------------------------
        // GET UPDATED ORDER
        // -------------------------------------------------

        const updatedOrder =
            await populateOrder(
                Order.findById(
                    order._id
                )
            );


        // -------------------------------------------------
        // RESPONSE
        // -------------------------------------------------

        return res.json({

            success: true,

            message: order.isGroupOrder
                ? `Group order cancelled. ${refundedShares} member share${refundedShares === 1 ? "" : "s"} refunded.`
                : "Order cancelled successfully.",

            data:
                updatedOrder
        });


    } catch (error) {

        console.error(
            "cancelOrder:",
            error
        );


        return res.status(400).json({

            success: false,

            message:
                error.message ||
                "Unable to cancel order."
        });
    }
};


// =========================================================
// EXPORT
// =========================================================

module.exports = {

    createOrder,

    getMyOrders,

    getOrderById,

    getAllOrders,

    updateOrderStatus,

    cancelOrder,

    updatePickupSlot
};