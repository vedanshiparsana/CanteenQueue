const express = require("express");

const {
    createGroupOrder,
    joinGroupOrder,
    getGroupOrder,
    addGroupItem,
    removeGroupItem,
    payGroupShare,
    createFinalGroupOrder
} = require("../controllers/groupOrderController");

const authenticateUser = require("../middleware/authMiddleware");

const router = express.Router();

router.post("/create", authenticateUser, createGroupOrder);

router.post("/join", authenticateUser, joinGroupOrder);

router.get("/:groupCode", authenticateUser, getGroupOrder);

router.post("/:groupCode/items", authenticateUser, addGroupItem);

router.delete("/:groupCode/items/:menuId", authenticateUser, removeGroupItem);

router.post("/pay", authenticateUser, payGroupShare);

router.post("/finalize", authenticateUser, createFinalGroupOrder);

module.exports = router;