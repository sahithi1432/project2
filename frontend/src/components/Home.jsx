import { useNavigate } from "react-router-dom";
import { useState, useRef, useEffect } from "react";
import "./Home.css";
import { getApiUrl } from '../config/environment.js';
import { logout, goHome, handleClickOutside } from '../utils/authUtils.js';

function Home(){
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    const isLoggedIn = !!user.id;
    const isAdmin = user.role === 'admin';
    const navigate = useNavigate();
    const [menuOpen, setMenuOpen] = useState(false);
    const menuRef = useRef(null);

    // Contact form states
    const [contactForm, setContactForm] = useState({
        name: '',
        email: '',
        message: ''
    });
    const [contactLoading, setContactLoading] = useState(false);
    const [contactMessage, setContactMessage] = useState('');

    // Component mounted effect
    useEffect(() => {
        // Component initialization logic can go here if needed
    }, [isLoggedIn, isAdmin]);

    const handleLogout = () => logout(navigate);

    // Handle contact form input changes
    const handleContactInputChange = (e) => {
        const { name, value } = e.target;
        setContactForm(prev => ({
            ...prev,
            [name]: value
        }));
    };

    // Handle contact form submission
    const handleContactSubmit = async (e) => {
        e.preventDefault();
        setContactLoading(true);
        setContactMessage('');

        try {
            const response = await fetch(`${getApiUrl()}/auth/contact`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(contactForm)
            });

            const data = await response.json();

            if (response.ok) {
                setContactMessage(data.message);
                setContactForm({ name: '', email: '', message: '' });
            } else {
                setContactMessage(data.message || 'Failed to send message. Please try again.');
            }
        } catch (error) {
            console.error('Contact form error:', error);
            setContactMessage('Network error. Please check your connection and try again.');
        } finally {
            setContactLoading(false);
        }
    };

    // Close menu when clicking outside
    useEffect(() => {
      const clickHandler = handleClickOutside(menuRef, menuOpen, setMenuOpen);
      if (menuOpen) {
        document.addEventListener('mousedown', clickHandler);
      } else {
        document.removeEventListener('mousedown', clickHandler);
      }
      return () => {
        document.removeEventListener('mousedown', clickHandler);
      };
    }, [menuOpen]);

    return(
        <div className="home-container">
            {/* Header */}
            <header className="home-header">
                <div className="header-content">
                    <div className="logo-section">
                        <div className="logo-icon"></div>
                        <div className="logo-text">
                            <span className="logo-mial">DREAM</span>
                            <span className="logo-tar">WALL</span>
                        </div>
                    </div>
                    <div className="header-menu">
                        {!isLoggedIn && (
                            <>
                                <button className="header-btn secondary" onClick={() => navigate('/Login')}>Login</button>
                                <button className="header-btn primary" onClick={() => navigate('/Signup')}>Get Started</button>
                            </>
                        )}
                        {isLoggedIn && (
                            <>
                                <button
                                    className="menu-icon"
                                    aria-label="Menu"
                                    onClick={() => setMenuOpen((open) => !open)}
                                >
                                    <span>&#9776;</span>
                                </button>
                                {menuOpen && (
                                    <div ref={menuRef} className="header-dropdown">
                                        <ul className="dropdown-list">
                                            <li>
                                                <button className="dropdown-item" onClick={() => { setMenuOpen(false); navigate('/profile'); }}>👤 Profile</button>
                                            </li>
                                            {isAdmin && (
                                                <li>
                                                    <button className="dropdown-item" onClick={() => { setMenuOpen(false); navigate('/admin'); }}>⚙️ Admin Panel</button>
                                                </li>
                                            )}
                                            <li>
                                                <button className="dropdown-item" onClick={() => { setMenuOpen(false); navigate('/Createaltar'); }}>🕯️ Create Altar</button>
                                            </li>
                                            <li>
                                                <button className="dropdown-item logout" onClick={() => { setMenuOpen(false); handleLogout(); }}>🚪 Logout</button>
                                            </li>
                                        </ul>
                                    </div>
                                )}
                            </>
                        )}
                    </div>
                </div>
            </header>

            {/* Hero Section */}
            <section className="hero-section">
                <div className="hero-content">
                    <div className="hero-text" style={{ textAlign: 'center', maxWidth: '800px', margin: '0 auto' }}>
                        <h1 className="hero-title">
                            Create Beautiful Virtual Altars
                        </h1>
                        <p className="hero-subtitle">
                            Honor your loved ones with personalized digital memorials. Upload photos, add meaningful items, and share memories with family and friends.
                        </p>
                        <div className="hero-buttons">
                            <button className="hero-btn primary" onClick={() => navigate('/Createaltar')}>
                                Start Creating
                            </button>
                            <button className="hero-btn secondary" onClick={() => document.getElementById('features').scrollIntoView({ behavior: 'smooth' })}>
                                Learn More
                            </button>
                        </div>
                    </div>
                </div>
            </section>

            {/* Features Section */}
            <section id="features" className="features-section">
                <div className="section-header">
                    <h2 className="section-title">Why Choose DreamWall?</h2>
                    <p className="section-subtitle">Everything you need to create meaningful digital memorials</p>
                </div>
                <div className="features-grid">
                    <div className="feature-card">
                        <div className="feature-icon">📸</div>
                        <h3 className="feature-title">Upload Photos</h3>
                        <p className="feature-description">Upload photos of your deceased loved ones and curate a beautiful virtual altar</p>
                    </div>
                    <div className="feature-card">
                        <div className="feature-icon">🎨</div>
                        <h3 className="feature-title">Customize Your Altar</h3>
                        <p className="feature-description">Adorn your private altar with your favorite ofrendas and personal cherished momentos</p>
                    </div>
                    <div className="feature-card">
                        <div className="feature-icon">🔗</div>
                        <h3 className="feature-title">Share with Loved Ones</h3>
                        <p className="feature-description">Share memories and anecdotes privately with family and friends through secure links</p>
                    </div>
                    <div className="feature-card">
                        <div className="feature-icon">💝</div>
                        <h3 className="feature-title">Preserve Memories</h3>
                        <p className="feature-description">Keep the memory of your loved ones alive with beautiful, lasting digital memorials</p>
                    </div>
                </div>
            </section>

            {/* Pricing Section */}
            <section className="pricing-section">
                <div className="section-header">
                    <h2 className="section-title">Simple Pricing</h2>
                    <p className="section-subtitle">Start creating beautiful altars today</p>
                </div>
                <div className="pricing-card">
                    <div className="pricing-badge">Most Popular</div>
                    <div className="pricing-header">
                        <h3 className="pricing-title">Annual Plan</h3>
                        <div className="pricing-price">
                            <span className="price">₹799</span>
                            <span className="period">/year</span>
                        </div>
                        
                    </div>
                    <div className="pricing-features">
                        <div className="pricing-feature">
                            <span className="feature-check">✓</span>
                            Create unlimited altars
                        </div>
                        <div className="pricing-feature">
                            <span className="feature-check">✓</span>
                            Customize with various styles
                        </div>
                        <div className="pricing-feature">
                            <span className="feature-check">✓</span>
                            Share with family and friends
                        </div>
                        <div className="pricing-feature">
                            <span className="feature-check">✓</span>
                            Secure and private
                        </div>
                        <div className="pricing-feature">
                            <span className="feature-check">✓</span>
                            Priority customer support
                        </div>
                    </div>
                    <div className="pricing-note">
                        *Teachers and organizations can contact us for free access
                    </div>
                    <button className="pricing-btn" onClick={() => navigate('/Createaltar')}>
                        Get Started
                    </button>
                </div>
            </section>

            {/* Contact Section */}
            <section className="contact-section">
                <div className="section-header">
                    <h2 className="section-title">Get in Touch</h2>
                    <p className="section-subtitle">Let us know how we can improve your experience!</p>
                </div>
                <div className="contact-content">
                    <div className="contact-info">
                        <h3 className="contact-title">We'd love to hear from you</h3>
                        <p className="contact-description">
                            Your feedback helps us make Mialtar better for everyone. Share your thoughts, suggestions, or any issues you encounter.
                        </p>
                        <div className="contact-details">
                            <div className="contact-item">
                                <span className="contact-icon">📧</span>
                                <span>hello@dreamwall.com</span>
                            </div>
                            <div className="contact-item">
                                <span className="contact-icon">💬</span>
                                <span>We respond within 24 hours</span>
                            </div>
                        </div>
                    </div>
                    <div className="contact-form-container">
                        <form className="contact-form" onSubmit={handleContactSubmit}>
                            <input 
                                type="text" 
                                name="name"
                                value={contactForm.name}
                                onChange={handleContactInputChange}
                                placeholder="Your name" 
                                className="contact-input"
                                required
                            />
                            <input 
                                type="email" 
                                name="email"
                                value={contactForm.email}
                                onChange={handleContactInputChange}
                                placeholder="Your email" 
                                className="contact-input"
                                required
                            />
                            <textarea 
                                name="message"
                                value={contactForm.message}
                                onChange={handleContactInputChange}
                                placeholder="Your message..." 
                                className="contact-textarea"
                                rows="4"
                                required
                            ></textarea>
                            {contactMessage && (
                                <div className={`contact-message ${contactMessage.includes('successfully') ? 'success' : 'error'}`}>
                                    {contactMessage}
                                </div>
                            )}
                            <button type="submit" className="contact-btn" disabled={contactLoading}>
                                <span className="btn-icon">📤</span>
                                {contactLoading ? 'Sending...' : 'Send Message'}
                            </button>
                        </form>
                    </div>
                </div>
            </section>

            {/* Footer */}
            <footer className="home-footer">
                <div className="footer-content">
                    <div className="footer-brand">
                        <div className="footer-logo">
                            <div className="logo-icon"></div>
                            <div className="logo-text">
                                <span className="logo-mial">DREAM WALL</span>
                                
                            </div>
                        </div>
                        <p className="footer-description">
                            Creating meaningful digital memorials to honor and remember your loved ones.
                        </p>
                        <div className="footer-social">
                            <a href="#" className="social-link">📷</a>
                            <a href="#" className="social-link">📘</a>
                        </div>
                    </div>
                    <div className="footer-links">
                        <div className="footer-column">
                            <h4 className="footer-heading">Product</h4>
                            <ul className="footer-list">
                                <li>Features</li>
                                <li>Pricing</li>
                                <li>FAQ</li>
                            </ul>
                        </div>
                        <div className="footer-column">
                            <h4 className="footer-heading">Company</h4>
                            <ul className="footer-list">
                                <li>About Us</li>
                                <li>Blog</li>
                                <li>Contact</li>
                            </ul>
                        </div>
                        <div className="footer-column">
                            <h4 className="footer-heading">Legal</h4>
                            <ul className="footer-list">
                                <li>Privacy</li>
                                <li>Terms</li>
                                <li>Cookies</li>
                            </ul>
                        </div>
                    </div>
                </div>
                <div className="footer-bottom">
                    <p>&copy; {new Date().getFullYear()} DreamWall. All rights reserved.</p>
                </div>
            </footer>
        </div>
    );
}

export default Home;