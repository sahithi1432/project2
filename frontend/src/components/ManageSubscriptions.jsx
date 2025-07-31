import { useEffect, useState, useRef } from 'react';
import { subscriptionAPI } from '../services/api';
import { useNavigate, Link } from 'react-router-dom';
import { logout, goHome, handleClickOutside } from '../utils/authUtils.js';
import './ManageSubscriptions.css';

const INITIAL_PLANS = [
  {
    name: 'free',
    display: 'Free',
    icon: '💎',
    description: 'Access limited features for free',
  },
  {
    name: 'premium',
    display: 'Premium',
    icon: '🚀',
    description: 'Unlock all premium features',
  },
];

const PREMIUM_PLANS = [
  {
    name: 'basic',
    display: 'Basic',
    icon: '⭐',
    price: '₹99/month',
    features: [
      '✅ Unlimited Walls',
      '✅ Sharing',
    ],
    button: 'Buy Now',
  },
  {
    name: 'silver',
    display: 'Silver',
    icon: '📅',
    price: '₹249/3 months',
    features: [
      '✅ Unlimited Walls',
      '✅ Sharing',
    ],
    button: 'Buy Now',
  },
  {
    name: 'gold',
    display: 'Gold',
    icon: '🗓️',
    price: '₹449/6 months',
    features: [
      '✅ Unlimited Walls',
      '✅ Sharing',
    ],
    button: 'Buy Now',
  },
  {
    name: 'platinum',
    display: 'Platinum',
    icon: '🏆',
    price: '₹799/year',
    features: [
      '✅ Unlimited Walls',
      '✅ Sharing',
    ],
    button: 'Buy Now',
  },
];

