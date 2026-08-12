const mongoose = require("mongoose");

const inventorySchema = new mongoose.Schema(
    {
        itemId: {
            type: String,
            unique: true,
            required: true
        },

        itemName: {
            type: String,
            required: true
        },

        currentStockCount: {
            type: Number,
            required: true,
            min: 0
        },

        unitType: {
            type: String,
            required: true
        },

        lastUpdated: {
            type: Date,
            default: Date.now
        }
    }
);

module.exports = mongoose.model("Inventory", inventorySchema);