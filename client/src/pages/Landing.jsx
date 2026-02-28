import { useNavigate, Link } from "react-router-dom";
import "../styles/landing.css";

export default function Landing() {
    const navigate = useNavigate();

    return (
        <div className="landing-container">
            {/* 🎨 Animated Background */}
            <div className="landing-bg-blob blob-1"></div>
            <div className="landing-bg-blob blob-2"></div>
            <div className="landing-bg-blob blob-3"></div>

            {/* Navigation */}
            <nav className="landing-nav">
                <div className="logo-container">
                    <img src="/logo.png" alt="DocsGuru Logo" className="logo-img" />
                    <h1>DocsGuru</h1>
                </div>
                <div className="nav-actions">
                    <button
                        className="login-btn"
                        onClick={() => navigate("/login")}
                    >
                        Login
                    </button>
                    <button onClick={() => navigate("/register")}>
                        Sign Up
                    </button>
                </div>
            </nav>

            {/* Hero Section */}
            <section className="hero-section">
                <h1 className="hero-title">
                    Collaborate in<br />Real-Time.
                </h1>
                <p className="hero-subtitle">
                    DocsGuru is the elegant, fast, and secure way to create documents with your team. Experience seamless real-time syncing and beautiful aesthetics.
                </p>
                <div className="hero-actions">
                    <button
                        style={{ padding: "16px 32px", fontSize: "1.1rem" }}
                        onClick={() => navigate("/register")}
                    >
                        Get Started for Free
                    </button>
                </div>
            </section>

            {/* Features Section */}
            <section className="features-section">
                <div className="features-grid">
                    <div className="feature-card glass">
                        <span className="feature-icon">⚡</span>
                        <h3 className="feature-title">Real-Time Sync</h3>
                        <p className="feature-desc">
                            Edit documents simultaneously with your teammates. See changes instantly as they happen with zero delay.
                        </p>
                    </div>

                    <div className="feature-card glass">
                        <span className="feature-icon">🖱️</span>
                        <h3 className="feature-title">Live Cursors</h3>
                        <p className="feature-desc">
                            Know exactly where everyone is working. Live colored cursors track your collaborators across the document.
                        </p>
                    </div>

                    <div className="feature-card glass">
                        <span className="feature-icon">💾</span>
                        <h3 className="feature-title">Smart Auto-Save</h3>
                        <p className="feature-desc">
                            Never lose your work again. DocsGuru intelligently debounces and auto-saves your documents seamlessly in the background.
                        </p>
                    </div>
                </div>
            </section>
        </div>
    );
}
