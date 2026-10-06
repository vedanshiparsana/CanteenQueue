const express = require("express");
const cors = require("cors");
require("dotenv").config();

const connectDB = require("./config/db");

const authRoutes = require("./routes/authRoutes");
const cartRoutes = require("./routes/cartRoutes");
const menuRoutes = require("./routes/menuRoutes");
const inventoryRoutes = require("./routes/inventoryRoutes");
const inventoryAlertRoutes = require("./routes/inventoryAlertRoutes");
const kitchenRoutes = require("./routes/kitchenRoutes");
const orderRoutes = require("./routes/orderRoutes");
const walletRoutes = require("./routes/walletRoutes");
const analyticsRoutes = require("./routes/analyticsRoutes");
const userRoutes = require("./routes/userRoutes");
const groupRoutes = require("./routes/groupRoutes");
const pickupSlotRoutes = require("./routes/pickupSlotRoutes");

const http = require("http");
const { Server } = require("socket.io");
const jwt = require("jsonwebtoken");
const { setIO } = require("./config/socket");
const { sendPickupReminders } = require("./controllers/notificationController");

const app = express();
const server = http.createServer(app);

const io = new Server(server, {
    cors: {
        origin: "*"
    }
});

setIO(io);

io.use((socket, next) => {
    const token = socket.handshake.auth?.token;

    if (!token || !process.env.JWT_SECRET) {
        return next(new Error("Authentication required"));
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        if (!decoded.id) {
            return next(new Error("Invalid authentication token"));
        }

        socket.data.userId = String(decoded.id);
        return next();
    } catch {
        return next(new Error("Invalid or expired authentication token"));
    }
});

io.on("connection", (socket) => {
    socket.join(`user:${socket.data.userId}`);
    console.log("User connected:", socket.id);

    socket.on("disconnect", () => {
        console.log("User disconnected:", socket.id);
    });
});

app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
    res.send("Backend is running");
});

app.use("/api/auth", authRoutes);
app.use("/api/menu", menuRoutes);
app.use("/api/inventory", inventoryRoutes);
app.use("/api/inventory-alerts", inventoryAlertRoutes);
app.use("/api/cart", cartRoutes);
app.use("/api/kitchen", kitchenRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/wallet", walletRoutes);
app.use("/api/analytics", analyticsRoutes);
app.use("/api/users", userRoutes);
app.use("/api/groups", groupRoutes);
app.use("/api/pickup-slots", pickupSlotRoutes);

const PORT = process.env.PORT || 5000;

connectDB().then(() => {
    sendPickupReminders();
    setInterval(sendPickupReminders, 60 * 1000);

    server.listen(PORT, () => {
        console.log(`Server running on port ${PORT}`);
    });
});