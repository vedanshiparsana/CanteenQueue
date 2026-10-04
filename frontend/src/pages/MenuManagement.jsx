import { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import api from "../services/api";
import "../styles/pages/MenuManagement.css";
const emptyForm = {
    name: "",
    description: "",
    price: "",
    category: "",
    imageUrl: "",
    isAvailable: true
};

const MenuManagement = () => {
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
        } catch (error) {
            console.error("Menu loading error:", error);

            setError(
                error.response?.data?.message ||
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

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;

        setFormData({
            ...formData,
            [name]: type === "checkbox" ? checked : value
        });
    };

    const resetForm = () => {
        setFormData(emptyForm);
        setEditingId(null);
        setMessage("");
        setError("");
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        setMessage("");
        setError("");

        if (
            !formData.name ||
            !formData.price ||
            !formData.category
        ) {
            setError(
                "Name, price and category are required."
            );
            return;
        }

        try {
            setSaving(true);

            if (editingId) {
                const response = await api.put(
                    `/menu/${editingId}`,
                    {
                        name: formData.name,
                        description: formData.description,
                        price: Number(formData.price),
                        category: formData.category,
                        imageUrl: formData.imageUrl,
                        isAvailable: formData.isAvailable
                    }
                );

                setMenuItems((currentItems) =>
                    currentItems.map((item) =>
                        item.menuId === editingId
                            ? response.data.data
                            : item
                    )
                );

                setMessage(
                    "Menu item updated successfully."
                );
            } else {
                const response = await api.post(
                    "/menu",
                    {
                        name: formData.name,
                        description: formData.description,
                        price: Number(formData.price),
                        category: formData.category,
                        imageUrl: formData.imageUrl,
                        isAvailable: formData.isAvailable
                    }
                );

                setMenuItems((currentItems) => [
                    ...currentItems,
                    response.data.data
                ]);

                setMessage(
                    `Menu item ${response.data.data.menuId} added successfully.`
                );
            }

            setFormData(emptyForm);
            setEditingId(null);
        } catch (error) {
            console.error("Menu save error:", error);

            setError(
                error.response?.data?.message ||
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
            isAvailable: item.isAvailable
        });

        setMessage("");
        setError("");

        window.scrollTo({
            top: 0,
            behavior: "smooth"
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

            setMenuItems((currentItems) =>
                currentItems.filter(
                    (item) => item.menuId !== menuId
                )
            );

            if (editingId === menuId) {
                resetForm();
            }

            setMessage(
                "Menu item deleted successfully."
            );
        } catch (error) {
            console.error("Menu delete error:", error);

            setError(
                error.response?.data?.message ||
                "Unable to delete menu item."
            );
        }
    };

    if (authLoading) {
        return (
            <div className="admin-loading">
                Loading menu management...
            </div>
        );
    }

    if (!user) {
        return (
            <div className="admin-access-message">
                <h2>Login required</h2>

                <p>
                    Please login to access menu management.
                </p>
            </div>
        );
    }

    if (user.role !== "admin") {
        return (
            <div className="admin-access-message">
                <h2>Access denied</h2>

                <p>
                    Only administrators can access menu management.
                </p>
            </div>
        );
    }

    return (
        <div className="admin-page">
            <div className="admin-container">
                <div className="admin-header">
                    <div>
                        <p className="admin-eyebrow">
                            CanteenQueue Admin
                        </p>

                        <h1>
                            Menu Management
                        </h1>

                        <p>
                            Add, edit and manage the food items
                            available in your campus canteen.
                        </p>
                    </div>

                    <div className="admin-badge">
                        ADMIN
                    </div>
                </div>

                {error && (
                    <div className="admin-message error">
                        {error}
                    </div>
                )}

                {message && (
                    <div className="admin-message success">
                        {message}
                    </div>
                )}

                <div className="admin-section">
                    <div className="section-heading">
                        <div>
                            <p className="section-label">
                                Menu
                            </p>

                            <h2>
                                {editingId
                                    ? `Edit Menu Item (${editingId})`
                                    : "Add Menu Item"}
                            </h2>

                            <p>
                                Enter the details of the food item below.
                                The Menu ID is generated automatically.
                            </p>
                        </div>
                    </div>

                    <form
                        className="menu-form"
                        onSubmit={handleSubmit}
                    >
                        <div className="form-title">
                            {editingId
                                ? `Editing ${editingId}`
                                : "Add Menu Item"}
                        </div>

                        <div className="form-grid">
                            <div className="form-group">
                                <label>
                                    Name *
                                </label>

                                <input
                                    name="name"
                                    value={formData.name}
                                    onChange={handleChange}
                                    placeholder="Example: Masala Dosa"
                                />
                            </div>

                            <div className="form-group">
                                <label>
                                    Price *
                                </label>

                                <input
                                    type="number"
                                    min="0"
                                    step="0.01"
                                    name="price"
                                    value={formData.price}
                                    onChange={handleChange}
                                    placeholder="Enter price"
                                />
                            </div>

                            <div className="form-group">
                                <label>
                                    Category *
                                </label>

                                <input
                                    name="category"
                                    value={formData.category}
                                    onChange={handleChange}
                                    placeholder="Example: Breakfast"
                                />
                            </div>

                            <div className="form-group full-width">
                                <label>
                                    Description
                                </label>

                                <textarea
                                    name="description"
                                    value={formData.description}
                                    onChange={handleChange}
                                    placeholder="Describe the food item"
                                    rows="3"
                                />
                            </div>

                            <div className="form-group full-width">
                                <label>
                                    Image URL
                                </label>

                                <input
                                    name="imageUrl"
                                    value={formData.imageUrl}
                                    onChange={handleChange}
                                    placeholder="Enter image URL"
                                />
                            </div>

                            <label className="availability-check">
                                <input
                                    type="checkbox"
                                    name="isAvailable"
                                    checked={formData.isAvailable}
                                    onChange={handleChange}
                                />

                                <span>
                                    Item is available
                                </span>
                            </label>
                        </div>

                        <div className="form-actions">
                            <button
                                type="submit"
                                className="admin-primary-button"
                                disabled={saving}
                            >
                                {saving
                                    ? "Saving..."
                                    : editingId
                                    ? "Update Item"
                                    : "Add Item"}
                            </button>

                            {editingId && (
                                <button
                                    type="button"
                                    className="admin-secondary-button"
                                    onClick={resetForm}
                                >
                                    Cancel Edit
                                </button>
                            )}
                        </div>
                    </form>
                </div>

                <div className="admin-section">
                    <div className="section-heading menu-list-heading">
                        <div>
                            <p className="section-label">
                                Current Menu
                            </p>

                            <h2>
                                Menu Items
                            </h2>
                        </div>

                        <span className="item-count">
                            {menuItems.length} items
                        </span>
                    </div>

                    {loading ? (
                        <div className="admin-empty">
                            Loading menu items...
                        </div>
                    ) : menuItems.length === 0 ? (
                        <div className="admin-empty">
                            No menu items found.
                        </div>
                    ) : (
                        <div className="menu-table-wrapper">
                            <table className="menu-table">
                                <thead>
                                    <tr>
                                        <th>Menu ID</th>
                                        <th>Name</th>
                                        <th>Category</th>
                                        <th>Price</th>
                                        <th>Status</th>
                                        <th>Actions</th>
                                    </tr>
                                </thead>

                                <tbody>
                                    {menuItems.map((item) => (
                                        <tr key={item.menuId}>
                                            <td>
                                                <strong>
                                                    {item.menuId}
                                                </strong>
                                            </td>

                                            <td>
                                                <div className="menu-name">
                                                    {item.name}
                                                </div>

                                                {item.description && (
                                                    <small>
                                                        {item.description}
                                                    </small>
                                                )}
                                            </td>

                                            <td>
                                                <span className="category-badge">
                                                    {item.category}
                                                </span>
                                            </td>

                                            <td>
                                                ₹
                                                {Number(
                                                    item.price
                                                ).toFixed(2)}
                                            </td>

                                            <td>
                                                <span
                                                    className={
                                                        item.isAvailable
                                                            ? "status available"
                                                            : "status unavailable"
                                                    }
                                                >
                                                    {item.isAvailable
                                                        ? "Available"
                                                        : "Unavailable"}
                                                </span>
                                            </td>

                                            <td>
                                                <div className="table-actions">
                                                    <button
                                                        className="edit-button"
                                                        onClick={() =>
                                                            handleEdit(item)
                                                        }
                                                    >
                                                        Edit
                                                    </button>

                                                    <button
                                                        className="delete-button"
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
                </div>
            </div>
        </div>
    );
};

export default MenuManagement;