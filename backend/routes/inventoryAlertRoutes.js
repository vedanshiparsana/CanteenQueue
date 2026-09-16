const express = require("express");

const {
    getActiveAlerts,
    getAllAlerts,
    resolveAlert
} = require("../controllers/inventoryAlertController");

const authenticateUser = require("../middleware/authMiddleware");
const authorizeRoles = require("../middleware/roleMiddleware");

const router = express.Router();

router.get(
    "/",
    authenticateUser,
    authorizeRoles("admin"),
    getActiveAlerts
);

router.get(
    "/all",
    authenticateUser,
    authorizeRoles("admin"),
    getAllAlerts
);

router.put(
    "/:id/resolve",
    authenticateUser,
    authorizeRoles("admin"),
    resolveAlert
);

module.exports = router;