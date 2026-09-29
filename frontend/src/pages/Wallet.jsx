import { useEffect, useState } from "react";
import api from "../services/api";
import WalletCard from "../components/WalletCard";
import "./Wallet.css";
const Wallet = () => {
    const [wallet, setWallet] = useState(0);
    const [name, setName] = useState("");

    const [amount, setAmount] = useState("");
    const [orderId, setOrderId] = useState("");

    const [loading, setLoading] = useState(true);
    const [message, setMessage] = useState("");
    const [error, setError] = useState("");

    // Get wallet balance
    const loadWallet = async () => {
        try {
            setLoading(true);
            setError("");

            const response = await api.get("/wallet");

            setWallet(response.data.data.wallet);
            setName(response.data.data.name);

        } catch (error) {
            console.error("Wallet error:", error);

            setError(
                error.response?.data?.message ||
                "Unable to load wallet."
            );

        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadWallet();
    }, []);

    // Add money
    const handleTopUp = async (e) => {
        e.preventDefault();

        setMessage("");
        setError("");

        const numericAmount = Number(amount);

        if (!numericAmount || numericAmount <= 0) {
            setError("Please enter a valid amount.");
            return;
        }

        try {
            const response = await api.post("/wallet/topup", {
                amount: numericAmount
            });

            setWallet(response.data.data.wallet);
            setAmount("");

            setMessage(
                `₹${numericAmount} added to your wallet successfully!`
            );

        } catch (error) {
            console.error("Top-up error:", error);

            setError(
                error.response?.data?.message ||
                "Unable to add money."
            );
        }
    };

    // Pay from wallet
    const handlePayment = async () => {
        setMessage("");
        setError("");

        if (!orderId.trim()) {
            setError("Please enter an Order ID.");
            return;
        }

        try {
            const response = await api.post("/wallet/pay", {
                orderId: orderId.trim()
            });

            setWallet(response.data.data.remainingBalance);

            setMessage(
                `Payment successful for ${response.data.data.orderId}.`
            );

            setOrderId("");

        } catch (error) {
            console.error("Payment error:", error);

            setError(
                error.response?.data?.message ||
                "Unable to process payment."
            );
        }
    };

    // Refund
    const handleRefund = async () => {
        setMessage("");
        setError("");

        if (!orderId.trim()) {
            setError("Please enter an Order ID.");
            return;
        }

        try {
            const response = await api.post("/wallet/refund", {
                orderId: orderId.trim()
            });

            setWallet(response.data.data.walletBalance);

            setMessage(
                `Refund of ₹${response.data.data.refundAmount} added to your wallet.`
            );

            setOrderId("");

        } catch (error) {
            console.error("Refund error:", error);

            setError(
                error.response?.data?.message ||
                "Unable to process refund."
            );
        }
    };

    if (loading) {
        return (
            <div className="wallet-loading">
                Loading your wallet...
            </div>
        );
    }

    return (
        <div className="wallet-page">

            <div className="wallet-container">

                {/* Heading */}

                <div className="wallet-heading">

                    <p className="wallet-eyebrow">
                        CanteenQueue Wallet
                    </p>

                    <h1>
                        Your money,
                        <span> your way.</span>
                    </h1>

                    <p>
                        Pay for your campus meals quickly and
                        manage your refunds in one place.
                    </p>

                </div>


                {/* Error */}

                {error && (
                    <div className="wallet-message error">
                        {error}
                    </div>
                )}


                {/* Success */}

                {message && (
                    <div className="wallet-message success">
                        {message}
                    </div>
                )}


                {/* Wallet balance */}

                <WalletCard
                    balance={wallet}
                    name={name}
                />


                <div className="wallet-grid">

                    {/* ADD MONEY */}

                    <div className="wallet-section">

                        <div className="section-icon">
                            +
                        </div>

                        <h2>Add Money</h2>

                        <p>
                            Add money to your CanteenQueue wallet
                            for faster checkout.
                        </p>

                        <form onSubmit={handleTopUp}>

                            <label>
                                Amount
                            </label>

                            <div className="amount-input">

                                <span>₹</span>

                                <input
                                    type="number"
                                    min="1"
                                    placeholder="Enter amount"
                                    value={amount}
                                    onChange={(e) =>
                                        setAmount(e.target.value)
                                    }
                                />

                            </div>

                            <div className="quick-amounts">

                                {[100, 200, 500].map((value) => (
                                    <button
                                        type="button"
                                        key={value}
                                        onClick={() =>
                                            setAmount(String(value))
                                        }
                                    >
                                        ₹{value}
                                    </button>
                                ))}

                            </div>

                            <button
                                type="submit"
                                className="primary-button"
                            >
                                Add Money
                            </button>

                        </form>

                    </div>


                    {/* PAY FOR ORDER */}

                    <div className="wallet-section">

                        <div className="section-icon pay">
                            →
                        </div>

                        <h2>Pay for Order</h2>

                        <p>
                            Use your wallet balance to pay for
                            an existing canteen order.
                        </p>

                        <label>
                            Order ID
                        </label>

                        <input
                            className="normal-input"
                            type="text"
                            placeholder="Example: ORD003"
                            value={orderId}
                            onChange={(e) =>
                                setOrderId(e.target.value)
                            }
                        />

                        <button
                            className="primary-button"
                            onClick={handlePayment}
                        >
                            Pay from Wallet
                        </button>

                    </div>


                    {/* REFUND */}

                    <div className="wallet-section refund-section">

                        <div className="section-icon refund">
                            ↩
                        </div>

                        <h2>Get a Refund</h2>

                        <p>
                            If a paid order was cancelled, its
                            amount can be returned to your wallet.
                        </p>

                        <label>
                            Cancelled Order ID
                        </label>

                        <input
                            className="normal-input"
                            type="text"
                            placeholder="Example: ORD003"
                            value={orderId}
                            onChange={(e) =>
                                setOrderId(e.target.value)
                            }
                        />

                        <button
                            className="secondary-button"
                            onClick={handleRefund}
                        >
                            Refund to Wallet
                        </button>

                    </div>

                </div>

            </div>

        </div>
    );
};

export default Wallet;