const Inventory = require("../models/Inventory");
const InventoryAlert = require("../models/InventoryAlert");

// Create inventory item
const createInventoryItem = async (req, res) => {
    try {
        const { itemId, itemName, currentStockCount, unitType } = req.body;

        const existingItem = await Inventory.findOne({ itemId });

        if (existingItem) {
            return res.status(400).json({
                success: false,
                message: "Item ID already exists"
            });
        }

        const item = await Inventory.create({
            itemId,
            itemName,
            currentStockCount,
            unitType
        });

        if (currentStockCount <= 5) {
            await InventoryAlert.create({
                itemId,
                itemName,
                alertType: currentStockCount === 0
                    ? "OUT_OF_STOCK"
                    : "LOW_STOCK",
                currentStock: currentStockCount
            });
        }

        res.status(201).json({
            success: true,
            message: "Inventory item created successfully",
            data: item
        });

    } catch (error) {
        console.error("Error creating inventory:", error);

        res.status(500).json({
            success: false,
            message: "Failed to create inventory item"
        });
    }
};

// Get all inventory items
const getInventoryItems = async (req, res) => {
    try {
        const items = await Inventory.find().sort({ itemName: 1 });

        res.status(200).json({
            success: true,
            count: items.length,
            data: items
        });

    } catch (error) {
        console.error("Error fetching inventory:", error);

        res.status(500).json({
            success: false,
            message: "Failed to fetch inventory"
        });
    }
};


// Update inventory item
const updateInventoryItem = async (req, res) => {
    try {
        const item = await Inventory.findOneAndUpdate(
            { itemId: req.params.id },
            {
                ...req.body,
                lastUpdated: new Date()
            },
            { new: true, runValidators: true }
        );

        if (!item) {
            return res.status(404).json({
                success: false,
                message: "Inventory item not found"
            });
        }

        // Check stock level
        if (item.currentStockCount <= 5) {

            const alertType = item.currentStockCount === 0
                ? "OUT_OF_STOCK"
                : "LOW_STOCK";

            // Remove old active alert
            await InventoryAlert.updateMany(
                {
                    itemId: item.itemId,
                    status: "ACTIVE"
                },
                {
                    status: "RESOLVED"
                }
            );

            // Create new alert
            await InventoryAlert.create({
                itemId: item.itemId,
                itemName: item.itemName,
                alertType,
                currentStock: item.currentStockCount
            });

        } else {

            // Stock is sufficient, resolve active alerts
            await InventoryAlert.updateMany(
                {
                    itemId: item.itemId,
                    status: "ACTIVE"
                },
                {
                    status: "RESOLVED"
                }
            );
        }

        res.status(200).json({
            success: true,
            message: "Inventory item updated successfully",
            data: item
        });

    } catch (error) {
        console.error("Error updating inventory:", error);

        res.status(500).json({
            success: false,
            message: "Failed to update inventory item"
        });
    }
};

// Delete inventory item
const deleteInventoryItem = async (req, res) => {
    try {
        const item = await Inventory.findOneAndDelete({
            itemId: req.params.id
        });

        if (!item) {
            return res.status(404).json({
                success: false,
                message: "Inventory item not found"
            });
        }

        res.status(200).json({
            success: true,
            message: "Inventory item deleted successfully"
        });

    } catch (error) {
        console.error("Error deleting inventory:", error);

        res.status(500).json({
            success: false,
            message: "Failed to delete inventory item"
        });
    }
};

module.exports = {
    createInventoryItem,
    getInventoryItems,
    updateInventoryItem,
    deleteInventoryItem
};