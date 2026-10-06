import { useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import logo from "../assets/logo.png";
import "../styles/components/AdminSidebar.css";

function AdminSidebar() {
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();

    const menuItems = [
        {
            id: "dashboard",
            label: "Dashboard",
            path: "/admin",
            icon: (
                <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
                    <rect
                        x="4"
                        y="4"
                        width="6"
                        height="6"
                        rx="1.2"
                        stroke="currentColor"
                        strokeWidth="1.8"
                    />
                    <rect
                        x="14"
                        y="4"
                        width="6"
                        height="6"
                        rx="1.2"
                        stroke="currentColor"
                        strokeWidth="1.8"
                    />
                    <rect
                        x="4"
                        y="14"
                        width="6"
                        height="6"
                        rx="1.2"
                        stroke="currentColor"
                        strokeWidth="1.8"
                    />
                    <rect
                        x="14"
                        y="14"
                        width="6"
                        height="6"
                        rx="1.2"
                        stroke="currentColor"
                        strokeWidth="1.8"
                    />
                </svg>
            ),
        },
        {
            id: "inventory",
            label: "Inventory",
            path: "/admin/inventory",
            icon: (
                <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
                    <path
                        d="m12 3 8 4.5v9L12 21l-8-4.5v-9L12 3Z"
                        stroke="currentColor"
                        strokeWidth="1.8"
                        strokeLinejoin="round"
                    />
                    <path
                        d="m4.5 7.8 7.5 4.4 7.5-4.4M12 12.2V21"
                        stroke="currentColor"
                        strokeWidth="1.8"
                        strokeLinejoin="round"
                    />
                </svg>
            ),
        },
        {
            id: "menu",
            label: "Menu Management",
            path: "/admin/menu",
            icon: (
                <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
                    <path
                        d="M4 7h16M4 12h16M4 17h10"
                        stroke="currentColor"
                        strokeWidth="1.8"
                        strokeLinecap="round"
                    />
                    <circle
                        cx="18"
                        cy="17"
                        r="2"
                        stroke="currentColor"
                        strokeWidth="1.8"
                    />
                </svg>
            ),
        },
        {
            id: "analytics",
            label: "Sales Analytics",
            path: "/admin/analytics",
            icon: (
                <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
                    <path
                        d="M5 19V10M12 19V5M19 19v-7"
                        stroke="currentColor"
                        strokeWidth="1.8"
                        strokeLinecap="round"
                    />
                    <path
                        d="M3 19h18"
                        stroke="currentColor"
                        strokeWidth="1.8"
                        strokeLinecap="round"
                    />
                </svg>
            ),
        },
    ];

    const isActive = (path) => {
        if (path === "/admin") {
            return (
                location.pathname === "/admin" ||
                location.pathname === "/admin/"
            );
        }

        return location.pathname.startsWith(path);
    };

    const handleLogout = () => {
        logout();
        navigate("/login");
    };

    return (
        <aside className="admin-sidebar">
            <button
                type="button"
                className="admin-sidebar-brand"
                onClick={() => navigate("/admin")}
                aria-label="CanteenQueue Admin Dashboard"
            >
                <img src={logo} alt="CanteenQueue" />

                <span className="admin-sidebar-brand-copy">
                    <strong>
                        Canteen<span>Queue</span>
                    </strong>

                    <small>ADMIN WORKSPACE</small>
                </span>
            </button>

            <div className="admin-sidebar-label">
                WORKSPACE
            </div>

            <nav
                className="admin-sidebar-nav"
                aria-label="Admin navigation"
            >
                {menuItems.map((item) => (
                    <button
                        key={item.id}
                        type="button"
                        className={`admin-sidebar-nav-link ${
                            isActive(item.path) ? "active" : ""
                        }`}
                        onClick={() => navigate(item.path)}
                    >
                        <span className="admin-sidebar-nav-icon">
                            {item.icon}
                        </span>

                        <span className="admin-sidebar-nav-text">
                            {item.label}
                        </span>

                        <span className="admin-sidebar-nav-arrow">
                            ›
                        </span>
                    </button>
                ))}
            </nav>

            <div className="admin-sidebar-spacer" />

            <div className="admin-sidebar-user">
                <div className="admin-sidebar-avatar">
                    {(user?.name || "A")
                        .trim()
                        .charAt(0)
                        .toUpperCase()}
                </div>

                <div className="admin-sidebar-user-info">
                    <strong>
                        {user?.name || "Admin"}
                    </strong>

                    <span>
                        Administrator
                    </span>
                </div>
            </div>

            <button
                type="button"
                className="admin-sidebar-logout"
                onClick={handleLogout}
            >
                <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    aria-hidden="true"
                >
                    <path
                        d="M10 17l5-5-5-5M15 12H3m9-7h6a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2h-6"
                        stroke="currentColor"
                        strokeWidth="1.8"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                    />
                </svg>

                Logout
            </button>
        </aside>
    );
}

export default AdminSidebar;