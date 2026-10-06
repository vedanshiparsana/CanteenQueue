import { Routes, Route } from "react-router-dom";

import Home from "./pages/Home";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Wallet from "./pages/Wallet";
import AdminDashboard from "./pages/AdminDashboard";
import MenuManagement from "./pages/MenuManagement";
import Inventory from "./pages/Inventory";
import InventoryAlerts from "./pages/InventoryAlerts";
import InventoryForm from "./pages/InventoryForm";
import MenuItemForm from "./pages/menuitemForm";
import SalesAnalytics from "./pages/SalesAnalytics";
import PickupSlotManagement from "./pages/PickupSlotManagement";
import ProtectedRoute from "./components/ProtectedRoute";
import StudentDashboard from "./pages/StudentDashboard";
import StaffDashboard from "./pages/StaffDashboard";

function App() {
    return (
        <Routes>
            <Route path="/" element={<Home />} />

            <Route path="/login" element={<Login />} />

            <Route path="/register" element={<Register />} />

            <Route
                path="/student"
                element={
                    <ProtectedRoute>
                        <StudentDashboard />
                    </ProtectedRoute>
                }
            />

            <Route
                path="/staff"
                element={
                    <ProtectedRoute>
                        <StaffDashboard />
                    </ProtectedRoute>
                }
            />

            <Route
                path="/wallet"
                element={
                    <ProtectedRoute>
                        <Wallet />
                    </ProtectedRoute>
                }
            />

            <Route
                path="/admin"
                element={
                    <ProtectedRoute>
                        <AdminDashboard />
                    </ProtectedRoute>
                }
            />

            <Route
                path="/admin/menu"
                element={
                    <ProtectedRoute>
                        <MenuManagement />
                    </ProtectedRoute>
                }
            />

            <Route
                path="/admin/menu/add"
                element={
                    <ProtectedRoute>
                        <MenuItemForm />
                    </ProtectedRoute>
                }
            />

            <Route
                path="/admin/menu/edit/:menuId"
                element={
                    <ProtectedRoute>
                        <MenuItemForm />
                    </ProtectedRoute>
                }
            />

            <Route
                path="/admin/inventory"
                element={
                    <ProtectedRoute>
                        <Inventory />
                    </ProtectedRoute>
                }
            />

            <Route
                path="/admin/inventory/add"
                element={
                    <ProtectedRoute>
                        <InventoryForm />
                    </ProtectedRoute>
                }
            />

            <Route
                path="/admin/inventory/edit/:itemId"
                element={
                    <ProtectedRoute>
                        <InventoryForm />
                    </ProtectedRoute>
                }
            />

            <Route
                path="/admin/alerts"
                element={
                    <ProtectedRoute>
                        <InventoryAlerts />
                    </ProtectedRoute>
                }
            />

            <Route
                path="/admin/analytics"
                element={
                    <ProtectedRoute>
                        <SalesAnalytics />
                    </ProtectedRoute>
                }
            />

            <Route
                path="/admin/pickup-slots"
                element={
                    <ProtectedRoute>
                        <PickupSlotManagement />
                    </ProtectedRoute>
                }
            />
        </Routes>
    );
}

export default App;