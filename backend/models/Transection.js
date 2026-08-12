const mongoose = require("mongoose");

const transactionSchema = new mongoose.Schema(
    {
        transactionId: {
            type: String,
            unique: true,
            required: true
        },

        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true
        },

        orderId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Order"
        },

        amount: {
            type: Number,
            required: true
        },

        paymentMethod: {
            type: String,
            enum: [
                "wallet",
                "refund",
                "topup",
                "group_split"
            ],
            required: true
        },

        timestamp: {
            type: Date,
            default: Date.now
        }
    }
);

module.exports = mongoose.model("Transaction", transactionSchema);