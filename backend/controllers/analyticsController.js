const Order = require("../models/Order");
const Menu = require("../models/Menu");

// Sales analytics
const getSales = async (req, res) => {
    try {
        const sales = await Order.aggregate([
            {
                $match: {
                    paymentStatus: "paid",
                    orderStatus: { $ne: "Cancelled" }
                }
            },
            {
                $group: {
                    _id: {
                        $dateToString: {
                            format: "%Y-%m-%d",
                            date: "$createdAt"
                        }
                    },
                    revenue: { $sum: "$totalAmount" },
                    orders: { $sum: 1 }
                }
            },
            { $sort: { "_id": 1 } }
        ]);

        res.status(200).json({
            success: true,
            data: sales
        });

    } catch (error) {
        console.error("Error fetching sales:", error);

        res.status(500).json({
            success: false,
            message: "Failed to fetch sales analytics"
        });
    }
};


// Popular items
const getPopularItems = async (req, res) => {
    try {
        const items = await Order.aggregate([
            {
                $match: {
                    orderStatus: { $ne: "Cancelled" }
                }
            },
            { $unwind: "$items" },
            {
                $group: {
                    _id: "$items.menuId",
                    totalQuantity: { $sum: "$items.quantity" }
                }
            },
            { $sort: { totalQuantity: -1 } },
            {
                $lookup: {
                    from: "menus",
                    localField: "_id",
                    foreignField: "_id",
                    as: "menu"
                }
            },
            { $unwind: "$menu" },
            {
                $project: {
                    _id: 0,
                    menuId: "$_id",
                    name: "$menu.name",
                    totalQuantity: 1
                }
            }
        ]);

        res.status(200).json({
            success: true,
            data: items
        });

    } catch (error) {
        console.error("Error fetching popular items:", error);

        res.status(500).json({
            success: false,
            message: "Failed to fetch popular items"
        });
    }
};


// Overall summary
const getSummary = async (req, res) => {
    try {
        const summary = await Order.aggregate([
            {
                $match: {
                    paymentStatus: "paid",
                    orderStatus: { $ne: "Cancelled" }
                }
            },
            {
                $group: {
                    _id: null,
                    totalRevenue: { $sum: "$totalAmount" },
                    totalOrders: { $sum: 1 },
                    averageOrderValue: { $avg: "$totalAmount" }
                }
            }
        ]);

        res.status(200).json({
            success: true,
            data: summary[0] || {
                totalRevenue: 0,
                totalOrders: 0,
                averageOrderValue: 0
            }
        });

    } catch (error) {
        console.error("Error fetching summary:", error);

        res.status(500).json({
            success: false,
            message: "Failed to fetch analytics summary"
        });
    }
};

module.exports = {
    getSales,
    getPopularItems,
    getSummary
};