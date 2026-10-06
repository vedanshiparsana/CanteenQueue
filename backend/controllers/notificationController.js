const Order = require("../models/Order");
const { sendNotification } = require("../config/socket");

const sentPickupReminders = new Map();
const REMINDER_EARLIEST_MS = 14 * 60 * 1000;
const REMINDER_LATEST_MS = 16 * 60 * 1000;
const REMINDER_RETENTION_MS = 24 * 60 * 60 * 1000;

const sendPickupReminders = async () => {
    try {
        const now = new Date();
        const orders = await Order.find({
            orderStatus: {
                $in: ["Received", "Preparing", "Ready"]
            }
        }).populate("pickupSlot.slotId", "date startTime endTime");

        orders.forEach((order) => {
            const slot = order.pickupSlot?.slotId;
            const timeParts = String(slot?.startTime || "").match(/^(\d{1,2}):(\d{2})$/);
            if (!slot?.date || !timeParts) return;

            const hours = Number(timeParts[1]);
            const minutes = Number(timeParts[2]);
            if (hours > 23 || minutes > 59) return;

            const pickupTime = new Date(slot.date);
            pickupTime.setHours(hours, minutes, 0, 0);

            const timeUntilPickup = pickupTime.getTime() - now.getTime();
            if (
                timeUntilPickup < REMINDER_EARLIEST_MS ||
                timeUntilPickup > REMINDER_LATEST_MS
            ) {
                return;
            }

            const reminderKey = `${order._id}:${pickupTime.getTime()}`;
            if (sentPickupReminders.has(reminderKey)) return;

            sentPickupReminders.set(reminderKey, now.getTime());
            sendNotification(
                [order.userId, ...(order.participants || [])],
                {
                    title: "Pickup time is approaching",
                    message: `Your pickup window for order ${order.orderId} is coming up at ${slot.startTime}–${slot.endTime}.`,
                    type: "pickup-reminder",
                    orderId: order.orderId
                }
            );
        });

        for (const [reminderKey, sentAt] of sentPickupReminders) {
            if (now.getTime() - sentAt > REMINDER_RETENTION_MS) {
                sentPickupReminders.delete(reminderKey);
            }
        }
    } catch (error) {
        console.error("Pickup reminder error:", error);
    }
};

module.exports = {
    sendPickupReminders
};
