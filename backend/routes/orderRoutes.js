const express = require("express");

const {
    createOrder,
    getMyOrders,
    getOrderById,
    getAllOrders,
    updateOrderStatus,
    cancelOrder
} = require("../controllers/orderController");

const authenticateUser = require("../middleware/authMiddleware");

const router = express.Router();


// Create order
router.post(
    "/",
    authenticateUser,
    createOrder
);


// Get logged-in user's orders
router.get(
    "/my",
    authenticateUser,
    getMyOrders
);


// Get all orders
router.get(
    "/",
    authenticateUser,
    getAllOrders
);


// Get single order
router.get(
    "/:id",
    authenticateUser,
    getOrderById
);


// Update order status
router.put(
    "/:id/status",
    authenticateUser,
    updateOrderStatus
);


// Cancel order
router.put(
    "/:id/cancel",
    authenticateUser,
    cancelOrder
);


module.exports = router;