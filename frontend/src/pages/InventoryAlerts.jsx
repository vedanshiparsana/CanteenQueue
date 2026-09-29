import { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import api from "../services/api";
import "./InventoryAlerts.css";

const InventoryAlerts = () => {
    const { user, loading: authLoading } = useAuth();

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
        } catch (error) {
            console.error("Inventory alerts loading error:", error);

            setError(
                error.response?.data?.message ||
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

    const handleResolve = async (alertId) => {
        try {
            setResolvingId(alertId);
            setMessage("");
            setError("");

            await api.put(
                `/inventory-alerts/${alertId}/resolve`
            );

            setAlerts((currentAlerts) =>
                currentAlerts.filter(
                    (alert) => alert._id !== alertId
                )
            );

            setMessage(
                "Inventory alert resolved successfully."
            );
        } catch (error) {
            console.error("Alert resolve error:", error);

            setError(
                error.response?.data?.message ||
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
                icon: "🚨"
            };
        }

        return {
            label: "Low Stock",
            className: "low-stock",
            icon: "⚠️"
        };
    };

    if (authLoading) {
        return (
            <div className="alerts-loading">
                Loading inventory alerts...
            </div>
        );
    }

    if (!user) {
        return (
            <div className="alerts-access-message">
                <h2>Login required</h2>

                <p>
                    Please login to access inventory alerts.
                </p>
            </div>
        );
    }

    if (user.role !== "admin") {
        return (
            <div className="alerts-access-message">
                <h2>Access denied</h2>

                <p>
                    Only administrators can access inventory alerts.
                </p>
            </div>
        );
    }

    return (
        <div className="alerts-page">
            <div className="alerts-container">
                <div className="alerts-header">
                    <div>
                        <p className="alerts-eyebrow">
                            CanteenQueue Admin
                        </p>

                        <h1>
                            Inventory Alerts
                        </h1>

                        <p>
                            Monitor low-stock and out-of-stock
                            inventory items.
                        </p>
                    </div>

                    <div className="alerts-badge">
                        ADMIN
                    </div>
                </div>

                {error && (
                    <div className="alerts-message error">
                        {error}
                    </div>
                )}

                {message && (
                    <div className="alerts-message success">
                        {message}
                    </div>
                )}

                <div className="alerts-section">
                    <div className="alerts-section-heading">
                        <div>
                            <p className="alerts-section-label">
                                Inventory Monitoring
                            </p>

                            <h2>
                                Active Alerts
                            </h2>

                            <p>
                                These inventory items currently
                                need attention.
                            </p>
                        </div>

                        <span className="alerts-count">
                            {alerts.length} active
                        </span>
                    </div>

                    {loading ? (
                        <div className="alerts-empty">
                            Loading inventory alerts...
                        </div>
                    ) : alerts.length === 0 ? (
                        <div className="alerts-empty success-empty">
                            <div className="alerts-empty-icon">
                                ✓
                            </div>

                            <h3>
                                No active alerts
                            </h3>

                            <p>
                                All inventory items currently have
                                sufficient stock.
                            </p>
                        </div>
                    ) : (
                        <div className="alerts-list">
                            {alerts.map((alert) => {
                                const alertDetails =
                                    getAlertDetails(alert);

                                return (
                                    <div
                                        className={`alert-card ${alertDetails.className}`}
                                        key={alert._id}
                                    >
                                        <div className="alert-icon">
                                            {alertDetails.icon}
                                        </div>

                                        <div className="alert-content">
                                            <div className="alert-top">
                                                <div>
                                                    <h3>
                                                        {alert.itemName}
                                                    </h3>

                                                    <p>
                                                        Item ID:{" "}
                                                        {alert.itemId}
                                                    </p>
                                                </div>

                                                <span
                                                    className={`alert-type ${alertDetails.className}`}
                                                >
                                                    {
                                                        alertDetails.label
                                                    }
                                                </span>
                                            </div>

                                            <div className="alert-details">
                                                <div>
                                                    <span>
                                                        Current Stock
                                                    </span>

                                                    <strong>
                                                        {
                                                            alert.currentStock
                                                        }
                                                    </strong>
                                                </div>

                                                <div>
                                                    <span>
                                                        Alert Created
                                                    </span>

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
                                            className="resolve-button"
                                            onClick={() =>
                                                handleResolve(
                                                    alert._id
                                                )
                                            }
                                            disabled={
                                                resolvingId ===
                                                alert._id
                                            }
                                        >
                                            {resolvingId ===
                                            alert._id
                                                ? "Resolving..."
                                                : "Resolve"}
                                        </button>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>

                <div className="alerts-info">
                    <div className="alerts-info-icon">
                        🔔
                    </div>

                    <div>
                        <h3>
                            Automatic Inventory Alerts
                        </h3>

                        <p>
                            Alerts are automatically created when
                            inventory stock reaches 5 or below.
                            Stock at 0 is marked as out of stock.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default InventoryAlerts;