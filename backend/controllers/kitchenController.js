const Order = require("../models/Order");

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