import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import "./AdminDashboard.css";

function AdminDashboard() {
    const navigate = useNavigate();
    const { user } = useAuth();

    if (!user || user.role !== "admin") {
        return (
            <div className="admin-page">
                <div className="admin-card">
                    <h2>Access Denied</h2>
                    <p>
                        You do not have permission to access the admin dashboard.
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div className="admin-page">
            <div className="admin-container">
                <div className="admin-heading">
                    <p className="admin-eyebrow">
                        CanteenQueue Admin
                    </p>

                    <h1>
                        Admin <span>Dashboard</span>
                    </h1>

                    <p>
                        Manage your campus canteen, menu and inventory from one place.
                    </p>
                </div>

                <div className="admin-welcome">
                    <div>
                        <p>Welcome back 👋</p>

                        <h2>
                            {user.name || "Admin"}
                        </h2>
                    </div>

                    <div className="admin-role">
                        Admin
                    </div>
                </div>

                <div className="admin-section">
                    <div className="admin-section-heading">
                        <h2>Management</h2>

                        <p>
                            Choose a section to manage.
                        </p>
                    </div>

                    <div className="admin-grid">
                        <button
                            className="admin-option"
                            onClick={() => navigate("/admin/menu")}
                        >
                            <div className="admin-option-icon">
                                🍽️
                            </div>

                            <div>
                                <h3>
                                    Menu Management
                                </h3>

                                <p>
                                    Add, edit, delete and manage canteen menu items.
                                </p>
                            </div>

                            <span>→</span>
                        </button>

                        <button
                            className="admin-option"
                            onClick={() => navigate("/admin/inventory")}
                        >
                            <div className="admin-option-icon">
                                📦
                            </div>

                            <div>
                                <h3>
                                    Inventory
                                </h3>

                                <p>
                                    Manage ingredients and monitor available stock.
                                </p>
                            </div>

                            <span>→</span>
                        </button>

                        <button
                            className="admin-option"
                            onClick={() => navigate("/admin/alerts")}
                        >
                            <div className="admin-option-icon">
                                🔔
                            </div>

                            <div>
                                <h3>
                                    Inventory Alerts
                                </h3>

                                <p>
                                    View low-stock and out-of-stock inventory alerts.
                                </p>
                            </div>

                            <span>→</span>
                        </button>
                    </div>
                </div>

                <div className="admin-info">
                    <div className="admin-info-icon">
                        📊
                    </div>

                    <div>
                        <h3>
                            Smart Canteen Management
                        </h3>

                        <p>
                            Keep your menu and inventory updated so students
                            can order smoothly without unnecessary queues.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default AdminDashboard;