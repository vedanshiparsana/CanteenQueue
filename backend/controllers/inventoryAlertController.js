const InventoryAlert = require("../models/InventoryAlert");

// Get active alerts
const getActiveAlerts = async (req, res) => {
    try {
        const alerts = await InventoryAlert.find({
            status: "ACTIVE"
        }).sort({ createdAt: -1 });

        res.status(200).json({
            success: true,
            count: alerts.length,
            data: alerts
        });

    } catch (error) {
        console.error("Error fetching alerts:", error);

        res.status(500).json({
            success: false,
            message: "Failed to fetch inventory alerts"
        });
    }
};


// Get all alerts
const getAllAlerts = async (req, res) => {
    try {
        const alerts = await InventoryAlert.find()
            .sort({ createdAt: -1 });

        res.status(200).json({
            success: true,
            count: alerts.length,
            data: alerts
        });

    } catch (error) {
        console.error("Error fetching all alerts:", error);

        res.status(500).json({
            success: false,
            message: "Failed to fetch inventory alerts"
        });
    }
};


// Resolve alert manually
const resolveAlert = async (req, res) => {
    try {
        const alert = await InventoryAlert.findByIdAndUpdate(
            req.params.id,
            {
                status: "RESOLVED"
            },
            { new: true }
        );

        if (!alert) {
            return res.status(404).json({
                success: false,
                message: "Alert not found"
            });
        }

        res.status(200).json({
            success: true,
            message: "Alert resolved successfully",
            data: alert
        });

    } catch (error) {
        console.error("Error resolving alert:", error);

        res.status(500).json({
            success: false,
            message: "Failed to resolve alert"
        });
    }
};


module.exports = {
    getActiveAlerts,
    getAllAlerts,
    resolveAlert
};