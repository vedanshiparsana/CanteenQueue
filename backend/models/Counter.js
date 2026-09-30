const mongoose = require("mongoose");

const counterSchema = new mongoose.Schema(
    {
        key: {
            type: String,
            unique: true,
            required: true
        },

        sequence: {
            type: Number,
            required: true,
            default: 0
        }
    },
    {
        timestamps: true
    }
);

module.exports = mongoose.model("Counter", counterSchema);