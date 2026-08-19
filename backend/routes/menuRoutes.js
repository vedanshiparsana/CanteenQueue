const express = require("express");
const router = express.Router();

const { getMenuItems } = require("../controllers/menuController");

// GET /api/menu
router.get("/", getMenuItems);

module.exports = router;