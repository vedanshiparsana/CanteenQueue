const mongoose = require("mongoose");

const menuSchema = new mongoose.Schema(
    {
        menuId: {
            type: String,
            unique: true,
            required: true
        },

        name: {
            type: String,
            required: true,
            trim: true
        },

        description: {
            type: String,
            default: ""
        },

        price: {
            type: Number,
            required: true,
            min: 0
        },

        category: {
            type: String,
            required: true
        },

        imageUrl: {
            type: String,
            default: ""
        },

        isAvailable: {
            type: Boolean,
            default: true
        }
    },
    {
        timestamps: true
    }
);

module.exports = mongoose.model("Menu", menuSchema);