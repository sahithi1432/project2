import React, { useEffect, useState } from 'react';
import { billingAPI } from '../services/api';
import { useNavigate, Link } from 'react-router-dom';
import './BillingHistory.css';

function BillingHistory() {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [menuOpen, setMenuOpen] = useState(false);
  const navigate = useNavigate();
  const isAdmin = JSON.parse(localStorage.getItem('user') || '{}').role === 'admin';
  const menuRef = React.useRef(null);

  React.useEffect(() => {
    function handleClickOutside(event) {
      if (menuOpen && menuRef.current && !menuRef.current.contains(event.target)) {
        setMenuOpen(false);
      }
    }
    if (menuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    } else {
      document.removeEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [menuOpen]);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    localStorage.removeItem('profilePhoto');
    navigate('/');
  };

  useEffect(() => {
    billingAPI.getHistory()
      .then(res => setHistory(res.history || []))
      .catch(() => setError('Failed to load billing history.'))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div style={{ position: 'relative' }}>
      {/* Menu Icon */}
      <div style={{ position: 'absolute', top: 24, right: 24, zIndex: 10 }}>
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
                <button onClick={() => { setMenuOpen(false); navigate('/'); }}>🏠 Home</button>
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
        <main className="settings-content" style={{ flex: 1, maxWidth: 700, margin: '0 auto', width: '100%' }}>
          <h2 style={{ textAlign: 'center', marginBottom: 32, color: '#2563eb' }}>Billing History</h2>
          {loading ? (
            <div>Loading...</div>
          ) : error ? (
            <div style={{ color: 'red' }}>{error}</div>
          ) : history.length === 0 ? (
            <div style={{ color: '#64748b', textAlign: 'center' }}>No billing history found.</div>
          ) : (
            <div style={{ maxHeight: 400, overflow: 'auto', borderRadius: 8 }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 16 }}>
                <thead>
                  <tr style={{ background: '#f1f5f9' }}>
                    <th style={thStyle}>Plan</th>
                    <th style={thStyle}>Amount</th>
                    <th style={thStyle}>Start Date</th>
                    <th style={thStyle}>End Date</th>
                  </tr>
                </thead>
                <tbody>
                  {history.map(item => (
                    <tr key={item.id} style={{ borderBottom: '1px solid #e5e7eb' }}>
                      <td style={tdStyle}>{item.plan}</td>
                      <td style={tdStyle}>{item.amount}</td>
                      <td style={tdStyle}>{new Date(item.start_date).toLocaleDateString()}</td>
                      <td style={tdStyle}>{item.end_date ? new Date(item.end_date).toLocaleDateString() : '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}

const thStyle = {
  padding: '10px 8px',
  textAlign: 'left',
  color: '#374151',
  fontWeight: 600,
  borderBottom: '2px solid #e5e7eb',
};
const tdStyle = {
  padding: '8px 8px',
  color: '#374151',
};



export default BillingHistory; 