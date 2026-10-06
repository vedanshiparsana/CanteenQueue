import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import api from "../services/api";
import AdminSidebar from "../components/AdminSidebar";
import "../styles/pages/AdminDashboard.css";

function AdminDashboard() {
    const { user, loading: authLoading } = useAuth();
    const navigate = useNavigate();

    const [inventoryItems, setInventoryItems] = useState([]);
    const [loading, setLoading] = useState(true);
    const [inventoryError, setInventoryError] = useState("");

    useEffect(() => {
        if (!authLoading && user?.role === "admin") {
            loadInventory();
        }
    }, [authLoading, user]);

    const loadInventory = async () => {
        try {
            setLoading(true);
            setInventoryError("");

            const response = await api.get("/inventory");

            setInventoryItems(response.data?.data || []);
        } catch (error) {
            console.error("Dashboard inventory error:", error);

            setInventoryItems([]);

            setInventoryError(
                error.response?.data?.message ||
                "Unable to load inventory information."
            );
        } finally {
            setLoading(false);
        }
    };

    const totalItems = inventoryItems.length;

    const outOfStockItems = inventoryItems.filter(
        (item) => Number(item.currentStockCount) === 0
    );

    const lowStockItems = inventoryItems.filter(
        (item) =>
            Number(item.currentStockCount) > 0 &&
            Number(item.currentStockCount) <= 5
    );

    const healthyItems = inventoryItems.filter(
        (item) => Number(item.currentStockCount) > 5
    );

    const getStockStatus = (stock) => {
        const value = Number(stock);

        if (value === 0) {
            return {
                label: "Out of Stock",
                className: "danger"
            };
        }

        if (value <= 5) {
            return {
                label: "Low Stock",
                className: "warning"
            };
        }

        return {
            label: "In Stock",
            className: "success"
        };
    };

    if (authLoading) {
        return (
            <div className="admin-dashboard-state">
                <div className="admin-dashboard-state-card">
                    <div className="admin-dashboard-loader"></div>
                    <p>Loading dashboard...</p>
                </div>
            </div>
        );
    }

    if (!user) {
        return (
            <div className="admin-dashboard-state">
                <div className="admin-dashboard-state-card">
                    <h2>Login required</h2>
                    <p>
                        Please login to access the admin dashboard.
                    </p>
                </div>
            </div>
        );
    }

    if (user.role !== "admin") {
        return (
            <div className="admin-dashboard-state">
                <div className="admin-dashboard-state-card">
                    <h2>Access denied</h2>
                    <p>
                        Only administrators can access this dashboard.
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div className="admin-dashboard">

            <AdminSidebar />

            <main className="admin-dashboard-main">

                {/* =========================
                    HEADER
                ========================= */}

                <header className="admin-dashboard-header">

                    <div>
                        <p className="admin-dashboard-eyebrow">
                            ADMIN WORKSPACE
                        </p>

                        <h1>Dashboard</h1>

                        <p className="admin-dashboard-subtitle">
                            Welcome back. Here's what's happening
                            with your canteen today.
                        </p>
                    </div>

                    <div className="admin-dashboard-profile">

                        <div className="admin-dashboard-profile-avatar">
                            {user?.name?.charAt(0)?.toUpperCase() || "A"}
                        </div>

                        <div>
                            <strong>
                                {user?.name || "Administrator"}
                            </strong>

                            <span>
                                Administrator
                            </span>
                        </div>

                    </div>

                </header>

                {/* =========================
                    WELCOME BANNER
                ========================= */}

                <section className="admin-welcome-card">

                    <div className="admin-welcome-content">

                        <span className="admin-welcome-label">
                            CANTEENQUEUE
                        </span>

                        <h2>
                            Keep your canteen running smoothly.
                        </h2>

                        <p>
                            Manage inventory and menu items from
                            your admin workspace.
                        </p>

                    </div>

                    <div className="admin-welcome-decoration">

                        <div className="admin-welcome-circle circle-one">
                            🍽
                        </div>

                        <div className="admin-welcome-circle circle-two">
                            ✓
                        </div>

                    </div>

                </section>

                {/* =========================
                    STATISTICS
                ========================= */}

                <section className="admin-stats-grid">

                    <div className="admin-stat-card">

                        <div className="admin-stat-icon green">
                            ▣
                        </div>

                        <div className="admin-stat-details">
                            <span>Total Items</span>

                            <strong>
                                {loading ? "—" : totalItems}
                            </strong>

                            <small>
                                Inventory items
                            </small>
                        </div>

                    </div>

                    <div className="admin-stat-card">

                        <div className="admin-stat-icon orange">
                            !
                        </div>

                        <div className="admin-stat-details">
                            <span>Low Stock</span>

                            <strong>
                                {loading
                                    ? "—"
                                    : lowStockItems.length}
                            </strong>

                            <small>
                                Need attention
                            </small>
                        </div>

                    </div>

                    <div className="admin-stat-card">

                        <div className="admin-stat-icon red">
                            ×
                        </div>

                        <div className="admin-stat-details">
                            <span>Out of Stock</span>

                            <strong>
                                {loading
                                    ? "—"
                                    : outOfStockItems.length}
                            </strong>

                            <small>
                                Currently unavailable
                            </small>
                        </div>

                    </div>

                    <div className="admin-stat-card">

                        <div className="admin-stat-icon blue">
                            ✓
                        </div>

                        <div className="admin-stat-details">
                            <span>Healthy Stock</span>

                            <strong>
                                {loading
                                    ? "—"
                                    : healthyItems.length}
                            </strong>

                            <small>
                                Good availability
                            </small>
                        </div>

                    </div>

                </section>

                {/* =========================
                    MAIN GRID
                ========================= */}

                <section className="admin-dashboard-content">

                    {/* INVENTORY STATUS */}

                    <div className="admin-dashboard-panel">

                        <div className="admin-panel-header">

                            <div>
                                <span>
                                    INVENTORY
                                </span>

                                <h2>
                                    Stock Overview
                                </h2>

                                <p>
                                    Current status of your inventory.
                                </p>
                            </div>

                            <button
                                type="button"
                                onClick={() =>
                                    navigate("/admin/inventory")
                                }
                            >
                                View All →
                            </button>

                        </div>

                        {inventoryError ? (
                            <div className="admin-dashboard-error">

                                <span>!</span>

                                <div>
                                    <strong>
                                        Inventory unavailable
                                    </strong>

                                    <p>
                                        {inventoryError}
                                    </p>
                                </div>

                            </div>
                        ) : (
                            <div className="admin-stock-overview">

                                <div className="admin-stock-row">

                                    <div className="admin-stock-info">

                                        <span className="admin-stock-dot green"></span>

                                        <div>
                                            <strong>
                                                Healthy Stock
                                            </strong>

                                            <small>
                                                More than 5 units
                                            </small>
                                        </div>

                                    </div>

                                    <strong className="admin-stock-number">
                                        {loading
                                            ? "—"
                                            : healthyItems.length}
                                    </strong>

                                </div>

                                <div className="admin-stock-row">

                                    <div className="admin-stock-info">

                                        <span className="admin-stock-dot orange"></span>

                                        <div>
                                            <strong>
                                                Low Stock
                                            </strong>

                                            <small>
                                                1 to 5 units remaining
                                            </small>
                                        </div>

                                    </div>

                                    <strong className="admin-stock-number">
                                        {loading
                                            ? "—"
                                            : lowStockItems.length}
                                    </strong>

                                </div>

                                <div className="admin-stock-row">

                                    <div className="admin-stock-info">

                                        <span className="admin-stock-dot red"></span>

                                        <div>
                                            <strong>
                                                Out of Stock
                                            </strong>

                                            <small>
                                                No stock available
                                            </small>
                                        </div>

                                    </div>

                                    <strong className="admin-stock-number">
                                        {loading
                                            ? "—"
                                            : outOfStockItems.length}
                                    </strong>

                                </div>

                            </div>
                        )}

                    </div>

                </section>

                {/* =========================
                    ATTENTION SECTION
                ========================= */}

                <section className="admin-attention-section">

                    <div className="admin-attention-header">

                        <div>
                            <span>
                                ATTENTION NEEDED
                            </span>

                            <h2>
                                Inventory Alerts
                            </h2>
                        </div>

                        {(lowStockItems.length +
                            outOfStockItems.length) > 0 && (
                            <span className="admin-alert-count">
                                {lowStockItems.length +
                                    outOfStockItems.length}{" "}
                                items
                            </span>
                        )}

                    </div>

                    {loading ? (
                        <div className="admin-empty-state">
                            Loading inventory...
                        </div>
                    ) : outOfStockItems.length === 0 &&
                      lowStockItems.length === 0 ? (
                        <div className="admin-good-state">

                            <div className="admin-good-icon">
                                ✓
                            </div>

                            <div>
                                <strong>
                                    Everything looks good
                                </strong>

                                <p>
                                    There are currently no low-stock
                                    or out-of-stock items.
                                </p>
                            </div>

                        </div>
                    ) : (
                        <div className="admin-alert-list">

                            {[
                                ...outOfStockItems,
                                ...lowStockItems
                            ]
                                .slice(0, 5)
                                .map((item) => {

                                    const status =
                                        getStockStatus(
                                            item.currentStockCount
                                        );

                                    return (
                                        <div
                                            className="admin-alert-item"
                                            key={item.itemId}
                                        >

                                            <div className="admin-alert-item-icon">
                                                {status.className ===
                                                "danger"
                                                    ? "×"
                                                    : "!"}
                                            </div>

                                            <div className="admin-alert-item-info">

                                                <strong>
                                                    {item.itemName}
                                                </strong>

                                                <span>
                                                    {item.currentStockCount}{" "}
                                                    {
                                                        item.unitType
                                                    }{" "}
                                                    remaining
                                                </span>

                                            </div>

                                            <span
                                                className={`admin-alert-status ${status.className}`}
                                            >
                                                {status.label}
                                            </span>

                                        </div>
                                    );
                                })}

                            {(outOfStockItems.length +
                                lowStockItems.length) > 5 && (
                                <button
                                    type="button"
                                    className="admin-view-alerts"
                                    onClick={() =>
                                        navigate(
                                            "/admin/inventory"
                                        )
                                    }
                                >
                                    View all inventory alerts →
                                </button>
                            )}

                        </div>
                    )}

                </section>

                {/* =========================
                    RECENT INVENTORY
                ========================= */}

                <section className="admin-recent-section">

                    <div className="admin-recent-header">

                        <div>
                            <span>
                                INVENTORY
                            </span>

                            <h2>
                                Recent Items
                            </h2>
                        </div>

                        <button
                            type="button"
                            onClick={() =>
                                navigate("/admin/inventory")
                            }
                        >
                            Manage Inventory →
                        </button>

                    </div>

                    {loading ? (
                        <div className="admin-empty-state">
                            Loading items...
                        </div>
                    ) : inventoryItems.length === 0 ? (
                        <div className="admin-empty-state">
                            No inventory items found.
                        </div>
                    ) : (
                        <div className="admin-recent-list">

                            {inventoryItems
                                .slice(-5)
                                .reverse()
                                .map((item) => {

                                    const status =
                                        getStockStatus(
                                            item.currentStockCount
                                        );

                                    return (
                                        <div
                                            className="admin-recent-item"
                                            key={item.itemId}
                                        >

                                            <div className="admin-recent-item-icon">
                                                {item.itemName
                                                    ?.charAt(0)
                                                    ?.toUpperCase() ||
                                                    "I"}
                                            </div>

                                            <div className="admin-recent-item-info">

                                                <strong>
                                                    {item.itemName}
                                                </strong>

                                                <span>
                                                    {item.itemId}
                                                </span>

                                            </div>

                                            <div className="admin-recent-stock">

                                                <strong>
                                                    {
                                                        item.currentStockCount
                                                    }
                                                </strong>

                                                <span>
                                                    {
                                                        item.unitType
                                                    }
                                                </span>

                                            </div>

                                            <span
                                                className={`admin-alert-status ${status.className}`}
                                            >
                                                {status.label}
                                            </span>

                                        </div>
                                    );
                                })}

                        </div>
                    )}

                </section>

                {/* FOOTER */}

                <footer className="admin-dashboard-footer">

                    <span>
                        CanteenQueue Admin
                    </span>

                    <span>
                        Smart Campus Canteen Management Platform
                    </span>

                </footer>

            </main>

        </div>
    );
}

export default AdminDashboard;