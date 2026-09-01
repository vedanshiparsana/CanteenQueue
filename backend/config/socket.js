let io;

const setIO = (socketIO) => {
    io = socketIO;
};

const getIO = () => {
    return io;
};

const sendNotification = (userId, message) => {
    if (!io) return;

    io.emit("notification:new", {
        userId,
        message
    });
};

module.exports = {
    setIO,
    getIO,
    sendNotification
};