const express = require("express");

const {
    getSales,
    getPopularItems,
    getSummary
} = require("../controllers/analyticsController");

const authenticateUser = require("../middleware/authMiddleware");
const authorizeRoles = require("../middleware/roleMiddleware");

const router = express.Router();

router.get(
    "/sales",
    authenticateUser,
    authorizeRoles("admin"),
    getSales
);

router.get(
    "/popular-items",
    authenticateUser,
    authorizeRoles("admin"),
    getPopularItems
);

router.get(
    "/summary",
    authenticateUser,
    authorizeRoles("admin"),
    getSummary
);

module.exports = router;