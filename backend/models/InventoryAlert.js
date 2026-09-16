const mongoose = require("mongoose");

const inventoryAlertSchema = new mongoose.Schema({
    itemId: {
        type: String,
        required: true
    },

    itemName: {
        type: String,
        required: true
    },

    alertType: {
        type: String,
        enum: ["LOW_STOCK", "OUT_OF_STOCK"],
        required: true
    },

    currentStock: {
        type: Number,
        required: true
    },

    threshold: {
        type: Number,
        default: 5
    },

    status: {
        type: String,
        enum: ["ACTIVE", "RESOLVED"],
        default: "ACTIVE"
    }
}, { timestamps: true });

module.exports = mongoose.model("InventoryAlert", inventoryAlertSchema);