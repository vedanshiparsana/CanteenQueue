const express = require("express");

const {
    createInventoryItem,
    getInventoryItems,
    updateInventoryItem,
    deleteInventoryItem
} = require("../controllers/inventoryController");

const router = express.Router();

router.post("/", createInventoryItem);
router.get("/", getInventoryItems);
router.put("/:id", updateInventoryItem);
router.delete("/:id", deleteInventoryItem);

module.exports = router;