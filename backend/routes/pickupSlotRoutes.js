const express = require("express");

const {
    getTodaySlots,
    getAllSlots,
    createPickupSlot,
    updatePickupSlotAdmin,
    deletePickupSlot
} = require("../controllers/pickupSlotController");

const authenticateUser = require("../middleware/authMiddleware");
const authorizeRoles = require("../middleware/roleMiddleware");

const router = express.Router();

router.get(
    "/today",
    authenticateUser,
    getTodaySlots
);

router.get(
    "/",
    authenticateUser,
    authorizeRoles("admin", "staff"),
    getAllSlots
);

router.post(
    "/",
    authenticateUser,
    authorizeRoles("admin", "staff"),
    createPickupSlot
);

router.put(
    "/:id",
    authenticateUser,
    authorizeRoles("admin", "staff"),
    updatePickupSlotAdmin
);

router.delete(
    "/:id",
    authenticateUser,
    authorizeRoles("admin", "staff"),
    deletePickupSlot
);

module.exports = router;