function ManageSubscriptions() {
  const [subscription, setSubscription] = useState('free');
  // Change subLoading to track the plan name
  const [subLoading, setSubLoading] = useState(null);
  const [subError, setSubError] = useState('');
  const [subSuccess, setSubSuccess] = useState('');
  const [menuOpen, setMenuOpen] = useState(false);
  const [showPremiumPlans, setShowPremiumPlans] = useState(false);
  const navigate = useNavigate();
  const isAdmin = JSON.parse(localStorage.getItem('user') || '{}').role === 'admin';
  const menuRef = useRef(null);

  useEffect(() => {
    subscriptionAPI.getSubscription()
      .then(res => setSubscription(res.subscription_plan || 'free'))
      .catch(() => setSubscription('free'));
  }, []);

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

  const handleSubscribe = async (plan) => {
    setSubLoading(plan); // set to the plan name
    setSubError(''); setSubSuccess('');
    try {
      await subscriptionAPI.subscribe(plan);
      setSubscription(plan);
      // Find the display name for the plan
      let displayName = plan.charAt(0).toUpperCase() + plan.slice(1);
      const found = PREMIUM_PLANS.find(p => p.name === plan);
      if (found) displayName = found.display;
      setSubSuccess(`Successfully subscribed to ${displayName} plan!`);
      setTimeout(() => setSubSuccess(''), 3000);
    } catch (err) {
      setSubError(err.message || 'Failed to subscribe');
    } finally {
      setSubLoading(null); // reset after done
    }
  };

  const handleLogout = () => logout(navigate);

  // UI for initial Free/Premium selection
  const renderInitialPlans = () => (
    <div style={{ display: 'flex', justifyContent: 'center', gap: 40, marginTop: 60 }}>
      {INITIAL_PLANS.map(plan => (
        <div key={plan.name} style={{
          border: '2px solid #2563eb',
          borderRadius: 14,
          padding: 32,
          minWidth: 220,
          background: '#f9fafb',
          boxShadow: '0 2px 12px rgba(37,99,235,0.10)',
          textAlign: 'center',
          cursor: 'pointer',
          transition: 'box-shadow 0.2s, border 0.2s',
        }}
          onClick={() => {
            if (plan.name === 'premium') setShowPremiumPlans(true);
            else handleSubscribe('free');
          }}
        >
          <div style={{ fontSize: 48, marginBottom: 12 }}>{plan.icon}</div>
          <div style={{ fontSize: 24, fontWeight: 700, color: '#2563eb', marginBottom: 8 }}>{plan.display}</div>
          <div style={{ fontSize: 16, color: '#374151', marginBottom: 12 }}>{plan.description}</div>
          {plan.name === 'free' && subscription === 'free' && (
            <div style={{ color: '#22c55e', fontWeight: 600, fontSize: 15 }}>✔ Current Plan</div>
          )}
        </div>
      ))}
    </div>
  );

  // UI for premium plans
  const renderPremiumPlans = () => (
    <div>
      <button onClick={() => setShowPremiumPlans(false)} style={{ marginBottom: 24, background: 'none', border: 'none', color: '#2563eb', fontWeight: 600, fontSize: 16, cursor: 'pointer' }}>← Back</button>
      <div style={{
        display: 'flex',
        gap: 16,
        justifyContent: 'center',
        flexWrap: 'nowrap', // force single row
        width: '100%',
        marginBottom: 32,
        paddingBottom: 8,
      }}>
        {PREMIUM_PLANS.map(plan => {
          const isCurrent = subscription === plan.name;
          return (
            <div key={plan.name} style={{
              border: isCurrent ? '2.5px solid #2563eb' : '1.5px solid #e5e7eb',
              borderRadius: 14,
              padding: 18,
              minWidth: 0,
              width: '100%',
              flex: '1 1 0', // allow cards to shrink and grow equally
              maxWidth: '25%', // 4 cards per row
              background: isCurrent ? '#f0f6ff' : '#f9fafb',
              boxShadow: isCurrent ? '0 2px 12px rgba(37,99,235,0.10)' : '0 1px 4px rgba(0,0,0,0.04)',
              position: 'relative',
              textAlign: 'center',
              transition: 'box-shadow 0.2s, border 0.2s',
            }}>
              <div style={{ fontSize: 38, marginBottom: 8 }}>{plan.icon}</div>
              <div style={{ fontSize: 20, fontWeight: 700, color: '#2563eb', marginBottom: 8 }}>{plan.display}</div>
              <div style={{ fontSize: 18, fontWeight: 500, color: '#374151', marginBottom: 12 }}>{plan.price}</div>
              <div style={{ marginBottom: 18 }}>
                {plan.features.map((f, i) => (
                  <div key={i} style={{ color: '#374151', fontSize: 15, marginBottom: 2, textAlign: 'left' }}>{f}</div>
                ))}
              </div>
              {isCurrent ? (
                <button
                  className="profile-delete-btn"
                  style={{ width: '100%', background: '#fff', color: '#2563eb', border: '1.5px solid #2563eb', fontWeight: 600 }}
                  disabled
                >
                  Current Plan
                </button>
              ) : (
                <button
                  className="profile-blue-btn"
                  style={{ width: '100%', fontWeight: 600 }}
                  onClick={() => handleSubscribe(plan.name)}
                  disabled={subLoading !== null}
                >
                  {subLoading === plan.name ? 'Updating...' : plan.button}
                </button>
              )}
              {isCurrent && (
                <div style={{ position: 'absolute', top: 14, right: 18, color: '#22c55e', fontWeight: 600, fontSize: 15 }}>✔</div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );

  return (
    <div style={{ position: 'relative' }}>
      {/* Menu Icon */}
      <div className="menu-container">
        <button
          className="menu-icon"
          aria-label="Menu"
          onClick={() => setMenuOpen((open) => !open)}
        >
          <span>&#9776;</span>
        </button>
        {menuOpen && (
          <div ref={menuRef} className="menu-dropdown">
            <ul>
              <li>
                <button onClick={() => { setMenuOpen(false); goHome(navigate); }}>🏠 Home</button>
              </li>
              {isAdmin && (
                <li>
                  <button onClick={() => { setMenuOpen(false); navigate('/admin'); }}>⚙️ Admin Panel</button>
                </li>
              )}
              <li>
                <button onClick={() => { setMenuOpen(false); navigate('/Createaltar'); }}>🕯️ Create Altar</button>
              </li>
              <li>
                <button onClick={() => { setMenuOpen(false); handleLogout(); }}>🚪 Logout</button>
              </li>
            </ul>
          </div>
        )}
      </div>
      <div className="settings-container" style={{ display: 'flex', minHeight: '80vh' }}>
        <aside className="settings-sidebar" style={{ minWidth: 220, background: '#f1f5f9', padding: 24, borderRadius: 16, marginRight: 32, display: 'flex', flexDirection: 'column', gap: 16 }}>
          <Link to="/profile" style={{ textDecoration: 'none' }}><button className="settings-tab-btn">Profile</button></Link>
          <Link to="/profile" style={{ textDecoration: 'none' }}><button className="settings-tab-btn">Security</button></Link>
          <Link to="/profile" style={{ textDecoration: 'none' }}><button className="settings-tab-btn">History</button></Link>
          <Link to="/profile" style={{ textDecoration: 'none' }}><button className="settings-tab-btn">Preferences</button></Link>
          <Link to="/profile" style={{ textDecoration: 'none' }}><button className="settings-tab-btn">Privacy</button></Link>
          <Link to="/subscriptions" style={{ textDecoration: 'none' }}><button className="settings-tab-btn">Manage Subscriptions</button></Link>
          <Link to="/billing-history" style={{ textDecoration: 'none' }}><button className="settings-tab-btn">Billing History</button></Link>
          <button className="settings-tab-btn logout-btn" onClick={handleLogout}>Logout</button>
        </aside>
        <main className="settings-content" style={{ flex: 1, maxWidth: 900, margin: '0 auto', width: '100%' }}>
          <h2 style={{ textAlign: 'center', marginBottom: 32, color: '#2563eb', letterSpacing: 1 }}>🌟 Choose Your Plan</h2>
          {subSuccess && <div style={{ color: '#22c55e', textAlign: 'center', marginBottom: 16, fontWeight: 600, fontSize: 17 }}>{subSuccess}</div>}
          {subError && <div style={{ color: 'red', marginBottom: 16 }}>{subError}</div>}
          {!showPremiumPlans ? renderInitialPlans() : renderPremiumPlans()}
        </main>
      </div>
    </div>
  );
}

export default ManageSubscriptions; 