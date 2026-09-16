const Order = require("../models/Order");
const User = require("../models/User");
const Menu = require("../models/Menu");
const Cart = require("../models/Cart")

const createOrder = async (req, res) => {
    try {
        const {
            orderId,
            items,
            pickupSlot,
            isGroupOrder,
            groupCode,
            participants
        } = req.body;

        if (!orderId || !items || items.length === 0 || !pickupSlot) {
            return res.status(400).json({
                success: false,
                message: "Order ID, items and pickup slot are required"
            });
        }

        // Get logged-in user
        const user = await User.findOne({
            userId: req.user.userId
        });

        if (!user) {
            return res.status(404).json({
                success: false,
                message: "User not found"
            });
        }

        // Check duplicate order ID
        const existingOrder = await Order.findOne({ orderId });

        if (existingOrder) {
            return res.status(409).json({
                success: false,
                message: "Order ID already exists"
            });
        }

        let totalAmount = 0;
        const orderItems = [];

        // Validate menu items and calculate total
        for (const item of items) {

            const menuItem = await Menu.findById(item.menuId);

            if (!menuItem) {
                return res.status(404).json({
                    success: false,
                    message: `Menu item not found: ${item.menuId}`
                });
            }

            if (!menuItem.isAvailable) {
                return res.status(400).json({
                    success: false,
                    message: `${menuItem.name} is currently unavailable`
                });
            }

            const quantity = Number(item.quantity);

            if (!quantity || quantity < 1) {
                return res.status(400).json({
                    success: false,
                    message: "Quantity must be at least 1"
                });
            }

            const itemTotal = menuItem.price * quantity;

            totalAmount += itemTotal;

            orderItems.push({
                menuId: menuItem._id,
                quantity,
                price: menuItem.price
            });
        }

        const order = await Order.create({
            orderId,
            userId: user._id,
            isGroupOrder: isGroupOrder || false,
            groupCode: groupCode || null,
            participants: participants || [],
            items: orderItems,
            totalAmount,
            paymentStatus: "pending",
            orderStatus: "Received",
            pickupSlot
        });

        return res.status(201).json({
            success: true,
            message: "Order created successfully",
            data: order
        });

    } catch (error) {
        console.error("Create order error:", error);

        return res.status(500).json({
            success: false,
            message: "Failed to create order",
            error: error.message
        });
    }
};

const getMyOrders = async (req, res) => {
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

        const orders = await Order.find({
            userId: user._id
        })
            .populate("items.menuId")
            .sort({ createdAt: -1 });

        return res.status(200).json({
            success: true,
            count: orders.length,
            data: orders
        });

    } catch (error) {
        console.error("Get my orders error:", error);

        return res.status(500).json({
            success: false,
            message: "Failed to fetch orders",
            error: error.message
        });
    }
};

const getOrderById = async (req, res) => {
    try {

        const order = await Order.findOne({
            orderId: req.params.id
        })
            .populate("userId", "userId name email")
            .populate("items.menuId")
            .populate("participants", "userId name email");

        if (!order) {
            return res.status(404).json({
                success: false,
                message: "Order not found"
            });
        }

        return res.status(200).json({
            success: true,
            data: order
        });

    } catch (error) {
        console.error("Get order error:", error);

        return res.status(500).json({
            success: false,
            message: "Failed to fetch order",
            error: error.message
        });
    }
};

const getAllOrders = async (req, res) => {
    try {

        const orders = await Order.find()
            .populate("userId", "userId name email")
            .populate("items.menuId")
            .populate("participants", "userId name email")
            .sort({ createdAt: -1 });

        return res.status(200).json({
            success: true,
            count: orders.length,
            data: orders
        });

    } catch (error) {
        console.error("Get all orders error:", error);

        return res.status(500).json({
            success: false,
            message: "Failed to fetch all orders",
            error: error.message
        });
    }
};

