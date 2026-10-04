import { useAuth } from "../context/AuthContext";
import "../styles/components/StudentSidebar.css";

function StudentSidebar({ activeSection, setActiveSection }) {
    const { user, logout } = useAuth();

    const menuItems = [
        {
            id: "home",
            icon: "⌂",
            label: "Home"
        },
        {
            id: "order",
            icon: "🍽",
            label: "Order Food"
        },
        {
            id: "cart",
            icon: "🛒",
            label: "Cart"
        },
        {
            id: "orders",
            icon: "▣",
            label: "My Orders"
        },
        {
            id: "groups",
            icon: "♧",
            label: "Groups"
        },
        {
            id: "wallet",
            icon: "₹",
            label: "Wallet"
        },
        {
            id: "profile",
            icon: "◯",
            label: "Profile"
        }
    ];

    return (
        <aside className="student-sidebar">

            <div className="student-sidebar-top">

                {/* Brand */}
                <div className="student-sidebar-brand">
                    <div className="student-sidebar-logo">
                        <img
                            src="/src/assets/logo.png"
                            alt="CanteenQueue"
                        />
                    </div>

                    <div>
                        <h2>CanteenQueue</h2>
                        <span>Student</span>
                    </div>
                </div>

                {/* Navigation */}
                <nav className="student-sidebar-nav">

                    {menuItems.map((item) => (
                        <button
                            key={item.id}
                            className={`student-nav-item ${
                                activeSection === item.id ? "active" : ""
                            }`}
                            onClick={() => setActiveSection(item.id)}
                        >
                            <span className="student-nav-icon">
                                {item.icon}
                            </span>

                            <span className="student-nav-label">
                                {item.label}
                            </span>
                        </button>
                    ))}

                </nav>

            </div>

            {/* Bottom user area */}
            <div className="student-sidebar-bottom">

                <div className="student-sidebar-user">

                    <div className="student-user-avatar">
                        {user?.name?.charAt(0)?.toUpperCase() || "S"}
                    </div>

                    <div className="student-user-info">
                        <strong>
                            {user?.name || "Student"}
                        </strong>

                        <span>
                            {user?.email || ""}
                        </span>
                    </div>

                </div>

                <button
                    className="student-logout"
                    onClick={logout}
                >
                    Logout
                </button>

            </div>

        </aside>
    );
}

export default StudentSidebar;