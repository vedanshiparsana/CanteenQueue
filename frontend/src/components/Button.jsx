import "../styles/components/Button.css";
function Button({
    children,
    variant = "primary",
    type = "button",
    onClick,
    disabled = false
}) {
    return (
        <button
            type={type}
            className={`cq-button cq-button-${variant}`}
            onClick={onClick}
            disabled={disabled}
        >
            {children}
        </button>
    );
}

export default Button;