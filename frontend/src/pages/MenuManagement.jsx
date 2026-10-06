import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import api from "../services/api";
import AdminSidebar from "../components/AdminSidebar";
import "../styles/pages/MenuManagement.css";

function MenuManagement() {
    const navigate = useNavigate();
    const { user, loading: authLoading } = useAuth();

    const [menuItems, setMenuItems] = useState([]);
    const [loading, setLoading] = useState(true);

    const [message, setMessage] = useState("");
    const [error, setError] = useState("");
    const [searchTerm, setSearchTerm] = useState("");

    const loadMenu = async () => {
        try {
            setLoading(true);
            setError("");

            const response = await api.get("/menu");

            setMenuItems(response.data?.data || []);
        } catch (requestError) {
            console.error("Menu loading error:", requestError);

            setError(
                requestError.response?.data?.message ||
                    "Unable to load menu items."
            );
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (!authLoading && user?.role === "admin") {
            loadMenu();
        }
    }, [authLoading, user]);

    const handleDelete = async (menuId) => {
        const confirmed = window.confirm(
            "Are you sure you want to delete this menu item?"
        );

        if (!confirmed) {
            return;
        }

        try {
            setMessage("");
            setError("");

            await api.delete(`/menu/${menuId}`);

            setMenuItems((currentItems) =>
                currentItems.filter(
                    (item) => item.menuId !== menuId
                )
            );

            setMessage(
                "Menu item deleted successfully."
            );
        } catch (requestError) {
            console.error("Menu delete error:", requestError);

            setError(
                requestError.response?.data?.message ||
                    "Unable to delete menu item."
            );
        }
    };

    const totalItems = menuItems.length;

    const availableItems = menuItems.filter(
        (item) => item.isAvailable
    ).length;

    const unavailableItems = menuItems.filter(
        (item) => !item.isAvailable
    ).length;

    const categories = new Set(
        menuItems
            .map((item) => item.category)
            .filter(Boolean)
    ).size;

    const filteredMenuItems = useMemo(() => {
        const search = searchTerm.trim().toLowerCase();

        if (!search) {
            return menuItems;
        }

        return menuItems.filter((item) => {
            return (
                item.name
                    ?.toLowerCase()
                    .includes(search) ||
                item.menuId
                    ?.toLowerCase()
                    .includes(search) ||
                item.category
                    ?.toLowerCase()
                    .includes(search) ||
                item.description
                    ?.toLowerCase()
                    .includes(search)
            );
        });
    }, [menuItems, searchTerm]);

    if (authLoading) {
        return (
            <div className="menu-state-screen">
                <div className="menu-state-card">
                    <div className="menu-state-icon">
                        🍽
                    </div>

                    <h2>
                        Loading menu management...
                    </h2>

                    <p>
                        Please wait.
                    </p>
                </div>
            </div>
        );
    }

    if (!user) {
        return (
            <div className="menu-state-screen">
                <div className="menu-state-card">
                    <div className="menu-state-icon">
                        🔐
                    </div>

                    <h2>
                        Login required
                    </h2>

                    <p>
                        Please login to access menu management.
                    </p>

                    <button
                        type="button"
                        onClick={() => navigate("/login")}
                    >
                        Go to Login
                    </button>
                </div>
            </div>
        );
    }

    if (user.role !== "admin") {
        return (
            <div className="menu-state-screen">
                <div className="menu-state-card">
                    <div className="menu-state-icon">
                        ⛔
                    </div>

                    <h2>
                        Access Denied
                    </h2>

                    <p>
                        Only administrators can manage menu items.
                    </p>

                    <button
                        type="button"
                        onClick={() => navigate("/")}
                    >
                        Return Home
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="menu-page">
            <AdminSidebar />

            <main className="menu-main">
                <div className="menu-content">
                    <header className="menu-page-header">
                        <div>
                            <p className="menu-eyebrow">
                                MENU MANAGEMENT
                            </p>

                            <h1>
                                Manage your <span>menu</span>
                            </h1>

                            <p className="menu-page-subtitle">
                                Add dishes, update prices and control
                                what students can order.
                            </p>
                        </div>

                        <div className="menu-header-badge">
                            <span>●</span>
                            Admin Workspace
                        </div>
                    </header>

                    {error && (
                        <div
                            className="menu-message menu-error"
                            role="alert"
                        >
                            <span>!</span>
                            {error}
                        </div>
                    )}

                    {message && (
                        <div
                            className="menu-message menu-success"
                            role="status"
                        >
                            <span>✓</span>
                            {message}
                        </div>
                    )}

                    <section className="menu-stats">
                        <div className="menu-stat-card">
                            <div className="menu-stat-icon">
                                🍽
                            </div>

                            <div>
                                <span>
                                    Total Items
                                </span>

                                <strong>
                                    {totalItems}
                                </strong>
                            </div>
                        </div>

                        <div className="menu-stat-card">
                            <div className="menu-stat-icon green">
                                ✓
                            </div>

                            <div>
                                <span>
                                    Available
                                </span>

                                <strong>
                                    {availableItems}
                                </strong>
                            </div>
                        </div>

                        <div className="menu-stat-card">
                            <div className="menu-stat-icon orange">
                                ◐
                            </div>

                            <div>
                                <span>
                                    Unavailable
                                </span>

                                <strong>
                                    {unavailableItems}
                                </strong>
                            </div>
                        </div>

                        <div className="menu-stat-card">
                            <div className="menu-stat-icon purple">
                                ▦
                            </div>

                            <div>
                                <span>
                                    Categories
                                </span>

                                <strong>
                                    {categories}
                                </strong>
                            </div>
                        </div>
                    </section>

                    <section className="menu-panel menu-list-panel">
                        <div className="menu-list-header">
                            <div>
                                <p className="menu-section-label">
                                    YOUR CANTEEN
                                </p>

                                <h2>
                                    Menu items
                                </h2>

                                <p>
                                    Review and manage your current dishes.
                                </p>
                            </div>

                            <div className="menu-list-controls">
                                <input
                                    type="text"
                                    className="menu-search-input"
                                    placeholder="Search menu..."
                                    value={searchTerm}
                                    onChange={(e) =>
                                        setSearchTerm(e.target.value)
                                    }
                                />

                                <button
                                    type="button"
                                    className="menu-primary-button"
                                    onClick={() =>
                                        navigate("/admin/menu/add")
                                    }
                                >
                                    + Add Menu Item
                                </button>

                                <div className="menu-item-count">
                                    {filteredMenuItems.length}{" "}
                                    {filteredMenuItems.length === 1
                                        ? "item"
                                        : "items"}
                                </div>
                            </div>
                        </div>

                        {loading ? (
                            <div className="menu-empty-state">
                                <div className="menu-loading-spinner" />

                                <p>
                                    Loading menu items...
                                </p>
                            </div>
                        ) : menuItems.length === 0 ? (
                            <div className="menu-empty-state">
                                <div className="menu-empty-icon">
                                    🍽
                                </div>

                                <h3>
                                    Your menu is empty
                                </h3>

                                <p>
                                    Add your first menu item using
                                    the Add Menu Item button.
                                </p>
                            </div>
                        ) : filteredMenuItems.length === 0 ? (
                            <div className="menu-empty-state">
                                <div className="menu-empty-icon">
                                    🔍
                                </div>

                                <h3>
                                    No matching menu items
                                </h3>

                                <p>
                                    Try searching by item name,
                                    ID, category or description.
                                </p>
                            </div>
                        ) : (
                            <div className="menu-table-wrapper">
                                <table className="menu-table">
                                    <thead>
                                        <tr>
                                            <th>
                                                Menu ID
                                            </th>

                                            <th>
                                                Item
                                            </th>

                                            <th>
                                                Category
                                            </th>

                                            <th>
                                                Price
                                            </th>

                                            <th>
                                                Availability
                                            </th>

                                            <th>
                                                Actions
                                            </th>
                                        </tr>
                                    </thead>

                                    <tbody>
                                        {filteredMenuItems.map(
                                            (item) => (
                                                <tr
                                                    key={item.menuId}
                                                >
                                                    <td>
                                                        <span className="menu-id">
                                                            {
                                                                item.menuId
                                                            }
                                                        </span>
                                                    </td>

                                                    <td>
                                                        <div className="menu-table-item">
                                                            <strong>
                                                                {item.name}
                                                            </strong>

                                                            {item.description && (
                                                                <small>
                                                                    {
                                                                        item.description
                                                                    }
                                                                </small>
                                                            )}
                                                        </div>
                                                    </td>

                                                    <td>
                                                        <span className="menu-category">
                                                            {
                                                                item.category
                                                            }
                                                        </span>
                                                    </td>

                                                    <td className="menu-price">
                                                        ₹
                                                        {Number(
                                                            item.price
                                                        ).toFixed(2)}
                                                    </td>

                                                    <td>
                                                        <span
                                                            className={`menu-status ${
                                                                item.isAvailable
                                                                    ? "available"
                                                                    : "unavailable"
                                                            }`}
                                                        >
                                                            <span />

                                                            {item.isAvailable
                                                                ? "Available"
                                                                : "Unavailable"}
                                                        </span>
                                                    </td>

                                                    <td>
                                                        <div className="menu-table-actions">
                                                            <button
                                                                type="button"
                                                                className="menu-edit-button"
                                                                onClick={() =>
                                                                    navigate(
                                                                        `/admin/menu/edit/${item.menuId}`
                                                                    )
                                                                }
                                                            >
                                                                Edit
                                                            </button>

                                                            <button
                                                                type="button"
                                                                className="menu-delete-button"
                                                                onClick={() =>
                                                                    handleDelete(
                                                                        item.menuId
                                                                    )
                                                                }
                                                            >
                                                                Delete
                                                            </button>
                                                        </div>
                                                    </td>
                                                </tr>
                                            )
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </section>

                    <footer className="menu-footer">
                        <span>
                            CanteenQueue Admin
                        </span>

                        <span>
                            Menu Management
                        </span>
                    </footer>
                </div>
            </main>
        </div>
    );
}

export default MenuManagement;