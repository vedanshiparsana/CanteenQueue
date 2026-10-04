const PickupSlot = require("../models/pickupSlot");

const startOfToday = () => {
    const now = new Date();

    return new Date(
        Date.UTC(
            now.getFullYear(),
            now.getMonth(),
            now.getDate(),
            0,
            0,
            0,
            0
        )
    );
};

const startOfTomorrow = () => {
    const tomorrow = startOfToday();

    tomorrow.setUTCDate(
        tomorrow.getUTCDate() + 1
    );

    return tomorrow;
};


// ===============================
// STUDENT
// GET TODAY'S AVAILABLE SLOTS
// ===============================

const getTodaySlots = async (req, res) => {
    try {
        const today = startOfToday();
        const tomorrow = startOfTomorrow();

        const dateTypeCheck = await PickupSlot.aggregate([
    {
        $project: {
            date: 1,
            dateType: {
                $type: "$date"
            },
            startTime: 1,
            endTime: 1,
            capacity: 1,
            bookedCount: 1,
            isActive: 1
        }
    }
]);

console.log(
    "DATE TYPE CHECK:",
    JSON.stringify(dateTypeCheck, null, 2)
);
        console.log("=================================");
        console.log("TODAY:", today.toISOString());
        console.log("TOMORROW:", tomorrow.toISOString());

        // 1. Get every pickup slot
        const allSlots = await PickupSlot.find({});

        console.log("ALL PICKUP SLOTS:", allSlots.length);

        allSlots.forEach((slot) => {
            console.log("SLOT:", {
                id: slot._id.toString(),
                date: slot.date,
                dateISO: slot.date.toISOString(),
                startTime: slot.startTime,
                endTime: slot.endTime,
                capacity: slot.capacity,
                bookedCount: slot.bookedCount,
                isActive: slot.isActive
            });
        });

        // 2. Test date only
        const dateSlots = await PickupSlot.find({
            date: {
                $gte: today,
                $lt: tomorrow
            }
        });

        console.log(
            "DATE MATCHING SLOTS:",
            dateSlots.length
        );

        // 3. Test date + active
        const activeSlots = await PickupSlot.find({
            date: {
                $gte: today,
                $lt: tomorrow
            },
            isActive: true
        });

        console.log(
            "DATE + ACTIVE MATCHING SLOTS:",
            activeSlots.length
        );

        // 4. Test final query without $expr
        const capacitySlots = await PickupSlot.find({
            date: {
                $gte: today,
                $lt: tomorrow
            },
            isActive: true,
            bookedCount: {
                $lt: 20
            }
        });

        console.log(
            "DATE + ACTIVE + CAPACITY TEST:",
            capacitySlots.length
        );

        // 5. Original query
        const slots = await PickupSlot.find({
            date: {
                $gte: today,
                $lt: tomorrow
            },
            isActive: true,
            $expr: {
                $lt: [
                    "$bookedCount",
                    "$capacity"
                ]
            }
        }).sort({
            startTime: 1
        });

        console.log(
            "FINAL AVAILABLE PICKUP SLOTS:",
            slots.length
        );

        console.log("=================================");

        res.json({
            success: true,
            slots
        });

    } catch (error) {
        console.error(
            "Get today slots error:",
            error
        );

        res.status(500).json({
            success: false,
            message: "Failed to fetch pickup slots"
        });
    }
};


// ===============================
// ADMIN / STAFF
// GET ALL SLOTS
// ===============================

const getAllSlots = async (req, res) => {
    try {
        const slots = await PickupSlot.find()
            .sort({
                date: 1,
                startTime: 1
            });

        res.json({
            success: true,
            slots
        });

    } catch (error) {
        console.error(
            "Get all slots error:",
            error
        );

        res.status(500).json({
            success: false,
            message:
                "Failed to fetch pickup slots"
        });
    }
};


// ===============================
// ADMIN / STAFF
// CREATE PICKUP SLOT
// ===============================

const createPickupSlot = async (req, res) => {
    try {
        const {
            date,
            startTime,
            endTime,
            capacity
        } = req.body;


        // -------------------------------
        // Validate required fields
        // -------------------------------

        if (
            !date ||
            !startTime ||
            !endTime ||
            capacity === undefined
        ) {
            return res.status(400).json({
                success: false,
                message:
                    "Date, start time, end time and capacity are required"
            });
        }


        // -------------------------------
        // Validate date
        // -------------------------------

        const dateParts = date
            .split("-")
            .map(Number);

        if (
            dateParts.length !== 3 ||
            dateParts.some(
                (value) => Number.isNaN(value)
            )
        ) {
            return res.status(400).json({
                success: false,
                message: "Invalid date"
            });
        }

        const [
            year,
            month,
            day
        ] = dateParts;

        const slotDate = new Date(
            Date.UTC(
                year,
                month - 1,
                day,
                0,
                0,
                0,
                0
            )
        );


        if (
            Number.isNaN(
                slotDate.getTime()
            )
        ) {
            return res.status(400).json({
                success: false,
                message: "Invalid date"
            });
        }


        // -------------------------------
        // Validate time
        // -------------------------------

        const timeRegex =
            /^([01]\d|2[0-3]):([0-5]\d)$/;

        if (
            !timeRegex.test(startTime) ||
            !timeRegex.test(endTime)
        ) {
            return res.status(400).json({
                success: false,
                message:
                    "Time must be in HH:MM format"
            });
        }


        if (startTime >= endTime) {
            return res.status(400).json({
                success: false,
                message:
                    "Start time must be before end time"
            });
        }


        // -------------------------------
        // Validate capacity
        // -------------------------------

        const numericCapacity =
            Number(capacity);

        if (
            !Number.isInteger(
                numericCapacity
            ) ||
            numericCapacity < 1
        ) {
            return res.status(400).json({
                success: false,
                message:
                    "Capacity must be a positive whole number"
            });
        }


        // -------------------------------
        // Check overlapping slots
        // -------------------------------

        const overlappingSlot =
            await PickupSlot.findOne({
                date: slotDate,

                isActive: true,

                startTime: {
                    $lt: endTime
                },

                endTime: {
                    $gt: startTime
                }
            });


        if (overlappingSlot) {
            return res.status(400).json({
                success: false,
                message:
                    "This pickup time overlaps with an existing slot"
            });
        }


        // -------------------------------
        // Create slot
        // -------------------------------

        const slot =
            await PickupSlot.create({
                date: slotDate,

                startTime,

                endTime,

                capacity:
                    numericCapacity,

                bookedCount: 0,

                isActive: true
            });


        res.status(201).json({
            success: true,

            message:
                "Pickup slot created successfully",

            slot
        });

    } catch (error) {
        console.error(
            "Create pickup slot error:",
            error
        );

        res.status(500).json({
            success: false,
            message:
                "Failed to create pickup slot"
        });
    }
};


