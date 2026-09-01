const User = require("../models/User");
const Order = require("../models/Order");

const getWalletBalance = async (req, res) => {
    try {
        const user = await User.findOne({
            userId: req.user.userId
        }).select("userId name wallet");

        if (!user) {
            return res.status(404).json({
                success: false,
                message: "User not found"
            });
        }

        return res.status(200).json({
            success: true,
            message: "Wallet balance fetched successfully",
            data: {
                userId: user.userId,
                name: user.name,
                wallet: user.wallet
            }
        });

    } catch (error) {
        console.error("Get wallet error:", error);

        return res.status(500).json({
            success: false,
            message: "Failed to fetch wallet balance"
        });
    }
};

const topUpWallet = async (req, res) => {
    try {
        const { amount } = req.body;

        // Validate amount
        if (amount === undefined || amount === null) {
            return res.status(400).json({
                success: false,
                message: "Top-up amount is required"
            });
        }

        if (typeof amount !== "number" || amount <= 0) {
            return res.status(400).json({
                success: false,
                message: "Top-up amount must be greater than 0"
            });
        }

        const user = await User.findOne({
            userId: req.user.userId
        });

        if (!user) {
            return res.status(404).json({
                success: false,
                message: "User not found"
            });
        }

        user.wallet += amount;

        await user.save();

        return res.status(200).json({
            success: true,
            message: "Wallet topped up successfully",
            data: {
                userId: user.userId,
                wallet: user.wallet,
                addedAmount: amount
            }
        });

    } catch (error) {
        console.error("Top-up error:", error);

        return res.status(500).json({
            success: false,
            message: "Failed to top up wallet"
        });
    }
};

const payFromWallet = async (req, res) => {
    try {
        const { orderId } = req.body;

        if (!orderId) {
            return res.status(400).json({
                success: false,
                message: "Order ID is required"
            });
        }

        // Find the order
        const order = await Order.findOne({ orderId });

        if (!order) {
            return res.status(404).json({
                success: false,
                message: "Order not found"
            });
        }

        // Make sure this order belongs to the logged-in user
        const user = await User.findOne({
            userId: req.user.userId
        });

        if (!user) {
            return res.status(404).json({
                success: false,
                message: "User not found"
            });
        }

        if (order.userId.toString() !== user._id.toString()) {
            return res.status(403).json({
                success: false,
                message: "You are not authorized to pay for this order"
            });
        }

        // Prevent paying twice
        if (order.paymentStatus === "paid") {
            return res.status(400).json({
                success: false,
                message: "Order has already been paid"
            });
        }

        // Don't allow payment for cancelled orders
        if (order.orderStatus === "Cancelled") {
            return res.status(400).json({
                success: false,
                message: "Cancelled orders cannot be paid"
            });
        }

        const amount = order.totalAmount;

        // Check wallet balance
        if (user.wallet < amount) {
            return res.status(400).json({
                success: false,
                message: "Insufficient wallet balance",
                balance: user.wallet,
                required: amount
            });
        }

        // Deduct money
        user.wallet -= amount;

        // Mark order as paid
        order.paymentStatus = "paid";

        // Save both
        await user.save();
        await order.save();

        return res.status(200).json({
            success: true,
            message: "Payment successful",
            data: {
                orderId: order.orderId,
                paidAmount: amount,
                remainingBalance: user.wallet,
                paymentStatus: order.paymentStatus
            }
        });

    } catch (error) {
        console.error("Wallet payment error:", error);

        return res.status(500).json({
            success: false,
            message: "Failed to process wallet payment"
        });
    }
};

const refundToWallet = async (req, res) => {
    try {
        const { orderId } = req.body;

        if (!orderId) {
            return res.status(400).json({
                success: false,
                message: "Order ID is required"
            });
        }

        // Find the order
        const order = await Order.findOne({ orderId });

        if (!order) {
            return res.status(404).json({
                success: false,
                message: "Order not found"
            });
        }

        // Only cancelled orders can be refunded
        if (order.orderStatus !== "Cancelled") {
            return res.status(400).json({
                success: false,
                message: "Only cancelled orders can be refunded"
            });
        }

        // Order must have been paid
        if (order.paymentStatus !== "paid") {
            return res.status(400).json({
                success: false,
                message: "Order payment was not completed, so refund is not required"
            });
        }

        // Prevent duplicate refund
        if (order.paymentStatus === "refunded") {
            return res.status(400).json({
                success: false,
                message: "Order has already been refunded"
            });
        }

        // Find the user who placed the order
        const user = await User.findById(order.userId);

        if (!user) {
            return res.status(404).json({
                success: false,
                message: "Order owner not found"
            });
        }

        // Add refund amount to wallet
        user.wallet += order.totalAmount;

        await user.save();

        // Mark order as refunded
        order.paymentStatus = "refunded";

        await order.save();

        return res.status(200).json({
            success: true,
            message: "Refund processed successfully",
            data: {
                orderId: order.orderId,
                refundAmount: order.totalAmount,
                walletBalance: user.wallet,
                paymentStatus: order.paymentStatus
            }
        });

    } catch (error) {
        console.error("Refund error:", error);

        return res.status(500).json({
            success: false,
            message: "Failed to process refund"
        });
    }
};

module.exports = {
    getWalletBalance,
    topUpWallet,
    payFromWallet,
    refundToWallet
};