const express = require("express");

const {
    getWalletBalance,
    getWalletHistory,
    topUpWallet,
    payFromWallet,
    refundToWallet
} = require("../controllers/walletController");

const authenticateUser = require("../middleware/authMiddleware");

const router = express.Router();

// Get wallet balance
router.get("/", authenticateUser, getWalletBalance);

// Wallet activity history
router.get("/history", authenticateUser, getWalletHistory);

// Add money
router.post("/topup", authenticateUser, topUpWallet);

// Pay using wallet
router.post("/pay", authenticateUser, payFromWallet);

// Refund cancelled order
router.post("/refund", authenticateUser, refundToWallet);

module.exports = router;