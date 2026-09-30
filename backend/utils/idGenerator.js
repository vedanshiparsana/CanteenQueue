const Counter = require("../models/Counter");

const generateNextId = async (prefix, Model, field) => {
    let counter = await Counter.findOne({
        key: prefix
    });

    if (!counter) {
        const lastItem = await Model.findOne({
            [field]: {
                $regex: `^${prefix}[0-9]+$`
            }
        }).sort({
            [field]: -1
        });

        let lastNumber = 0;

        if (lastItem) {
            lastNumber = parseInt(
                lastItem[field].replace(prefix, ""),
                10
            ) || 0;
        }

        try {
            counter = await Counter.create({
                key: prefix,
                sequence: lastNumber
            });
        } catch (error) {
            if (error.code === 11000) {
                counter = await Counter.findOne({
                    key: prefix
                });
            } else {
                throw error;
            }
        }
    }

    const updatedCounter = await Counter.findOneAndUpdate(
        {
            key: prefix
        },
        {
            $inc: {
                sequence: 1
            }
        },
        {
            new: true
        }
    );

    return `${prefix}${String(updatedCounter.sequence).padStart(3, "0")}`;
};

module.exports = generateNextId;