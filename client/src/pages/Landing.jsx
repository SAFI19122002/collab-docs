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
                <div className="features-container">
                    {/* Feature 1 */}
                    <div className="feature-row">
                        <div className="feature-text">
                            <h3 className="feature-title">Real-Time Sync</h3>
                            <p className="feature-desc">
                                Edit documents simultaneously with your teammates. Our robust WebSocket infrastructure ensures that every keystroke is broadcasted instantly to all connected users with zero delay, making remote teamwork feel like you're sitting in the same room.
                            </p>
                        </div>
                        <div className="feature-visual">
                            <img src="/feature_realtime_sync.png" alt="Real-Time Sync" className="feature-img" />
                        </div>
                    </div>

                    {/* Feature 2 (Reversed) */}
                    <div className="feature-row reverse">
                        <div className="feature-text">
                            <h3 className="feature-title">Live Cursors</h3>
                            <p className="feature-desc">
                                Know exactly where everyone is working. Live colored cursors track your collaborators across the document, complete with their name tags. Say goodbye to the confusion of accidentally overwriting your teammate's sentences.
                            </p>
                        </div>
                        <div className="feature-visual">
                            <img src="/feature_live_cursors.png" alt="Live Cursors" className="feature-img" />
                        </div>
                    </div>

                    {/* Feature 3 */}
                    <div className="feature-row">
                        <div className="feature-text">
                            <h3 className="feature-title">Smart Auto-Save</h3>
                            <p className="feature-desc">
                                Never lose your work again. DocsGuru intelligently debounces your typing and auto-saves your documents seamlessly into our encrypted MongoDB database. Close your tab at any time with total peace of mind.
                            </p>
                        </div>
                        <div className="feature-visual">
                            <img src="/feature_auto_save.png" alt="Smart Auto-Save" className="feature-img" />
                        </div>
                    </div>
                </div>
            </section>
        </div>
    );
}
