const express = require("express");

const {
    getKitchenOrders,
    updateOrderStatus
} = require("../controllers/kitchenController");

const router = express.Router();

router.get("/orders", getKitchenOrders);
router.put("/orders/:orderId/status", updateOrderStatus);

module.exports = router;