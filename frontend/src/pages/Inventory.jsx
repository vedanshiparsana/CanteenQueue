import { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import api from "../services/api";
import "./Inventory.css";

const emptyForm = {
    itemName: "",
    currentStockCount: "",
    unitType: ""
};

const Inventory = () => {
    const { user, loading: authLoading } = useAuth();

    const [inventoryItems, setInventoryItems] = useState([]);
    const [formData, setFormData] = useState(emptyForm);
    const [editingId, setEditingId] = useState(null);

    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    const [message, setMessage] = useState("");
    const [error, setError] = useState("");

    const loadInventory = async () => {
        try {
            setLoading(true);
            setError("");

            const response = await api.get("/inventory");

            setInventoryItems(response.data.data || []);
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

    const handleChange = (e) => {
        const { name, value } = e.target;

        setFormData({
            ...formData,
            [name]: value
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
            !formData.itemName ||
            formData.currentStockCount === "" ||
            !formData.unitType
        ) {
            setError(
                "Item name, stock count and unit type are required."
            );
            return;
        }

        if (Number(formData.currentStockCount) < 0) {
            setError("Stock count cannot be negative.");
            return;
        }

        try {
            setSaving(true);

            if (editingId) {
                const response = await api.put(
                    `/inventory/${editingId}`,
                    {
                        itemName: formData.itemName,
                        currentStockCount: Number(
                            formData.currentStockCount
                        ),
                        unitType: formData.unitType
                    }
                );

                setInventoryItems((currentItems) =>
                    currentItems.map((item) =>
                        item.itemId === editingId
                            ? response.data.data
                            : item
                    )
                );

                setMessage(
                    "Inventory item updated successfully."
                );
            } else {
                const response = await api.post(
                    "/inventory",
                    {
                        itemName: formData.itemName,
                        currentStockCount: Number(
                            formData.currentStockCount
                        ),
                        unitType: formData.unitType
                    }
                );

                setInventoryItems((currentItems) => [
                    ...currentItems,
                    response.data.data
                ]);

                setMessage(
                    `Inventory item ${response.data.data.itemId} added successfully.`
                );
            }

            setFormData(emptyForm);
            setEditingId(null);
        } catch (error) {
            console.error("Inventory save error:", error);

            setError(
                error.response?.data?.message ||
                "Unable to save inventory item."
            );
        } finally {
            setSaving(false);
        }
    };

    const handleEdit = (item) => {
        setEditingId(item.itemId);

        setFormData({
            itemName: item.itemName || "",
            currentStockCount:
                item.currentStockCount ?? "",
            unitType: item.unitType || ""
        });

        setMessage("");
        setError("");

        window.scrollTo({
            top: 0,
            behavior: "smooth"
        });
    };

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

            if (editingId === itemId) {
                resetForm();
            }

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
        if (stock === 0) {
            return {
                label: "Out of Stock",
                className: "out-of-stock"
            };
        }

        if (stock <= 5) {
            return {
                label: "Low Stock",
                className: "low-stock"
            };
        }

        return {
            label: "In Stock",
            className: "in-stock"
        };
    };

    if (authLoading) {
        return (
            <div className="inventory-loading">
                Loading inventory...
            </div>
        );
    }

    if (!user) {
        return (
            <div className="inventory-access-message">
                <h2>Login required</h2>

                <p>
                    Please login to access inventory management.
                </p>
            </div>
        );
    }

    if (user.role !== "admin") {
        return (
            <div className="inventory-access-message">
                <h2>Access denied</h2>

                <p>
                    Only administrators can access inventory management.
                </p>
            </div>
        );
    }

    return (
        <div className="inventory-page">
            <div className="inventory-container">
                <div className="inventory-header">
                    <div>
                        <p className="inventory-eyebrow">
                            CanteenQueue Admin
                        </p>

                        <h1>
                            Inventory
                        </h1>

                        <p>
                            Manage ingredients, stock levels and
                            inventory availability.
                        </p>
                    </div>

                    <div className="inventory-badge">
                        ADMIN
                    </div>
                </div>

                {error && (
                    <div className="inventory-message error">
                        {error}
                    </div>
                )}

                {message && (
                    <div className="inventory-message success">
                        {message}
                    </div>
                )}

                <div className="inventory-section">
                    <div className="inventory-section-heading">
                        <div>
                            <p className="inventory-section-label">
                                Inventory Management
                            </p>

                            <h2>
                                {editingId
                                    ? `Edit Inventory Item (${editingId})`
                                    : "Add Inventory Item"}
                            </h2>

                            <p>
                                Add or update stock information.
                                The Item ID is generated automatically.
                            </p>
                        </div>
                    </div>

                    <form
                        className="inventory-form"
                        onSubmit={handleSubmit}
                    >
                        <div className="inventory-form-title">
                            {editingId
                                ? `Editing ${editingId}`
                                : "Add Inventory Item"}
                        </div>

                        <div className="inventory-form-grid">
                            <div className="inventory-form-group">
                                <label>
                                    Item Name *
                                </label>

                                <input
                                    name="itemName"
                                    value={formData.itemName}
                                    onChange={handleChange}
                                    placeholder="Example: Rice"
                                />
                            </div>

                            <div className="inventory-form-group">
                                <label>
                                    Current Stock Count *
                                </label>

                                <input
                                    type="number"
                                    min="0"
                                    step="1"
                                    name="currentStockCount"
                                    value={
                                        formData.currentStockCount
                                    }
                                    onChange={handleChange}
                                    placeholder="Example: 20"
                                />
                            </div>

                            <div className="inventory-form-group">
                                <label>
                                    Unit Type *
                                </label>

                                <input
                                    name="unitType"
                                    value={formData.unitType}
                                    onChange={handleChange}
                                    placeholder="Example: kg, litre, pieces"
                                />
                            </div>
                        </div>

                        <div className="inventory-form-actions">
                            <button
                                type="submit"
                                className="inventory-primary-button"
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
                                    className="inventory-secondary-button"
                                    onClick={resetForm}
                                >
                                    Cancel Edit
                                </button>
                            )}
                        </div>
                    </form>
                </div>

                <div className="inventory-section">
                    <div className="inventory-list-heading">
                        <div>
                            <p className="inventory-section-label">
                                Current Inventory
                            </p>

                            <h2>
                                Inventory Items
                            </h2>
                        </div>

                        <span className="inventory-item-count">
                            {inventoryItems.length} items
                        </span>
                    </div>

                    {loading ? (
                        <div className="inventory-empty">
                            Loading inventory items...
                        </div>
                    ) : inventoryItems.length === 0 ? (
                        <div className="inventory-empty">
                            No inventory items found.
                        </div>
                    ) : (
                        <div className="inventory-table-wrapper">
                            <table className="inventory-table">
                                <thead>
                                    <tr>
                                        <th>
                                            Item ID
                                        </th>

                                        <th>
                                            Item Name
                                        </th>

                                        <th>
                                            Stock
                                        </th>

                                        <th>
                                            Unit
                                        </th>

                                        <th>
                                            Last Updated
                                        </th>

                                        <th>
                                            Status
                                        </th>

                                        <th>
                                            Actions
                                        </th>
                                    </tr>
                                </thead>

                                <tbody>
                                    {inventoryItems.map((item) => {
                                        const stockStatus =
                                            getStockStatus(
                                                item.currentStockCount
                                            );

                                        return (
                                            <tr
                                                key={item.itemId}
                                            >
                                                <td>
                                                    <strong>
                                                        {item.itemId}
                                                    </strong>
                                                </td>

                                                <td>
                                                    <div className="inventory-item-name">
                                                        {item.itemName}
                                                    </div>
                                                </td>

                                                <td>
                                                    <strong>
                                                        {
                                                            item.currentStockCount
                                                        }
                                                    </strong>
                                                </td>

                                                <td>
                                                    {item.unitType}
                                                </td>

                                                <td>
                                                    {item.lastUpdated
                                                        ? new Date(
                                                              item.lastUpdated
                                                          ).toLocaleDateString()
                                                        : "-"}
                                                </td>

                                                <td>
                                                    <span
                                                        className={`inventory-status ${stockStatus.className}`}
                                                    >
                                                        {
                                                            stockStatus.label
                                                        }
                                                    </span>
                                                </td>

                                                <td>
                                                    <div className="inventory-table-actions">
                                                        <button
                                                            className="inventory-edit-button"
                                                            onClick={() =>
                                                                handleEdit(
                                                                    item
                                                                )
                                                            }
                                                        >
                                                            Edit
                                                        </button>

                                                        <button
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
                </div>

                <div className="inventory-info">
                    <div className="inventory-info-icon">
                        🔔
                    </div>

                    <div>
                        <h3>
                            Smart Inventory Alerts
                        </h3>

                        <p>
                            Items with stock of 5 or below are
                            automatically handled by the inventory
                            alert system.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Inventory;