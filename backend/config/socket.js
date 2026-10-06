let io;

const setIO = (socketIO) => {
    io = socketIO;
};

const getIO = () => {
    return io;
};

const sendNotification = (userId, message) => {
    if (!io) return;

    const recipientIds = Array.isArray(userId) ? userId : [userId];
    const uniqueRecipientIds = new Set(
        recipientIds
            .filter(Boolean)
            .map((recipient) => String(recipient._id || recipient))
    );

    uniqueRecipientIds.forEach((recipientId) => {
        io.to(`user:${recipientId}`).emit("notification:new", {
            ...message,
            userId: recipientId
        });
    });
};

const sendOrderStatusNotification = (order, orderStatus) => {
    if (!io || !order) return;

    const recipientIds = [order.userId, ...(order.participants || [])]
        .filter(Boolean)
        .map((recipient) => String(recipient._id || recipient));
    const uniqueRecipientIds = new Set(recipientIds);

    const statusMessages = {
        Preparing: {
            title: "Your order is being prepared",
            message: `The canteen has started preparing order ${order.orderId}.`
        },
        Ready: {
            title: "Your order is ready",
            message: `Order ${order.orderId} is ready for pickup.`
        },
        Completed: {
            title: "Order completed",
            message: `Order ${order.orderId} has been completed.`
        },
        Cancelled: {
            title: "Order cancelled",
            message: `Order ${order.orderId} has been cancelled.`
        }
    };

    uniqueRecipientIds.forEach((recipientId) => {
        const room = `user:${recipientId}`;

        io.to(room).emit("order:statusUpdated", {
            orderId: order.orderId,
            orderStatus
        });

        if (orderStatus === "Ready") {
            io.to(room).emit("order:ready", {
                orderId: order.orderId
            });
        }

        const notification = statusMessages[orderStatus];
        if (notification) {
            io.to(room).emit("notification:new", {
                ...notification,
                type: "order-status",
                orderId: order.orderId,
                status: orderStatus,
                userId: recipientId
            });
        }
    });
};

module.exports = {
    setIO,
    getIO,
    sendNotification,
    sendOrderStatusNotification
};