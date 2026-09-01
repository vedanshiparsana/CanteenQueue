const Order = require("../models/Order");
const {
    getIO,
    sendNotification
} = require("../config/socket");

// Get active kitchen orders
const getKitchenOrders = async (req, res) => {
    try {
        const orders = await Order.find({
            orderStatus: {
                $in: ["Received", "Preparing", "Ready"]
            }
        }).sort({ "pickupSlot.date": 1 });

        res.status(200).json({
            success: true,
            count: orders.length,
            data: orders
        });

    } catch (error) {
        console.error("Error fetching kitchen orders:", error);

        res.status(500).json({
            success: false,
            message: "Failed to fetch kitchen orders"
        });
    }
};


// Update order status
const updateOrderStatus = async (req, res) => {
    try {
        const { orderId } = req.params;
        const { orderStatus } = req.body;

        const validStatuses = [
            "Received",
            "Preparing",
            "Ready",
            "Completed",
            "Cancelled"
        ];

        if (!validStatuses.includes(orderStatus)) {
            return res.status(400).json({
                success: false,
                message: "Invalid order status"
            });
        }

        const order = await Order.findOneAndUpdate(
            { orderId },
            { orderStatus },
            { new: true, runValidators: true }
        );

        if (!order) {
            return res.status(404).json({
                success: false,
                message: "Order not found"
            });
        }

        // Socket.IO: notify all connected clients
        const io = getIO();

        io.emit("order:statusUpdated", {
            orderId: order.orderId,
            orderStatus: order.orderStatus
        });

        // Socket.IO: notify when order is ready
        if (order.orderStatus === "Ready") {
            io.emit("order:ready", {
                orderId: order.orderId
            });
        }

        if (order.orderStatus === "Ready") {
    sendNotification(
        order.userId,
        `Your order ${order.orderId} is ready for pickup`
    );
}

        res.status(200).json({
            success: true,
            message: "Order status updated successfully",
            data: order
        });

    } catch (error) {
        console.error("Error updating order status:", error);

        res.status(500).json({
            success: false,
            message: "Failed to update order status"
        });
    }
};


module.exports = {
    getKitchenOrders,
    updateOrderStatus
};