// ===============================
// ADMIN / STAFF
// UPDATE PICKUP SLOT
// ===============================

const updatePickupSlotAdmin = async (
    req,
    res
) => {
    try {
        const { id } = req.params;

        const {
            date,
            startTime,
            endTime,
            capacity,
            isActive
        } = req.body;


        const slot =
            await PickupSlot.findById(id);


        if (!slot) {
            return res.status(404).json({
                success: false,
                message:
                    "Pickup slot not found"
            });
        }


        // -------------------------------
        // Update date
        // -------------------------------

        if (date !== undefined) {

            const dateParts = date
                .split("-")
                .map(Number);

            if (
                dateParts.length !== 3 ||
                dateParts.some(
                    (value) =>
                        Number.isNaN(value)
                )
            ) {
                return res.status(400).json({
                    success: false,
                    message:
                        "Invalid date"
                });
            }


            const [
                year,
                month,
                day
            ] = dateParts;


            const newDate =
                new Date(
                    Date.UTC(
                        year,
                        month - 1,
                        day,
                        0,
                        0,
                        0,
                        0
                    )
                );


            if (
                Number.isNaN(
                    newDate.getTime()
                )
            ) {
                return res.status(400).json({
                    success: false,
                    message:
                        "Invalid date"
                });
            }


            slot.date = newDate;
        }


        // -------------------------------
        // Update times
        // -------------------------------

        if (
            startTime !== undefined
        ) {
            slot.startTime =
                startTime;
        }


        if (
            endTime !== undefined
        ) {
            slot.endTime =
                endTime;
        }


        const timeRegex =
            /^([01]\d|2[0-3]):([0-5]\d)$/;


        if (
            !timeRegex.test(
                slot.startTime
            ) ||
            !timeRegex.test(
                slot.endTime
            )
        ) {
            return res.status(400).json({
                success: false,
                message:
                    "Time must be in HH:MM format"
            });
        }


        if (
            slot.startTime >=
            slot.endTime
        ) {
            return res.status(400).json({
                success: false,
                message:
                    "Start time must be before end time"
            });
        }


        // -------------------------------
        // Update capacity
        // -------------------------------

        if (
            capacity !== undefined
        ) {

            const numericCapacity =
                Number(capacity);


            if (
                !Number.isInteger(
                    numericCapacity
                ) ||
                numericCapacity < 1
            ) {
                return res.status(400).json({
                    success: false,
                    message:
                        "Capacity must be a positive whole number"
                });
            }


            if (
                numericCapacity <
                slot.bookedCount
            ) {
                return res.status(400).json({
                    success: false,
                    message:
                        "Capacity cannot be lower than the number of bookings"
                });
            }


            slot.capacity =
                numericCapacity;
        }


        // -------------------------------
        // Update active status
        // -------------------------------

        if (
            isActive !== undefined
        ) {
            slot.isActive =
                Boolean(isActive);
        }


        await slot.save();


        res.json({
            success: true,

            message:
                "Pickup slot updated successfully",

            slot
        });

    } catch (error) {
        console.error(
            "Update pickup slot error:",
            error
        );

        res.status(500).json({
            success: false,
            message:
                "Failed to update pickup slot"
        });
    }
};


// ===============================
// ADMIN / STAFF
// DELETE PICKUP SLOT
// ===============================

const deletePickupSlot = async (
    req,
    res
) => {
    try {
        const { id } = req.params;


        const slot =
            await PickupSlot.findById(id);


        if (!slot) {
            return res.status(404).json({
                success: false,
                message:
                    "Pickup slot not found"
            });
        }


        if (
            slot.bookedCount > 0
        ) {
            return res.status(400).json({
                success: false,
                message:
                    "Cannot delete a pickup slot that already has bookings"
            });
        }


        await PickupSlot.findByIdAndDelete(
            id
        );


        res.json({
            success: true,

            message:
                "Pickup slot deleted successfully"
        });

    } catch (error) {
        console.error(
            "Delete pickup slot error:",
            error
        );

        res.status(500).json({
            success: false,
            message:
                "Failed to delete pickup slot"
        });
    }
};


// ===============================
// EXPORTS
// ===============================

module.exports = {
    getTodaySlots,
    getAllSlots,
    createPickupSlot,
    updatePickupSlotAdmin,
    deletePickupSlot,
    startOfToday,
    startOfTomorrow
};