import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import api from "../services/api";
import AdminSidebar from "../components/AdminSidebar";
import "../styles/pages/MenuManagement.css";

const emptyForm = {
    name: "",
    description: "",
    price: "",
    category: "",
    imageUrl: "",
    isAvailable: true,
};

function MenuManagement() {
    const navigate = useNavigate();
    const { user, loading: authLoading } = useAuth();

    const [menuItems, setMenuItems] = useState([]);
    const [formData, setFormData] = useState(emptyForm);
    const [editingId, setEditingId] = useState(null);

    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    const [message, setMessage] = useState("");
    const [error, setError] = useState("");

    const loadMenu = async () => {
        try {
            setLoading(true);
            setError("");

            const response = await api.get("/menu");

            setMenuItems(response.data.data || []);
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

    const handleChange = (event) => {
        const { name, value, type, checked } = event.target;

        setFormData((current) => ({
            ...current,
            [name]: type === "checkbox" ? checked : value,
        }));
    };

    const resetForm = () => {
        setFormData(emptyForm);
        setEditingId(null);
        setMessage("");
        setError("");
    };

    const handleSubmit = async (event) => {
        event.preventDefault();

        setMessage("");
        setError("");

        if (!formData.name.trim() || !formData.category.trim()) {
            setError("Item name and category are required.");
            return;
        }

        if (formData.price === "" || Number(formData.price) < 0) {
            setError("Please enter a valid price.");
            return;
        }

        const payload = {
            name: formData.name.trim(),
            description: formData.description.trim(),
            price: Number(formData.price),
            category: formData.category.trim(),
            imageUrl: formData.imageUrl.trim(),
            isAvailable: formData.isAvailable,
        };

        try {
            setSaving(true);

            if (editingId) {
                const response = await api.put(
                    `/menu/${editingId}`,
                    payload
                );

                setMenuItems((current) =>
                    current.map((item) =>
                        item.menuId === editingId
                            ? response.data.data
                            : item
                    )
                );

                setMessage("Menu item updated successfully.");
            } else {
                const response = await api.post("/menu", payload);

                const newItem = response.data.data;

                setMenuItems((current) => [
                    ...current,
                    newItem,
                ]);

                setMessage(
                    `Menu item ${newItem.menuId} added successfully.`
                );
            }

            setFormData(emptyForm);
            setEditingId(null);
        } catch (requestError) {
            console.error("Menu save error:", requestError);

            setError(
                requestError.response?.data?.message ||
                    "Unable to save menu item."
            );
        } finally {
            setSaving(false);
        }
    };

    const handleEdit = (item) => {
        setEditingId(item.menuId);

        setFormData({
            name: item.name || "",
            description: item.description || "",
            price: item.price ?? "",
            category: item.category || "",
            imageUrl: item.imageUrl || "",
            isAvailable: item.isAvailable ?? true,
        });

        setMessage("");
        setError("");

        window.scrollTo({
            top: 0,
            behavior: "smooth",
        });
    };

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

            setMenuItems((current) =>
                current.filter(
                    (item) => item.menuId !== menuId
                )
            );

            if (editingId === menuId) {
                setFormData(emptyForm);
                setEditingId(null);
            }

            setMessage("Menu item deleted successfully.");
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

    if (authLoading) {
        return (
            <div className="menu-state-screen">
                <div className="menu-state-card">
                    <div className="menu-state-icon">🍽</div>
                    <h2>Loading menu management...</h2>
                    <p>Please wait.</p>
                </div>
            </div>
        );
    }

    if (!user) {
        return (
            <div className="menu-state-screen">
                <div className="menu-state-card">
                    <div className="menu-state-icon">🔐</div>
                    <h2>Login required</h2>
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
                    <div className="menu-state-icon">⛔</div>
                    <h2>Access Denied</h2>
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

                    {/* Header */}
                    <header className="menu-page-header">
                        <div>
                            <p className="menu-eyebrow">
                                MENU MANAGEMENT
                            </p>

                            <h1>
                                Manage your{" "}
                                <span>menu</span>
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

                    {/* Messages */}
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

                    {/* Stats */}
                    <section className="menu-stats">
                        <div className="menu-stat-card">
                            <div className="menu-stat-icon">
                                🍽
                            </div>

                            <div>
                                <span>Total Items</span>
                                <strong>{totalItems}</strong>
                            </div>
                        </div>

                        <div className="menu-stat-card">
                            <div className="menu-stat-icon green">
                                ✓
                            </div>

                            <div>
                                <span>Available</span>
                                <strong>{availableItems}</strong>
                            </div>
                        </div>

                        <div className="menu-stat-card">
                            <div className="menu-stat-icon orange">
                                ◐
                            </div>

                            <div>
                                <span>Unavailable</span>
                                <strong>{unavailableItems}</strong>
                            </div>
                        </div>

                        <div className="menu-stat-card">
                            <div className="menu-stat-icon purple">
                                ▦
                            </div>

                            <div>
                                <span>Categories</span>
                                <strong>{categories}</strong>
                            </div>
                        </div>
                    </section>

                    {/* Add / Edit Form */}
                    <section className="menu-panel">
                        <div className="menu-panel-header">
                            <div>
                                <p className="menu-section-label">
                                    {editingId
                                        ? "EDIT MENU ITEM"
                                        : "NEW MENU ITEM"}
                                </p>

                                <h2>
                                    {editingId
                                        ? "Update menu item"
                                        : "Add a menu item"}
                                </h2>

                                <p>
                                    Keep your canteen menu accurate
                                    and up to date.
                                </p>
                            </div>

                            <div className="menu-panel-icon">
                                {editingId ? "✎" : "+"}
                            </div>
                        </div>

                        {editingId && (
                            <div className="menu-editing-note">
                                <span>✎</span>
                                Editing Menu ID:
                                <strong>{editingId}</strong>
                            </div>
                        )}

                        <form
                            className="menu-form"
                            onSubmit={handleSubmit}
                        >
                            <div className="menu-form-grid">

                                <div className="menu-form-group">
                                    <label htmlFor="menu-name">
                                        Item Name *
                                    </label>

                                    <input
                                        id="menu-name"
                                        name="name"
                                        value={formData.name}
                                        onChange={handleChange}
                                        placeholder="Example: Veg Sandwich"
                                        required
                                    />
                                </div>

                                <div className="menu-form-group">
                                    <label htmlFor="menu-category">
                                        Category *
                                    </label>

                                    <input
                                        id="menu-category"
                                        name="category"
                                        value={formData.category}
                                        onChange={handleChange}
                                        placeholder="Example: Snacks"
                                        required
                                    />
                                </div>

                                <div className="menu-form-group">
                                    <label htmlFor="menu-price">
                                        Price (₹) *
                                    </label>

                                    <input
                                        id="menu-price"
                                        name="price"
                                        type="number"
                                        min="0"
                                        step="0.01"
                                        value={formData.price}
                                        onChange={handleChange}
                                        placeholder="Example: 80"
                                        required
                                    />
                                </div>

                                <div className="menu-form-group">
                                    <label htmlFor="menu-image">
                                        Image URL
                                    </label>

                                    <input
                                        id="menu-image"
                                        name="imageUrl"
                                        type="url"
                                        value={formData.imageUrl}
                                        onChange={handleChange}
                                        placeholder="https://example.com/image.jpg"
                                    />
                                </div>

                                <div className="menu-form-group menu-form-full">
                                    <label htmlFor="menu-description">
                                        Description
                                    </label>

                                    <textarea
                                        id="menu-description"
                                        name="description"
                                        value={formData.description}
                                        onChange={handleChange}
                                        placeholder="Describe the menu item..."
                                        rows="3"
                                    />
                                </div>

                            </div>

                            {/* Availability */}
                            <label className="menu-availability">
                                <input
                                    type="checkbox"
                                    name="isAvailable"
                                    checked={formData.isAvailable}
                                    onChange={handleChange}
                                />

                                <span className="menu-toggle" />

                                <span className="menu-availability-text">
                                    <strong>
                                        Available for students
                                    </strong>

                                    <small>
                                        Students can see and order
                                        this item.
                                    </small>
                                </span>
                            </label>

                            {/* Buttons */}
                            <div className="menu-form-actions">
                                <button
                                    type="submit"
                                    className="menu-primary-button"
                                    disabled={saving}
                                >
                                    {saving
                                        ? "Saving..."
                                        : editingId
                                        ? "Update Menu Item"
                                        : "Add Menu Item"}

                                    {!saving && (
                                        <span>→</span>
                                    )}
                                </button>

                                {editingId && (
                                    <button
                                        type="button"
                                        className="menu-secondary-button"
                                        onClick={resetForm}
                                    >
                                        Cancel Edit
                                    </button>
                                )}
                            </div>
                        </form>
                    </section>

                    {/* Menu List */}
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
                                    Review and manage your current
                                    dishes.
                                </p>
                            </div>

                            <div className="menu-item-count">
                                {menuItems.length} items
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
                                    the form above.
                                </p>
                            </div>
                        ) : (
                            <div className="menu-table-wrapper">
                                <table className="menu-table">
                                    <thead>
                                        <tr>
                                            <th>Menu ID</th>
                                            <th>Item</th>
                                            <th>Category</th>
                                            <th>Price</th>
                                            <th>Availability</th>
                                            <th>Actions</th>
                                        </tr>
                                    </thead>

                                    <tbody>
                                        {menuItems.map((item) => (
                                            <tr key={item.menuId}>
                                                <td>
                                                    <span className="menu-id">
                                                        {item.menuId}
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
                                                        {item.category}
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
                                                                handleEdit(
                                                                    item
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
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </section>

                    {/* Footer */}
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