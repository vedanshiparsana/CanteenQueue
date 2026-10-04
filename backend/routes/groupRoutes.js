const express = require("express");

const {
    createGroupOrder,
    joinGroupOrder,
    getMyGroups,
    deleteGroup,
    getGroupOrder,
    addGroupItem,
    removeGroupItem,
    payGroupShare,
    createFinalGroupOrder
} = require("../controllers/groupController");

const authenticateUser =
    require("../middleware/authMiddleware");

const router = express.Router();


// =========================================================
// CREATE GROUP
// POST /api/groups/create
// =========================================================

router.post(
    "/create",
    authenticateUser,
    createGroupOrder
);


// =========================================================
// JOIN GROUP
// POST /api/groups/join
// =========================================================

router.post(
    "/join",
    authenticateUser,
    joinGroupOrder
);


// =========================================================
// GET MY GROUPS
// GET /api/groups/my
// =========================================================

router.get(
    "/my",
    authenticateUser,
    getMyGroups
);

router.delete(
    "/:groupCode",
    authenticateUser,
    deleteGroup
);


// =========================================================
// PAY GROUP SHARE
// POST /api/groups/pay
// =========================================================

router.post(
    "/pay",
    authenticateUser,
    payGroupShare
);


// =========================================================
// FINALIZE GROUP
// POST /api/groups/finalize
// =========================================================

router.post(
    "/finalize",
    authenticateUser,
    createFinalGroupOrder
);


// =========================================================
// ADD GROUP ITEM
// POST /api/groups/:groupCode/items
// =========================================================

router.post(
    "/:groupCode/items",
    authenticateUser,
    addGroupItem
);


// =========================================================
// REMOVE GROUP ITEM
// DELETE /api/groups/:groupCode/items/:menuId
// =========================================================

router.delete(
    "/:groupCode/items/:menuId",
    authenticateUser,
    removeGroupItem
);


// =========================================================
// GET GROUP
// GET /api/groups/:groupCode
// =========================================================

router.get(
    "/:groupCode",
    authenticateUser,
    getGroupOrder
);


module.exports = router;