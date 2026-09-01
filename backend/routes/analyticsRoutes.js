const express = require("express");

const {
    getSales,
    getPopularItems,
    getSummary
} = require("../controllers/analyticsController");

const router = express.Router();

router.get("/sales", getSales);
router.get("/popular-items", getPopularItems);
router.get("/summary", getSummary);

module.exports = router;