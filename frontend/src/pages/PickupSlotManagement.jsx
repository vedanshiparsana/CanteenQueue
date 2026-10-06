import { useCallback, useEffect, useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import api from "../services/api";
import AdminSidebar from "../components/AdminSidebar";
import "../styles/pages/PickupSlotManagement.css";

const emptySlotForm = () => ({
    date: "",
    startTime: "",
    endTime: "",
    capacity: "20"
});

const getDateInputValue = (date) => {
    if (!date) return "";
    const parsedDate = new Date(date);
    return Number.isNaN(parsedDate.getTime())
        ? ""
        : parsedDate.toISOString().slice(0, 10);
};

const formatSlotDate = (date) => {
    if (!date) return "Date unavailable";
    const parsedDate = new Date(date);
    return Number.isNaN(parsedDate.getTime())
        ? "Date unavailable"
        : parsedDate.toLocaleDateString([], {
            timeZone: "UTC",
            weekday: "short",
            month: "short",
            day: "numeric",
            year: "numeric"
        });
};

const formatSlotTime = (time) => {
    if (!time) return "—";
    const [hours, minutes] = time.split(":").map(Number);
    if (Number.isNaN(hours) || Number.isNaN(minutes)) return time;
    return new Date(2000, 0, 1, hours, minutes).toLocaleTimeString([], {
        hour: "numeric",
        minute: "2-digit"
    });
};

function PickupSlotManagement() {
    const { user, loading: authLoading } = useAuth();
    const navigate = useNavigate();
    const [slots, setSlots] = useState([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [busySlotId, setBusySlotId] = useState("");
    const [showForm, setShowForm] = useState(false);
    const [editingSlotId, setEditingSlotId] = useState("");
    const [form, setForm] = useState(emptySlotForm);
    const [error, setError] = useState("");
    const [message, setMessage] = useState("");

    const loadSlots = useCallback(async () => {
        setLoading(true);
        try {
            const response = await api.get("/pickup-slots");
            if (!response.data?.success || !Array.isArray(response.data.slots)) {
                throw new Error(response.data?.message || "Unable to load pickup slots.");
            }
            setSlots(response.data.slots);
            setError("");
        } catch (loadError) {
            console.error("Pickup slot management load error:", loadError);
            setError(
                loadError.response?.data?.message ||
                loadError.message ||
                "Unable to load pickup slots."
            );
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        if (!authLoading && user?.role === "admin") {
            Promise.resolve().then(loadSlots);
        }
    }, [authLoading, user, loadSlots]);

    const openCreateForm = () => {
        setEditingSlotId("");
        setForm(emptySlotForm());
        setError("");
        setMessage("");
        setShowForm(true);
    };

    const openEditForm = (slot) => {
        setEditingSlotId(slot._id);
        setForm({
            date: getDateInputValue(slot.date),
            startTime: slot.startTime || "",
            endTime: slot.endTime || "",
            capacity: String(slot.capacity || "")
        });
        setError("");
        setMessage("");
        setShowForm(true);
    };

    const closeForm = () => {
        if (saving) return;
        setShowForm(false);
        setEditingSlotId("");
    };

    const handleSubmit = async (event) => {
        event.preventDefault();
        setSaving(true);
        setError("");
        setMessage("");

        const payload = {
            ...form,
            capacity: Number(form.capacity)
        };

        try {
            const response = editingSlotId
                ? await api.put(`/pickup-slots/${editingSlotId}`, payload)
                : await api.post("/pickup-slots", payload);

            if (!response.data?.success) {
                throw new Error(response.data?.message || "Unable to save pickup slot.");
            }

            setMessage(
                editingSlotId
                    ? "Pickup slot updated successfully."
                    : "Pickup slot created successfully."
            );
            setShowForm(false);
            setEditingSlotId("");
            await loadSlots();
        } catch (saveError) {
            console.error("Pickup slot save error:", saveError);
            setError(
                saveError.response?.data?.message ||
                saveError.message ||
                "Unable to save pickup slot."
            );
        } finally {
            setSaving(false);
        }
    };

    const toggleSlotAvailability = async (slot) => {
        setBusySlotId(slot._id);
        setError("");
        setMessage("");
        try {
            const response = await api.put(`/pickup-slots/${slot._id}`, {
                isActive: !slot.isActive
            });
            if (!response.data?.success) {
                throw new Error(response.data?.message || "Unable to update slot availability.");
            }
            setSlots((current) => current.map((item) =>
                item._id === slot._id
                    ? { ...item, ...response.data.slot }
                    : item
            ));
        } catch (toggleError) {
            console.error("Pickup slot availability error:", toggleError);
            setError(
                toggleError.response?.data?.message ||
                toggleError.message ||
                "Unable to update slot availability."
            );
        } finally {
            setBusySlotId("");
        }
    };

    const deleteSlot = async (slot) => {
        if (Number(slot.bookedCount) > 0) return;
        if (!window.confirm(`Delete the pickup slot on ${formatSlotDate(slot.date)} from ${formatSlotTime(slot.startTime)} to ${formatSlotTime(slot.endTime)}?`)) {
            return;
        }

        setBusySlotId(slot._id);
        setError("");
        setMessage("");
        try {
            const response = await api.delete(`/pickup-slots/${slot._id}`);
            if (!response.data?.success) {
                throw new Error(response.data?.message || "Unable to delete pickup slot.");
            }
            setSlots((current) => current.filter((item) => item._id !== slot._id));
            setMessage("Pickup slot deleted successfully.");
        } catch (deleteError) {
            console.error("Pickup slot delete error:", deleteError);
            setError(
                deleteError.response?.data?.message ||
                deleteError.message ||
                "Unable to delete pickup slot."
            );
        } finally {
            setBusySlotId("");
        }
    };

    if (authLoading) {
        return (
            <div className="pickup-admin-state">
                <span className="pickup-admin-loader" />
                <p>Loading pickup slot management...</p>
            </div>
        );
    }

    if (!user) return <Navigate to="/login" replace />;
    if (user.role !== "admin") {
        return (
            <div className="pickup-admin-state">
                <div className="pickup-admin-state-card">
                    <span>ADMIN WORKSPACE</span>
                    <h1>Access denied</h1>
                    <p>Only administrators can manage pickup slots.</p>
                    <button type="button" onClick={() => navigate("/")}>Return home</button>
                </div>
            </div>
        );
    }

    const activeSlots = slots.filter((slot) => slot.isActive).length;
    const totalBookings = slots.reduce(
        (total, slot) => total + Number(slot.bookedCount || 0),
        0
    );

    return (
        <div className="pickup-admin-page">
            <AdminSidebar />
            <main className="pickup-admin-main">
                <div className="pickup-admin-content">
                    <header className="pickup-admin-header">
                        <div>
                            <p className="pickup-admin-eyebrow">PICKUP OPERATIONS</p>
                            <h1>Pickup slot <span>management</span></h1>
                            <p>Schedule and manage the collection windows available to students.</p>
                        </div>
                        <button type="button" className="pickup-admin-primary" onClick={openCreateForm}>
                            <span aria-hidden="true">＋</span> Add pickup slot
                        </button>
                    </header>

                    {error && <div className="pickup-admin-message error" role="alert">{error}</div>}
                    {message && <div className="pickup-admin-message success" role="status">{message}</div>}

                    <section className="pickup-admin-stats" aria-label="Pickup slot summary">
                        <article><span>All slots</span><strong>{slots.length}</strong></article>
                        <article><span>Active slots</span><strong>{activeSlots}</strong></article>
                        <article><span>Bookings</span><strong>{totalBookings}</strong></article>
                    </section>

                    {showForm && (
                        <section className="pickup-admin-form-card">
                            <div className="pickup-admin-form-heading">
                                <div>
                                    <p className="pickup-admin-eyebrow">{editingSlotId ? "EDIT SCHEDULE" : "NEW SCHEDULE"}</p>
                                    <h2>{editingSlotId ? "Update pickup slot" : "Create pickup slot"}</h2>
                                </div>
                                <button type="button" className="pickup-admin-close" onClick={closeForm} disabled={saving} aria-label="Close form">×</button>
                            </div>
                            <form onSubmit={handleSubmit}>
                                <label>
                                    Pickup date
                                    <input
                                        type="date"
                                        required
                                        value={form.date}
                                        onChange={(event) => setForm({ ...form, date: event.target.value })}
                                    />
                                </label>
                                <label>
                                    Start time
                                    <input
                                        type="time"
                                        required
                                        value={form.startTime}
                                        onChange={(event) => setForm({ ...form, startTime: event.target.value })}
                                    />
                                </label>
                                <label>
                                    End time
                                    <input
                                        type="time"
                                        required
                                        value={form.endTime}
                                        onChange={(event) => setForm({ ...form, endTime: event.target.value })}
                                    />
                                </label>
                                <label>
                                    Capacity
                                    <input
                                        type="number"
                                        min="1"
                                        step="1"
                                        required
                                        value={form.capacity}
                                        onChange={(event) => setForm({ ...form, capacity: event.target.value })}
                                    />
                                </label>
                                <div className="pickup-admin-form-actions">
                                    <button type="button" className="pickup-admin-secondary" onClick={closeForm} disabled={saving}>Cancel</button>
                                    <button type="submit" className="pickup-admin-primary" disabled={saving}>
                                        {saving ? "Saving..." : editingSlotId ? "Save changes" : "Create slot"}
                                    </button>
                                </div>
                            </form>
                        </section>
                    )}

                    <section className="pickup-admin-list">
                        <div className="pickup-admin-list-heading">
                            <div>
                                <p className="pickup-admin-eyebrow">SCHEDULE</p>
                                <h2>All pickup slots</h2>
                            </div>
                            <span>{slots.length} total</span>
                        </div>

                        {loading ? (
                            <div className="pickup-admin-empty"><span className="pickup-admin-loader" /><p>Loading pickup slots...</p></div>
                        ) : slots.length ? (
                            <div className="pickup-admin-table-wrap">
                                <table className="pickup-admin-table">
                                    <thead>
                                        <tr>
                                            <th>Date</th>
                                            <th>Pickup window</th>
                                            <th>Bookings</th>
                                            <th>Availability</th>
                                            <th>Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {slots.map((slot) => {
                                            const isBusy = busySlotId === slot._id;
                                            const bookedCount = Number(slot.bookedCount || 0);
                                            return (
                                                <tr key={slot._id}>
                                                    <td data-label="Date"><strong>{formatSlotDate(slot.date)}</strong></td>
                                                    <td data-label="Pickup window">
                                                        <span className="pickup-admin-time">{formatSlotTime(slot.startTime)} – {formatSlotTime(slot.endTime)}</span>
                                                        <small>{bookedCount} / {slot.capacity} bookings</small>
                                                    </td>
                                                    <td data-label="Bookings">{bookedCount} / {slot.capacity}</td>
                                                    <td data-label="Availability">
                                                        <button
                                                            type="button"
                                                            className={`pickup-admin-toggle ${slot.isActive ? "active" : ""}`}
                                                            disabled={isBusy}
                                                            onClick={() => toggleSlotAvailability(slot)}
                                                            aria-pressed={Boolean(slot.isActive)}
                                                        >
                                                            <span />{slot.isActive ? "Active" : "Inactive"}
                                                        </button>
                                                    </td>
                                                    <td data-label="Actions">
                                                        <div className="pickup-admin-actions">
                                                            <button type="button" className="pickup-admin-action edit" disabled={isBusy} onClick={() => openEditForm(slot)}>Edit</button>
                                                            <button
                                                                type="button"
                                                                className="pickup-admin-action delete"
                                                                disabled={isBusy || bookedCount > 0}
                                                                title={bookedCount > 0 ? "Slots with existing bookings cannot be deleted" : "Delete pickup slot"}
                                                                onClick={() => deleteSlot(slot)}
                                                            >
                                                                {isBusy ? "Please wait" : "Delete"}
                                                            </button>
                                                        </div>
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>
                        ) : (
                            <div className="pickup-admin-empty">
                                <span aria-hidden="true">◷</span>
                                <h3>No pickup slots yet</h3>
                                <p>Create a pickup window to make it available for student orders.</p>
                                <button type="button" className="pickup-admin-primary" onClick={openCreateForm}>Add the first slot</button>
                            </div>
                        )}
                    </section>
                </div>
            </main>
        </div>
    );
}

export default PickupSlotManagement;
