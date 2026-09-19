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

        const menuItems = await Menu.find(filter).sort({
            category: 1,
            name: 1
        });

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


// Create menu item - Admin only
const createMenuItem = async (req, res) => {
    try {
        const {
            menuId,
            name,
            description,
            price,
            category,
            imageUrl,
            isAvailable
        } = req.body;

        if (!menuId || !name || price === undefined || !category) {
            return res.status(400).json({
                success: false,
                message: "Menu ID, name, price and category are required"
            });
        }

        if (Number(price) < 0) {
            return res.status(400).json({
                success: false,
                message: "Price cannot be negative"
            });
        }

        const existingMenu = await Menu.findOne({ menuId });

        if (existingMenu) {
            return res.status(409).json({
                success: false,
                message: "Menu ID already exists"
            });
        }

        const menuItem = await Menu.create({
            menuId,
            name,
            description: description || "",
            price: Number(price),
            category,
            imageUrl: imageUrl || "",
            isAvailable: isAvailable !== undefined
                ? isAvailable
                : true
        });

        return res.status(201).json({
            success: true,
            message: "Menu item created successfully",
            data: menuItem
        });

    } catch (error) {
        console.error("Error creating menu item:", error);

        return res.status(500).json({
            success: false,
            message: "Failed to create menu item"
        });
    }
};


// Update menu item / pricing - Admin only
const updateMenuItem = async (req, res) => {
    try {
        const { id } = req.params;

        const {
            name,
            description,
            price,
            category,
            imageUrl,
            isAvailable
        } = req.body;

        const menuItem = await Menu.findOne({ menuId: id });

        if (!menuItem) {
            return res.status(404).json({
                success: false,
                message: "Menu item not found"
            });
        }

        if (price !== undefined && Number(price) < 0) {
            return res.status(400).json({
                success: false,
                message: "Price cannot be negative"
            });
        }

        if (name !== undefined) {
            menuItem.name = name;
        }

        if (description !== undefined) {
            menuItem.description = description;
        }

        if (price !== undefined) {
            menuItem.price = Number(price);
        }

        if (category !== undefined) {
            menuItem.category = category;
        }

        if (imageUrl !== undefined) {
            menuItem.imageUrl = imageUrl;
        }

        if (isAvailable !== undefined) {
            menuItem.isAvailable = isAvailable;
        }

        await menuItem.save();

        return res.status(200).json({
            success: true,
            message: "Menu item updated successfully",
            data: menuItem
        });

    } catch (error) {
        console.error("Error updating menu item:", error);

        return res.status(500).json({
            success: false,
            message: "Failed to update menu item"
        });
    }
};


// Delete menu item - Admin only
const deleteMenuItem = async (req, res) => {
    try {
        const { id } = req.params;

        const menuItem = await Menu.findOneAndDelete({
            menuId: id
        });

        if (!menuItem) {
            return res.status(404).json({
                success: false,
                message: "Menu item not found"
            });
        }

        return res.status(200).json({
            success: true,
            message: "Menu item deleted successfully",
            data: menuItem
        });

    } catch (error) {
        console.error("Error deleting menu item:", error);

        res.status(500).json({
            success: false,
            message: "Failed to delete menu item"
        });
    }
};


module.exports = {
    getMenuItems,
    createMenuItem,
    updateMenuItem,
    deleteMenuItem
};