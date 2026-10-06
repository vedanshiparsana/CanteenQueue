import { useNavigate } from "react-router-dom";
import Button from "../components/Button";
import logo from "../assets/logo.png";
import "../styles/pages/Home.css";
import "../styles/components/Navbar.css";
import "../styles/components/Footer.css";

function Home() {
    const navigate = useNavigate();
    const loginForSection = (section) => {
        navigate("/login", {
            state: {
                returnTo: {
                    section
                }
            }
        });
    };

    return (
        <div className="home-page">

            {/* NAVBAR */}

            <nav className="home-navbar">
                <div className="page-container navbar-content">

                    <a href="/" className="brand">
                        <div className="brand-logo">
                            <img src={logo} alt="CanteenQueue logo" />
                        </div>

                        <div className="brand-text">
                            <div className="brand-name">
                                Canteen<span>Queue</span>
                            </div>

                            <div className="brand-tagline">
                                Campus food, simplified.
                            </div>
                        </div>
                    </a>


                    <div className="nav-links">
                        <a href="#menu">Menu</a>
                        <a href="#how-it-works">How it works</a>
                        <a href="#group-order">Group order</a>
                    </div>


                    <div className="navbar-actions">
                        <button className="nav-login" onClick={() => navigate("/login")}>
                            Sign in
                        </button>

                        <Button onClick={() => navigate("/register")}>
                            Get started →
                        </Button>
                    </div>

                </div>
            </nav>


            <main>

                {/* HERO */}

                <section className="hero">
                    <div className="page-container hero-content">

                        <div className="hero-text">

                            <div className="hero-badge">
                                <span className="status-dot"></span>
                                Made for campus life
                            </div>

                            <h1>
                                Good food.
                                <br />
                                <span>Less waiting.</span>
                            </h1>

                            <p>
                                Your college canteen, right at your fingertips.
                                Order ahead, skip the queue and spend your break
                                doing what actually matters.
                            </p>

                            <div className="hero-actions">

                                <Button onClick={() => {document.getElementById("menu")?.scrollIntoView({behavior: "smooth"});}}>
                                    Explore the menu →
                                </Button>

                                <a
                                    href="#how-it-works"
                                    className="text-button"
                                >
                                    See how it works
                                    <span>↓</span>
                                </a>

                            </div>


                            <div className="hero-trust">

                                <div className="avatar-stack">
                                    <span>R</span>
                                    <span>H</span>
                                    <span>J</span>
                                    <span>+</span>
                                </div>

                                <div>
                                    <strong>Made for students</strong>
                                    <span>Built around campus life</span>
                                </div>

                            </div>

                        </div>


                        <div className="hero-visual">

                            <div className="hero-circle"></div>

                            <div className="food-card">

                                <div className="food-image">

                                    <div className="food-pattern"></div>

                                    <div className="food-illustration">
                                        🍜
                                    </div>

                                    <div className="popular-badge">
                                        ★ Popular today
                                    </div>

                                </div>


                                <div className="food-info">

                                    <div>
                                        <span className="food-category">
                                            CAMPUS FAVOURITE
                                        </span>

                                        <h3>
                                            Masala Noodles
                                        </h3>
                                    </div>

                                    <div className="food-price">
                                        ₹70
                                    </div>

                                </div>


                                <div className="food-footer">
                                    <span>Freshly prepared</span>
                                    <span>•</span>
                                    <span>~10 min</span>
                                </div>

                            </div>


                            <div className="floating-order-card">

                                <div className="order-icon">
                                    ✓
                                </div>

                                <div>
                                    <strong>Order ready!</strong>
                                    <span>Pickup counter 02</span>
                                </div>

                            </div>


                            <div className="floating-time-card">
                                <span className="time-icon">⚡</span>

                                <div>
                                    <strong>10 min</strong>
                                    <span>average pickup</span>
                                </div>
                            </div>

                        </div>

                    </div>
                </section>


                {/* QUICK STATS */}

                <section className="stats-section">

                    <div className="page-container stats-grid">

                        <div className="stat">
                            <strong>10<span>min</span></strong>
                            <p>Average pickup time</p>
                        </div>

                        <div className="stat">
                            <strong>24<span>+</span></strong>
                            <p>Meals &amp; snacks</p>
                        </div>

                        <div className="stat">
                            <strong>3</strong>
                            <p>Campus counters</p>
                        </div>

                        <div className="stat">
                            <strong>1</strong>
                            <p>Simple experience</p>
                        </div>

                    </div>

                </section>


                {/* MENU PREVIEW */}

                <section
                    className="menu-section"
                    id="menu"
                >

                    <div className="page-container">

                        <div className="section-heading">

                            <div>
                                <span className="eyebrow">
                                    TODAY AT THE CANTEEN
                                </span>

                                <h2 className="section-title">
                                    Something good is
                                    <br />
                                    <span>waiting for you.</span>
                                </h2>
                            </div>

                            <a href="#menu" className="view-all">
                                View full menu →
                            </a>

                        </div>


                        <div className="category-row">

                            <button className="category active">
                                All
                            </button>

                            <button className="category">
                                Breakfast
                            </button>

                            <button className="category">
                                Meals
                            </button>

                            <button className="category">
                                Snacks
                            </button>

                            <button className="category">
                                Drinks
                            </button>

                            <button className="category">
                                Desserts
                            </button>

                        </div>


                        <div className="menu-grid">

                            <div className="menu-card featured-food">

                                <div className="menu-image">
                                    <span>🍛</span>

                                    <div className="food-label">
                                        Student favourite
                                    </div>
                                </div>

                                <div className="menu-details">
                                    <div>
                                        <h3>Paneer Rice Bowl</h3>
                                        <p>Comfort food • Filling</p>
                                    </div>

                                    <strong>₹120</strong>
                                </div>

                                <button className="add-button">
                                    +
                                </button>

                            </div>


                            <div className="menu-card">

                                <div className="menu-image image-two">
                                    <span>🌯</span>
                                </div>

                                <div className="menu-details">
                                    <div>
                                        <h3>Paneer Frankie</h3>
                                        <p>Spicy • Fresh</p>
                                    </div>

                                    <strong>₹80</strong>
                                </div>

                                <button className="add-button">
                                    +
                                </button>

                            </div>


                            <div className="menu-card">

                                <div className="menu-image image-three">
                                    <span>🥪</span>
                                </div>

                                <div className="menu-details">
                                    <div>
                                        <h3>Veg Sandwich</h3>
                                        <p>Crispy • Quick</p>
                                    </div>

                                    <strong>₹65</strong>
                                </div>

                                <button className="add-button">
                                    +
                                </button>

                            </div>


                            <div className="menu-card">

                                <div className="menu-image image-four">
                                    <span>🥤</span>
                                </div>

                                <div className="menu-details">
                                    <div>
                                        <h3>Cold Coffee</h3>
                                        <p>Chilled • Creamy</p>
                                    </div>

                                    <strong>₹50</strong>
                                </div>

                                <button className="add-button">
                                    +
                                </button>

                            </div>

                        </div>

                    </div>

                </section>


                {/* HOW IT WORKS */}

                <section
                    className="steps-section"
                    id="how-it-works"
                >

                    <div className="page-container">

                        <div className="steps-intro">

                            <span className="eyebrow">
                                SIMPLE BY DESIGN
                            </span>

                            <h2 className="section-title">
                                From hungry to
                                <br />
                                <span>happy in three steps.</span>
                            </h2>

                        </div>


                        <div className="steps-grid">

                            <div className="step-card">

                                <div className="step-top">
                                    <span>01</span>
                                    <div className="step-icon">🔎</div>
                                </div>

                                <h3>Find your food</h3>

                                <p>
                                    Browse the canteen menu and discover
                                    what's available right now.
                                </p>

                            </div>


                            <div className="step-card highlighted-step">

                                <div className="step-top">
                                    <span>02</span>
                                    <div className="step-icon">🛒</div>
                                </div>

                                <h3>Place your order</h3>

                                <p>
                                    Add your favourites, choose a pickup
                                    slot and pay from your wallet.
                                </p>

                            </div>


                            <div className="step-card">

                                <div className="step-top">
                                    <span>03</span>
                                    <div className="step-icon">⚡</div>
                                </div>

                                <h3>Pick it up</h3>

                                <p>
                                    Get notified when your food is ready
                                    and collect it without the long wait.
                                </p>

                            </div>

                        </div>

                    </div>

                </section>


                {/* GROUP ORDER */}

                <section
                    className="group-section"
                    id="group-order"
                >

                    <div className="page-container group-container">

                        <div className="group-copy">

                            <span className="eyebrow">
                                BETTER WITH FRIENDS
                            </span>

                            <h2 className="section-title">
                                Lunch plans?
                                <br />
                                <span>Order together.</span>
                            </h2>

                            <p>
                                Create a group order, invite your friends,
                                let everyone add their own food and split
                                the payment from their own wallet.
                            </p>

                            <Button variant="secondary" onClick={() => loginForSection("groups")}>
                                Start a group order →
                            </Button>

                        </div>


                        <div className="group-visual">

                            <div className="group-card">

                                <div className="group-card-header">

                                    <div>
                                        <span>GROUP ORDER</span>
                                        <h3>Friday Lunch</h3>
                                    </div>

                                    <div className="group-code">
                                        CQ-7F4K
                                    </div>

                                </div>


                                <div className="members">

                                    <div className="member">
                                        <span className="member-avatar avatar-one">
                                            R
                                        </span>

                                        <div>
                                            <strong>Rutvi</strong>
                                            <small>Paneer Bowl</small>
                                        </div>

                                        <span className="paid">✓ Paid</span>
                                    </div>


                                    <div className="member">
                                        <span className="member-avatar avatar-two">
                                            H
                                        </span>

                                        <div>
                                            <strong>Het</strong>
                                            <small>Frankie + Coffee</small>
                                        </div>

                                        <span className="paid">✓ Paid</span>
                                    </div>


                                    <div className="member">
                                        <span className="member-avatar avatar-three">
                                            J
                                        </span>

                                        <div>
                                            <strong>Jiya</strong>
                                            <small>Veg Sandwich</small>
                                        </div>

                                        <span className="pending">
                                            Pending
                                        </span>
                                    </div>

                                </div>


                                <div className="group-total">

                                    <span>Total</span>

                                    <strong>₹315</strong>

                                </div>

                            </div>

                        </div>

                    </div>

                </section>


                {/* EXPERIENCE SECTION */}

                <section className="experience-section">

                    <div className="page-container">

                        <div className="experience-box">

                            <div className="experience-content">

                                <span className="eyebrow">
                                    BUILT FOR YOUR BREAK
                                </span>

                                <h2>
                                    More time with
                                    <br />
                                    <span>your people.</span>
                                </h2>

                                <p>
                                    Because a college break should be about
                                    conversations, friends and good food —
                                    not waiting in line.
                                </p>

                                <Button onClick={() => navigate("/register")}>
                                    Get started →
                                </Button>

                            </div>


                            <div className="experience-shapes">

                                <div className="shape shape-one">
                                    🍕
                                </div>

                                <div className="shape shape-two">
                                    ☕
                                </div>

                                <div className="shape shape-three">
                                    🍔
                                </div>

                                <div className="shape shape-four">
                                    🥤
                                </div>

                            </div>

                        </div>

                    </div>

                </section>

            </main>


            {/* FOOTER */}

            <footer className="footer">

                <div className="page-container">

                    <div className="footer-main">

                        <div className="footer-brand">

                            <div className="brand">
                                <div className="brand-logo footer-logo">
                                    <img src={logo} alt="CanteenQueue logo" />
                                </div>

                                <div className="brand-text">
                                    <div className="brand-name">
                                        Canteen<span>Queue</span>
                                    </div>

                                    <div className="brand-tagline">
                                        Campus food, simplified.
                                    </div>
                                </div>
                            </div>

                            <p>
                                Making campus food faster, simpler
                                and a little more fun.
                            </p>

                        </div>


                        <div className="footer-links">

                            <div>
                                <h4>Explore</h4>
                                <a href="#menu">Menu</a>
                                <a href="#how-it-works">How it works</a>
                                <a href="#group-order">Group order</a>
                            </div>

                            <div>
                                <h4>Account</h4>
                                <a href="/login" onClick={(e) => {e.preventDefault();navigate("/login");}}>
                                    Sign in
                                </a>
                                <a href="/register" onClick={(e) => {e.preventDefault();navigate("/register");}}>
                                    Create account
                                </a>
                                <a href="/login" onClick={(e) => {e.preventDefault();loginForSection("orders");}}>
                                     My orders
                                </a>
                            </div>

                            <div>
                                <h4>Campus</h4>
                                <a href="#support">Help &amp; support</a>
                                <a href="#feedback">Feedback</a>
                                <a href="#about">About us</a>
                            </div>

                        </div>

                    </div>


                    <div className="footer-bottom">

                        <span>
                            © 2026 CanteenQueue
                        </span>

                        <span>
                            Made for campus life ♡
                        </span>

                    </div>

                </div>

            </footer>

        </div>
    );
}

export default Home;