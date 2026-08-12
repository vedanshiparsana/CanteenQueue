const mongoose = require("mongoose");

const cartItemSchema = new mongoose.Schema(
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
        }
    },
    {
        _id: false
    }
);

const cartSchema = new mongoose.Schema(
    {
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
            unique: true
        },

        items: {
            type: [cartItemSchema],
            default: []
        },

        runningTotal: {
            type: Number,
            default: 0
        }
    },
    {
        timestamps: true
    }
);

module.exports = mongoose.model("Cart", cartSchema);