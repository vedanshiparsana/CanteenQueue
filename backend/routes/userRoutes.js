const express = require("express");

const {
    getAllUsers,
    getUserById,
    updateMyProfile,
    updateUserRole,
    deleteUser
} = require("../controllers/userController");

const authenticateUser = require("../middleware/authMiddleware");
const authorizeRoles = require("../middleware/roleMiddleware");

const router = express.Router();

router.put(
    "/profile",
    authenticateUser,
    updateMyProfile
);


// Get all users
// Admin only
router.get(
    "/",
    authenticateUser,
    authorizeRoles("admin"),
    getAllUsers
);


// Get single user
// Admin only
router.get(
    "/:id",
    authenticateUser,
    authorizeRoles("admin"),
    getUserById
);


// Update user role
// Admin only
router.put(
    "/:id/role",
    authenticateUser,
    authorizeRoles("admin"),
    updateUserRole
);


// Delete user
// Admin only
router.delete(
    "/:id",
    authenticateUser,
    authorizeRoles("admin"),
    deleteUser
);


module.exports = router;