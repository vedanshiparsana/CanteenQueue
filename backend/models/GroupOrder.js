const mongoose = require("mongoose");

const groupItemSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true
    },
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
}, { _id: false });

const groupOrderSchema = new mongoose.Schema({
    groupCode: {
        type: String,
        unique: true,
        required: true
    },

    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true
    },

    members: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: "User"
    }],

    items: {
        type: [groupItemSchema],
        default: []
    },

    totalAmount: {
        type: Number,
        default: 0
    },

    memberPayments: [{
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User"
        },
        amount: {
            type: Number,
            default: 0
        },
        paid: {
            type: Boolean,
            default: false
        }
    }],

    status: {
        type: String,
        enum: ["Open", "PaymentPending", "Completed", "Cancelled"],
        default: "Open"
    },

    orderId: {
        type: String,
        default: null
    },

    pickupSlot: {
        date: Date,
        startTime: String,
        endTime: String
    }
}, { timestamps: true });

module.exports = mongoose.model("GroupOrder", groupOrderSchema);