const WalletCard = ({ balance, name }) => {
    return (
        <div className="wallet-card">
            <div className="wallet-card-top">
                <div>
                    <p className="wallet-label">Available Balance</p>

                    <h1>
                        ₹ {Number(balance || 0).toFixed(2)}
                    </h1>
                </div>

                <div className="wallet-icon">
                    ₹
                </div>
            </div>

            <div className="wallet-user">
                <span>Wallet Holder</span>
                <strong>{name || "Student"}</strong>
            </div>
        </div>
    );
};

export default WalletCard;