import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
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
    isAvailable: true
};

function MenuItemForm() {
    const navigate = useNavigate();
    const { menuId } = useParams();
    const { user, loading: authLoading } = useAuth();

    const editingId = menuId || null;

    const [formData, setFormData] = useState(emptyForm);

    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);

    const [message, setMessage] = useState("");
    const [error, setError] = useState("");

    useEffect(() => {
        const loadMenuItem = async () => {
            if (!editingId) {
                return;
            }

            try {
                setLoading(true);
                setError("");

                const response = await api.get("/menu");

                const items = response.data?.data || [];

                const item = items.find(
                    (currentItem) =>
                        currentItem.menuId === editingId
                );

                if (!item) {
                    setError("Menu item not found.");
                    return;
                }

                setFormData({
                    name: item.name || "",
                    description: item.description || "",
                    price: item.price ?? "",
                    category: item.category || "",
                    imageUrl: item.imageUrl || "",
                    isAvailable:
                        item.isAvailable ?? true
                });
            } catch (requestError) {
                console.error(
                    "Menu item loading error:",
                    requestError
                );

                setError(
                    requestError.response?.data?.message ||
                        "Unable to load menu item."
                );
            } finally {
                setLoading(false);
            }
        };

        if (!authLoading && user?.role === "admin") {
            loadMenuItem();
        }
    }, [authLoading, user, editingId]);

    const handleChange = (event) => {
        const {
            name,
            value,
            type,
            checked
        } = event.target;

        setFormData((current) => ({
            ...current,
            [name]:
                type === "checkbox"
                    ? checked
                    : value
        }));
    };

    const handleSubmit = async (event) => {
        event.preventDefault();

        setMessage("");
        setError("");

        if (
            !formData.name.trim() ||
            !formData.category.trim()
        ) {
            setError(
                "Item name and category are required."
            );

            return;
        }

        if (
            formData.price === "" ||
            Number(formData.price) < 0
        ) {
            setError(
                "Please enter a valid price."
            );

            return;
        }

        const payload = {
            name: formData.name.trim(),
            description:
                formData.description.trim(),
            price: Number(formData.price),
            category: formData.category.trim(),
            imageUrl: formData.imageUrl.trim(),
            isAvailable:
                formData.isAvailable
        };

        try {
            setSaving(true);

            if (editingId) {
                await api.put(
                    `/menu/${editingId}`,
                    payload
                );

                setMessage(
                    "Menu item updated successfully."
                );
            } else {
                const response = await api.post(
                    "/menu",
                    payload
                );

                setMessage(
                    `Menu item ${response.data.data.menuId} added successfully.`
                );

                setFormData(emptyForm);
            }
        } catch (requestError) {
            console.error(
                "Menu save error:",
                requestError
            );

            setError(
                requestError.response?.data?.message ||
                    "Unable to save menu item."
            );
        } finally {
            setSaving(false);
        }
    };

    const handleCancel = () => {
        navigate("/admin/menu");
    };

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
                        Please login to access menu
                        management.
                    </p>
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
                        Only administrators can manage
                        menu items.
                    </p>
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
                                {editingId
                                    ? "Update your "
                                    : "Add to your "}
                                <span>menu</span>
                            </h1>

                            <p className="menu-page-subtitle">
                                {editingId
                                    ? "Update the details of this menu item."
                                    : "Add a new dish that students can order."}
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
                                {editingId
                                    ? "✎"
                                    : "+"}
                            </div>
                        </div>

                        {editingId && (
                            <div className="menu-editing-note">
                                <span>✎</span>

                                Editing Menu ID:

                                <strong>
                                    {editingId}
                                </strong>
                            </div>
                        )}

                        {loading ? (
                            <div className="menu-empty-state">
                                <div className="menu-loading-spinner" />

                                <p>
                                    Loading menu item...
                                </p>
                            </div>
                        ) : (
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
                                            value={
                                                formData.name
                                            }
                                            onChange={
                                                handleChange
                                            }
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
                                            value={
                                                formData.category
                                            }
                                            onChange={
                                                handleChange
                                            }
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
                                            value={
                                                formData.price
                                            }
                                            onChange={
                                                handleChange
                                            }
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
                                            value={
                                                formData.imageUrl
                                            }
                                            onChange={
                                                handleChange
                                            }
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
                                            value={
                                                formData.description
                                            }
                                            onChange={
                                                handleChange
                                            }
                                            placeholder="Describe the menu item..."
                                            rows="3"
                                        />
                                    </div>
                                </div>

                                <label className="menu-availability">
                                    <input
                                        type="checkbox"
                                        name="isAvailable"
                                        checked={
                                            formData.isAvailable
                                        }
                                        onChange={
                                            handleChange
                                        }
                                    />

                                    <span className="menu-toggle" />

                                    <span className="menu-availability-text">
                                        <strong>
                                            Available for students
                                        </strong>

                                        <small>
                                            Students can see and
                                            order this item.
                                        </small>
                                    </span>
                                </label>

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
                                            <span>
                                                →
                                            </span>
                                        )}
                                    </button>

                                    <button
                                        type="button"
                                        className="menu-secondary-button"
                                        onClick={
                                            handleCancel
                                        }
                                    >
                                        Cancel
                                    </button>
                                </div>
                            </form>
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

export default MenuItemForm;