const express = require("express");
const cors = require("cors");
require("dotenv").config();

const connectDB = require("./config/db");

const authRoutes = require("./routes/authRoutes");
const cartRoutes = require("./routes/cartRoutes");
const menuRoutes = require("./routes/menuRoutes");
const inventoryRoutes = require("./routes/inventoryRoutes");
const kitchenRoutes = require("./routes/kitchenRoutes");
const orderRoutes = require("./routes/orderRoutes");
const walletRoutes = require("./routes/walletRoutes");
const analyticsRoutes = require("./routes/analyticsRoutes");
const groupOrderRoutes = require("./routes/groupOrderRoutes");

const {
    sendPickupReminders
} = require("./controllers/notificationController");

const http = require("http");
const { Server } = require("socket.io");
const { setIO } = require("./config/socket");

const app = express();

// Create HTTP server
const server = http.createServer(app);

// Create Socket.IO server
const io = new Server(server, {
    cors: {
        origin: "*"
    }
});

setIO(io);

// Socket.IO connection
io.on("connection", (socket) => {
    console.log("User connected:", socket.id);

    socket.on("disconnect", () => {
        console.log("User disconnected:", socket.id);
    });
});

app.use(cors());
app.use(express.json());

// Connect MongoDB
connectDB();

// Routes
app.get("/", (req, res) => {
    res.send("Backend is running");
});

app.use("/api/auth", authRoutes);
app.use("/api/menu", menuRoutes);
app.use("/api/inventory", inventoryRoutes);
app.use("/api/cart", cartRoutes);
app.use("/api/kitchen", kitchenRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/wallet", walletRoutes);
app.use("/api/analytics", analyticsRoutes);
app.use("/api/group-orders", groupOrderRoutes);

const PORT = process.env.PORT || 5000;

// IMPORTANT: use server.listen, NOT app.listen
server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});

setInterval(() => {
    sendPickupReminders();
}, 60 * 1000);