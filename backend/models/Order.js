const mongoose = require("mongoose");

const orderItemSchema = new mongoose.Schema(
    {
        menuId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Menu",
            required: true
        },

        quantity: {
            type: Number,
            required: true,
            min: 1
        },

        price: {
            type: Number,
            required: true,
            min: 0
        }
    },
    {
        _id: false
    }
);

const orderSchema = new mongoose.Schema(
    {
        orderId: {
            type: String,
            unique: true,
            required: true
        },

        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true
        },

        isGroupOrder: {
            type: Boolean,
            default: false
        },

        groupCode: {
            type: String,
            default: null
        },

        participants: [
            {
                type: mongoose.Schema.Types.ObjectId,
                ref: "User"
            }
        ],

        memberPayments: [
            {
                userId: {
                    type: mongoose.Schema.Types.ObjectId,
                    ref: "User",
                    required: true
                },
                amount: {
                    type: Number,
                    required: true,
                    min: 0
                },
                paid: {
                    type: Boolean,
                    default: false
                },
                refunded: {
                    type: Boolean,
                    default: false
                }
            }
        ],

        items: {
            type: [orderItemSchema],
            required: true
        },

        totalAmount: {
            type: Number,
            required: true,
            min: 0
        },

        paymentStatus: {
            type: String,
            enum: ["pending", "paid", "refunded", "failed"],
            default: "pending"
        },

        orderStatus: {
            type: String,
            enum: [
                "AwaitingPayment",
                "Received",
                "Preparing",
                "Ready",
                "Completed",
                "Cancelled"
            ],
            default: "Received"
        },

        pickupSlot: {
            slotId: {
                type: mongoose.Schema.Types.ObjectId,
                ref: "PickupSlot",
                required: true
            }
        }
    },
    {
        timestamps: true
    }
);

module.exports = mongoose.model("Order", orderSchema);