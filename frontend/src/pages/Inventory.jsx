import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import api from "../services/api";
import AdminSidebar from "../components/AdminSidebar";
import "../styles/pages/Inventory.css";

const Inventory = () => {
    const navigate = useNavigate();
    const { user, loading: authLoading } = useAuth();

    const [inventoryItems, setInventoryItems] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [message, setMessage] = useState("");

    const loadInventory = async () => {
        try {
            setLoading(true);
            setError("");

            const response = await api.get("/inventory");

            setInventoryItems(response.data?.data || []);
        } catch (error) {
            console.error("Inventory loading error:", error);

            setError(
                error.response?.data?.message ||
                    "Unable to load inventory items."
            );
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (!authLoading && user?.role === "admin") {
            loadInventory();
        }
    }, [authLoading, user]);

    const handleDelete = async (itemId) => {
        const confirmed = window.confirm(
            "Are you sure you want to delete this inventory item?"
        );

        if (!confirmed) {
            return;
        }

        try {
            setMessage("");
            setError("");

            await api.delete(`/inventory/${itemId}`);

            setInventoryItems((currentItems) =>
                currentItems.filter(
                    (item) => item.itemId !== itemId
                )
            );

            setMessage(
                "Inventory item deleted successfully."
            );
        } catch (error) {
            console.error("Inventory delete error:", error);

            setError(
                error.response?.data?.message ||
                    "Unable to delete inventory item."
            );
        }
    };

    const getStockStatus = (stock) => {
        const numericStock = Number(stock);

        if (numericStock === 0) {
            return {
                label: "Out of stock",
                className: "out-of-stock"
            };
        }

        if (numericStock <= 5) {
            return {
                label: "Low stock",
                className: "low-stock"
            };
        }

        return {
            label: "In stock",
            className: "in-stock"
        };
    };

    const stockSummary = useMemo(() => {
        const total = inventoryItems.length;

        const low = inventoryItems.filter((item) => {
            const stock = Number(item.currentStockCount);

            return stock > 0 && stock <= 5;
        }).length;

        const out = inventoryItems.filter(
            (item) =>
                Number(item.currentStockCount) === 0
        ).length;

        const healthy = inventoryItems.filter(
            (item) =>
                Number(item.currentStockCount) > 5
        ).length;

        return {
            total,
            low,
            out,
            healthy
        };
    }, [inventoryItems]);

    if (authLoading) {
        return (
            <div className="inventory-state-screen">
                <div className="inventory-state-card">
                    <div className="inventory-loading-spinner" />

                    <h2>
                        Loading inventory
                    </h2>

                    <p>
                        Please wait while we prepare your
                        inventory workspace.
                    </p>
                </div>
            </div>
        );
    }

    if (!user) {
        return (
            <div className="inventory-state-screen">
                <div className="inventory-state-card">
                    <div className="inventory-state-icon">
                        !
                    </div>

                    <h2>
                        Login required
                    </h2>

                    <p>
                        Please login to access inventory
                        management.
                    </p>
                </div>
            </div>
        );
    }

    if (user.role !== "admin") {
        return (
            <div className="inventory-state-screen">
                <div className="inventory-state-card">
                    <div className="inventory-state-icon">
                        !
                    </div>

                    <h2>
                        Access denied
                    </h2>

                    <p>
                        Only administrators can access
                        inventory management.
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div className="inventory-page">
            <AdminSidebar />

            <main className="inventory-main">
                <div className="inventory-content">
                    <section className="inventory-hero">
                        <div>
                            <p className="inventory-eyebrow">
                                INVENTORY CONTROL
                            </p>

                            <h1>
                                Inventory
                            </h1>

                            <p>
                                Monitor ingredients, manage stock
                                levels and keep your canteen ready
                                for service.
                            </p>
                        </div>

                        <div className="inventory-form-actions">
                            <button
                                type="button"
                                className="inventory-secondary-button"
                                onClick={loadInventory}
                                disabled={loading}
                            >
                                <span>↻</span>

                                {loading
                                    ? "Refreshing..."
                                    : "Refresh stock"}
                            </button>

                            <button
                                type="button"
                                className="inventory-primary-button"
                                onClick={() =>
                                    navigate("/admin/inventory/add")
                                }
                            >
                                + Add item
                            </button>
                        </div>
                    </section>

                    <section className="inventory-stats">
                        <article className="inventory-stat-card">
                            <div className="inventory-stat-icon total">
                                <span>▦</span>
                            </div>

                            <div>
                                <span>
                                    Total items
                                </span>

                                <strong>
                                    {stockSummary.total}
                                </strong>

                                <small>
                                    Items being monitored
                                </small>
                            </div>
                        </article>

                        <article className="inventory-stat-card">
                            <div className="inventory-stat-icon healthy">
                                <span>✓</span>
                            </div>

                            <div>
                                <span>
                                    Healthy stock
                                </span>

                                <strong>
                                    {stockSummary.healthy}
                                </strong>

                                <small>
                                    More than 5 units
                                </small>
                            </div>
                        </article>

                        <article className="inventory-stat-card warning">
                            <div className="inventory-stat-icon low">
                                <span>!</span>
                            </div>

                            <div>
                                <span>
                                    Low stock
                                </span>

                                <strong>
                                    {stockSummary.low}
                                </strong>

                                <small>
                                    1–5 units remaining
                                </small>
                            </div>
                        </article>

                        <article className="inventory-stat-card danger">
                            <div className="inventory-stat-icon out">
                                <span>×</span>
                            </div>

                            <div>
                                <span>
                                    Out of stock
                                </span>

                                <strong>
                                    {stockSummary.out}
                                </strong>

                                <small>
                                    Immediate attention
                                </small>
                            </div>
                        </article>
                    </section>

                    {error && (
                        <div
                            className="inventory-message error"
                            role="alert"
                        >
                            <span>!</span>

                            <p>
                                {error}
                            </p>

                            <button
                                type="button"
                                onClick={loadInventory}
                                disabled={loading}
                            >
                                Try again
                            </button>
                        </div>
                    )}

                    {message && (
                        <div
                            className="inventory-message success"
                            role="status"
                        >
                            <span>✓</span>

                            <p>
                                {message}
                            </p>
                        </div>
                    )}

                    <section className="inventory-panel inventory-list-panel">
                        <div className="inventory-list-heading">
                            <div>
                                <p className="inventory-section-label">
                                    STOCK OVERVIEW
                                </p>

                                <h2>
                                    Inventory items
                                </h2>

                                <p>
                                    Review current stock and manage
                                    individual items.
                                </p>
                            </div>

                            <span className="inventory-item-count">
                                {inventoryItems.length}{" "}
                                {inventoryItems.length === 1
                                    ? "item"
                                    : "items"}
                            </span>
                        </div>

                        {loading ? (
                            <div className="inventory-empty">
                                <div className="inventory-loading-spinner" />

                                <strong>
                                    Loading inventory
                                </strong>

                                <p>
                                    Getting the latest stock information.
                                </p>
                            </div>
                        ) : inventoryItems.length === 0 ? (
                            <div className="inventory-empty">
                                <div className="inventory-empty-icon">
                                    ▦
                                </div>

                                <strong>
                                    No inventory items yet
                                </strong>

                                <p>
                                    Add your first inventory item using
                                    the Add item button above.
                                </p>
                            </div>
                        ) : (
                            <div className="inventory-table-wrapper">
                                <table className="inventory-table">
                                    <thead>
                                        <tr>
                                            <th>Item</th>
                                            <th>Item ID</th>
                                            <th>Current stock</th>
                                            <th>Unit</th>
                                            <th>Updated</th>
                                            <th>Status</th>
                                            <th>Actions</th>
                                        </tr>
                                    </thead>

                                    <tbody>
                                        {inventoryItems.map((item) => {
                                            const stockStatus =
                                                getStockStatus(
                                                    item.currentStockCount
                                                );

                                            return (
                                                <tr key={item.itemId}>
                                                    <td>
                                                        <div className="inventory-item-cell">
                                                            <div className="inventory-item-avatar">
                                                                {(item.itemName || "I")
                                                                    .charAt(0)
                                                                    .toUpperCase()}
                                                            </div>

                                                            <strong>
                                                                {item.itemName ||
                                                                    "Unnamed item"}
                                                            </strong>
                                                        </div>
                                                    </td>

                                                    <td>
                                                        <span className="inventory-id">
                                                            {item.itemId}
                                                        </span>
                                                    </td>

                                                    <td>
                                                        <strong className="inventory-stock-number">
                                                            {
                                                                item.currentStockCount
                                                            }
                                                        </strong>
                                                    </td>

                                                    <td>
                                                        <span className="inventory-unit">
                                                            {item.unitType}
                                                        </span>
                                                    </td>

                                                    <td>
                                                        <span className="inventory-date">
                                                            {item.lastUpdated
                                                                ? new Date(
                                                                      item.lastUpdated
                                                                  ).toLocaleDateString(
                                                                      undefined,
                                                                      {
                                                                          day: "2-digit",
                                                                          month: "short",
                                                                          year: "numeric"
                                                                      }
                                                                  )
                                                                : "-"}
                                                        </span>
                                                    </td>

                                                    <td>
                                                        <span
                                                            className={`inventory-status ${stockStatus.className}`}
                                                        >
                                                            <span />
                                                            {
                                                                stockStatus.label
                                                            }
                                                        </span>
                                                    </td>

                                                    <td>
                                                        <div className="inventory-table-actions">
                                                            <button
                                                                type="button"
                                                                className="inventory-edit-button"
                                                                onClick={() =>
                                                                    navigate(
                                                                        `/admin/inventory/edit/${item.itemId}`
                                                                    )
                                                                }
                                                            >
                                                                Edit
                                                            </button>

                                                            <button
                                                                type="button"
                                                                className="inventory-delete-button"
                                                                onClick={() =>
                                                                    handleDelete(
                                                                        item.itemId
                                                                    )
                                                                }
                                                            >
                                                                Delete
                                                            </button>
                                                        </div>
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </section>

                    <section className="inventory-alert-note">
                        <div className="inventory-alert-icon">
                            !
                        </div>

                        <div>
                            <strong>
                                Stock monitoring
                            </strong>

                            <p>
                                Items with 5 or fewer units are considered
                                low stock. Items at 0 are marked out of stock
                                and will appear in the dashboard notifications.
                            </p>
                        </div>
                    </section>

                    <footer className="inventory-footer">
                        <span>
                            © {new Date().getFullYear()} CanteenQueue
                        </span>

                        <span>
                            Keep campus dining running smoothly.
                        </span>
                    </footer>
                </div>
            </main>
        </div>
    );
};

export default Inventory;