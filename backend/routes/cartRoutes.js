const express = require("express");

const {
    getCart,
    addToCart,
    updateCartQuantity,
    removeFromCart
} = require("../controllers/cartController");

const authMiddleware = require("../middleware/authMiddleware");

const router = express.Router();

router.get("/", authMiddleware, getCart);

router.post("/add", authMiddleware, addToCart);

router.put("/update", authMiddleware, updateCartQuantity);

router.delete("/remove/:menuId", authMiddleware, removeFromCart);

module.exports = router;