import { useEffect, useMemo, useState } from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import StudentSidebar from "../components/StudentSidebar";
import api from "../services/api";
import "../styles/pages/StudentDashboard.css";

/*
 * STUDENT API SURFACE — all data below comes from the existing backend.
 * READ:  GET /menu, /cart, /orders/my, /orders/:id, /wallet, /wallet/history, /pickup-slots/today, /groups/my, /groups/:groupCode
 * CREATE: POST /cart/add, /orders, /wallet/topup, /groups/create, /groups/join, /groups/:groupCode/items, /wallet/pay, /wallet/refund, /groups/pay, /groups/finalize
 * UPDATE: PUT /cart/update, /orders/:id/pickup-slot
 * DELETE/CANCEL: DELETE /cart/remove/:menuId, PUT /orders/:id/cancel, DELETE /groups/:groupCode/items/:menuId
 * No menu/order/wallet/pickup/group data is hardcoded for the dashboard.
 */

function StudentDashboard() {
    const { user, updateUser, loading: authLoading } = useAuth();

    // =========================================================
    // MAIN SECTION
    // =========================================================

    const [activeSection, setActiveSection] = useState("home");

    // =========================================================
    // BACKEND DATA
    // =========================================================

    const [menu, setMenu] = useState([]);
    const [cart, setCart] = useState({
        items: [],
        runningTotal: 0
    });
    const [orders, setOrders] = useState([]);
    const [wallet, setWallet] = useState(null);
    const [walletHistory, setWalletHistory] = useState([]);
    const [pickupSlots, setPickupSlots] = useState([]);
    const [groups, setGroups] = useState([]);
    const [group, setGroup] = useState(null);
    const [selectedOrder, setSelectedOrder] = useState(null);
    const [groupDetailsOpen, setGroupDetailsOpen] = useState(false);

    // =========================================================
    // UI STATE
    // =========================================================

    const [search, setSearch] = useState("");
    const [category, setCategory] = useState("All");

    const [selectedPickupSlot, setSelectedPickupSlot] = useState("");

    const [topupAmount, setTopupAmount] = useState("");

    const [groupNameInput, setGroupNameInput] = useState("");
    const [groupCodeInput, setGroupCodeInput] = useState("");

    const [selectedGroupPickupSlot, setSelectedGroupPickupSlot] = useState("");
    const [pendingGroupItems, setPendingGroupItems] = useState({});
    const [profileEditing, setProfileEditing] = useState(false);
    const [profileDraft, setProfileDraft] = useState({
        name: "",
        email: "",
        phone_no: ""
    });

    const [loading, setLoading] = useState(false);
    const [initialLoading, setInitialLoading] = useState(true);

    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");

    // =========================================================
    // MESSAGE HELPERS
    // =========================================================

    const showSuccess = (message) => {
        setSuccess(message);
        setError("");

        window.clearTimeout(
            showSuccess.timeout
        );

        showSuccess.timeout = window.setTimeout(() => {
            setSuccess("");
        }, 3000);
    };

    const showError = (message) => {
        setError(message);
        setSuccess("");

        window.clearTimeout(
            showError.timeout
        );

        showError.timeout = window.setTimeout(() => {
            setError("");
        }, 4000);
    };

    // =========================================================
    // INITIAL DATA LOAD
    // =========================================================

    useEffect(() => {
        loadDashboard();

        const statusTimer = window.setInterval(() => {
            fetchOrders();
        }, 15000);

        return () => window.clearInterval(statusTimer);
    }, []);

    const loadDashboard = async () => {
        setInitialLoading(true);

        await Promise.all([
            fetchMenu(),
            fetchCart(),
            fetchOrders(),
            fetchWallet(),
            fetchWalletHistory(),
            fetchPickupSlots(),
            fetchMyGroups()
        ]);

        setInitialLoading(false);
    };

    // =========================================================
    // MENU
    //
    // BACKEND:
    // GET /menu
    //
    // RESPONSE:
    // {
    //   success: true,
    //   count: 4,
    //   data: [...]
    // }
    // =========================================================

    const fetchMenu = async () => {
        try {
            const response = await api.get("/menu");

            if (
                response.data?.success &&
                Array.isArray(response.data.data)
            ) {
                setMenu(response.data.data);
                return;
            }

            setMenu([]);

            showError(
                response.data?.message ||
                "Failed to load menu."
            );
        } catch (err) {
            console.error(
                "GET /menu:",
                err
            );

            setMenu([]);

            showError(
                err.response?.data?.message ||
                "Unable to load menu."
            );
        }
    };

    const fetchWalletHistory = async () => {
        try {
            const response = await api.get("/wallet/history");
            setWalletHistory(Array.isArray(response.data?.data) ? response.data.data : []);
        } catch (err) {
            console.error("GET /wallet/history:", err);
            showError(err.response?.data?.message || "Unable to load wallet history.");
        }
    };

    // =========================================================
    // CART
    //
    // BACKEND:
    // GET /cart
    //
    // RESPONSE:
    // {
    //   success: true,
    //   data: {
    //      items: [],
    //      runningTotal: 0
    //   }
    // }
    // =========================================================

    const fetchCart = async () => {
        try {
            const response = await api.get("/cart");

            if (
                response.data?.success &&
                response.data?.data
            ) {
                setCart(response.data.data);
                return;
            }

            setCart({
                items: [],
                runningTotal: 0
            });
        } catch (err) {
            console.error(
                "GET /cart:",
                err
            );

            setCart({
                items: [],
                runningTotal: 0
            });
        }
    };

    // =========================================================
    // ORDERS
    //
    // BACKEND:
    // GET /orders/my
    //
    // RESPONSE:
    // {
    //   success: true,
    //   count: 2,
    //   data: [...]
    // }
    // =========================================================

    const fetchOrders = async () => {
        try {
            const response =
                await api.get("/orders/my");

            if (
                response.data?.success &&
                Array.isArray(response.data.data)
            ) {
                setOrders(response.data.data);
                setSelectedOrder((current) => {
                    if (!current?.orderId) return current;
                    return response.data.data.find((order) => order.orderId === current.orderId) || current;
                });
                return;
            }

            setOrders([]);

            showError(
                response.data?.message ||
                "Failed to load orders."
            );
        } catch (err) {
            console.error(
                "GET /orders/my:",
                err
            );

            setOrders([]);

            showError(
                err.response?.data?.message ||
                "Unable to load orders."
            );
        }
    };

    // =========================================================
    // PICKUP SLOTS
    // GET /pickup-slots/today
    // =========================================================

    const fetchPickupSlots = async () => {
        try {
            const response = await api.get("/pickup-slots/today");

            const slots = Array.isArray(response.data?.data)
                ? response.data.data
                : Array.isArray(response.data?.slots)
                    ? response.data.slots
                    : [];

            if (response.data?.success && slots.length >= 0) {
                setPickupSlots(slots);
                return;
            }

            setPickupSlots([]);
        } catch (err) {
            console.error("GET /pickup-slots/today:", err);
            setPickupSlots([]);
        }
    };

    // =========================================================
    // WALLET
    //
    // BACKEND:
    // GET /wallet
    // =========================================================

    const fetchWallet = async () => {
        try {
            const response =
                await api.get("/wallet");

            if (response.data?.success) {
                setWallet(response.data);
                return;
            }

            setWallet(response.data);
        } catch (err) {
            console.error(
                "GET /wallet:",
                err
            );

            setWallet(null);
        }
    };

    // =========================================================
    // DATA HELPERS
    // =========================================================

    const getWalletAmount = () => {
        if (
            typeof wallet?.wallet === "number"
        ) {
            return wallet.wallet;
        }

        if (
            typeof wallet?.data?.wallet ===
            "number"
        ) {
            return wallet.data.wallet;
        }

        if (
            typeof wallet?.user?.wallet ===
            "number"
        ) {
            return wallet.user.wallet;
        }

        return 0;
    };

    const cartItems = Array.isArray(
        cart?.items
    )
        ? cart.items
        : [];

    const cartCount = cartItems.reduce(
        (total, item) =>
            total + Number(item.quantity || 0),
        0
    );

    const cartTotal = Number(
        cart?.runningTotal || 0
    );

    // =========================================================
    // MENU HELPERS
    // =========================================================

    const getMenuId = (item) =>
        item?._id;

    const getMenuName = (item) =>
        item?.name || "";

    const getMenuCategory = (item) =>
        item?.category || "";

    const getMenuDescription = (item) =>
        item?.description || "";

    const getMenuPrice = (item) =>
        Number(item?.price || 0);

    const isMenuAvailable = (item) =>
        item?.isAvailable === true;

    // =========================================================
    // CATEGORIES
    // =========================================================

    const categories = useMemo(() => {
        const uniqueCategories = [
            ...new Set(
                menu
                    .map(
                        (item) =>
                            item.category
                    )
                    .filter(Boolean)
            )
        ];

        return [
            "All",
            ...uniqueCategories
        ];
    }, [menu]);

    // =========================================================
    // FILTERED MENU
    // =========================================================

    const filteredMenu = useMemo(() => {
        const searchText =
            search.trim().toLowerCase();

        return menu.filter((item) => {
            const name =
                getMenuName(item).toLowerCase();

            const description =
                getMenuDescription(
                    item
                ).toLowerCase();

            const itemCategory =
                getMenuCategory(item);

            const matchesSearch =
                !searchText ||
                name.includes(searchText) ||
                description.includes(
                    searchText
                );

            const matchesCategory =
                category === "All" ||
                itemCategory === category;

            return (
                matchesSearch &&
                matchesCategory
            );
        });
    }, [
        menu,
        search,
        category
    ]);

    // =========================================================
    // GET CART ITEM ID
    //
    // Cart controller populates items.menuId
    // =========================================================

    const getCartMenuId = (item) => {
        if (
            typeof item?.menuId === "object"
        ) {
            return item.menuId?._id;
        }

        return item?.menuId;
    };

    // =========================================================
    // GET CART ITEM NAME
    // =========================================================

    const getCartItemName = (item) => {
        if (
            typeof item?.menuId ===
            "object"
        ) {
            return (
                item.menuId?.name ||
                "Menu item"
            );
        }

        return "Menu item";
    };

    // =========================================================
    // GET CART ITEM PRICE
    // =========================================================

    const getCartItemPrice = (item) => {
        if (
            typeof item?.menuId ===
            "object"
        ) {
            return Number(
                item.menuId?.price || 0
            );
        }

        return 0;
    };

    // =========================================================
    // ADD TO CART
    //
    // POST /cart/add
    // =========================================================

    const addToCart = async (menuId) => {
        if (!menuId) {
            showError(
                "Invalid menu item."
            );
            return;
        }

        try {
            setLoading(true);

            await api.post(
                "/cart/add",
                {
                    menuId,
                    quantity: 1
                }
            );

            await fetchCart();

            showSuccess(
                "Item added to cart."
            );
        } catch (err) {
            console.error(
                "POST /cart/add:",
                err
            );

            showError(
                err.response?.data?.message ||
                "Unable to add item to cart."
            );
        } finally {
            setLoading(false);
        }
    };

    // =========================================================
    // UPDATE CART QUANTITY
    //
    // PUT /cart/update
    // =========================================================

    const updateCartQuantity = async (
        menuId,
        quantity
    ) => {
        if (quantity < 1) {
            await removeFromCart(
                menuId
            );
            return;
        }

        try {
            setLoading(true);

            await api.put(
                "/cart/update",
                {
                    menuId,
                    quantity
                }
            );

            await fetchCart();
        } catch (err) {
            console.error(
                "PUT /cart/update:",
                err
            );

            showError(
                err.response?.data?.message ||
                "Unable to update cart."
            );
        } finally {
            setLoading(false);
        }
    };

    // =========================================================
    // REMOVE FROM CART
    //
    // DELETE /cart/remove/:menuId
    // =========================================================

    const removeFromCart = async (
        menuId
    ) => {
        try {
            setLoading(true);

            await api.delete(
                `/cart/remove/${menuId}`
            );

            await fetchCart();

            showSuccess(
                "Item removed from cart."
            );
        } catch (err) {
            console.error(
                "DELETE /cart/remove:",
                err
            );

            showError(
                err.response?.data?.message ||
                "Unable to remove item."
            );
        } finally {
            setLoading(false);
        }
    };

    // =========================================================
    // PLACE ORDER
    //
    // POST /orders
    // =========================================================

    const placeOrder = async () => {
        if (cartItems.length === 0) {
            showError("Your cart is empty.");
            return;
        }

        if (!selectedPickupSlot) {
            showError("Please select an available pickup slot.");
            return;
        }

        try {
            setLoading(true);

            const orderItems = cartItems.map((item) => ({
                menuId: typeof item.menuId === "object" ? item.menuId._id : item.menuId,
                quantity: Number(item.quantity)
            }));

            const response = await api.post("/orders", {
                orderId: `ORD${Date.now()}`,
                items: orderItems,
                pickupSlot: { slotId: selectedPickupSlot }
            });

            const createdOrder = response.data?.data;
            if (!createdOrder?.orderId) {
                throw new Error("Order was created without an order ID.");
            }

            setSelectedPickupSlot("");
            setSelectedOrder(createdOrder);
            setActiveSection("orders");

            try {
                await api.post("/wallet/pay", {
                    orderId: createdOrder.orderId
                });

                await Promise.all([
                    fetchCart(),
                    fetchOrders(),
                    fetchWallet(),
                    fetchWalletHistory(),
                    fetchPickupSlots()
                ]);

                showSuccess("Payment successful. Your order is confirmed.");
            } catch (paymentError) {
                await Promise.all([
                    fetchCart(),
                    fetchOrders(),
                    fetchPickupSlots()
                ]);
                setSelectedOrder(createdOrder);
                showError(
                    paymentError.response?.data?.message ||
                    "Payment failed. Your order is not confirmed; pay from order details to continue."
                );
            }
        } catch (err) {
            console.error("POST /orders:", err);
            showError(err.response?.data?.message || "Unable to place order.");
        } finally {
            setLoading(false);
        }
    };

    // =========================================================
    // PAY ORDER
    //
    // POST /wallet/pay
    // =========================================================

    const payOrder = async (
        orderId
    ) => {
        try {
            setLoading(true);

            await api.post(
                "/wallet/pay",
                {
                    orderId
                }
            );

            await Promise.all([
                fetchOrders(),
                fetchWallet(),
                fetchWalletHistory()
            ]);

            showSuccess(
                "Payment successful."
            );
        } catch (err) {
            console.error(
                "POST /wallet/pay:",
                err
            );

            showError(
                err.response?.data?.message ||
                "Payment failed."
            );
        } finally {
            setLoading(false);
        }
    };

    // =========================================================
    // CANCEL ORDER
    //
    // PUT /orders/:id/cancel
    // =========================================================

    const cancelOrder = async (
        orderId
    ) => {
        try {
            setLoading(true);

            const response = await api.put(
                `/orders/${orderId}/cancel`
            );

            await Promise.all([
                fetchOrders(),
                fetchPickupSlots(),
                fetchWallet(),
                fetchWalletHistory()
            ]);
            setSelectedOrder(null);

            showSuccess(response.data?.message || "Order cancelled successfully.");
        } catch (err) {
            console.error(
                "PUT /orders/:id/cancel:",
                err
            );

            showError(
                err.response?.data?.message ||
                "Unable to cancel order."
            );
        } finally {
            setLoading(false);
        }
    };

    // =========================================================
    // REFUND ORDER
    //
    // POST /wallet/refund
    // =========================================================

    const refundOrder = async (
        orderId
    ) => {
        try {
            setLoading(true);

            await api.post(
                "/wallet/refund",
                {
                    orderId
                }
            );

            await Promise.all([
                fetchOrders(),
                fetchWallet(),
                fetchWalletHistory()
            ]);

            showSuccess(
                "Refund added to wallet."
            );
        } catch (err) {
            console.error(
                "POST /wallet/refund:",
                err
            );

            showError(
                err.response?.data?.message ||
                "Unable to refund order."
            );
        } finally {
            setLoading(false);
        }
    };

    // =========================================================
    // UPDATE PICKUP SLOT
    //
    // PUT /orders/:id/pickup-slot
    // =========================================================

    const updatePickupSlot = async (orderId) => {
        if (!selectedPickupSlot) {
            showError("Please select an available pickup slot.");
            return;
        }

        try {
            setLoading(true);

            await api.put(`/orders/${orderId}/pickup-slot`, {
                slotId: selectedPickupSlot
            });

            await Promise.all([fetchOrders(), fetchPickupSlots()]);
            setSelectedPickupSlot("");
            showSuccess("Pickup slot updated.");
        } catch (err) {
            console.error("PUT /orders/:id/pickup-slot:", err);
            showError(err.response?.data?.message || "Unable to update pickup slot.");
        } finally {
            setLoading(false);
        }
    };

    const fetchOrderDetails = async (orderId) => {
        try {
            setLoading(true);
            const response = await api.get(`/orders/${orderId}`);
            if (response.data?.success) {
                setSelectedOrder(response.data.data);
                return true;
            }
            return false;
        } catch (err) {
            console.error("GET /orders/:id:", err);
            showError(err.response?.data?.message || "Unable to load order details.");
            return false;
        } finally {
            setLoading(false);
        }
    };

    // =========================================================
    // TOP UP WALLET
    //
    // POST /wallet/topup
    // =========================================================

    const topUpWallet = async () => {
        const amount =
            Number(topupAmount);

        if (!amount || amount <= 0) {
            showError(
                "Enter a valid amount."
            );
            return;
        }

        try {
            setLoading(true);

            await api.post(
                "/wallet/topup",
                {
                    amount
                }
            );

            setTopupAmount("");

            await Promise.all([fetchWallet(), fetchWalletHistory()]);

            showSuccess(
                "Wallet topped up successfully."
            );
        } catch (err) {
            console.error(
                "POST /wallet/topup:",
                err
            );

            showError(
                err.response?.data?.message ||
                "Unable to top up wallet."
            );
        } finally {
            setLoading(false);
        }
    };

    // =========================================================
    // GROUP ORDERS
    // =========================================================

    const fetchMyGroups = async () => {
        try {
            const response = await api.get("/groups/my");
            const data = Array.isArray(response.data?.data)
                ? response.data.data
                : [];

            setGroups(data);
            return data;
        } catch (err) {
            console.error("GET /groups/my:", err);
            setGroups([]);
            showError(err.response?.data?.message || "Unable to load your groups.");
            return [];
        }
    };

    const createGroup = async () => {
        const name = groupNameInput.trim();

        if (!name) {
            showError("Enter a group name.");
            return;
        }

        try {
            setLoading(true);

            const response = await api.post("/groups/create", {
                groupName: name
            });

            const groupCode = response.data?.groupCode;

            if (!groupCode) {
                throw new Error("Backend did not return a group code.");
            }

            setGroupNameInput("");
            setGroupCodeInput("");

            await fetchMyGroups();
            await fetchGroup(groupCode, false);
            setGroupDetailsOpen(false);
            setPendingGroupItems({});

            showSuccess(`Group "${name}" created.`);
        } catch (err) {
            console.error("POST /groups/create:", err);
            showError(err.response?.data?.message || err.message || "Unable to create group.");
        } finally {
            setLoading(false);
        }
    };

    const joinGroup = async () => {
        const code = groupCodeInput.trim().toUpperCase();

        if (!code) {
            showError("Enter a group code.");
            return;
        }

        try {
            setLoading(true);

            const response = await api.post("/groups/join", {
                groupCode: code
            });

            const joinedCode = response.data?.groupCode || code;

            setGroupCodeInput("");
            await fetchMyGroups();
            await fetchGroup(joinedCode, false);
            setGroupDetailsOpen(false);
            setPendingGroupItems({});

            showSuccess("Joined group successfully.");
        } catch (err) {
            console.error("POST /groups/join:", err);
            showError(err.response?.data?.message || "Unable to join group.");
        } finally {
            setLoading(false);
        }
    };

    const deleteGroup = async (groupCode) => {
        if (!window.confirm("Delete this group? Groups with paid shares or order history cannot be deleted.")) {
            return;
        }

        try {
            setLoading(true);
            await api.delete(`/groups/${groupCode}`);

            if (group?.groupCode === groupCode) {
                setGroup(null);
                setGroupDetailsOpen(false);
                setPendingGroupItems({});
            }

            await fetchMyGroups();
            showSuccess("Group deleted successfully.");
        } catch (err) {
            console.error("DELETE /groups/:groupCode:", err);
            showError(err.response?.data?.message || "Unable to delete this group.");
        } finally {
            setLoading(false);
        }
    };

    const saveProfile = async (event) => {
        event.preventDefault();

        try {
            setLoading(true);
            const response = await api.put("/users/profile", profileDraft);

            if (!response.data?.success || !response.data?.data) {
                throw new Error(response.data?.message || "Unable to update profile.");
            }

            updateUser(response.data.data);
            setProfileEditing(false);
            showSuccess("Profile updated successfully.");
        } catch (err) {
            console.error("PUT /users/profile:", err);
            showError(err.response?.data?.message || err.message || "Unable to update profile.");
        } finally {
            setLoading(false);
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

    const fetchGroup = async (groupCode, manageLoading = true) => {
        try {
            if (manageLoading) setLoading(true);

            const response = await api.get(`/groups/${groupCode}`);
            const data = response.data?.data || response.data;

            if (!data?._id && !data?.groupCode) {
                throw new Error("Invalid group response from backend.");
            }

            setGroup(data);
            setGroupDetailsOpen(true);
            return data;
        } catch (err) {
            console.error("GET /groups/:groupCode:", err);
            showError(err.response?.data?.message || "Unable to load group.");
            return null;
        } finally {
            if (manageLoading) setLoading(false);
        }
    };

    const selectGroup = async (groupCode) => {
        if (!groupCode) return;
        setPendingGroupItems({});
        await fetchGroup(groupCode);
    };

    const openGroupFromOrder = async (groupCode) => {
        if (!groupCode) return;
        setActiveSection("groups");
        await fetchGroup(groupCode);
    };

    const copyGroupCode = async () => {
        if (!group?.groupCode) return;

        try {
            await navigator.clipboard.writeText(group.groupCode);
            showSuccess("Group code copied.");
        } catch (err) {
            console.error("COPY GROUP CODE:", err);
            showError("Unable to copy the group code.");
        }
    };

    const addGroupItem = (menuId) => {
        if (!group?.groupCode || group.status !== "Open") {
            showError("This group is not open for new items.");
            return;
        }

        setPendingGroupItems((current) => ({
            ...current,
            [menuId]: Number(current[menuId] || 0) + 1
        }));
    };

    const removePendingGroupItem = (menuId) => {
        setPendingGroupItems((current) => {
            const next = { ...current };
            const quantity = Number(next[menuId] || 0);

            if (quantity <= 1) {
                delete next[menuId];
            } else {
                next[menuId] = quantity - 1;
            }

            return next;
        });
    };

    const confirmGroupItems = async () => {
        if (!group?.groupCode) return;

        const selections = Object.entries(pendingGroupItems)
            .filter(([, quantity]) => Number(quantity) > 0);

        if (selections.length === 0) {
            showError("Add at least one menu item before confirming.");
            return;
        }

        try {
            setLoading(true);

            for (const [menuId, quantity] of selections) {
                await api.post(`/groups/${group.groupCode}/items`, {
                    menuId,
                    quantity: Number(quantity)
                });
            }

            setPendingGroupItems({});

            await Promise.all([
                fetchGroup(group.groupCode, false),
                fetchMyGroups()
            ]);

            showSuccess("Your group order items have been confirmed.");
        } catch (err) {
            console.error("CONFIRM GROUP ITEMS:", err);
            showError(err.response?.data?.message || "Unable to confirm group items.");
        } finally {
            setLoading(false);
        }
    };

    const removeGroupItem = async (menuId) => {
        if (!group?.groupCode) return;

        try {
            setLoading(true);

            await api.delete(`/groups/${group.groupCode}/items/${menuId}`);

            await Promise.all([
                fetchGroup(group.groupCode, false),
                fetchMyGroups()
            ]);

            showSuccess("Item removed from group.");
        } catch (err) {
            console.error("DELETE /groups/:groupCode/items/:menuId:", err);
            showError(err.response?.data?.message || "Unable to remove group item.");
        } finally {
            setLoading(false);
        }
    };

    const payGroupShare = async () => {
        if (!group?.groupCode) return;

        try {
            setLoading(true);

            await api.post("/groups/pay", {
                groupCode: group.groupCode
            });

            await Promise.all([
                fetchGroup(group.groupCode, false),
                fetchMyGroups(),
                fetchWallet(),
                fetchWalletHistory()
            ]);

            showSuccess("Your group share has been paid.");
        } catch (err) {
            console.error("POST /groups/pay:", err);
            showError(err.response?.data?.message || "Unable to pay group share.");
        } finally {
            setLoading(false);
        }
    };

    const finalizeGroup = async () => {
        if (!group?.groupCode) return;

        if (!selectedGroupPickupSlot) {
            showError("Select an available pickup slot.");
            return;
        }

        try {
            setLoading(true);

            await api.post("/groups/finalize", {
                groupCode: group.groupCode,
                pickupSlot: { slotId: selectedGroupPickupSlot }
            });

            await Promise.all([
                fetchGroup(group.groupCode, false),
                fetchMyGroups(),
                fetchOrders(),
                fetchPickupSlots()
            ]);

            setSelectedGroupPickupSlot("");
            showSuccess("Group order placed. Members can now pay their shares.");
        } catch (err) {
            console.error("POST /groups/finalize:", err);
            showError(err.response?.data?.message || "Unable to finalize group order.");
        } finally {
            setLoading(false);
        }
    };

    // =========================================================
    // STUDENT DASHBOARD VIEW HELPERS
    // =========================================================

    const getSlotId = (slot) => slot?._id || slot?.id;

    const getRemainingSlots = (slot) => Math.max(
        0,
        Number(slot?.capacity || 0) - Number(slot?.bookedCount || 0)
    );

    const formatSlotDate = (value) => {
        if (!value) return "Today";

        const date = new Date(value);
        if (Number.isNaN(date.getTime())) return "Today";

        return date.toLocaleDateString("en-IN", {
            day: "numeric",
            month: "short"
        });
    };

    const getPickupLabel = (order) => {
        const slot = order?.pickupSlot?.slotId;

        if (!slot) return "Pickup slot not available";

        if (typeof slot === "string") return "Pickup slot selected";

        return `${slot.startTime || "--:--"} – ${slot.endTime || "--:--"}`;
    };

    const renderPickupSlots = ({
        selectedSlot,
        onSelect,
        compact = false,
        title = "Choose a pickup slot",
        subtitle = "Pick a time that works for you"
    }) => (
        <section className={`student-slot-picker ${compact ? "compact" : ""}`}>
            <div className="student-slot-heading">
                <div>
                    <span>PICKUP</span>
                    <h3>{title}</h3>
                    <p>{subtitle}</p>
                </div>
                <span className="student-slot-count">
                    {pickupSlots.length} available
                </span>
            </div>

            {pickupSlots.length === 0 ? (
                <div className="student-slot-empty">
                    <span className="student-empty-icon">◷</span>
                    <div>
                        <strong>No pickup slots right now</strong>
                        <p>Please check again shortly.</p>
                    </div>
                </div>
            ) : (
                <div className="student-slot-grid">
                    {pickupSlots.map((slot) => {
                        const slotId = getSlotId(slot);
                        const remaining = getRemainingSlots(slot);
                        const selected = String(selectedSlot) === String(slotId);
                        const full = remaining <= 0;

                        return (
                            <button
                                type="button"
                                key={slotId}
                                className={`student-slot-card ${selected ? "selected" : ""}`}
                                onClick={() => onSelect(slotId)}
                                disabled={loading || full}
                            >
                                <span className="student-slot-time">
                                    {slot.startTime || "--:--"}
                                    <em>–</em>
                                    {slot.endTime || "--:--"}
                                </span>
                                <span className="student-slot-meta">
                                    {formatSlotDate(slot.date)}
                                </span>
                                <span className={`student-slot-capacity ${remaining <= 3 ? "low" : ""}`}>
                                    {full ? "Full" : `${remaining} ${remaining === 1 ? "spot" : "spots"} left`}
                                </span>
                                <span className="student-slot-select">
                                    {selected ? "✓ Selected" : "Select"}
                                </span>
                            </button>
                        );
                    })}
                </div>
            )}
        </section>
    );

    const renderEmptyState = (icon, title, text, action) => (
        <div className="student-empty-state">
            <div className="student-empty-icon-large">{icon}</div>
            <h2>{title}</h2>
            <p>{text}</p>
            {action}
        </div>
    );

    // =========================================================
    // HOME
    // =========================================================

    const renderHome = () => {
        const activeOrders = orders.filter(
            (order) => !["Completed", "Cancelled"].includes(order.orderStatus)
        );

        return (
            <div className="student-content">
                <section className="student-hero-card">
                    <div className="student-hero-copy">
                        <span className="student-eyebrow">STUDENT DASHBOARD</span>
                        <h1>
                            Hey, {user?.name?.split(" ")[0] || "Student"}.<br />
                            <span>What are you craving?</span>
                        </h1>
                        <p>Order ahead, choose your pickup time and skip the canteen queue.</p>
                        <div className="student-hero-actions">
                            <button type="button" className="student-primary-action" onClick={() => setActiveSection("order")}>
                                Order food <span>→</span>
                            </button>
                            <button type="button" className="student-secondary-action" onClick={() => setActiveSection("orders")}>
                                Track orders
                            </button>
                        </div>
                    </div>
                    <div className="student-hero-art" aria-hidden="true">
                        <div className="student-hero-orbit orbit-one" />
                        <div className="student-hero-orbit orbit-two" />
                        <div className="student-hero-food">🍜</div>
                        <span className="student-hero-float float-one">⚡ Fast pickup</span>
                        <span className="student-hero-float float-two">♡ Made for students</span>
                    </div>
                </section>

                <section className="student-stat-grid">
                    <article className="student-stat-card accent-wallet">
                        <span>WALLET</span>
                        <strong>₹{getWalletAmount().toFixed(2)}</strong>
                        <small>Ready to spend</small>
                    </article>
                    <article className="student-stat-card accent-orders">
                        <span>ORDERS</span>
                        <strong>{orders.length}</strong>
                        <small>Total placed</small>
                    </article>
                    <article className="student-stat-card accent-active">
                        <span>ACTIVE</span>
                        <strong>{activeOrders.length}</strong>
                        <small>Still on the move</small>
                    </article>
                </section>

                {activeOrders.length > 0 ? (
                    <section className="student-next-order">
                        <div className="student-section-title-row">
                            <div>
                                <span className="student-eyebrow">ON YOUR RADAR</span>
                                <h2>Active orders</h2>
                            </div>
                            <button type="button" className="student-text-button" onClick={() => setActiveSection("orders")}>
                                View all →
                            </button>
                        </div>
                        <div className="student-home-active-orders">
                            {activeOrders.map((order) => (
                                <article className="student-home-active-order" key={order._id || order.orderId}>
                                    <div className="student-order-icon">✓</div>
                                    <div className="student-next-order-main">
                                        <strong>{order.orderId}</strong>
                                        <span>
                                            {order.isGroupOrder ? `Group ${order.groupCode || "order"} · ` : ""}
                                            {getPickupLabel(order)} · ₹{Number(order.totalAmount || 0).toFixed(2)}
                                        </span>
                                    </div>
                                    <span className="student-status">{order.orderStatus}</span>
                                    <button
                                        type="button"
                                        className="student-text-button student-home-order-details"
                                        disabled={loading}
                                        onClick={async () => {
                                            if (await fetchOrderDetails(order.orderId)) {
                                                setActiveSection("orders");
                                            }
                                        }}
                                    >
                                        View details →
                                    </button>
                                </article>
                            ))}
                        </div>
                    </section>
                ) : (
                    <section className="student-next-order student-next-order-empty">
                        <div>
                            <span className="student-eyebrow">READY WHEN YOU ARE</span>
                            <h2>No active order</h2>
                            <p>Your next meal is only a few taps away.</p>
                        </div>
                        <button type="button" className="student-primary-action" onClick={() => setActiveSection("order")}>
                            Browse menu →
                        </button>
                    </section>
                )}

            </div>
        );
    };

    // =========================================================
    // ORDER FOOD
    // =========================================================

    const renderOrderFood = () => (
        <div className="student-content">
            <div className="student-page-heading">
                <div>
                    <span className="student-eyebrow">CANTEEN MENU</span>
                    <h1>Pick your <span>favourites.</span></h1>
                    <p>Fresh campus food, ready when you are.</p>
                </div>
                <button type="button" className="student-cart-summary student-cart-summary-go" onClick={() => setActiveSection("cart")}>
                    <span>GO TO CART</span>
                    <strong>{cartCount} {cartCount === 1 ? "item" : "items"}</strong>
                    <small>₹{cartTotal.toFixed(2)}</small>
                </button>
            </div>

            <div className="student-menu-toolbar">
                <label className="student-search-box">
                    <span>⌕</span>
                    <input type="text" placeholder="Search food or ingredients..." value={search} onChange={(event) => setSearch(event.target.value)} />
                    {search && <button type="button" onClick={() => setSearch("")} aria-label="Clear search">×</button>}
                </label>
                <div className="student-category-list">
                    {categories.map((item) => (
                        <button type="button" key={item} className={category === item ? "active" : ""} onClick={() => setCategory(item)}>
                            {item}
                        </button>
                    ))}
                </div>
            </div>

            {initialLoading ? (
                renderEmptyState("◌", "Loading today’s menu", "Getting the latest canteen items for you...")
            ) : filteredMenu.length === 0 ? (
                renderEmptyState("⌕", "Nothing matched", "Try another search or switch to a different category.", <button type="button" className="student-secondary-action" onClick={() => { setSearch(""); setCategory("All"); }}>Reset filters</button>)
            ) : (
                <div className="student-menu-grid">
                    {filteredMenu.map((item) => {
                        const menuId = getMenuId(item);
                        const available = isMenuAvailable(item);
                        return (
                            <article className={`student-food-card ${available ? "" : "unavailable"}`} key={menuId}>
                                <div className="student-food-icon">🍽️</div>
                                <div className="student-food-info">
                                    <span className="student-food-category">{getMenuCategory(item) || "Canteen"}</span>
                                    <h3>{getMenuName(item)}</h3>
                                    <p>{getMenuDescription(item) || "A campus favourite made fresh for you."}</p>
                                </div>
                                <div className="student-food-bottom">
                                    <strong>₹{getMenuPrice(item).toFixed(2)}</strong>
                                    <button type="button" disabled={loading || !available} onClick={() => addToCart(menuId)}>
                                        {available ? "Add to cart" : "Unavailable"}
                                    </button>
                                </div>
                            </article>
                        );
                    })}
                </div>
            )}

        </div>
    );

    const renderCart = () => (
        <div className="student-content">
            <div className="student-page-heading">
                <div>
                    <span className="student-eyebrow">YOUR BASKET</span>
                    <h1>Review your <span>order.</span></h1>
                    <p>Adjust your items, choose a pickup time and pay securely from your wallet.</p>
                </div>
                <button type="button" className="student-secondary-action" onClick={() => setActiveSection("order")}>
                    ← Add more items
                </button>
            </div>

            {cartItems.length > 0 ? (
                <section className="student-cart-panel">
                    <div className="student-cart-header">
                        <div>
                            <span className="student-eyebrow">CHECKOUT</span>
                            <h2>Your cart</h2>
                            <p>{cartCount} {cartCount === 1 ? "item" : "items"} · ₹{cartTotal.toFixed(2)}</p>
                        </div>
                    </div>

                    <div className="student-cart-items">
                        {cartItems.map((item) => {
                            const menuId = getCartMenuId(item);
                            const quantity = Number(item.quantity || 0);
                            const price = getCartItemPrice(item);
                            return (
                                <div className="student-cart-item" key={menuId}>
                                    <div className="student-cart-item-icon">🍴</div>
                                    <div className="student-cart-item-info">
                                        <strong>{getCartItemName(item)}</strong>
                                        <span>₹{price.toFixed(2)} each</span>
                                    </div>
                                    <div className="student-quantity-control">
                                        <button type="button" disabled={loading} onClick={() => quantity === 1 ? removeFromCart(menuId) : updateCartQuantity(menuId, quantity - 1)}>−</button>
                                        <strong>{quantity}</strong>
                                        <button type="button" disabled={loading} onClick={() => updateCartQuantity(menuId, quantity + 1)}>+</button>
                                    </div>
                                    <strong className="student-cart-line-total">₹{(price * quantity).toFixed(2)}</strong>
                                    <button type="button" className="student-icon-button danger" disabled={loading} onClick={() => removeFromCart(menuId)} aria-label={`Remove ${getCartItemName(item)}`}>×</button>
                                </div>
                            );
                        })}
                    </div>

                    {renderPickupSlots({
                        selectedSlot: selectedPickupSlot,
                        onSelect: setSelectedPickupSlot,
                        title: "Choose your pickup time",
                        subtitle: "Your order will be tied to this slot."
                    })}

                    <div className="student-checkout-bar">
                        <div>
                            <span>ORDER BILL</span>
                            <strong>₹{cartTotal.toFixed(2)}</strong>
                            <small>₹{cartTotal.toFixed(2)} will be deducted from your wallet when you place this order.</small>
                        </div>
                        <button type="button" className="student-primary-action checkout-action" disabled={loading || !selectedPickupSlot} onClick={placeOrder}>
                            {loading ? "Processing payment…" : selectedPickupSlot ? "Pay & place order →" : "Select a pickup slot"}
                        </button>
                    </div>
                </section>
            ) : (
                renderEmptyState(
                    "🛒",
                    "Your cart is empty",
                    "Browse the menu and add items here when you’re ready to order.",
                    <button type="button" className="student-primary-action" onClick={() => setActiveSection("order")}>
                        Browse menu →
                    </button>
                )
            )}
        </div>
    );

    // =========================================================
    // MY ORDERS
    // =========================================================

    const renderOrders = () => {
        const activeOrder = orders.find((order) => !["Completed", "Cancelled"].includes(order.orderStatus));
        const selected = selectedOrder || activeOrder;
        const statusSteps = ["Received", "Preparing", "Ready", "Completed"];

        return (
            <div className="student-content">
                <div className="student-page-heading">
                    <div>
                        <span className="student-eyebrow">ORDER CENTRE</span>
                        <h1>Track your <span>orders.</span></h1>
                        <p>See status, payment and pickup details in one place.</p>
                    </div>
                    <button type="button" className="student-secondary-action" disabled={loading} onClick={fetchOrders}>↻ Refresh</button>
                </div>

                {selected && (
                    <section className="student-order-detail">
                        <div className="student-order-detail-top">
                            <div>
                                <span className="student-eyebrow">SELECTED ORDER</span>
                                <h2>{selected.orderId}</h2>
                                <p>{selected.orderStatus === "AwaitingPayment" ? "Awaiting payment — order not confirmed" : `${selected.orderStatus} · ${getPickupLabel(selected)}`}</p>
                            </div>
                            <span className={`student-status ${selected.orderStatus === "Cancelled" ? "cancelled" : ""}`}>{selected.orderStatus}</span>
                        </div>

                        <div className="student-order-progress">
                            {selected.orderStatus === "AwaitingPayment" && (
                                <div className="student-muted-copy">Complete payment to confirm this order and send it to the kitchen.</div>
                            )}
                            {statusSteps.map((step, index) => {
                                const currentIndex = statusSteps.indexOf(selected.orderStatus);
                                const done = selected.orderStatus !== "Cancelled" && currentIndex >= index;
                                return (
                                    <div className={`student-progress-step ${done ? "done" : ""}`} key={step}>
                                        <span>{done ? "✓" : index + 1}</span>
                                        <small>{step}</small>
                                    </div>
                                );
                            })}
                        </div>

                        <div className="student-order-detail-grid">
                            <div className="student-order-detail-card">
                                <span>TOTAL</span>
                                <strong>₹{Number(selected.totalAmount || 0).toFixed(2)}</strong>
                            </div>
                            <div className="student-order-detail-card">
                                <span>PAYMENT</span>
                                <strong>{selected.paymentStatus || "pending"}</strong>
                            </div>
                            <div className="student-order-detail-card">
                                <span>PICKUP</span>
                                <strong>{getPickupLabel(selected)}</strong>
                            </div>
                        </div>

                        {selected.isGroupOrder && Array.isArray(selected.memberPayments) && (
                            <div className="student-order-items-summary">
                                <strong>Share breakdown for this order</strong>
                                {selected.memberPayments.map((payment, index) => (
                                    <div key={`${payment.userId?._id || payment.userId}-${index}`}>
                                        <span>
                                            {payment.userId?.name || "Group member"}
                                            {String(payment.userId?._id || payment.userId) === String(user?._id || user?.id)
                                                ? " (you)"
                                                : ""}
                                        </span>
                                        <strong>₹{Number(payment.amount || 0).toFixed(2)} · {payment.paid ? "Paid" : "Unpaid"}</strong>
                                    </div>
                                ))}
                            </div>
                        )}

                        <div className="student-order-items-summary">
                            {(selected.items || []).map((item) => (
                                <div key={item.menuId?._id || item.menuId}>
                                    <span>{item.menuId?.name || "Menu item"} × {item.quantity}</span>
                                    <strong>₹{(Number(item.price || item.menuId?.price || 0) * Number(item.quantity || 0)).toFixed(2)}</strong>
                                </div>
                            ))}
                        </div>

                        <div className="student-order-actions">
                            {selected.isGroupOrder ? (
                                <button type="button" className="student-secondary-action" disabled={loading || !selected.groupCode} onClick={() => openGroupFromOrder(selected.groupCode)}>
                                    View group details & pay your share
                                </button>
                            ) : selected.paymentStatus !== "paid" && selected.orderStatus !== "Cancelled" && (
                                <button type="button" className="student-primary-action" disabled={loading} onClick={() => payOrder(selected.orderId)}>
                                    Pay now · ₹{Number(selected.totalAmount || 0).toFixed(2)}
                                </button>
                            )}
                            {(["Received", "AwaitingPayment"].includes(selected.orderStatus) ||
                                (selected.isGroupOrder && selected.orderStatus === "Cancelled" && selected.paymentStatus !== "refunded")) && (
                                <button type="button" className="student-secondary-action danger-action" disabled={loading} onClick={() => { if (window.confirm(selected.orderStatus === "Cancelled" ? "Retry refunding any unpaid member shares?" : selected.isGroupOrder ? "Cancel this group order? Each member's paid share will be refunded." : "Cancel this order?")) cancelOrder(selected.orderId); }}>
                                    {selected.orderStatus === "Cancelled" ? "Retry member refunds" : selected.isGroupOrder ? "Cancel group order" : "Cancel order"}
                                </button>
                            )}
                            {!selected.isGroupOrder && selected.orderStatus === "Completed" && selected.paymentStatus === "paid" && (
                                <button type="button" className="student-secondary-action" disabled={loading} onClick={() => refundOrder(selected.orderId)}>
                                    Refund to wallet
                                </button>
                            )}
                            <button type="button" className="student-secondary-action" disabled={loading} onClick={() => fetchOrderDetails(selected.orderId)}>
                                Refresh status
                            </button>
                        </div>

                        {selected.orderStatus === "Received" && selected.paymentStatus === "paid" && (
                            <div className="student-order-pickup-edit">
                                {renderPickupSlots({
                                    selectedSlot: selectedPickupSlot,
                                    onSelect: setSelectedPickupSlot,
                                    compact: true,
                                    title: "Change pickup time",
                                    subtitle: "Only available slots can be selected."
                                })}
                                <button type="button" className="student-primary-action" disabled={loading || !selectedPickupSlot} onClick={() => updatePickupSlot(selected.orderId)}>
                                    Update pickup slot →
                                </button>
                            </div>
                        )}
                    </section>
                )}

                {orders.length === 0 ? (
                    renderEmptyState("▣", "No orders yet", "Your completed and active orders will appear here.", <button type="button" className="student-primary-action" onClick={() => setActiveSection("order")}>Order your first meal →</button>)
                ) : (
                    <section className="student-order-list">
                        <div className="student-section-title-row">
                            <div>
                                <span className="student-eyebrow">HISTORY</span>
                                <h2>All orders</h2>
                            </div>
                            <span className="student-list-count">{orders.length} total</span>
                        </div>
                        {orders.map((order) => (
                            <article className={`student-order-card ${selectedOrder?.orderId === order.orderId ? "selected" : ""}`} key={order._id || order.orderId}>
                                <div className="student-order-card-main">
                                    <div className="student-order-id-wrap">
                                        <span className="student-order-mini-icon">🍴</span>
                                        <div>
                                            <span>ORDER</span>
                                            <h3>{order.orderId}</h3>
                                        </div>
                                    </div>
                                    <span className={`student-status ${order.orderStatus === "Cancelled" ? "cancelled" : ""}`}>{order.orderStatus}</span>
                                </div>
                                <div className="student-order-card-meta">
                                    <div><span>TOTAL</span><strong>₹{Number(order.totalAmount || 0).toFixed(2)}</strong></div>
                                    <div><span>PAYMENT</span><strong>{order.paymentStatus || "pending"}</strong></div>
                                    <div><span>PICKUP</span><strong>{getPickupLabel(order)}</strong></div>
                                </div>
                                <div className="student-order-card-footer">
                                    <span>{(order.items || []).slice(0, 2).map((item) => `${item.menuId?.name || "Item"} × ${item.quantity}`).join(" · ") || "No items"}</span>
                                    <div>
                                        <button type="button" className="student-text-button" disabled={loading} onClick={() => fetchOrderDetails(order.orderId)}>View details →</button>
                                        {(["Received", "AwaitingPayment"].includes(order.orderStatus) ||
                                            (order.isGroupOrder && order.orderStatus === "Cancelled" && order.paymentStatus !== "refunded")) && <button type="button" className="student-text-button danger-text" disabled={loading} onClick={() => { if (window.confirm(order.orderStatus === "Cancelled" ? "Retry refunding any unpaid member shares?" : order.isGroupOrder ? "Cancel this group order? Each member's paid share will be refunded." : "Cancel this order?")) cancelOrder(order.orderId); }}>{order.orderStatus === "Cancelled" ? "Retry refunds" : "Cancel"}</button>}
                                    </div>
                                </div>
                            </article>
                        ))}
                    </section>
                )}
            </div>
        );
    };

    // =========================================================
    // WALLET
    // =========================================================

    const renderWallet = () => (
        <div className="student-content">
            <div className="student-page-heading">
                <div>
                    <span className="student-eyebrow">WALLET</span>
                    <h1>Your campus <span>balance.</span></h1>
                    <p>Top up once and keep checkout quick.</p>
                </div>
                <button
                    type="button"
                    className="student-secondary-action"
                    disabled={loading}
                    onClick={() => Promise.all([fetchWallet(), fetchWalletHistory()])}
                >
                    ↻ Refresh
                </button>
            </div>

            <div className="student-wallet-layout">
                <section className="student-wallet-card">
                    <div className="student-wallet-glow" />
                    <span>AVAILABLE BALANCE</span>
                    <strong>₹{getWalletAmount().toFixed(2)}</strong>
                    <p>Use your wallet for food and group order payments.</p>
                    <div className="student-wallet-card-footer">
                        <span>STUDENT WALLET</span>
                        <span>•••• 2026</span>
                    </div>
                </section>

                <section className="student-wallet-form">
                    <div>
                        <span className="student-eyebrow">TOP UP</span>
                        <h2>Add money</h2>
                        <p>Choose an amount or enter your own.</p>
                    </div>
                    <div className="student-topup-presets">
                        {[100, 250, 500, 1000].map((amount) => (
                            <button type="button" key={amount} className={Number(topupAmount) === amount ? "selected" : ""} onClick={() => setTopupAmount(String(amount))}>₹{amount}</button>
                        ))}
                    </div>
                    <label className="student-input-wrap">
                        <span>Amount</span>
                        <div><b>₹</b><input type="number" min="1" placeholder="Enter amount" value={topupAmount} onChange={(event) => setTopupAmount(event.target.value)} /></div>
                    </label>
                    <button type="button" className="student-primary-action" disabled={loading} onClick={topUpWallet}>
                        {loading ? "Adding…" : "Add to wallet →"}
                    </button>
                </section>
            </div>

            <section className="student-wallet-history">
                <div className="student-section-title-row">
                    <div>
                        <span className="student-eyebrow">WALLET ACTIVITY</span>
                        <h2>Transaction history</h2>
                        <p>Review top-ups, order payments, group shares and refunds.</p>
                    </div>
                    <span className="student-list-count">{walletHistory.length} {walletHistory.length === 1 ? "transaction" : "transactions"}</span>
                </div>

                {walletHistory.length === 0 ? (
                    <div className="student-group-empty">No wallet activity yet. Top-ups and payments will appear here.</div>
                ) : (
                    <div className="student-wallet-history-list">
                        {walletHistory.map((transaction) => {
                            const isCredit = ["topup", "refund"].includes(transaction.paymentMethod);
                            const labels = {
                                topup: "Wallet top-up",
                                wallet: "Order payment",
                                group_split: "Group share",
                                refund: "Order refund"
                            };
                            const reference = transaction.orderId?.orderId
                                ? `Order ${transaction.orderId.orderId}`
                                : transaction.groupCode
                                    ? `Group ${transaction.groupCode}`
                                    : "Wallet";

                            return (
                                <article className="student-wallet-history-item" key={transaction._id || transaction.transactionId}>
                                    <span className={`student-wallet-history-icon ${isCredit ? "credit" : "debit"}`}>
                                        {isCredit ? "↓" : "↑"}
                                    </span>
                                    <div className="student-wallet-history-description">
                                        <strong>{labels[transaction.paymentMethod] || "Wallet transaction"}</strong>
                                        <small>{reference} · {new Date(transaction.timestamp).toLocaleString()}</small>
                                    </div>
                                    <strong className={`student-wallet-history-amount ${isCredit ? "credit" : "debit"}`}>
                                        {isCredit ? "+" : "−"}₹{Number(transaction.amount || 0).toFixed(2)}
                                    </strong>
                                </article>
                            );
                        })}
                    </div>
                )}
            </section>
        </div>
    );

    // =========================================================
    // GROUP ORDERS
    // =========================================================

    const renderGroups = () => {
        const groupItems = Array.isArray(group?.items) ? group.items : [];
        const groupMembers = Array.isArray(group?.members) ? group.members : [];
        const groupPayments = Array.isArray(group?.memberPayments) ? group.memberPayments : [];
        const groupPaymentsStarted = groupPayments.some((payment) => payment.paid);
        const paidMemberCount = groupPayments.filter((payment) => payment.paid || Number(payment.amount || 0) === 0).length;
        const currentUserKeys = new Set(
            [user?._id, user?.id, user?.userId]
                .filter(Boolean)
                .map(String)
        );
        const creatorUser = group?.createdBy;
        const creatorKeys = [
            creatorUser?._id,
            creatorUser?.id,
            creatorUser?.userId,
            creatorUser
        ].filter(Boolean).map(String);

        const currentPayment = group?.currentMemberPayment || (Array.isArray(group?.memberPayments)
            ? group.memberPayments.find((payment) => {
                const paymentUser = payment?.userId;
                const paymentKeys = [
                    paymentUser?._id,
                    paymentUser?.id,
                    paymentUser?.userId,
                    paymentUser
                ]
                    .filter(Boolean)
                    .map(String);

                return paymentKeys.some((key) => currentUserKeys.has(key));
            })
            : null);

        const pendingEntries = Object.entries(pendingGroupItems)
            .map(([menuId, quantity]) => ({
                menu: menu.find((item) => String(getMenuId(item)) === String(menuId)),
                menuId,
                quantity: Number(quantity)
            }))
            .filter((entry) => entry.menu && entry.quantity > 0);

        const pendingTotal = pendingEntries.reduce(
            (total, entry) => total + (getMenuPrice(entry.menu) * entry.quantity),
            0
        );

        return (
            <div className="student-content">
                <div className="student-page-heading">
                    <div>
                        <span className="student-eyebrow">GROUP ORDER</span>
                        <h1>Eat together, <span>easily.</span></h1>
                        <p>Everyone adds their own items. Any member can place the order, then each person pays their share.</p>
                    </div>
                </div>

                <section className="student-group-start">
                    <div className="student-group-start-card create">
                        <div className="student-feature-icon">＋</div>
                        <div>
                            <h2>Create a group</h2>
                            <p>Give your shared order a name and invite your friends.</p>
                        </div>
                        <input
                            className="student-group-create-input"
                            value={groupNameInput}
                            onChange={(event) => setGroupNameInput(event.target.value)}
                            placeholder="e.g. Friday Lunch"
                            maxLength={60}
                        />
                        <button type="button" className="student-primary-action" disabled={loading} onClick={createGroup}>
                            Create group →
                        </button>
                    </div>

                    <div className="student-group-start-card join">
                        <div className="student-feature-icon">↗</div>
                        <div>
                            <h2>Join a group</h2>
                            <p>Already have a code? Jump straight into the shared basket.</p>
                        </div>
                        <div className="student-inline-action">
                            <input
                                value={groupCodeInput}
                                onChange={(event) => setGroupCodeInput(event.target.value.toUpperCase())}
                                placeholder="e.g. GRP1234"
                                maxLength="12"
                            />
                            <button type="button" className="student-primary-action" disabled={loading} onClick={joinGroup}>
                                Join →
                            </button>
                        </div>
                    </div>
                </section>

                <section className="student-groups-list-section">
                    <div className="student-section-title-row">
                        <div>
                            <span className="student-eyebrow">YOUR GROUPS</span>
                            <h2>Groups you belong to</h2>
                        </div>
                        <span className="student-list-count">{groups.length} {groups.length === 1 ? "group" : "groups"}</span>
                    </div>

                    {groups.length === 0 ? (
                        <div className="student-group-empty-list">
                            <span>♧</span>
                            <div>
                                <strong>No groups yet</strong>
                                <p>Create a group above or join one using a friend's code.</p>
                            </div>
                        </div>
                    ) : (
                        <div className="student-groups-list">
                            {groups.map((item) => {
                                const itemId = item._id || item.groupCode;
                                const memberCount = Array.isArray(item.members) ? item.members.length : 0;
                                const isActive = group?.groupCode === item.groupCode;

                                const itemCreator = item.createdBy;
                                const itemCreatorKeys = [
                                    itemCreator?._id,
                                    itemCreator?.id,
                                    itemCreator?.userId,
                                    itemCreator
                                ].filter(Boolean).map(String);
                                const isCreator = itemCreatorKeys.some((key) => currentUserKeys.has(key));

                                return (
                                    <div
                                        key={itemId}
                                        className={`student-group-list-item ${isActive ? "active" : ""}`}
                                    >
                                        <span className="student-group-list-icon">👥</span>
                                        <span className="student-group-list-item-main">
                                            <strong>{item.groupName || "Unnamed group"}</strong>
                                            <small>{memberCount} {memberCount === 1 ? "member" : "members"} · ₹{Number(item.totalAmount || 0).toFixed(2)}</small>
                                        </span>
                                        <button type="button" className="student-group-list-view" disabled={loading} onClick={() => selectGroup(item.groupCode)}>
                                            View details
                                        </button>
                                        {isCreator && (
                                            <button type="button" className="student-group-delete" disabled={loading} onClick={() => deleteGroup(item.groupCode)}>
                                                Delete
                                            </button>
                                        )}
                                        <span className="student-group-list-arrow">→</span>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </section>

                {group && groupDetailsOpen && (
                    <section className="student-group-workspace">
                        <div className="student-group-overview">
                            <div>
                                <span className="student-eyebrow">GROUP WORKSPACE</span>
                                <h2>{group.groupName || "Group order"}</h2>
                                <p>{groupMembers.length} {groupMembers.length === 1 ? "member" : "members"} · ₹{Number(group.totalAmount || 0).toFixed(2)} total</p>
                            </div>
                            <div className="student-group-overview-actions">
                                <button type="button" className="student-secondary-action" onClick={() => setGroupDetailsOpen(false)}>← Close</button>
                            </div>
                        </div>

                        <div className="student-group-details">
                            <div>
                                <span>JOIN CODE</span>
                                <div className="student-group-code-row">
                                    <strong>{group.groupCode}</strong>
                                    <button type="button" className="student-copy-button" onClick={copyGroupCode}>Copy</button>
                                </div>
                                <small>Share this code with friends.</small>
                            </div>
                            <div><span>MEMBERS</span><strong>{groupMembers.length}</strong><small>Students in this group.</small></div>
                        </div>

                        <div className="student-group-grid">
                            <div className="student-group-panel">
                                <div className="student-panel-heading">
                                    <div><span className="student-eyebrow">MEMBERS</span><h3>Who's in this group</h3></div>
                                </div>
                                <div className="student-group-members">
                                    {groupMembers.length === 0 ? (
                                        <div className="student-muted-copy">No members found.</div>
                                    ) : groupMembers.map((member) => (
                                        <div className="student-group-member" key={member._id || member.userId}>
                                            <span className="student-group-member-avatar">{member?.name?.charAt(0)?.toUpperCase() || "S"}</span>
                                            <div>
                                                <strong>{member.name || "Student"}{[member?._id, member?.id, member?.userId].filter(Boolean).map(String).some((key) => currentUserKeys.has(key) && creatorKeys.includes(key)) ? " · Creator" : ""}</strong>
                                                <small>
                                                    {member.email || member.userId || "Group member"}
                                                    {(() => {
                                                        const memberPayment = group.memberPayments?.find((payment) => {
                                                            const paymentUserId = payment.userId?._id || payment.userId;
                                                            return String(paymentUserId) === String(member._id || member.id);
                                                        });

                                                        return memberPayment
                                                            ? ` · ₹${Number(memberPayment.amount || 0).toFixed(2)} · ${memberPayment.paid ? "Paid" : "Unpaid"}`
                                                            : "";
                                                    })()}
                                                </small>
                                            </div>
                                        </div>
                                    ))}
                                </div>

                                <div className="student-panel-heading student-group-menu-heading">
                                    <div><span className="student-eyebrow">MENU</span><h3>Add to shared basket</h3></div>
                                </div>

                                {group.status === "Open" && !groupPaymentsStarted ? (
                                    <>
                                        <div className="student-group-menu">
                                            {menu.filter(isMenuAvailable).map((item) => {
                                                const menuId = getMenuId(item);
                                                const pendingQuantity = Number(pendingGroupItems[menuId] || 0);

                                                return (
                                                    <button type="button" key={menuId} disabled={loading} onClick={() => addGroupItem(menuId)} className={pendingQuantity > 0 ? "has-pending" : ""}>
                                                        <span>🍴</span>
                                                        <div><strong>{getMenuName(item)}</strong><small>₹{getMenuPrice(item).toFixed(2)}{pendingQuantity > 0 ? ` · ${pendingQuantity} pending` : ""}</small></div>
                                                        <b>+</b>
                                                    </button>
                                                );
                                            })}
                                        </div>

                                        {pendingEntries.length > 0 && (
                                            <div className="student-group-pending">
                                                <div className="student-group-pending-heading">
                                                    <div><span>READY TO ADD</span><strong>Confirm your selection</strong></div>
                                                    <b>₹{pendingTotal.toFixed(2)}</b>
                                                </div>
                                                <div className="student-group-pending-items">
                                                    {pendingEntries.map((entry) => (
                                                        <div key={entry.menuId} className="student-group-pending-item">
                                                            <div><strong>{getMenuName(entry.menu)}</strong><small>Qty {entry.quantity} · ₹{(getMenuPrice(entry.menu) * entry.quantity).toFixed(2)}</small></div>
                                                            <button type="button" disabled={loading} onClick={() => removePendingGroupItem(entry.menuId)}>−</button>
                                                        </div>
                                                    ))}
                                                </div>
                                                <button type="button" className="student-primary-action student-group-confirm" disabled={loading} onClick={confirmGroupItems}>
                                                    {loading ? "Confirming…" : "Confirm & add to group order →"}
                                                </button>
                                            </div>
                                        )}
                                    </>
                                ) : group.status === "Open" ? (
                                    <p className="student-muted-copy">The shared basket is locked because a member has paid. Other members can finish paying their equal shares.</p>
                                ) : (
                                    <p className="student-muted-copy">The shared basket is currently locked.</p>
                                )}

                                <div className="student-panel-heading student-group-items-heading">
                                    <div><span className="student-eyebrow">SHARED BASKET</span><h3>Current items</h3></div>
                                </div>

                                <div className="student-group-items">
                                    {groupItems.length === 0 ? (
                                        <div className="student-group-empty">No items yet. Add something tasty above.</div>
                                    ) : groupItems.map((item, index) => {
                                        const menuId = item.menuId?._id || item.menuId;
                                        const itemName = item.menuId?.name || item.name || "Menu item";
                                        const itemUserKeys = [item.userId?._id, item.userId?.id, item.userId?.userId, item.userId]
                                            .filter(Boolean)
                                            .map(String);
                                        const isOwnItem = itemUserKeys.some((key) => currentUserKeys.has(key));
                                        const itemTotal = Number(item.price || item.menuId?.price || 0) * Number(item.quantity || 0);

                                        return (
                                            <div className="student-group-item" key={`${menuId}-${index}`}>
                                                <span>🍽</span>
                                                <div><strong>{itemName}</strong><small>Qty {item.quantity} · ₹{itemTotal.toFixed(2)} · {item.userId?.name || "Member"}</small></div>
                                                {group.status === "Open" && !groupPaymentsStarted && isOwnItem && (
                                                    <button type="button" className="student-icon-button danger" disabled={loading} onClick={() => removeGroupItem(menuId)}>×</button>
                                                )}
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>

                            <div className="student-group-panel payment-panel">
                                <div className="student-panel-heading"><div><span className="student-eyebrow">PAYMENT</span><h3>Your share</h3></div></div>
                                <div className="student-group-total"><span>CURRENT ORDER TOTAL</span><strong>₹{Number(group.totalAmount || 0).toFixed(2)}</strong></div>
                                <div className="student-muted-copy">{paidMemberCount} of {groupMembers.length} members paid</div>
                                <div className="student-order-items-summary">
                                    {groupPayments.map((payment, index) => {
                                        const paymentUserId = payment.userId?._id || payment.userId;
                                        const member = groupMembers.find((candidate) =>
                                            String(candidate._id || candidate.id) === String(paymentUserId)
                                        );

                                        return (
                                            <div key={`${paymentUserId}-${index}`}>
                                                <span>{member?.name || "Group member"}</span>
                                                <strong>₹{Number(payment.amount || 0).toFixed(2)} · {payment.paid ? "Paid" : "Unpaid"}</strong>
                                            </div>
                                        );
                                    })}
                                </div>
                                {currentPayment ? (
                                    <div className="student-group-share">
                                        <span>YOUR SHARE</span>
                                        <strong>₹{Number(currentPayment.amount || 0).toFixed(2)}</strong>
                                        <small>
                                            {currentPayment.paid
                                                ? "Paid from your wallet"
                                                : `Equal split across ${groupMembers.length} ${groupMembers.length === 1 ? "member" : "members"}`}
                                        </small>
                                    </div>
                                ) : (
                                    <div className="student-group-share"><span>YOUR SHARE</span><strong>₹0.00</strong><small>Add and confirm your items above. Your payable share will appear here.</small></div>
                                )}
                                <button
                                    type="button"
                                    className="student-primary-action"
                                    disabled={loading || group.status !== "Open" || !currentPayment || currentPayment.paid || Number(currentPayment.amount || 0) <= 0}
                                    onClick={payGroupShare}
                                >
                                    {currentPayment?.paid
                                        ? "✓ Share paid"
                                        : `Pay ₹${Number(currentPayment?.amount || 0).toFixed(2)} share →`}
                                </button>
                            </div>
                        </div>

                        {(() => {
                            const selectedGroupOrders = Array.isArray(group.orders)
                                ? group.orders
                                : orders.filter((order) =>
                                    String(order?.groupCode || "").toUpperCase() === String(group.groupCode || "").toUpperCase()
                                );

                            return (
                                <section className="student-group-orders-section student-group-orders-inside">
                                    <div className="student-section-title-row">
                                        <div>
                                            <span className="student-eyebrow">GROUP ORDERS</span>
                                            <h2>{group.groupName || "Group order"} orders</h2>
                                            <p>Each order has its own total and member share breakdown.</p>
                                        </div>
                                        <span className="student-list-count">{selectedGroupOrders.length} {selectedGroupOrders.length === 1 ? "order" : "orders"}</span>
                                    </div>
                                    <div className="student-group-order-history">
                                        {selectedGroupOrders.length === 0 ? (
                                            <div className="student-group-empty">No orders have been placed by this group yet.</div>
                                        ) : selectedGroupOrders.map((order) => (
                                            <button
                                                type="button"
                                                className="student-group-order-history-item"
                                                key={order._id || order.orderId}
                                                onClick={() => {
                                                    setSelectedOrder(order);
                                                    setActiveSection("orders");
                                                }}
                                            >
                                                <span className="student-group-order-history-icon">👥</span>
                                                <span>
                                                    <strong>{order.orderId || "Group order"}</strong>
                                                    <small>{group.groupName || group.groupCode} · {order.orderStatus || "Received"} · {order.paymentStatus || "paid"}</small>
                                                    <small>
                                                        {(order.memberPayments || []).map((payment) =>
                                                            `${payment.userId?.name || "Member"}: ₹${Number(payment.amount || 0).toFixed(2)} (${payment.paid ? "paid" : "unpaid"})`
                                                        ).join(" · ") || "No share breakdown available"}
                                                    </small>
                                                </span>
                                                <b>₹{Number(order.totalAmount || 0).toFixed(2)}</b>
                                                <span>→</span>
                                            </button>
                                        ))}
                                    </div>
                                </section>
                            );
                        })()}

                        {group.status === "PaymentPending" && !group.orderId && groupItems.length > 0 && (
                            <section className="student-group-finalize">
                                <div className="student-section-title-row"><div><span className="student-eyebrow">ALL SHARES PAID</span><h2>Place the group order</h2><p>All members have paid. Any group member can select a pickup time and place the order.</p></div></div>
                                {renderPickupSlots({ selectedSlot: selectedGroupPickupSlot, onSelect: setSelectedGroupPickupSlot, title: "Group pickup slot", subtitle: "Everyone will use this pickup window." })}
                                <button type="button" className="student-primary-action" disabled={loading || !selectedGroupPickupSlot} onClick={finalizeGroup}>Place group order →</button>
                            </section>
                        )}

                        {group.orderId && (
                            <div className="student-group-success">
                                <span>✓</span>
                                <div><strong>Group order placed</strong><p>Order ID <b>{group.orderId}</b> · Your pickup is booked.</p></div>
                                <button type="button" className="student-text-button" onClick={() => setActiveSection("orders")}>Track order →</button>
                            </div>
                        )}
                    </section>
                )}
            </div>
        );
    };

    // =========================================================
    // PROFILE
    // =========================================================

    const renderProfile = () => (
        <div className="student-content">
            <div className="student-page-heading">
                <div>
                    <span className="student-eyebrow">PROFILE</span>
                    <h1>Your student <span>account.</span></h1>
                    <p>Your account details used by CanteenQueue.</p>
                </div>
            </div>

            <section className="student-profile-card">
                <div className="student-profile-top">
                    <div className="student-profile-avatar">{user?.name?.charAt(0)?.toUpperCase() || "S"}</div>
                    <div>
                        <span className="student-eyebrow">SIGNED IN</span>
                        <h2>{user?.name || "Student"}</h2>
                        <p>{user?.email || ""}</p>
                    </div>
                    <span className="student-role-pill">{String(user?.role || "student").toUpperCase()}</span>
                </div>
                {profileEditing ? (
                    <form className="student-profile-edit-form" onSubmit={saveProfile}>
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
                        <div className="student-profile-edit-actions">
                            <button type="submit" className="student-primary-action" disabled={loading}>
                                {loading ? "Saving…" : "Save changes"}
                            </button>
                            <button type="button" className="student-secondary-action" disabled={loading} onClick={() => setProfileEditing(false)}>
                                Cancel
                            </button>
                        </div>
                    </form>
                ) : (
                    <>
                        <div className="student-profile-grid">
                            <div><span>NAME</span><strong>{user?.name || "—"}</strong></div>
                            <div><span>USER ID</span><strong>{user?.userId || "—"}</strong></div>
                            <div><span>EMAIL</span><strong>{user?.email || "—"}</strong></div>
                            <div><span>PHONE</span><strong>{user?.phone_no || "—"}</strong></div>
                            <div><span>ROLE</span><strong>{user?.role || "student"}</strong></div>
                        </div>
                        <button type="button" className="student-primary-action student-profile-edit-button" onClick={startProfileEditing}>
                            Edit profile
                        </button>
                    </>
                )}
            </section>

        </div>
    );

    // =========================================================
    // SECTION SWITCH
    // =========================================================

    const renderSection = () => {
        switch (activeSection) {
            case "home":
                return renderHome();

            case "order":
                return renderOrderFood();

            case "cart":
                return renderCart();

            case "orders":
                return renderOrders();

            case "groups":
                return renderGroups();

            case "wallet":
                return renderWallet();

            case "profile":
                return renderProfile();

            default:
                return renderHome();
        }
    };

    // =========================================================
    // ACCESS GUARD + MAIN UI
    // =========================================================

    if (authLoading) {
        return (
            <div className="student-access-loading">
                <div className="student-loading-orb">🍜</div>
                <strong>Opening your canteen dashboard…</strong>
                <span>Checking your student session</span>
            </div>
        );
    }

    if (!user) {
        return <Navigate to="/login" replace />;
    }

    if (String(user.role || "").toLowerCase() !== "student") {
        return <Navigate to="/" replace />;
    }

    return (
        <div className="student-app">

            <StudentSidebar
                activeSection={
                    activeSection
                }
                setActiveSection={
                    setActiveSection
                }
            />

            <main className="student-main">

                {success && (
                    <div className="student-toast success">
                        {success}
                    </div>
                )}

                {error && (
                    <div className="student-toast error">
                        {error}
                    </div>
                )}

                {renderSection()}

            </main>

        </div>
    );
}

export default StudentDashboard;