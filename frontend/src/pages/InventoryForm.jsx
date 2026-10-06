import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import api from "../services/api";
import AdminSidebar from "../components/AdminSidebar";
import "../styles/pages/Inventory.css";

const emptyForm = {
    itemName: "",
    currentStockCount: "",
    unitType: ""
};

const InventoryForm = () => {
    const navigate = useNavigate();
    const { itemId } = useParams();
    const { user, loading: authLoading } = useAuth();

    const editingId = itemId || null;

    const [formData, setFormData] = useState(emptyForm);
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);

    const [message, setMessage] = useState("");
    const [error, setError] = useState("");

    useEffect(() => {
        const loadItem = async () => {
            if (!editingId) {
                return;
            }

            try {
                setLoading(true);
                setError("");

                const response = await api.get("/inventory");

                const items = response.data?.data || [];

                const item = items.find(
                    (currentItem) =>
                        currentItem.itemId === editingId
                );

                if (!item) {
                    setError("Inventory item not found.");
                    return;
                }

                setFormData({
                    itemName: item.itemName || "",
                    currentStockCount:
                        item.currentStockCount ?? "",
                    unitType: item.unitType || ""
                });
            } catch (requestError) {
                console.error(
                    "Inventory item loading error:",
                    requestError
                );

                setError(
                    requestError.response?.data?.message ||
                        "Unable to load inventory item."
                );
            } finally {
                setLoading(false);
            }
        };

        if (!authLoading && user?.role === "admin") {
            loadItem();
        }
    }, [authLoading, user, editingId]);

    const handleChange = (event) => {
        const { name, value } = event.target;

        setFormData((current) => ({
            ...current,
            [name]: value
        }));
    };

    const handleSubmit = async (event) => {
        event.preventDefault();

        setMessage("");
        setError("");

        if (
            !formData.itemName.trim() ||
            formData.currentStockCount === "" ||
            !formData.unitType.trim()
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

            const payload = {
                itemName: formData.itemName.trim(),
                currentStockCount: Number(
                    formData.currentStockCount
                ),
                unitType: formData.unitType.trim()
            };

            if (editingId) {
                await api.put(
                    `/inventory/${editingId}`,
                    payload
                );

                setMessage(
                    "Inventory item updated successfully."
                );
            } else {
                const response = await api.post(
                    "/inventory",
                    payload
                );

                setMessage(
                    `Inventory item ${response.data.data.itemId} added successfully.`
                );

                setFormData(emptyForm);
            }
        } catch (requestError) {
            console.error(
                "Inventory save error:",
                requestError
            );

            setError(
                requestError.response?.data?.message ||
                    "Unable to save inventory item."
            );
        } finally {
            setSaving(false);
        }
    };

    const handleCancel = () => {
        navigate("/admin/inventory");
    };

    if (authLoading) {
        return (
            <div className="inventory-state-screen">
                <div className="inventory-state-card">
                    <div className="inventory-loading-spinner" />

                    <h2>
                        Loading inventory
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
                                {editingId
                                    ? "Edit inventory item"
                                    : "Add inventory item"}
                            </h1>

                            <p>
                                {editingId
                                    ? "Update the current stock information for this item."
                                    : "Add an ingredient or supply to your inventory."}
                            </p>
                        </div>
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

                    <section className="inventory-panel">
                        <div className="inventory-panel-heading">
                            <div className="inventory-panel-icon">
                                {editingId ? "✎" : "+"}
                            </div>

                            <div>
                                <p className="inventory-section-label">
                                    {editingId
                                        ? "UPDATE STOCK ITEM"
                                        : "ADD NEW ITEM"}
                                </p>

                                <h2>
                                    {editingId
                                        ? `Edit ${editingId}`
                                        : "Add inventory item"}
                                </h2>

                                <p>
                                    {editingId
                                        ? "Update the current stock information for this item."
                                        : "Add an ingredient or supply to your inventory."}
                                </p>
                            </div>
                        </div>

                        {loading ? (
                            <div className="inventory-empty">
                                <div className="inventory-loading-spinner" />

                                <strong>
                                    Loading inventory item
                                </strong>

                                <p>
                                    Getting the latest information.
                                </p>
                            </div>
                        ) : (
                            <form
                                className="inventory-form"
                                onSubmit={handleSubmit}
                            >
                                <div className="inventory-form-grid">
                                    <div className="inventory-form-group">
                                        <label htmlFor="itemName">
                                            Item name
                                        </label>

                                        <input
                                            id="itemName"
                                            name="itemName"
                                            value={
                                                formData.itemName
                                            }
                                            onChange={
                                                handleChange
                                            }
                                            placeholder="e.g. Rice"
                                        />
                                    </div>

                                    <div className="inventory-form-group">
                                        <label htmlFor="currentStockCount">
                                            Current stock
                                        </label>

                                        <input
                                            id="currentStockCount"
                                            type="number"
                                            min="0"
                                            step="1"
                                            name="currentStockCount"
                                            value={
                                                formData.currentStockCount
                                            }
                                            onChange={
                                                handleChange
                                            }
                                            placeholder="e.g. 20"
                                        />
                                    </div>

                                    <div className="inventory-form-group">
                                        <label htmlFor="unitType">
                                            Unit type
                                        </label>

                                        <input
                                            id="unitType"
                                            name="unitType"
                                            value={
                                                formData.unitType
                                            }
                                            onChange={
                                                handleChange
                                            }
                                            placeholder="e.g. kg, litre, pieces"
                                        />
                                    </div>
                                </div>

                                <div className="inventory-form-footer">
                                    <p>
                                        Item ID is generated automatically.
                                    </p>

                                    <div className="inventory-form-actions">
                                        <button
                                            type="button"
                                            className="inventory-secondary-button"
                                            onClick={handleCancel}
                                        >
                                            Cancel
                                        </button>

                                        <button
                                            type="submit"
                                            className="inventory-primary-button"
                                            disabled={saving}
                                        >
                                            {saving
                                                ? "Saving..."
                                                : editingId
                                                ? "Save changes"
                                                : "Add item"}
                                        </button>
                                    </div>
                                </div>
                            </form>
                        )}
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

export default InventoryForm;