
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import api from "../services/api";
import logo from "../assets/logo.png";
import "../styles/pages/InventoryAlerts.css";

function InventoryAlerts() {
    const navigate = useNavigate();
    const { user, loading: authLoading, logout } = useAuth();

    const [alerts, setAlerts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [resolvingId, setResolvingId] = useState(null);
    const [message, setMessage] = useState("");
    const [error, setError] = useState("");

    const loadAlerts = async () => {
        try {
            setLoading(true);
            setError("");

            const response = await api.get("/inventory-alerts");
            setAlerts(response.data.data || []);
        } catch (err) {
            console.error("Inventory alerts loading error:", err);
            setError(
                err.response?.data?.message ||
                "Unable to load inventory alerts."
            );
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (!authLoading && user?.role === "admin") {
            loadAlerts();
        }
    }, [authLoading, user]);

    const handleLogout = () => {
        logout();
        navigate("/login");
    };

    const handleResolve = async (alertId) => {
        try {
            setResolvingId(alertId);
            setMessage("");
            setError("");

            await api.put(`/inventory-alerts/${alertId}/resolve`);

            setAlerts((current) =>
                current.filter((alert) => alert._id !== alertId)
            );

            setMessage("Inventory alert resolved successfully.");
        } catch (err) {
            console.error("Alert resolve error:", err);
            setError(
                err.response?.data?.message ||
                "Unable to resolve inventory alert."
            );
        } finally {
            setResolvingId(null);
        }
    };

    const getAlertDetails = (alert) => {
        if (alert.alertType === "OUT_OF_STOCK") {
            return {
                label: "Out of Stock",
                className: "out-of-stock",
                icon: "!",
                description: "This item currently has no stock available.",
            };
        }

        return {
            label: "Low Stock",
            className: "low-stock",
            icon: "↘",
            description: "This item has reached a low stock level.",
        };
    };

    if (authLoading) {
        return (
            <div className="alerts-state-screen">
                Loading account...
            </div>
        );
    }

    if (!user || user.role !== "admin") {
        return (
            <div className="alerts-state-screen">
                <div className="alerts-access-card">
                    <h2>{!user ? "Login required" : "Access denied"}</h2>
                    <p>
                        {!user
                            ? "Please log in to access inventory alerts."
                            : "Only administrators can access inventory alerts."}
                    </p>
                    <button
                        type="button"
                        className="alerts-primary-button"
                        onClick={() => navigate("/login")}
                    >
                        Go to Login
                    </button>
                </div>
            </div>
        );
    }

    const outOfStockCount = alerts.filter(
        (alert) => alert.alertType === "OUT_OF_STOCK"
    ).length;

    const lowStockCount = alerts.length - outOfStockCount;

    return (
        <div className="alerts-layout">
            <aside className="alerts-sidebar">
                <button
                    className="alerts-brand"
                    type="button"
                    onClick={() => navigate("/admin")}
                    aria-label="CanteenQueue Admin home"
                >
                    <img src={logo} alt="CanteenQueue" />
                </button>

                <p className="alerts-sidebar-label">WORKSPACE</p>

                <nav className="alerts-navigation" aria-label="Admin navigation">
                    <button
                        type="button"
                        className="alerts-nav-item"
                        onClick={() => navigate("/admin/menu")}
                    >
                        <span className="alerts-nav-icon">≡</span>
                        <span>Menu Management</span>
                        <span className="alerts-nav-arrow">›</span>
                    </button>

                    <button
                        type="button"
                        className="alerts-nav-item"
                        onClick={() => navigate("/admin/inventory")}
                    >
                        <span className="alerts-nav-icon">▦</span>
                        <span>Inventory</span>
                        <span className="alerts-nav-arrow">›</span>
                    </button>
                </nav>

                <div className="alerts-sidebar-bottom">
                    <div className="alerts-sidebar-note">
                        <span className="alerts-note-icon">!</span>
                        <strong>Stay on top of stock</strong>
                        <p>Review alerts and resolve them after checking the stock.</p>
                    </div>

                    <div className="alerts-sidebar-user">
                        <div className="alerts-avatar">
                            {(user.name || "A").trim().charAt(0).toUpperCase()}
                        </div>
                        <div className="alerts-user-details">
                            <strong>{user.name || "Admin"}</strong>
                            <span>Administrator</span>
                        </div>
                    </div>

                    <button
                        type="button"
                        className="alerts-logout"
                        onClick={handleLogout}
                    >
                        <span aria-hidden="true">↪</span> Logout
                    </button>
                </div>
            </aside>

            <main className="alerts-main">
                <header className="alerts-topbar">
                    <div>
                        <p className="alerts-breadcrumb">
                            Workspace <span>/</span> Inventory Alerts
                        </p>
                        <p className="alerts-topbar-subtitle">
                            Stock monitoring and notifications
                        </p>
                    </div>

                    <div className="alerts-topbar-profile">
                        <span className="alerts-online-dot" />
                        <span>Admin account</span>
                        <div className="alerts-topbar-avatar">
                            {(user.name || "A").trim().charAt(0).toUpperCase()}
                        </div>
                    </div>
                </header>

                <div className="alerts-content">
                    <section className="alerts-page-heading">
                        <div>
                            <p className="alerts-eyebrow">STOCK MONITORING</p>
                            <h1>Inventory Alerts</h1>
                            <p>
                                Keep an eye on supplies that need attention
                                before they interrupt canteen operations.
                            </p>
                        </div>

                        <button
                            type="button"
                            className="alerts-refresh-button"
                            onClick={loadAlerts}
                            disabled={loading}
                        >
                            <span aria-hidden="true">↻</span>
                            {loading ? "Refreshing..." : "Refresh alerts"}
                        </button>
                    </section>

                    <section className="alerts-summary-grid">
                        <div className="alerts-summary-card">
                            <div className="alerts-summary-icon active-alerts-icon">
                                <span>!</span>
                            </div>
                            <div>
                                <span>Active alerts</span>
                                <strong>{alerts.length}</strong>
                                <small>Items needing attention</small>
                            </div>
                        </div>

                        <div className="alerts-summary-card">
                            <div className="alerts-summary-icon low-alerts-icon">
                                <span>↘</span>
                            </div>
                            <div>
                                <span>Low stock</span>
                                <strong>{lowStockCount}</strong>
                                <small>Restocking may be needed</small>
                            </div>
                        </div>

                        <div className="alerts-summary-card">
                            <div className="alerts-summary-icon out-alerts-icon">
                                <span>×</span>
                            </div>
                            <div>
                                <span>Out of stock</span>
                                <strong>{outOfStockCount}</strong>
                                <small>No stock remaining</small>
                            </div>
                        </div>
                    </section>

                    {error && (
                        <div className="alerts-message error" role="alert">
                            <span>!</span> {error}
                        </div>
                    )}

                    {message && (
                        <div className="alerts-message success" role="status">
                            <span>✓</span> {message}
                        </div>
                    )}

                    <section className="alerts-panel">
                        <div className="alerts-section-heading">
                            <div>
                                <p className="alerts-section-label">NEEDS ATTENTION</p>
                                <h2>Active alerts</h2>
                                <p>
                                    Check the current stock and resolve alerts
                                    once the issue has been addressed.
                                </p>
                            </div>

                            <span className="alerts-count">
                                {alerts.length} active
                            </span>
                        </div>

                        {loading ? (
                            <div className="alerts-empty">
                                <span className="alerts-loading-spinner" />
                                Loading inventory alerts...
                            </div>
                        ) : alerts.length === 0 ? (
                            <div className="alerts-empty success-empty">
                                <div className="alerts-empty-icon">✓</div>
                                <h3>You're all caught up!</h3>
                                <p>
                                    There are no active inventory alerts to display.
                                    Your current alert list is clear.
                                </p>
                                <button
                                    type="button"
                                    className="alerts-secondary-button"
                                    onClick={() => navigate("/admin/inventory")}
                                >
                                    View inventory <span aria-hidden="true">→</span>
                                </button>
                            </div>
                        ) : (
                            <div className="alerts-list">
                                {alerts.map((alert) => {
                                    const details = getAlertDetails(alert);

                                    return (
                                        <article
                                            className={`alert-card ${details.className}`}
                                            key={alert._id}
                                        >
                                            <div className={`alert-icon ${details.className}`}>
                                                {details.icon}
                                            </div>

                                            <div className="alert-content">
                                                <div className="alert-top">
                                                    <div className="alert-item-heading">
                                                        <h3>{alert.itemName}</h3>
                                                        <p>Item ID: {alert.itemId}</p>
                                                    </div>

                                                    <span
                                                        className={`alert-type ${details.className}`}
                                                    >
                                                        <span />
                                                        {details.label}
                                                    </span>
                                                </div>

                                                <p className="alert-description">
                                                    {details.description}
                                                </p>

                                                <div className="alert-details">
                                                    <div>
                                                        <span>Current stock</span>
                                                        <strong>{alert.currentStock}</strong>
                                                    </div>

                                                    <div>
                                                        <span>Alert created</span>
                                                        <strong>
                                                            {alert.createdAt
                                                                ? new Date(
                                                                    alert.createdAt
                                                                ).toLocaleString()
                                                                : "-"}
                                                        </strong>
                                                    </div>
                                                </div>
                                            </div>

                                            <button
                                                type="button"
                                                className="resolve-button"
                                                onClick={() => handleResolve(alert._id)}
                                                disabled={resolvingId === alert._id}
                                            >
                                                {resolvingId === alert._id
                                                    ? "Resolving..."
                                                    : "Resolve alert"}
                                            </button>
                                        </article>
                                    );
                                })}
                            </div>
                        )}
                    </section>

                    <section className="alerts-info">
                        <div className="alerts-info-icon">i</div>
                        <div>
                            <h3>How inventory alerts work</h3>
                            <p>
                                Your current inventory rules flag stock counts of
                                5 or below as low stock, and a count of 0 as out
                                of stock. Review the item in Inventory before
                                resolving its alert.
                            </p>
                        </div>
                        <button
                            type="button"
                            className="alerts-info-button"
                            onClick={() => navigate("/admin/inventory")}
                        >
                            Manage stock <span aria-hidden="true">→</span>
                        </button>
                    </section>

                    <footer className="alerts-footer">
                        <span>© {new Date().getFullYear()} CanteenQueue</span>
                        <span>Made for smoother campus dining.</span>
                    </footer>
                </div>
            </main>
        </div>
    );
}

export default InventoryAlerts;
