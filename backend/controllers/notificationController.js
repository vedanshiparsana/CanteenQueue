const Order = require("../models/Order");
const { getIO } = require("../config/socket");

const sendPickupReminders = async () => {
    try {
        const now = new Date();
        const reminderTime = new Date(now.getTime() + 15 * 60 * 1000);

        const orders = await Order.find({
            orderStatus: {
                $in: ["Received", "Preparing", "Ready"]
            },
            "pickupSlot.date": {
                $gte: now,
                $lte: reminderTime
            }
        });

        const io = getIO();

        orders.forEach((order) => {
            io.emit("pickup:reminder", {
                userId: order.userId,
                orderId: order.orderId,
                message: `Your pickup slot for order ${order.orderId} is approaching`
            });
        });

    } catch (error) {
        console.error("Pickup reminder error:", error);
    }
};

module.exports = {
    sendPickupReminders
};