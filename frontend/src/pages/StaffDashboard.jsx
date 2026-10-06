import { useCallback, useEffect, useMemo, useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import api from "../services/api";
import logo from "../assets/logo.png";
import "../styles/pages/StaffDashboard.css";

const ORDER_STATUSES = ["Received", "Preparing", "Ready", "Completed"];
const ORDER_FILTER_STATUSES = [...ORDER_STATUSES, "Cancelled"];
const LIVE_ORDER_STATUSES = ["Received", "Preparing", "Ready"];
const SECTIONS = [
    { id: "dashboard", label: "Home", icon: "⌂" },
    { id: "orders", label: "Orders", icon: "▤" },
    { id: "pickup", label: "Pickup Queue", icon: "◷" },
    { id: "menu", label: "Menu Availability", icon: "☷" },
    { id: "profile", label: "Profile", icon: "◉" }
];

const money = (amount) =>
    `₹${Number(amount || 0).toLocaleString("en-IN", {
        maximumFractionDigits: 2
    })}`;

const titleCase = (value) =>
    String(value || "Unknown")
        .replace(/([a-z])([A-Z])/g, "$1 $2")
        .replace(/^./, (character) => character.toUpperCase());

const formatTime = (value) => {
    if (!value) return "Time not set";
    const [hours, minutes] = String(value).split(":").map(Number);
    if (Number.isNaN(hours) || Number.isNaN(minutes)) return value;
    return new Date(2000, 0, 1, hours, minutes).toLocaleTimeString([], {
        hour: "numeric",
        minute: "2-digit"
    });
};

const formatDate = (value) => {
    if (!value) return "Date not set";
    const date = new Date(value);
    return Number.isNaN(date.getTime())
        ? "Date not set"
        : date.toLocaleDateString([], {
            month: "short",
            day: "numeric",
            year: "numeric"
        });
};

const getSlot = (order) => order?.pickupSlot?.slotId || null;

function StaffDashboard() {
    const { user, logout, updateUser, loading: authLoading } = useAuth();
    const navigate = useNavigate();
    const [activeSection, setActiveSection] = useState("dashboard");
    const [orders, setOrders] = useState([]);
    const [menuItems, setMenuItems] = useState([]);
    const [ordersLoading, setOrdersLoading] = useState(true);
    const [menuLoading, setMenuLoading] = useState(true);
    const [error, setError] = useState("");
    const [statusFilter, setStatusFilter] = useState("All");
    const [orderKindFilter, setOrderKindFilter] = useState("All");
    const [search, setSearch] = useState("");
    const [menuSearch, setMenuSearch] = useState("");
    const [selectedOrder, setSelectedOrder] = useState(null);
    const [busyOrderId, setBusyOrderId] = useState("");
    const [busyMenuId, setBusyMenuId] = useState("");
    const [profileEditing, setProfileEditing] = useState(false);
    const [profileSaving, setProfileSaving] = useState(false);
    const [profileDraft, setProfileDraft] = useState({
        name: "",
        email: "",
        phone_no: ""
    });

    const loadOrders = useCallback(async () => {
        try {
            const response = await api.get("/orders");
            if (response.data?.success && Array.isArray(response.data.data)) {
                setOrders(response.data.data);
                setError("");
            } else {
                throw new Error(response.data?.message || "Unable to load orders.");
            }
        } catch (loadError) {
            console.error("Staff dashboard orders error:", loadError);
            setError(
                loadError.response?.data?.message ||
                loadError.message ||
                "Unable to load orders."
            );
        } finally {
            setOrdersLoading(false);
        }
    }, []);

    const loadMenu = useCallback(async () => {
        try {
            const response = await api.get("/menu");
            if (response.data?.success && Array.isArray(response.data.data)) {
                setMenuItems(response.data.data);
            } else {
                throw new Error(response.data?.message || "Unable to load menu.");
            }
        } catch (loadError) {
            console.error("Staff dashboard menu error:", loadError);
            setError(
                loadError.response?.data?.message ||
                loadError.message ||
                "Unable to load menu availability."
            );
        } finally {
            setMenuLoading(false);
        }
    }, []);

    useEffect(() => {
        if (!authLoading && user?.role === "staff") {
            Promise.resolve().then(() => {
                loadOrders();
                loadMenu();
            });
        }
    }, [authLoading, user, loadOrders, loadMenu]);

    useEffect(() => {
        if (authLoading || user?.role !== "staff") return undefined;
        const interval = window.setInterval(loadOrders, 15000);
        return () => window.clearInterval(interval);
    }, [authLoading, user, loadOrders]);

    const counts = useMemo(
        () => ORDER_STATUSES.reduce((result, status) => {
            result[status] = orders.filter(
                (order) => order.orderStatus === status
            ).length;
            return result;
        }, {}),
        [orders]
    );

    const liveOrders = useMemo(
        () => orders.filter((order) => LIVE_ORDER_STATUSES.includes(order.orderStatus)),
        [orders]
    );

    const filteredOrders = useMemo(() => {
        const normalizedSearch = search.trim().toLowerCase();
        return orders.filter((order) => {
            const statusMatches =
                statusFilter === "All" || order.orderStatus === statusFilter;
            const kindMatches =
                orderKindFilter === "All" ||
                (order.isGroupOrder ? "Group" : "Normal") === orderKindFilter;
            const searchMatches =
                !normalizedSearch ||
                [
                    order.orderId,
                    order.userId?.name,
                    order.userId?.userId
                ].some((value) =>
                    String(value || "").toLowerCase().includes(normalizedSearch)
                );
            return statusMatches && kindMatches && searchMatches;
        });
    }, [orders, statusFilter, orderKindFilter, search]);

    const pickupGroups = useMemo(() => {
        const readyOrders = orders.filter((order) => order.orderStatus === "Ready");
        const groups = new Map();
        readyOrders.forEach((order) => {
            const slot = getSlot(order);
            const key = slot?._id ||
                `${slot?.date || "unscheduled"}-${slot?.startTime || ""}-${slot?.endTime || ""}`;
            if (!groups.has(key)) {
                groups.set(key, { slot, orders: [] });
            }
            groups.get(key).orders.push(order);
        });
        return Array.from(groups.values()).sort((first, second) =>
            new Date(first.slot?.date || 0) - new Date(second.slot?.date || 0) ||
            String(first.slot?.startTime || "").localeCompare(
                String(second.slot?.startTime || "")
            )
        );
    }, [orders]);

    const groupOrders = useMemo(
        () => orders.filter((order) => order.isGroupOrder),
        [orders]
    );

    const filteredMenuItems = useMemo(() => {
        const query = menuSearch.trim().toLowerCase();
        return menuItems.filter((item) =>
            String(item.name || "").toLowerCase().includes(query)
        );
    }, [menuItems, menuSearch]);

    const updateOrderStatus = async (order) => {
        const nextStatus = {
            Received: "Preparing",
            Preparing: "Ready",
            Ready: "Completed"
        }[order.orderStatus];
        if (!nextStatus) return;

        setBusyOrderId(order.orderId);
        setError("");
        try {
            const response = await api.put(
                `/orders/${encodeURIComponent(order.orderId)}/status`,
                { status: nextStatus }
            );
            if (!response.data?.success) {
                throw new Error(response.data?.message || "Unable to update order status.");
            }
            setOrders((current) => current.map((item) =>
                item.orderId === order.orderId
                    ? { ...item, ...response.data.data }
                    : item
            ));
            if (selectedOrder?.orderId === order.orderId) {
                setSelectedOrder((current) => ({ ...current, ...response.data.data }));
            }
        } catch (updateError) {
            console.error("Staff order status update error:", updateError);
            setError(
                updateError.response?.data?.message ||
                updateError.message ||
                "Unable to update order status."
            );
        } finally {
            setBusyOrderId("");
        }
    };

    const updateAvailability = async (item) => {
        setBusyMenuId(item.menuId);
        setError("");
        try {
            const response = await api.put(`/menu/${encodeURIComponent(item.menuId)}`, {
                isAvailable: !item.isAvailable
            });
            if (!response.data?.success) {
                throw new Error(response.data?.message || "Unable to update availability.");
            }
            setMenuItems((current) => current.map((menuItem) =>
                menuItem.menuId === item.menuId
                    ? { ...menuItem, ...response.data.data }
                    : menuItem
            ));
        } catch (updateError) {
            console.error("Staff menu availability update error:", updateError);
            setError(
                updateError.response?.data?.message ||
                updateError.message ||
                "Unable to update menu availability."
            );
        } finally {
            setBusyMenuId("");
        }
    };

    const startProfileEditing = () => {
        setProfileDraft({
            name: user?.name || "",
            email: user?.email || "",
            phone_no: user?.phone_no || ""
        });
        setProfileEditing(true);
    };

    const saveProfile = async (event) => {
        event.preventDefault();
        setProfileSaving(true);
        setError("");
        try {
            const response = await api.put("/users/profile", profileDraft);
            if (!response.data?.success || !response.data?.data) {
                throw new Error(response.data?.message || "Unable to update profile.");
            }
            updateUser(response.data.data);
            setProfileEditing(false);
        } catch (profileError) {
            console.error("Staff profile update error:", profileError);
            setError(
                profileError.response?.data?.message ||
                profileError.message ||
                "Unable to update profile."
            );
        } finally {
            setProfileSaving(false);
        }
    };

    const handleLogout = () => {
        logout();
        navigate("/login");
    };

    if (authLoading) {
        return (
            <div className="staff-loading">
                <span className="staff-loader" />
                <p>Loading staff workspace...</p>
            </div>
        );
    }

    if (!user) return <Navigate to="/login" replace />;
    if (user.role !== "staff") {
        return (
            <div className="staff-access-denied">
                <div>
                    <span>STAFF WORKSPACE</span>
                    <h1>Access denied</h1>
                    <p>This dashboard is available to staff members only.</p>
                    <button type="button" onClick={() => navigate("/")}>Return home</button>
                </div>
            </div>
        );
    }

    const currentSection = SECTIONS.find((section) => section.id === activeSection);

    const renderOrderCard = (order, detailed = false) => {
        const slot = getSlot(order);
        const nextAction = {
            Received: "Start Preparing",
            Preparing: "Mark Ready",
            Ready: "Mark Completed"
        }[order.orderStatus];
        const itemsCount = (order.items || []).reduce(
            (total, item) => total + Number(item.quantity || 0),
            0
        );

        return (
            <article className="staff-order-card" key={order.orderId}>
                <div className="staff-order-card-top">
                    <div>
                        <span className="staff-order-label">ORDER ID</span>
                        <h3>{order.orderId || "Order"}</h3>
                    </div>
                    <span className={`staff-status staff-status-${String(order.orderStatus || "").toLowerCase()}`}>
                        {titleCase(order.orderStatus)}
                    </span>
                </div>
                <div className="staff-order-student">
                    <span className="staff-avatar">
                        {(order.userId?.name || "S").trim().charAt(0).toUpperCase()}
                    </span>
                    <div>
                        <strong>{order.userId?.name || "Student details unavailable"}</strong>
                        <span>{itemsCount} {itemsCount === 1 ? "item" : "items"} · {money(order.totalAmount)}</span>
                    </div>
                </div>
                <div className="staff-order-facts">
                    <div><span>Payment</span><strong className={`staff-payment-${String(order.paymentStatus || "").toLowerCase()}`}>{titleCase(order.paymentStatus)}</strong></div>
                    <div><span>Pickup</span><strong>{slot ? `${formatTime(slot.startTime)} – ${formatTime(slot.endTime)}` : "Slot unavailable"}</strong></div>
                    <div><span>Order type</span><strong>{order.isGroupOrder ? "Group Order" : "Normal Order"}</strong></div>
                    {detailed && <div><span>Placed</span><strong>{formatDate(order.createdAt)}</strong></div>}
                </div>
                <div className="staff-order-card-actions">
                    <button type="button" className="staff-button staff-button-quiet" onClick={() => setSelectedOrder(order)}>
                        View Details
                    </button>
                    {nextAction && (
                        <button
                            type="button"
                            className="staff-button staff-button-primary"
                            disabled={busyOrderId === order.orderId}
                            onClick={() => updateOrderStatus(order)}
                        >
                            {busyOrderId === order.orderId ? "Updating..." : nextAction}
                        </button>
                    )}
                </div>
            </article>
        );
    };

    const renderOrders = (detailed = false) => (
        <>
            <div className="staff-filter-bar">
                <div className="staff-filter-tabs" role="tablist" aria-label="Filter orders by status">
                    {["All", ...ORDER_FILTER_STATUSES].map((status) => (
                        <button
                            type="button"
                            role="tab"
                            aria-selected={statusFilter === status}
                            className={statusFilter === status ? "active" : ""}
                            key={status}
                            onClick={() => setStatusFilter(status)}
                        >
                            {status}
                            {status === "All" && <span>{orders.length}</span>}
                        </button>
                    ))}
                </div>
                {detailed && (
                    <label className="staff-select-label">
                        Order type
                        <select value={orderKindFilter} onChange={(event) => setOrderKindFilter(event.target.value)}>
                            <option>All</option>
                            <option>Normal</option>
                            <option>Group</option>
                        </select>
                    </label>
                )}
            </div>
            {detailed && (
                <label className="staff-search">
                    <span aria-hidden="true">⌕</span>
                    <input
                        type="search"
                        value={search}
                        onChange={(event) => setSearch(event.target.value)}
                        placeholder="Search by order ID, student name, or student ID"
                        aria-label="Search by order ID, student name, or student ID"
                    />
                </label>
            )}
            {ordersLoading ? (
                <div className="staff-empty"><span className="staff-loader" /><p>Loading orders...</p></div>
            ) : filteredOrders.length ? (
                <div className="staff-order-grid">
                    {filteredOrders.map((order) => renderOrderCard(order, detailed))}
                </div>
            ) : (
                <div className="staff-empty">
                    <span className="staff-empty-icon">▤</span>
                    <h3>No orders found</h3>
                    <p>Orders matching these filters will appear here.</p>
                </div>
            )}
        </>
    );

    return (
        <div className="staff-app">
            <aside className="staff-sidebar">
                <div className="staff-brand">
                    <span className="staff-brand-mark"><img src={logo} alt="" /></span>
                    <span><strong>CanteenQueue</strong><small>Staff</small></span>
                </div>
                <p className="staff-nav-caption">WORKSPACE</p>
                <nav className="staff-nav" aria-label="Staff navigation">
                    {SECTIONS.map((section) => (
                        <button
                            type="button"
                            key={section.id}
                            className={`staff-nav-link ${activeSection === section.id ? "active" : ""}`}
                            onClick={() => setActiveSection(section.id)}
                        >
                            <span className="staff-nav-icon" aria-hidden="true">{section.icon}</span>
                            {section.label}
                            {activeSection === section.id && <span className="staff-nav-arrow">›</span>}
                        </button>
                    ))}
                </nav>
                <div className="staff-sidebar-spacer" />
                <div className="staff-sidebar-user">
                    <span className="staff-avatar">{(user.name || "S").trim().charAt(0).toUpperCase()}</span>
                    <span><strong>{user.name || "Staff member"}</strong><small>{user.email || ""}</small></span>
                </div>
                <button type="button" className="staff-logout" onClick={handleLogout}>
                    <span aria-hidden="true">↪</span> Logout
                </button>
            </aside>

            <main className="staff-main">
                <header className="staff-header">
                    <div>
                        <p className="staff-eyebrow">STAFF WORKSPACE</p>
                        <h1>{activeSection === "dashboard" ? "Staff Dashboard" : currentSection?.label || "Profile"}</h1>
                        <p className="staff-subtitle">
                            {activeSection === "dashboard"
                                ? "Manage today's canteen orders"
                                : activeSection === "profile"
                                    ? "Your staff account details"
                                    : "Keep the canteen moving smoothly"}
                        </p>
                    </div>
                    <div className="staff-header-actions">
                        <button
                            type="button"
                            className="staff-refresh"
                            onClick={() => {
                                setOrdersLoading(true);
                                loadOrders();
                                if (activeSection === "menu") {
                                    setMenuLoading(true);
                                    loadMenu();
                                }
                            }}
                            aria-label="Refresh dashboard data"
                        >↻</button>
                    </div>
                </header>

                {error && (
                    <div className="staff-message staff-message-error" role="alert">
                        <span>{error}</span>
                        <button type="button" onClick={() => setError("")} aria-label="Dismiss error">×</button>
                    </div>
                )}
                {activeSection === "dashboard" && (
                    <>
                        <section className="staff-stat-grid" aria-label="Order status counts">
                            {ORDER_STATUSES.map((status, index) => (
                                <button
                                    type="button"
                                    className={`staff-stat-card staff-stat-${status.toLowerCase()}`}
                                    key={status}
                                    onClick={() => {
                                        setStatusFilter(status);
                                        setActiveSection("orders");
                                    }}
                                >
                                    <span className="staff-stat-icon">{["↗", "◷", "✓", "✦"][index]}</span>
                                    <span className="staff-stat-copy"><span>{status === "Received" ? "Received" : status}</span><strong>{counts[status] || 0}</strong></span>
                                    <span className="staff-stat-link">View orders ›</span>
                                </button>
                            ))}
                        </section>
                        <section className="staff-live-board" aria-labelledby="staff-live-board-title">
                            <div className="staff-live-board-heading">
                                <div className="staff-live-board-title">
                                    <span className="staff-live-board-mark" aria-hidden="true"><i /></span>
                                    <div>
                                        <p className="staff-eyebrow">KITCHEN LIVE BOARD</p>
                                        <h2 id="staff-live-board-title">Orders in progress <span>{liveOrders.length}</span></h2>
                                        <p>Active orders from received through pickup-ready. Completed and cancelled orders are hidden.</p>
                                    </div>
                                </div>
                                <button type="button" className="staff-link-button" onClick={() => { setStatusFilter("All"); setActiveSection("orders"); }}>Open all orders <span>→</span></button>
                            </div>
                            {ordersLoading ? (
                                <div className="staff-live-board-empty"><span className="staff-loader" /><p>Syncing the live order board...</p></div>
                            ) : liveOrders.length ? (
                                <div className="staff-live-lanes">
                                    {LIVE_ORDER_STATUSES.map((status) => {
                                        const laneOrders = liveOrders.filter((order) => order.orderStatus === status);
                                        return (
                                            <section className={`staff-live-lane staff-live-lane-${status.toLowerCase()}`} key={status}>
                                                <div className="staff-live-lane-heading">
                                                    <span className="staff-live-lane-marker" />
                                                    <h3>{status === "Received" ? "New orders" : status}</h3>
                                                    <span className="staff-live-lane-count">{laneOrders.length}</span>
                                                </div>
                                                {laneOrders.length ? (
                                                    <div className="staff-live-lane-orders">
                                                        {laneOrders.map((order, index) => {
                                                            const slot = getSlot(order);
                                                            const nextAction = {
                                                                Received: "Start Preparing",
                                                                Preparing: "Mark Ready",
                                                                Ready: "Mark Completed"
                                                            }[status];
                                                            const itemCount = (order.items || []).reduce(
                                                                (total, item) => total + Number(item.quantity || 0),
                                                                0
                                                            );
                                                            return (
                                                                <article
                                                                    className="staff-live-order-card"
                                                                    key={order.orderId}
                                                                    style={{ "--staff-card-index": index }}
                                                                >
                                                                    <div className="staff-live-card-top">
                                                                        <span className="staff-live-order-symbol" aria-hidden="true">#</span>
                                                                        <div className="staff-live-order-id">
                                                                            <span>ORDER TICKET</span>
                                                                            <strong>{order.orderId || "Order"}</strong>
                                                                        </div>
                                                                        <span className={`staff-live-status staff-live-status-${status.toLowerCase()}`}>
                                                                            <i />{status === "Received" ? "Just in" : status}
                                                                        </span>
                                                                    </div>
                                                                    <div className="staff-live-customer">
                                                                        <span className="staff-live-customer-avatar">
                                                                            {(order.userId?.name || "S").trim().charAt(0).toUpperCase()}
                                                                        </span>
                                                                        <span><strong>{order.userId?.name || "Student details unavailable"}</strong><small>{order.isGroupOrder ? "Group order" : "Student order"}</small></span>
                                                                        <span className="staff-live-type">{order.isGroupOrder ? "GROUP" : "NORMAL"}</span>
                                                                    </div>
                                                                    <div className="staff-live-items">
                                                                        <div className="staff-live-items-heading">
                                                                            <span>ORDER ITEMS</span>
                                                                            <strong>{itemCount} {itemCount === 1 ? "item" : "items"}</strong>
                                                                        </div>
                                                                        {(order.items || []).slice(0, 3).map((item, itemIndex) => (
                                                                            <div className="staff-live-item" key={item.menuId?._id || itemIndex}>
                                                                                <span className="staff-live-item-quantity">{item.quantity}×</span>
                                                                                <span>{item.menuId?.name || "Menu item"}</span>
                                                                                <strong>{money(Number(item.price || 0) * Number(item.quantity || 0))}</strong>
                                                                            </div>
                                                                        ))}
                                                                        {(order.items || []).length > 3 && (
                                                                            <span className="staff-live-more-items">+{order.items.length - 3} more items</span>
                                                                        )}
                                                                    </div>
                                                                    <div className="staff-live-summary">
                                                                        <div><span>Pickup</span><strong>{slot ? `${formatTime(slot.startTime)} – ${formatTime(slot.endTime)}` : "Slot unavailable"}</strong></div>
                                                                        <div className="staff-live-total"><span>Total</span><strong>{money(order.totalAmount)}</strong></div>
                                                                    </div>
                                                                    <div className="staff-live-payment">
                                                                        <span className={`staff-live-payment-dot staff-live-payment-${String(order.paymentStatus || "").toLowerCase()}`} />
                                                                        {titleCase(order.paymentStatus)}
                                                                        <span className="staff-live-payment-divider">·</span>
                                                                        {formatDate(order.createdAt)}
                                                                    </div>
                                                                    <div className="staff-live-card-actions">
                                                                        <button type="button" className="staff-live-details" onClick={() => setSelectedOrder(order)}>Details</button>
                                                                        <button
                                                                            type="button"
                                                                            className="staff-live-action"
                                                                            disabled={busyOrderId === order.orderId}
                                                                            onClick={() => updateOrderStatus(order)}
                                                                        >
                                                                            {busyOrderId === order.orderId ? "Updating..." : nextAction}
                                                                            <span aria-hidden="true">→</span>
                                                                        </button>
                                                                    </div>
                                                                </article>
                                                            );
                                                        })}
                                                    </div>
                                                ) : (
                                                    <div className="staff-live-lane-empty">
                                                        <span aria-hidden="true">{status === "Received" ? "✦" : status === "Preparing" ? "◷" : "✓"}</span>
                                                        <p>{status === "Received" ? "Waiting for the next order" : `No orders ${status.toLowerCase()}`}</p>
                                                    </div>
                                                )}
                                            </section>
                                        );
                                    })}
                                </div>
                            ) : (
                                <div className="staff-live-board-empty">
                                    <span className="staff-live-board-empty-icon" aria-hidden="true">✓</span>
                                    <h3>All caught up</h3>
                                    <p>New and active orders will appear here as soon as they come in.</p>
                                </div>
                            )}
                        </section>
                    </>
                )}

                {activeSection === "orders" && (
                    <section className="staff-section">
                        {renderOrders(true)}
                    </section>
                )}

                {activeSection === "pickup" && (
                    <section className="staff-section staff-pickup-section">
                        {ordersLoading ? (
                            <div className="staff-empty"><span className="staff-loader" /><p>Loading pickup queue...</p></div>
                        ) : pickupGroups.length ? (
                            <div className="staff-pickup-groups">
                                {pickupGroups.map(({ slot, orders: slotOrders }, index) => (
                                    <section className="staff-pickup-group" key={slot?._id || `slot-${index}`}>
                                        <div className="staff-pickup-heading">
                                            <span className="staff-pickup-clock">◷</span>
                                            <div><h3>{slot ? `${formatTime(slot.startTime)} – ${formatTime(slot.endTime)}` : "Pickup slot unavailable"}</h3><p>{formatDate(slot?.date)}</p></div>
                                            <span className="staff-slot-count">{slotOrders.length} {slotOrders.length === 1 ? "pickup" : "pickups"}</span>
                                        </div>
                                        <div className="staff-pickup-orders">
                                            {slotOrders.map((order, orderIndex) => (
                                                <div className="staff-pickup-order" key={order.orderId} style={{ "--staff-queue-index": orderIndex }}>
                                                    <span className="staff-queue-number" aria-hidden="true">{String(orderIndex + 1).padStart(2, "0")}</span>
                                                    <button
                                                        type="button"
                                                        className="staff-queue-ticket"
                                                        onClick={() => setSelectedOrder(order)}
                                                        aria-label={`View details for pickup order ${order.orderId}, ${order.userId?.name || "Student"}`}
                                                    >
                                                        <strong>{order.orderId}</strong>
                                                        <small>{order.userId?.name || "Student"} · {money(order.totalAmount)}</small>
                                                    </button>
                                                    <button
                                                        type="button"
                                                        className="staff-queue-complete"
                                                        disabled={busyOrderId === order.orderId}
                                                        onClick={() => updateOrderStatus(order)}
                                                    >
                                                        {busyOrderId === order.orderId ? "Updating..." : "Mark completed"}
                                                    </button>
                                                </div>
                                            ))}
                                        </div>
                                    </section>
                                ))}
                            </div>
                        ) : (
                            <div className="staff-empty"><span className="staff-empty-icon">◷</span><h3>Pickup queue is clear</h3><p>Orders marked ready for pickup will be grouped by slot here.</p></div>
                        )}
                    </section>
                )}

                {activeSection === "groups" && (
                    <section className="staff-section">
                        <div className="staff-section-heading">
                            <div><p className="staff-eyebrow">SHARED ORDERS</p><h2>Group orders <span className="staff-heading-count">{groupOrders.length}</span></h2></div>
                        </div>
                        {ordersLoading ? (
                            <div className="staff-empty"><span className="staff-loader" /><p>Loading group orders...</p></div>
                        ) : groupOrders.length ? (
                            <div className="staff-order-grid">
                                {groupOrders.map((order) => (
                                    <article className="staff-order-card staff-group-card" key={order.orderId}>
                                        <div className="staff-order-card-top">
                                            <div><span className="staff-order-label">GROUP ORDER</span><h3>{order.orderId}</h3></div>
                                            <span className={`staff-status staff-status-${String(order.orderStatus || "").toLowerCase()}`}>{titleCase(order.orderStatus)}</span>
                                        </div>
                                        <div className="staff-group-code"><span>GROUP CODE</span><strong>{order.groupCode || "—"}</strong></div>
                                        <div className="staff-order-facts">
                                            <div><span>Members</span><strong>{order.participants?.length || 1}</strong></div>
                                            <div><span>Items</span><strong>{(order.items || []).reduce((total, item) => total + Number(item.quantity || 0), 0)}</strong></div>
                                            <div><span>Total</span><strong>{money(order.totalAmount)}</strong></div>
                                            <div><span>Payment</span><strong className={`staff-payment-${String(order.paymentStatus || "").toLowerCase()}`}>{titleCase(order.paymentStatus)}</strong></div>
                                            <div><span>Pickup</span><strong>{getSlot(order) ? `${formatTime(getSlot(order).startTime)} – ${formatTime(getSlot(order).endTime)}` : "Slot unavailable"}</strong></div>
                                        </div>
                                        <div className="staff-order-card-actions">
                                            <button type="button" className="staff-button staff-button-quiet" onClick={() => setSelectedOrder(order)}>View Details</button>
                                            {order.orderStatus !== "Completed" && (
                                                <button type="button" className="staff-button staff-button-primary" disabled={busyOrderId === order.orderId} onClick={() => updateOrderStatus(order)}>
                                                    {busyOrderId === order.orderId ? "Updating..." : ({ Received: "Start Preparing", Preparing: "Mark Ready", Ready: "Mark Completed" }[order.orderStatus] || "Processing")}
                                                </button>
                                            )}
                                        </div>
                                    </article>
                                ))}
                            </div>
                        ) : (
                            <div className="staff-empty"><span className="staff-empty-icon">♧</span><h3>No group orders yet</h3><p>Group orders will appear here when students place them.</p></div>
                        )}
                    </section>
                )}

                {activeSection === "menu" && (
                    <section className="staff-section">
                        <div className="staff-section-heading">
                            <div><p className="staff-eyebrow">SERVICE CONTROLS</p><h2>Menu availability</h2><p className="staff-section-description">Temporarily mark items available or out of stock.</p></div>
                            <span className="staff-menu-count">{filteredMenuItems.length} items</span>
                        </div>
                        {menuLoading ? (
                            <div className="staff-empty"><span className="staff-loader" /><p>Loading menu...</p></div>
                        ) : (
                            <>
                                <label className="staff-search staff-menu-search">
                                    <span aria-hidden="true">⌕</span>
                                    <input
                                        type="search"
                                        value={menuSearch}
                                        onChange={(event) => setMenuSearch(event.target.value)}
                                        placeholder="Search menu by item name"
                                        aria-label="Search menu by item name"
                                    />
                                </label>
                                {filteredMenuItems.length ? (
                                    <div className="staff-menu-grid">
                                        {filteredMenuItems.map((item) => (
                                    <article className="staff-menu-card" key={item.menuId}>
                                        <div className="staff-menu-item-copy">
                                            <span className="staff-menu-category">{item.category || "Menu item"}</span>
                                            <h3>{item.name}</h3>
                                            <strong>{money(item.price)}</strong>
                                        </div>
                                        <div className="staff-menu-control">
                                            <span className={item.isAvailable ? "is-available" : "is-unavailable"}>
                                                {item.isAvailable ? "Available" : "Out of Stock"}
                                            </span>
                                            <button
                                                type="button"
                                                role="switch"
                                                aria-checked={Boolean(item.isAvailable)}
                                                aria-label={`${item.isAvailable ? "Mark" : "Make"} ${item.name} ${item.isAvailable ? "unavailable" : "available"}`}
                                                className={`staff-switch ${item.isAvailable ? "on" : ""}`}
                                                disabled={busyMenuId === item.menuId}
                                                onClick={() => updateAvailability(item)}
                                            ><span /></button>
                                        </div>
                                    </article>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="staff-empty">
                                        <span className="staff-empty-icon">☷</span>
                                        <h3>{menuSearch.trim() ? "No matching menu items" : "No menu items available"}</h3>
                                        <p>{menuSearch.trim() ? "Try another item name." : "The menu service did not return any items."}</p>
                                    </div>
                                )}
                            </>
                        )}
                    </section>
                )}

                {activeSection === "profile" && (
                    <section className="staff-section">
                        <div className="staff-profile-card">
                            <div className="staff-profile-top">
                                <span className="staff-profile-large-avatar">{(user.name || "S").trim().charAt(0).toUpperCase()}</span>
                                <div>
                                    <p className="staff-eyebrow">SIGNED IN</p>
                                    <h2>{user.name || "Staff member"}</h2>
                                    <span>{user.email || "Staff account"}</span>
                                </div>
                                <span className="staff-role-badge">STAFF</span>
                            </div>
                            {profileEditing ? (
                                <form className="staff-profile-edit-form" onSubmit={saveProfile}>
                                    <label>
                                        Name
                                        <input
                                            type="text"
                                            required
                                            value={profileDraft.name}
                                            onChange={(event) => setProfileDraft({ ...profileDraft, name: event.target.value })}
                                        />
                                    </label>
                                    <label>
                                        Email
                                        <input
                                            type="email"
                                            required
                                            value={profileDraft.email}
                                            onChange={(event) => setProfileDraft({ ...profileDraft, email: event.target.value })}
                                        />
                                    </label>
                                    <label>
                                        Phone
                                        <input
                                            type="tel"
                                            value={profileDraft.phone_no}
                                            onChange={(event) => setProfileDraft({ ...profileDraft, phone_no: event.target.value })}
                                        />
                                    </label>
                                    <div className="staff-profile-edit-actions">
                                        <button type="submit" className="staff-button staff-button-primary" disabled={profileSaving}>
                                            {profileSaving ? "Saving..." : "Save changes"}
                                        </button>
                                        <button type="button" className="staff-button staff-button-quiet" disabled={profileSaving} onClick={() => setProfileEditing(false)}>
                                            Cancel
                                        </button>
                                    </div>
                                </form>
                            ) : (
                                <>
                                    <div className="staff-profile-fields">
                                        <div><span>Name</span><strong>{user.name || "Not provided"}</strong></div>
                                        <div><span>Staff ID</span><strong>{user.userId || "Not provided"}</strong></div>
                                        <div><span>Email</span><strong>{user.email || "Not provided"}</strong></div>
                                        <div><span>Phone</span><strong>{user.phone_no || "Not provided"}</strong></div>
                                        <div><span>Role</span><strong>Staff</strong></div>
                                    </div>
                                    <button type="button" className="staff-button staff-button-primary staff-profile-edit-button" onClick={startProfileEditing}>Edit profile</button>
                                </>
                            )}
                        </div>
                    </section>
                )}
            </main>

            {selectedOrder && (
                <div className="staff-modal-backdrop" role="presentation" onMouseDown={(event) => {
                    if (event.target === event.currentTarget) setSelectedOrder(null);
                }}>
                    <section className="staff-order-modal" role="dialog" aria-modal="true" aria-labelledby="staff-order-modal-title">
                        <div className="staff-modal-header">
                            <div><span className="staff-eyebrow">ORDER DETAILS</span><h2 id="staff-order-modal-title">{selectedOrder.orderId}</h2></div>
                            <button type="button" className="staff-modal-close" onClick={() => setSelectedOrder(null)} aria-label="Close order details">×</button>
                        </div>
                        <div className="staff-modal-scroll">
                            <section className="staff-detail-section">
                                <h3>Order</h3>
                                <div className="staff-detail-grid">
                                    <div><span>Created</span><strong>{selectedOrder.createdAt ? new Date(selectedOrder.createdAt).toLocaleString() : "Not available"}</strong></div>
                                    <div><span>Status</span><strong>{titleCase(selectedOrder.orderStatus)}</strong></div>
                                    <div><span>Payment</span><strong>{titleCase(selectedOrder.paymentStatus)}</strong></div>
                                    <div><span>Order type</span><strong>{selectedOrder.isGroupOrder ? "Group Order" : "Normal Order"}</strong></div>
                                    {selectedOrder.isGroupOrder && <div><span>Group code</span><strong>{selectedOrder.groupCode || "—"}</strong></div>}
                                </div>
                            </section>
                            <section className="staff-detail-section">
                                <h3>Student</h3>
                                <div className="staff-detail-grid">
                                    <div><span>Name</span><strong>{selectedOrder.userId?.name || "Not available"}</strong></div>
                                    <div><span>Student ID</span><strong>{selectedOrder.userId?.userId || "Not available"}</strong></div>
                                    <div><span>Email</span><strong>{selectedOrder.userId?.email || "Not available"}</strong></div>
                                    <div><span>Phone</span><strong>{selectedOrder.userId?.phone_no || "Not available"}</strong></div>
                                </div>
                            </section>
                            <section className="staff-detail-section">
                                <h3>Items</h3>
                                <div className="staff-detail-items">
                                    {(selectedOrder.items || []).map((item, index) => (
                                        <div className="staff-detail-item" key={item.menuId?._id || index}>
                                            <span><strong>{item.menuId?.name || "Menu item"}</strong><small>Qty {item.quantity} × {money(item.price)}</small></span>
                                            <strong>{money(Number(item.quantity || 0) * Number(item.price || 0))}</strong>
                                        </div>
                                    ))}
                                    <div className="staff-detail-total"><span>Total</span><strong>{money(selectedOrder.totalAmount)}</strong></div>
                                </div>
                            </section>
                            <section className="staff-detail-section">
                                <h3>Pickup</h3>
                                <div className="staff-detail-grid">
                                    <div><span>Date</span><strong>{formatDate(getSlot(selectedOrder)?.date)}</strong></div>
                                    <div><span>Time</span><strong>{getSlot(selectedOrder) ? `${formatTime(getSlot(selectedOrder).startTime)} – ${formatTime(getSlot(selectedOrder).endTime)}` : "Not available"}</strong></div>
                                </div>
                            </section>
                        </div>
                        {selectedOrder.orderStatus !== "Completed" && selectedOrder.orderStatus !== "Cancelled" && (
                            <div className="staff-modal-footer">
                                <button type="button" className="staff-button staff-button-primary" disabled={busyOrderId === selectedOrder.orderId} onClick={() => updateOrderStatus(selectedOrder)}>
                                    {busyOrderId === selectedOrder.orderId ? "Updating..." : ({ Received: "Start Preparing", Preparing: "Mark Ready", Ready: "Mark Completed" }[selectedOrder.orderStatus] || "Update order")}
                                </button>
                            </div>
                        )}
                    </section>
                </div>
            )}
        </div>
    );
}

export default StaffDashboard;
