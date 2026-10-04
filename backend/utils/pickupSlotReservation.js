const PickupSlot = require("../models/pickupSlot");

const startOfToday = () => {
    const date = new Date();
    date.setHours(0, 0, 0, 0);
    return date;
};

const startOfTomorrow = () => {
    const date = startOfToday();
    date.setDate(date.getDate() + 1);
    return date;
};

const reservePickupSlot = async (slotId) => {
    if (!slotId) {
        throw new Error("Pickup slot is required.");
    }

    const slot = await PickupSlot.findOneAndUpdate(
        {
            _id: slotId,
            isActive: true,
            date: {
                $gte: startOfToday(),
                $lt: startOfTomorrow()
            },
            $expr: {
                $lt: ["$bookedCount", "$capacity"]
            }
        },
        {
            $inc: {
                bookedCount: 1
            }
        },
        {
            new: true
        }
    );

    if (!slot) {
        throw new Error("Pickup slot is unavailable or full.");
    }

    return slot;
};

const releasePickupSlot = async (slotId) => {
    if (!slotId) {
        return;
    }

    await PickupSlot.findOneAndUpdate(
        {
            _id: slotId,
            bookedCount: {
                $gt: 0
            }
        },
        {
            $inc: {
                bookedCount: -1
            }
        }
    );
};

module.exports = {
    reservePickupSlot,
    releasePickupSlot
};