const updateOrderStatus = async (req, res) => {
    try {

        const { status } = req.body;

        const allowedStatuses = [
            "Received",
            "Preparing",
            "Ready",
            "Completed",
            "Cancelled"
        ];

        if (!status || !allowedStatuses.includes(status)) {
            return res.status(400).json({
                success: false,
                message: "Invalid order status"
            });
        }

        const order = await Order.findOne({
            orderId: req.params.id
        });

        if (!order) {
            return res.status(404).json({
                success: false,
                message: "Order not found"
            });
        }

        // Prevent updating cancelled/completed orders
        if (
            order.orderStatus === "Cancelled" ||
            order.orderStatus === "Completed"
        ) {
            return res.status(400).json({
                success: false,
                message: `Cannot update an order that is already ${order.orderStatus}`
            });
        }

        order.orderStatus = status;

        await order.save();

        return res.status(200).json({
            success: true,
            message: "Order status updated successfully",
            data: order
        });

    } catch (error) {
        console.error("Update order status error:", error);

        return res.status(500).json({
            success: false,
            message: "Failed to update order status",
            error: error.message
        });
    }
};

const updatePickupSlot = async (req, res) => {
    try {
        const { date, startTime, endTime } = req.body;

        if (!date || !startTime || !endTime) {
            return res.status(400).json({
                success: false,
                message: "Date, start time and end time are required"
            });
        }

        // Validate time format: HH:MM
        const timeRegex = /^([01]\d|2[0-3]):([0-5]\d)$/;

        if (!timeRegex.test(startTime) || !timeRegex.test(endTime)) {
            return res.status(400).json({
                success: false,
                message: "Time must be in HH:MM format"
            });
        }

        // Start time must be before end time
        if (startTime >= endTime) {
            return res.status(400).json({
                success: false,
                message: "Start time must be before end time"
            });
        }

        const pickupDate = new Date(date);

        if (isNaN(pickupDate.getTime())) {
            return res.status(400).json({
                success: false,
                message: "Invalid pickup date"
            });
        }

        // Prevent scheduling in the past
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        pickupDate.setHours(0, 0, 0, 0);

        if (pickupDate < today) {
            return res.status(400).json({
                success: false,
                message: "Pickup date cannot be in the past"
            });
        }

        const order = await Order.findOne({
            orderId: req.params.id
        });

        if (!order) {
            return res.status(404).json({
                success: false,
                message: "Order not found"
            });
        }

        // Only the owner of the order can schedule the pickup
        const user = await User.findOne({
            userId: req.user.userId
        });

        if (!user || order.userId.toString() !== user._id.toString()) {
            return res.status(403).json({
                success: false,
                message: "You are not authorized to modify this order"
            });
        }

        // Do not allow changing pickup after preparation
        if (
            order.orderStatus === "Preparing" ||
            order.orderStatus === "Ready" ||
            order.orderStatus === "Completed" ||
            order.orderStatus === "Cancelled"
        ) {
            return res.status(400).json({
                success: false,
                message: "Pickup slot cannot be changed at this stage"
            });
        }

        order.pickupSlot = {
            date: pickupDate,
            startTime,
            endTime
        };

        await order.save();

        return res.status(200).json({
            success: true,
            message: "Pickup slot scheduled successfully",
            data: {
                orderId: order.orderId,
                pickupSlot: order.pickupSlot
            }
        });

    } catch (error) {
        console.error("Update pickup slot error:", error);

        return res.status(500).json({
            success: false,
            message: "Failed to schedule pickup slot",
            error: error.message
        });
    }
};


const cancelOrder = async (req, res) => {
    try {

        const order = await Order.findOne({
            orderId: req.params.id
        });

        if (!order) {
            return res.status(404).json({
                success: false,
                message: "Order not found"
            });
        }

        // Only orders before preparation can be cancelled
        if (
            order.orderStatus === "Preparing" ||
            order.orderStatus === "Ready" ||
            order.orderStatus === "Completed"
        ) {
            return res.status(400).json({
                success: false,
                message: "Order cannot be cancelled at this stage"
            });
        }

        if (order.orderStatus === "Cancelled") {
            return res.status(400).json({
                success: false,
                message: "Order is already cancelled"
            });
        }

        order.orderStatus = "Cancelled";

        await order.save();

        return res.status(200).json({
            success: true,
            message: "Order cancelled successfully",
            data: order
        });

    } catch (error) {
        console.error("Cancel order error:", error);

        return res.status(500).json({
            success: false,
            message: "Failed to cancel order",
            error: error.message
        });
    }
};

module.exports = {
    createOrder,
    getMyOrders,
    getOrderById,
    getAllOrders,
    updateOrderStatus,
    cancelOrder,
    updatePickupSlot
};