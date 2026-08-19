const User = require("../models/User");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const registerUser = async (req, res) => {
    try {
        const { userId, name, email, password, phone_no, role } = req.body;

        // Check required fields
        if (!userId || !name || !email || !password) {
            return res.status(400).json({
                success: false,
                message: "User ID, name, email and password are required"
            });
        }

        // Check if email already exists
        const existingEmail = await User.findOne({ email });

        if (existingEmail) {
            return res.status(409).json({
                success: false,
                message: "Email is already registered"
            });
        }

        // Check if userId already exists
        const existingUserId = await User.findOne({ userId });

        if (existingUserId) {
            return res.status(409).json({
                success: false,
                message: "User ID already exists"
            });
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(password, 10);

        // Create new user
        const user = await User.create({
            userId,
            name,
            email,
            password: hashedPassword,
            phone_no,
            role: role || "student"
        });

        return res.status(201).json({
            success: true,
            message: "User registered successfully",
            user: {
                userId: user.userId,
                name: user.name,
                email: user.email,
                phone_no: user.phone_no,
                role: user.role,
                wallet: user.wallet
            }
        });

    } catch (error) {
        console.error("Registration error:", error);

        return res.status(500).json({
            success: false,
            message: "Server error during registration"
        });
    }
};



const loginUser = async (req, res) => {
    try {
        const { email, password } = req.body;

        // Check required fields
        if (!email || !password) {
            return res.status(400).json({
                success: false,
                message: "Email and password are required"
            });
        }

        // Find user
        const user = await User.findOne({ email });

        if (!user) {
            return res.status(401).json({
                success: false,
                message: "Invalid email or password"
            });
        }

        // Compare password
        const isPasswordCorrect = await bcrypt.compare(
            password,
            user.password
        );

        if (!isPasswordCorrect) {
            return res.status(401).json({
                success: false,
                message: "Invalid email or password"
            });
        }

        // Check JWT secret
        if (!process.env.JWT_SECRET) {
            console.error("JWT_SECRET is not configured");

            return res.status(500).json({
                success: false,
                message: "JWT configuration error"
            });
        }

        // Generate JWT
        const token = jwt.sign(
    {
        id: user._id,
        userId: user.userId,
        email: user.email,
        role: user.role
    },
    process.env.JWT_SECRET,
    {
        expiresIn: process.env.JWT_EXPIRES_IN || "7d"
    }
);

        return res.status(200).json({
            success: true,
            message: "Login successful",
            token,
            user: {
                userId: user.userId,
                name: user.name,
                email: user.email,
                phone_no: user.phone_no,
                role: user.role,
                wallet: user.wallet
            }
        });

    } catch (error) {
        console.error("Login error:", error);

        return res.status(500).json({
            success: false,
            message: "Server error during login"
        });
    }
};


module.exports = {
    registerUser,
    loginUser
};