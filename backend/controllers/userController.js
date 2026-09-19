const User = require("../models/User");


// Get all users
// Admin only
const getAllUsers = async (req, res) => {
    try {
        const users = await User.find()
            .select("-password")
            .sort({ createdAt: -1 });

        return res.status(200).json({
            success: true,
            count: users.length,
            data: users
        });

    } catch (error) {
        console.error("Error fetching users:", error);

        return res.status(500).json({
            success: false,
            message: "Failed to fetch users"
        });
    }
};


// Get single user
// Admin only
const getUserById = async (req, res) => {
    try {
        const { id } = req.params;

        const user = await User.findOne({ userId: id })
            .select("-password");

        if (!user) {
            return res.status(404).json({
                success: false,
                message: "User not found"
            });
        }

        return res.status(200).json({
            success: true,
            data: user
        });

    } catch (error) {
        console.error("Error fetching user:", error);

        return res.status(500).json({
            success: false,
            message: "Failed to fetch user"
        });
    }
};


// Update user role
// Admin only
const updateUserRole = async (req, res) => {
    try {
        const { id } = req.params;
        const { role } = req.body;

        const validRoles = [
            "student",
            "staff",
            "admin"
        ];

        if (!validRoles.includes(role)) {
            return res.status(400).json({
                success: false,
                message: "Invalid user role"
            });
        }

        const user = await User.findOne({ userId: id });

        if (!user) {
            return res.status(404).json({
                success: false,
                message: "User not found"
            });
        }

        // Prevent admin from changing their own role
        if (user._id.toString() === req.user.id.toString()) {
            return res.status(400).json({
                success: false,
                message: "You cannot change your own role"
            });
        }

        user.role = role;

        await user.save();

        return res.status(200).json({
            success: true,
            message: "User role updated successfully",
            data: {
                userId: user.userId,
                name: user.name,
                email: user.email,
                role: user.role
            }
        });

    } catch (error) {
        console.error("Error updating user role:", error);

        return res.status(500).json({
            success: false,
            message: "Failed to update user role"
        });
    }
};


// Delete user
// Admin only
const deleteUser = async (req, res) => {
    try {
        const { id } = req.params;

        const user = await User.findOne({ userId: id });

        if (!user) {
            return res.status(404).json({
                success: false,
                message: "User not found"
            });
        }

        // Prevent admin from deleting themselves
        if (user._id.toString() === req.user.id.toString()) {
            return res.status(400).json({
                success: false,
                message: "You cannot delete your own account"
            });
        }

        await User.deleteOne({ userId: id });

        return res.status(200).json({
            success: true,
            message: "User deleted successfully"
        });

    } catch (error) {
        console.error("Error deleting user:", error);

        return res.status(500).json({
            success: false,
            message: "Failed to delete user"
        });
    }
};


module.exports = {
    getAllUsers,
    getUserById,
    updateUserRole,
    deleteUser
};