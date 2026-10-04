import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { registerUser } from "../services/authService";
import "../styles/pages/Auth.css";

const Register = () => {
    const navigate = useNavigate();

    const [formData, setFormData] = useState({
        userId: "",
        name: "",
        email: "",
        password: "",
        phone_no: "",
        role: "student",
    });

    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);

    const handleChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value,
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        setError("");

        if (
            !formData.userId ||
            !formData.name ||
            !formData.email ||
            !formData.password
        ) {
            setError("Please fill all required fields.");
            return;
        }

        try {
            setLoading(true);

            const data = await registerUser(formData);

            if (data.success) {
                navigate("/login");
            } else {
                setError(
                    data.message || "Registration failed."
                );
            }

        } catch (error) {
            setError(
                error.response?.data?.message ||
                "Unable to connect to server."
            );
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="auth-page">

            <div className="auth-card">

                <div className="auth-header">
                    <h1>Create account 🍴</h1>

                    <p>
                        Join CanteenQueue today
                    </p>
                </div>

                {error && (
                    <div className="auth-error">
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit}>

                    <div className="form-group">
                        <label>{formData.role === "staff" ? "Staff ID *" : "Student ID *"}</label>

                        <input
                            name="userId"
                            placeholder="e.g. 23CS101"
                            value={formData.userId}
                            onChange={handleChange}
                        />
                    </div>

                    <div className="form-group">
                        <label>Name *</label>

                        <input
                            name="name"
                            placeholder="Your full name"
                            value={formData.name}
                            onChange={handleChange}
                        />
                    </div>

                    <div className="form-group">
                        <label>Email *</label>

                        <input
                            type="email"
                            name="email"
                            placeholder="you@example.com"
                            value={formData.email}
                            onChange={handleChange}
                        />
                    </div>

                    <div className="form-group">
                        <label>Phone</label>

                        <input
                            type="tel"
                            name="phone_no"
                            placeholder="Your phone number"
                            value={formData.phone_no}
                            onChange={handleChange}
                        />
                    </div>

                    <div className="form-group">
                        <label htmlFor="role">Account type *</label>
                        <select
                            id="role"
                            name="role"
                            value={formData.role}
                            onChange={handleChange}
                        >
                            <option value="student">Student</option>
                            <option value="staff">Staff</option>
                        </select>
                    </div>

                    <div className="form-group">
                        <label>Password *</label>

                        <input
                            type="password"
                            name="password"
                            placeholder="Create a password"
                            value={formData.password}
                            onChange={handleChange}
                        />
                    </div>

                    <button
                        type="submit"
                        className="auth-button"
                        disabled={loading}
                    >
                        {loading
                            ? "Creating account..."
                            : "Create Account"}
                    </button>

                </form>

                <p className="auth-footer">
                    Already have an account?{" "}
                    <Link to="/login">
                        Login
                    </Link>
                </p>

            </div>

        </div>
    );
};

export default Register;