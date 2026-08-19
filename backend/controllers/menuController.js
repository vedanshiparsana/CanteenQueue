const Menu = require("../models/Menu");

// Get all available menu items with optional category filtering
const getMenuItems = async (req, res) => {
    try {
        const { category } = req.query;

        // Base filter: only available food items
        const filter = {
            isAvailable: true
        };

        // Add category filter if provided
        if (category) {
            filter.category = category;
        }

        const menuItems = await Menu.find(filter).sort({ category: 1, name: 1 });

        res.status(200).json({
            success: true,
            count: menuItems.length,
            data: menuItems
        });

    } catch (error) {
        console.error("Error fetching menu:", error);

        res.status(500).json({
            success: false,
            message: "Failed to fetch menu items"
        });
    }
};

module.exports = {
    getMenuItems
};