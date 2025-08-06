import { useState, useEffect, useRef } from 'react';
import { wallAPI } from '../services/api';
import { userAPI } from '../services/api';
import { subscriptionAPI } from '../services/api';
import { billingAPI } from '../services/api';
import { useNavigate, Link } from 'react-router-dom';
import { authAPI } from '../services/api';
import { logout, goHome, handleClickOutside } from '../utils/authUtils.js';
import './profile.css';
import { getApiUrl } from '../config/environment.js';

function Profile() {
  const [user, setUser] = useState({ username: '', email: '', id: '' });
  const [editMode, setEditMode] = useState(false);
  const [form, setForm] = useState({ username: '', email: '' });
  const [showPasswordForm, setShowPasswordForm] = useState(false);
  const [passwords, setPasswords] = useState({ current: '', new: '', confirm: '' });
  const [profilePhoto, setProfilePhoto] = useState(() => localStorage.getItem('profilePhoto') || '');
  const [finalAltars, setFinalAltars] = useState([]);
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('profile');
  const settingsRef = useRef();
  const isAdmin = user.role === 'admin';
  const [previewAltar, setPreviewAltar] = useState(null);
  const [showPreview, setShowPreview] = useState(false);
  const [shareModal, setShareModal] = useState({ open: false, mode: null, link: '' });
  const [copied, setCopied] = useState(false);
  const [shareMenuOpen, setShareMenuOpen] = useState(false);
  const shareOptions = [
    { name: 'WhatsApp', getUrl: (link) => `https://wa.me/?text=${encodeURIComponent(link)}`, color: '#25D366' },
    { name: 'Email', getUrl: (link) => `mailto:?subject=Check%20out%20this%20Altar&body=${encodeURIComponent(link)}`, color: '#0072c6' },
    { name: 'Facebook', getUrl: (link) => `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(link)}`, color: '#4267B2' },
    { name: 'Twitter', getUrl: (link) => `https://twitter.com/intent/tweet?url=${encodeURIComponent(link)}&text=Check%20out%20this%20Altar!`, color: '#1DA1F2' },
    { name: 'Telegram', getUrl: (link) => `https://t.me/share/url?url=${encodeURIComponent(link)}&text=Check%20out%20this%20Altar!`, color: '#0088cc' },
    { name: 'LinkedIn', getUrl: (link) => `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(link)}`, color: '#0077b5' },
    { name: 'Instagram', getUrl: (link) => `https://www.instagram.com/`, color: '#E1306C', disabled: true },
  ];
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef(null);
  const shareMenuRef = useRef(null);
  const [subscription, setSubscription] = useState(null);
  const [subLoading, setSubLoading] = useState(true);
  const [subError, setSubError] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [otp, setOtp] = useState('');
  const [otpVerified, setOtpVerified] = useState(false);
  const [otpError, setOtpError] = useState('');
  const [originalEmail, setOriginalEmail] = useState('');
  const [showUpgradeMsg, setShowUpgradeMsg] = useState(false);
  const [billingHistory, setBillingHistory] = useState([]);
  const [billingLoading, setBillingLoading] = useState(true);
  const [billingError, setBillingError] = useState('');
  const [subSuccess, setSubSuccess] = useState('');
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [notificationLoading, setNotificationLoading] = useState(false);
  const [theme, setTheme] = useState(() => {
    const saved = localStorage.getItem('theme');
    return saved || 'light';
  });
  const [language, setLanguage] = useState(() => {
    const saved = localStorage.getItem('language');
    return saved || 'en';
  });
  const [autoSaveEnabled, setAutoSaveEnabled] = useState(() => {
    const saved = localStorage.getItem('autoSaveEnabled');
    return saved ? JSON.parse(saved) : true;
  });
  const [subLoadingPlan, setSubLoadingPlan] = useState(null);
  const [lastSuccessPlan, setLastSuccessPlan] = useState(null);
  const [isProfilePublic, setIsProfilePublic] = useState(false);
  const [privacyLoading, setPrivacyLoading] = useState(false);
  const [subscriptionEnd, setSubscriptionEnd] = useState(null);

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

  // Add click outside for shareMenu
  useEffect(() => {
    function handleClickOutsideShareMenu(event) {
      if (shareMenuOpen && shareMenuRef.current && !shareMenuRef.current.contains(event.target)) {
        setShareMenuOpen(false);
      }
    }
    if (shareMenuOpen) {
      document.addEventListener('mousedown', handleClickOutsideShareMenu);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutsideShareMenu);
    };
  }, [shareMenuOpen]);

  useEffect(() => {
    const stored = JSON.parse(localStorage.getItem('user'));
    if (!stored) {
      navigate('/login');
      return;
    }
    setUser(stored);
    setForm({ username: stored.username || '', email: stored.email || '' });
    if (stored.id) {
      wallAPI.getUserDesigns(stored.id).then((all) => {
        setFinalAltars(all);
      }).catch(() => setFinalAltars([]));
    }
    // Fetch subscription status
    subscriptionAPI.getSubscription().then(res => {
      setSubscription(res.subscription_plan || 'free');
      setSubscriptionEnd(res.subscription_end || null);
      setSubLoading(false);
    }).catch(() => {
      setSubscription('free');
      setSubscriptionEnd(null);
      setSubLoading(false);
    });
    
    // Fetch billing history
    billingAPI.getHistory().then(res => {
      setBillingHistory(res.history || []);
    }).catch(() => setBillingError('Failed to load billing history.'))
    .finally(() => setBillingLoading(false));
  }, []);

  // Add state to track public/private mode for each altar
  const [localPublicStatus, setLocalPublicStatus] = useState({});

  // When fetching altars, always initialize localPublicStatus to all private (unchecked)
  useEffect(() => {
    if (Array.isArray(finalAltars)) {
      const status = {};
      finalAltars.forEach(a => { status[a.id] = false; }); // false means private
      setLocalPublicStatus(status);
    }
  }, [finalAltars]);

  const handleEdit = () => {
    setEditMode(true);
    setOriginalEmail(form.email);
    setOtpSent(false);
    setOtp('');
    setOtpVerified(true); // If email not changed, allow save
    setOtpError('');
  };
  const handleCancel = () => {
    setEditMode(false);
    setForm({ username: user.username, email: user.email });
    setOtpSent(false);
    setOtp('');
    setOtpVerified(false);
    setOtpError('');
  };
  const handleChange = e => {
    setForm({ ...form, [e.target.name]: e.target.value });
    if (e.target.name === 'email' && e.target.value !== originalEmail) {
      setOtpSent(false);
      setOtp('');
      setOtpVerified(false);
      setOtpError('');
    } else if (e.target.name === 'email' && e.target.value === originalEmail) {
      setOtpVerified(true);
    }
  };
  const handleSendOtp = async () => {
    setOtpError('');
    setOtp('');
    setOtpVerified(false);
    try {
      await authAPI.sendOtp(form.email);
      setOtpSent(true);
    } catch (err) {
      setOtpError(err.message || 'Failed to send OTP');
    }
  };
  const handleVerifyOtp = async () => {
    setOtpError('');
    try {
      await authAPI.verifyOtp(form.email, otp);
      setOtpVerified(true);
    } catch (err) {
      setOtpError(err.message || 'OTP verification failed');
      setOtpVerified(false);
    }
  };
  const handleSave = async e => {
    e.preventDefault();
    if (form.email !== originalEmail && !otpVerified) {
      setOtpError('Please verify the OTP sent to your new email.');
      return;
    }
    try {
      await userAPI.updateProfile(user.id, form);
      setUser({ ...user, ...form });
      setEditMode(false);
      localStorage.setItem('user', JSON.stringify({ ...user, ...form }));
      alert('Profile updated successfully!');
    } catch (err) {
      alert(err.message || 'Failed to update profile');
    }
  };

  const handlePasswordChange = e => setPasswords({ ...passwords, [e.target.name]: e.target.value });
  const handlePasswordSubmit = async e => {
    e.preventDefault();
    if (passwords.new !== passwords.confirm) {
      alert('New passwords do not match');
      return;
    }
    try {
      await userAPI.changePassword(passwords.current, passwords.new);
      alert('Password changed successfully!');
      setPasswords({ current: '', new: '', confirm: '' });
      setShowPasswordForm(false);
    } catch (err) {
      alert(err.message || 'Failed to change password');
    }
  };

  const handlePhotoChange = async (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = async () => {
        try {
          await userAPI.updateProfilePhoto(user.id, reader.result);
          setProfilePhoto(reader.result);
          const updatedUser = { ...user, profile_photo: reader.result };
          setUser(updatedUser);
          localStorage.setItem('user', JSON.stringify(updatedUser));
          localStorage.setItem('profilePhoto', reader.result);
          window.dispatchEvent(new Event('profilePhotoUpdated'));
          alert('Profile photo updated!');
        } catch (err) {
          alert('Failed to upload profile photo');
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleDeletePhoto = async () => {
    try {
      await userAPI.updateProfilePhoto(user.id, '');
      setProfilePhoto('');
      const updatedUser = { ...user, profile_photo: '' };
      setUser(updatedUser);
      localStorage.setItem('user', JSON.stringify(updatedUser));
      localStorage.removeItem('profilePhoto');
      window.dispatchEvent(new Event('profilePhotoUpdated'));
      alert('Profile photo deleted!');
    } catch (err) {
      alert('Failed to delete profile photo');
    }
  };

  const handleDeleteAltar = async (id) => {
    if (window.confirm('Are you sure you want to delete this altar?')) {
      await wallAPI.deleteDesign(id);
      setFinalAltars(finalAltars.filter(a => a.id !== id));
    }
  };

  const handlePreviewAltar = (altar) => {
    setPreviewAltar(altar);
    setShowPreview(true);
  };

  const closePreview = () => {
    setShowPreview(false);
    setPreviewAltar(null);
  };

  const handleShareAltar = (altar) => {
    setShareModal({ open: true, mode: null, link: '', altar });
  };

  const handleSelectShareMode = async (mode) => {
    const { altar } = shareModal;
    try {
      let link = '';
      if (mode === 'view') {
        const { share_token } = await wallAPI.generateShareToken(altar.id);
        link = `${window.location.origin}/#/altar/shared/${share_token}`;
      } else if (mode === 'edit') {
        const { edit_token } = await wallAPI.generateEditToken(altar.id);
        link = `${window.location.origin}/#/createaltar/edit/${edit_token}`;
      }
      setShareModal({ ...shareModal, mode, link });
    } catch (err) {
      alert('Failed to generate share link: ' + (err.message || 'Unknown error'));
      setShareModal({ open: false, mode: null, link: '' });
    }
  };

  const handleCopyShareLink = () => {
    if (shareModal.link) {
      navigator.clipboard.writeText(shareModal.link);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    }
  };

  const handleLogout = () => logout(navigate);

  const handleDeleteAccount = async () => {
    if (!window.confirm('Are you sure you want to delete your account?')) return;
    const user = JSON.parse(localStorage.getItem('user'));
    const token = localStorage.getItem('token');
    try {
              const res = await fetch(`${getApiUrl()}/auth/users/${user.id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        localStorage.clear();
        alert('Account deleted.');
        navigate('/signup');
      } else {
        const data = await res.json();
        alert(data.message || 'Failed to delete account');
      }
    } catch (err) {
      alert('Error deleting account');
    }
  };

  const handleSubscribe = async (planName) => {
    setSubLoadingPlan(planName);
    setSubError('');
    setLastSuccessPlan(null);
    try {
      await subscriptionAPI.subscribe(planName);
      setSubscription(planName);
      setLastSuccessPlan(planName); // Track which plan was successful
    } catch (err) {
      setSubError('Failed to subscribe. Please try again.');
    } finally {
      setSubLoadingPlan(null);
    }
  };

  const handleNotificationToggle = async () => {
    const newValue = !notificationsEnabled;
    setNotificationLoading(true);
    
    try {
      await userAPI.updateNotificationPreferences(newValue);
      setNotificationsEnabled(newValue);
      
      // Show feedback to user
      if (newValue) {
        alert('Email notifications enabled! You will receive email updates about your altars and subscriptions.');
      } else {
        alert('Email notifications disabled. You will no longer receive email updates. You can re-enable them anytime from Preferences.');
      }
    } catch (error) {
      alert(`Failed to update notification preferences: ${error.message}`);
      // Revert the toggle if API call fails
      setNotificationsEnabled(!newValue);
    } finally {
      setNotificationLoading(false);
    }
  };

  const handleThemeChange = (e) => {
    const newTheme = e.target.value;
    setTheme(newTheme);
    localStorage.setItem('theme', newTheme);
    
    // Apply theme to document
    document.documentElement.setAttribute('data-theme', newTheme);
    
    // Show feedback
    alert(`Theme changed to ${newTheme === 'auto' ? 'Auto (System)' : newTheme} theme!`);
  };

  const handleLanguageChange = (e) => {
    const newLanguage = e.target.value;
    setLanguage(newLanguage);
    localStorage.setItem('language', newLanguage);
    
    // Show feedback
    const languageNames = {
      'en': 'English',
      'es': 'Español',
      'fr': 'Français',
      'de': 'Deutsch',
      'hi': 'हिंदी'
    };
    alert(`Language changed to ${languageNames[newLanguage]}!`);
  };

  const handleAutoSaveToggle = () => {
    const newValue = !autoSaveEnabled;
    setAutoSaveEnabled(newValue);
    localStorage.setItem('autoSaveEnabled', JSON.stringify(newValue));
    
    // Show feedback to user
    if (newValue) {
      alert('Auto-save enabled! Your altar designs will be automatically saved as you work.');
    } else {
      alert('Auto-save disabled. You will need to manually save your altar designs.');
    }
  };

  // Load notification preferences from backend
  useEffect(() => {
    const loadNotificationPreferences = async () => {
      try {
        const response = await userAPI.getNotificationPreferences();
        setNotificationsEnabled(response.notificationsEnabled);
      } catch (error) {
        console.error('Failed to load notification preferences:', error);
        // Keep default value if API fails
      }
    };
    
    loadNotificationPreferences();
  }, []);

  // Load profile privacy from backend
  useEffect(() => {
    const loadProfilePrivacy = async () => {
      try {
        const response = await userAPI.getProfilePrivacy();
        setIsProfilePublic(response.profilePublic);
      } catch (error) {
        // Optionally handle error
      }
    };
    loadProfilePrivacy();
  }, []);

  const handlePrivacyToggle = async () => {
    const newValue = !isProfilePublic;
    setPrivacyLoading(true);
    try {
      await userAPI.updateProfilePrivacy(newValue);
      setIsProfilePublic(newValue);
    } catch (error) {
      // Optionally show error
    } finally {
      setPrivacyLoading(false);
    }
  };

  // Apply theme on component mount
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  return (
    <div className="profile-container">
      {/* Menu Icon */}
      <div className="profile-menu-icon">
        <button
          className="menu-icon"
          aria-label="Menu"
          onClick={() => setMenuOpen((open) => !open)}
        >
          <span>&#9776;</span>
        </button>
        {menuOpen && (
          <div ref={menuRef} className="profile-menu-dropdown">
            <ul className="profile-menu-list">
              <li>
                <button className="profile-menu-item" onClick={() => { setMenuOpen(false); goHome(navigate); }}>🏠 Home</button>
              </li>
              {isAdmin && (
                <li>
                  <button className="profile-menu-item" onClick={() => { setMenuOpen(false); navigate('/admin'); }}>⚙️ Admin Panel</button>
                </li>
              )}
              <li>
                <button className="profile-menu-item" onClick={() => { setMenuOpen(false); navigate('/Createaltar'); }}>🕯️ Create Altar</button>
              </li>
              <li>
                <button className="profile-menu-item" onClick={() => { setMenuOpen(false); handleLogout(); }}>🚪 Logout</button>
              </li>
            </ul>
          </div>
        )}
      </div>
      
      <div className="profile-settings-container">
        <aside className="profile-settings-sidebar">
          <button 
            className={`settings-tab-btn${activeTab === 'profile' ? ' active' : ''}`} 
            data-section="profile"
            onClick={() => setActiveTab('profile')}
          >
            👤 Profile
          </button>
          <button 
            className={`settings-tab-btn${activeTab === 'security' ? ' active' : ''}`} 
            data-section="security"
            onClick={() => setActiveTab('security')}
          >
            🔒 Security
          </button>
          <button 
            className={`settings-tab-btn${activeTab === 'history' ? ' active' : ''}`} 
            data-section="history"
            onClick={() => setActiveTab('history')}
          >
            📚 History
          </button>
          <button 
            className={`settings-tab-btn${activeTab === 'subscriptions' ? ' active' : ''}`} 
            data-section="subscriptions"
            onClick={() => setActiveTab('subscriptions')}
          >
            💳 Subscriptions
          </button>
          <button 
            className={`settings-tab-btn${activeTab === 'billing' ? ' active' : ''}`} 
            data-section="billing"
            onClick={() => setActiveTab('billing')}
          >
            💰 Billing
          </button>
          <button 
            className={`settings-tab-btn${activeTab === 'preferences' ? ' active' : ''}`} 
            data-section="preferences"
            onClick={() => setActiveTab('preferences')}
          >
            ⚙️ Preferences
          </button>
          <button 
            className={`settings-tab-btn${activeTab === 'privacy' ? ' active' : ''}`} 
            data-section="privacy"
            onClick={() => setActiveTab('privacy')}
          >
            🛡️ Privacy
          </button>
        </aside>
        
        <main className="profile-settings-content">
          {activeTab === 'profile' && (
            <section>
              <div className="profile-avatar-section">
                <div className="profile-avatar-container">
                  <img
                    src={user.profile_photo || profilePhoto || 'https://ui-avatars.com/api/?name=User&background=8B5CF6&color=fff&rounded=true&size=128'}
                    alt="avatar"
                    className="profile-avatar"
                  />
                  {!subLoading && subscription && subscription !== 'free' && (
                    <div className="profile-premium-badge">
                      <span className="premium-badge-icon">👑</span>
                      <span className="premium-badge-text">Premium</span>
                    </div>
                  )}
                </div>
                <div className="profile-avatar-buttons">
                  <label className="profile-upload-label">
                    Upload Photo
                    <input type="file" accept="image/*" style={{ display: 'none' }} onChange={handlePhotoChange} />
                  </label>
                  {(profilePhoto || user.profile_photo) && (
                    <button onClick={handleDeletePhoto} className="profile-delete-photo-btn">Delete</button>
                  )}
                </div>
              </div>
              <h2 className="profile-title">Profile</h2>
              
              <form id="profile-form" onSubmit={handleSave} className="profile-form">
                <label className="profile-form-label">Username</label>
                <input
                  name="username"
                  value={form.username}
                  onChange={handleChange}
                  disabled={!editMode}
                  className="profile-form-input"
                />
                <label className="profile-form-label">Email</label>
                <div className="profile-email-row">
                  <input
                    name="email"
                    value={form.email}
                    onChange={handleChange}
                    disabled={!editMode}
                    className="profile-form-input"
                  />
                  {editMode && form.email !== originalEmail && (
                    <button type="button" onClick={handleSendOtp} disabled={otpSent} className="profile-blue-btn">{otpSent ? 'OTP Sent' : 'Send OTP'}</button>
                  )}
                </div>
                {editMode && form.email !== originalEmail && otpSent && !otpVerified && (
                  <div className="profile-otp-section">
                    <input type="text" value={otp} onChange={e => setOtp(e.target.value)} placeholder="Enter OTP" required className="profile-form-input profile-otp-input" />
                    <button type="button" onClick={handleVerifyOtp} disabled={!otp} className="profile-blue-btn">Verify OTP</button>
                  </div>
                )}
                {editMode && form.email !== originalEmail && otpVerified && <div className="profile-otp-verified">OTP Verified</div>}
                {editMode && otpError && <div className="profile-otp-error">{otpError}</div>}
                <label className="profile-form-label">User Type</label>
                <input
                  value={user.role || 'user'}
                  disabled
                  className="profile-form-input"
                />
              </form>
              
              {editMode ? (
                <div className="profile-edit-btn-row">
                  <button type="submit" form="profile-form" className="profile-edit-btn">Save</button>
                  <button type="button" onClick={handleCancel} className="profile-edit-cancel-btn">Cancel</button>
                </div>
              ) : (
                <>
                  <button className="profile-edit-btn" onClick={handleEdit}>Edit Info</button>
                  <button className="profile-delete-btn" onClick={handleDeleteAccount}>Delete Account</button>
                </>
              )}
            </section>
        )}
          
          {activeTab === 'security' && (
            <section>
              <h2 className="profile-title">Security</h2>
              <button className="profile-edit-btn" onClick={() => setShowPasswordForm(true)}>Change Password</button>
      {showPasswordForm && (
        <div className="profile-password-modal">
          <div className="profile-password-modal-content">
                    <form onSubmit={handlePasswordSubmit} className="profile-form">
              <input
                type="password"
                name="current"
                value={passwords.current}
                onChange={handlePasswordChange}
                placeholder="Current Password"
                className="profile-form-input"
                required
                autoComplete="current-password"
              />
              <input
                type="password"
                name="new"
                value={passwords.new}
                onChange={handlePasswordChange}
                placeholder="New Password"
                className="profile-form-input"
                required
                autoComplete="new-password"
              />
              <input
                type="password"
                name="confirm"
                value={passwords.confirm}
                onChange={handlePasswordChange}
                placeholder="Confirm New Password"
                className="profile-form-input"
                required
                autoComplete="new-password"
              />
                      <div className="profile-edit-btn-row">
                <button type="submit" className="profile-blue-btn">Save</button>
                <button type="button" onClick={() => setShowPasswordForm(false)} className="profile-edit-cancel-btn">Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}
            </section>
          )}
          
          {activeTab === 'history' && (
            <section>
              <h2 className="profile-title">Saved Altars History</h2>
              {finalAltars.length === 0 ? (
                <p style={{ color: '#64748b' }}>No saved altars found.</p>
              ) : (
                <ul className="profile-history-list">
                  {finalAltars.map(altar => {
                    let wallData = typeof altar.wall_data === 'string' ? JSON.parse(altar.wall_data) : altar.wall_data;
                    return (
                      <li key={altar.id} className="profile-history-item">
                        <div className="profile-history-title">{altar.wall_name}</div>
                        {wallData.interest && (
                          <div className="profile-theme">
                            Theme: {wallData.interest}
                          </div>
                        )}
                        
                                                {/* Altar Design Preview */}
                        <div className="altar-preview-container">
                          {(() => {
                            const originalWidth = wallData.width || 800;
                            const originalHeight = wallData.height || 500;
                            const previewWidth = Math.min(originalWidth, 200);
                            const previewHeight = Math.min(originalHeight, 120);
                            const scaleX = previewWidth / originalWidth;
                            const scaleY = previewHeight / originalHeight;
                            
                            return (
                              <div 
                                className="altar-preview-canvas"
                                style={{
                                  width: previewWidth,
                                  height: previewHeight,
                                  background: wallData.wallBg && wallData.wallBg !== '' ? `url(${wallData.wallBg}) center/cover no-repeat` : wallData.color || '#3b82f6',
                                  backgroundColor: !wallData.wallBg || wallData.wallBg === '' ? wallData.color || '#3b82f6' : 'transparent',
                                  position: 'relative',
                                  margin: '12px 0',
                                  cursor: 'pointer',
                                  overflow: 'hidden'
                                }}
                                onClick={() => handlePreviewAltar(altar)}
                                title="Click to view larger preview"
                              >
                                {Array.isArray(wallData.images) && wallData.images.map((img, i) => (
                                  <img
                                    key={i}
                                    src={img.src}
                                    alt="altar item"
                                    className="altar-preview-item"
                                    style={{
                                      left: img.x * scaleX,
                                      top: img.y * scaleY,
                                      width: img.w * scaleX,
                                      height: img.h * scaleY,
                                      borderRadius:
                                        img.shape === 'circle' ? '50%' :
                                        img.shape === 'ellipse' ? '50% / 40%' :
                                        img.shape === 'rounded' ? Math.min(20 * scaleX, 8) : 0
                                    }}
                                  />
                                ))}
                              </div>
                            );
                          })()}
                        </div>

                        <div className="profile-public-toggle">
                          <div className="profile-toggle-section">
                            <label className="profile-toggle-label">
                              <input
                                type="checkbox"
                                checked={!!localPublicStatus[altar.id]}
                                onChange={e => setLocalPublicStatus(prev => ({ ...prev, [altar.id]: e.target.checked }))}
                                className="profile-toggle-checkbox"
                              />
                              <span className="profile-toggle-text">Public</span>
                              {!localPublicStatus[altar.id] && (
                                <span className="profile-private-indicator">
                                  <span className="profile-private-icon">🔒</span> Private
                                </span>
                              )}
                            </label>
                          </div>
                        </div>
                        
                        <div className="profile-history-buttons">
                          <button
                            className="profile-history-btn"
                            onClick={() => { navigate('/createaltar', { state: { altar } }); }}
                          >
                            Load Altar
                          </button>
                          <button
                            className="profile-delete-btn"
                            onClick={() => handleDeleteAltar(altar.id)}
                          >
                            Delete
                          </button>
                          {localPublicStatus[altar.id] && (
                            <button
                              className="profile-history-btn"
                              onClick={() => {
                                if (subscription === 'free') {
                                  setShowUpgradeMsg(true);
                                  return;
                                }
                                handleShareAltar(altar);
                              }}
                            >
                              Share
                            </button>
                          )}
                        </div>
                      </li>
                    );
                  })}
                </ul>
              )}
            </section>
          )}
          
          {activeTab === 'preferences' && (
            <section>
              <h2 className="profile-title">Preferences</h2>
              
              <div className="preferences-section">
                
                <div className="preferences-item">
                  <div className="preferences-item-content">
                    <div className="preferences-item-info">
                      <h3 className="preferences-item-title">Notifications</h3>
                      <p className="preferences-item-description">
                        Receive notifications about altar updates, subscription changes, and new features.
                      </p>
                    </div>
                    <div className="preferences-item-control">
                      <label className="preferences-toggle">
                        <input
                          type="checkbox"
                          checked={notificationsEnabled}
                          onChange={handleNotificationToggle}
                          disabled={notificationLoading}
                          className="preferences-toggle-input"
                        />
                        <span className="preferences-toggle-slider"></span>
                      </label>
                      {notificationLoading && (
                        <span className="preferences-loading">Updating...</span>
                      )}
                    </div>
                  </div>
                </div>
                
                <div className="preferences-item">
                  <div className="preferences-item-content">
                    <div className="preferences-item-info">
                      <h3 className="preferences-item-title">Theme</h3>
                      <p className="preferences-item-description">
                        Choose your preferred color theme for the application.
                      </p>
                    </div>
                    <div className="preferences-item-control">
                      <select 
                        className="preferences-select" 
                        value={theme}
                        onChange={handleThemeChange}
                      >
                        <option value="light">Light Theme</option>
                        <option value="dark">Dark Theme</option>
                        <option value="auto">Auto (System)</option>
                      </select>
                    </div>
                  </div>
                </div>
                
                <div className="preferences-item">
                  <div className="preferences-item-content">
                    <div className="preferences-item-info">
                      <h3 className="preferences-item-title">Language</h3>
                      <p className="preferences-item-description">
                        Select your preferred language for the interface.
                      </p>
                    </div>
                    <div className="preferences-item-control">
                      <select 
                        className="preferences-select" 
                        value={language}
                        onChange={handleLanguageChange}
                      >
                        <option value="en">English</option>
                        <option value="es">Español</option>
                        <option value="fr">Français</option>
                        <option value="de">Deutsch</option>
                        <option value="hi">हिंदी</option>
                      </select>
                    </div>
                  </div>
                </div>
                
                <div className="preferences-item">
                  <div className="preferences-item-content">
                    <div className="preferences-item-info">
                      <h3 className="preferences-item-title">Auto-Save</h3>
                      <p className="preferences-item-description">
                        Automatically save your altar designs as you work.
                      </p>
                    </div>
                    <div className="preferences-item-control">
                      <label className="preferences-toggle">
                        <input
                          type="checkbox"
                          checked={autoSaveEnabled}
                          onChange={handleAutoSaveToggle}
                          className="preferences-toggle-input"
                        />
                        <span className="preferences-toggle-slider"></span>
                      </label>
                    </div>
                  </div>
                </div>
              </div>
            </section>
          )}
          
          {activeTab === 'privacy' && (
            <section>
              <h2 className="profile-title">Privacy</h2>
              <div className="preferences-section">
                <div className="preferences-item">
                  <div className="preferences-item-content">
                    <div className="preferences-item-info">
                      <h3 className="preferences-item-title">Profile Privacy</h3>
                      <p className="preferences-item-description">
                        Set your profile as public or private.
                      </p>
                    </div>
                    <div className="preferences-item-control">
                      <label className="preferences-toggle">
                        <input
                          type="checkbox"
                          checked={isProfilePublic}
                          onChange={handlePrivacyToggle}
                          disabled={privacyLoading}
                          className="preferences-toggle-input"
                        />
                        <span className="preferences-toggle-slider"></span>
                      </label>
                      <span style={{ marginLeft: 12, fontWeight: 600 }}>
                        {isProfilePublic ? 'Public' : 'Private'}
                      </span>
                      {privacyLoading && <span className="preferences-loading">Updating...</span>}
                    </div>
                  </div>
                </div>
              </div>
            </section>
          )}
          
          {activeTab === 'subscriptions' && (
            <section>
              <h2 className="profile-title">Manage Subscriptions</h2>
              {subError && <div className="subscription-error">{subError}</div>}
              {lastSuccessPlan === 'free' && (
                <div className="subscription-success">Subscription successful!</div>
              )}
              {subscriptionEnd && (
                <div style={{ color: '#64748b', textAlign: 'center', marginBottom: 8 }}>
                  Subscription ends on: {new Date(subscriptionEnd).toLocaleDateString()}
                </div>
              )}
              <div className="subscription-plans-container">
                <div className="subscription-plan-card">
                  <div className="subscription-plan-icon">💎</div>
                  <div className="subscription-plan-title">Free</div>
                  <div className="subscription-plan-description">Create up to 3 altars with basic features</div>
                  {subscription === 'free' ? (
                    <div className="subscription-current-plan">✔ Current Plan</div>
                  ) : (
                    <button
                      className="profile-blue-btn subscription-premium-btn"
                      onClick={() => handleSubscribe('free')}
                      disabled={subLoadingPlan === 'free'}
                    >
                      {subLoadingPlan === 'free' ? 'Updating...' : 'Switch to Free'}
                    </button>
                  )}
                </div>
                
                <div 
                  className="subscription-plan-card clickable"
                  onClick={() => setActiveTab('subscriptions-premium')}
                >
                  <div className="subscription-plan-icon">🚀</div>
                  <div className="subscription-plan-title">Premium</div>
                  <div className="subscription-plan-description">Unlock all premium features</div>
                  {subscription !== 'free' && (
                    <div className="subscription-current-plan">✔ Current Plan</div>
                  )}
                </div>
              </div>
            </section>
          )}
          
          {activeTab === 'subscriptions-premium' && (
            <section>
              <h2 className="profile-title">Premium Plans</h2>
              <button onClick={() => setActiveTab('subscriptions')} className="subscription-back-btn">← Back</button>
              
              <div className="subscription-premium-container">
                {[
                  { name: 'basic', display: 'Basic', icon: '⭐', price: '₹99/month', features: ['✅ Unlimited Altars', '✅ All Design Elements', '✅ Custom Background Upload', '✅ Sharing & Export'] },
                  { name: 'silver', display: 'Silver', icon: '📅', price: '₹249/3 months', features: ['✅ Unlimited Altars', '✅ All Design Elements', '✅ Custom Background Upload', '✅ Sharing & Export', '✅ Advanced Templates'] },
                  { name: 'gold', display: 'Gold', icon: '🗓️', price: '₹449/6 months', features: ['✅ Unlimited Altars', '✅ All Design Elements', '✅ Custom Background Upload', '✅ Sharing & Export', '✅ Advanced Templates', '✅ Custom Uploads'] },
                  { name: 'platinum', display: 'Platinum', icon: '🏆', price: '₹799/year', features: ['✅ Unlimited Altars', '✅ All Design Elements', '✅ Custom Background Upload', '✅ Sharing & Export', '✅ Advanced Templates', '✅ Custom Uploads', '✅ Exclusive Designs'] },
                ].map(plan => {
                  const isCurrent = subscription === plan.name;
                  return (
                    <div key={plan.name} className={`subscription-premium-card${isCurrent ? ' current' : ''}`}>
                      <div className="subscription-premium-icon">{plan.icon}</div>
                      <div className="subscription-premium-title">{plan.display}</div>
                      <div className="subscription-premium-price">{plan.price}</div>
                      <div className="subscription-premium-features">
                        {plan.features.map((f, i) => (
                          <div key={i} className="subscription-premium-feature">{f}</div>
                        ))}
                      </div>
                      {lastSuccessPlan === plan.name && (
                        <div className="subscription-success">Subscription successful!</div>
                      )}
                      {isCurrent ? (
                        <button
                          className="profile-delete-btn subscription-premium-btn current"
                          disabled
                        >
                          Current Plan
                        </button>
                      ) : (
                        <button
                          className="profile-blue-btn subscription-premium-btn"
                          onClick={() => handleSubscribe(plan.name)}
                          disabled={subLoadingPlan === plan.name}
                        >
                          {subLoadingPlan === plan.name ? 'Updating...' : 'Buy Now'}
                        </button>
                      )}
                      {isCurrent && (
                        <div className="subscription-current-indicator">✔</div>
                      )}
                    </div>
                  );
                })}
              </div>
            </section>
          )}
          
          {activeTab === 'billing' && (
            <section>
              <h2 className="profile-title">Billing History</h2>
              {billingLoading ? (
                <div className="billing-loading">Loading...</div>
              ) : billingError ? (
                <div className="billing-error">{billingError}</div>
              ) : billingHistory.length === 0 ? (
                <div className="billing-empty">No billing history found.</div>
              ) : (
                <div className="billing-table-container">
                  <table className="billing-table">
                    <thead className="billing-table-header">
                      <tr>
                        <th>Plan</th>
                        <th>Amount</th>
                        <th>Start Date</th>
                        <th>End Date</th>
                      </tr>
                    </thead>
                    <tbody>
                      {billingHistory.map(item => (
                        <tr key={item.id} className="billing-table-row">
                          <td className="billing-table-cell">{item.plan}</td>
                          <td className="billing-table-cell">{item.amount}</td>
                          <td className="billing-table-cell">{new Date(item.start_date).toLocaleDateString()}</td>
                          <td className="billing-table-cell">{item.end_date ? new Date(item.end_date).toLocaleDateString() : '-'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </section>
          )}
        </main>
      </div>

      {/* Enlarged Altar Preview Modal */}
      {showPreview && previewAltar && (
        <div className="altar-preview-modal">
          <div className="altar-preview-content">
            <button 
              onClick={closePreview} 
              className="altar-preview-close"
            >
              &times;
            </button>
            <div>
              <h3 className="altar-preview-title">
                {previewAltar.wall_name}
              </h3>
              {(() => {
                let wallData = typeof previewAltar.wall_data === 'string' ? JSON.parse(previewAltar.wall_data) : previewAltar.wall_data;
                const originalWidth = wallData.width || 800;
                const originalHeight = wallData.height || 500;
                const maxWidth = 800;
                const maxHeight = 500;
                const scaleX = Math.min(maxWidth / originalWidth, maxHeight / originalHeight);
                const scaleY = scaleX; // Maintain aspect ratio
                const displayWidth = originalWidth * scaleX;
                const displayHeight = originalHeight * scaleY;
                
                return (
                  <div
                    className="altar-preview-canvas"
                    style={{
                      width: displayWidth,
                      height: displayHeight,
                      background: wallData.wallBg && wallData.wallBg !== '' ? `url(${wallData.wallBg}) center/cover no-repeat` : wallData.color || '#3b82f6',
                      backgroundColor: !wallData.wallBg || wallData.wallBg === '' ? wallData.color || '#3b82f6' : 'transparent',
                      position: 'relative',
                      margin: '0 auto',
                      overflow: 'hidden'
                    }}
                  >
                    {Array.isArray(wallData.images) && wallData.images.map((img, i) => (
                      <img
                        key={i}
                        src={img.src}
                        alt="altar item"
                        className="altar-preview-item"
                        style={{
                          left: img.x * scaleX,
                          top: img.y * scaleY,
                          width: img.w * scaleX,
                          height: img.h * scaleY,
                          borderRadius:
                            img.shape === 'circle' ? '50%' :
                            img.shape === 'ellipse' ? '50% / 40%' :
                            img.shape === 'rounded' ? Math.max(20 * scaleX, 8) : 0
                        }}
                      />
                    ))}
                  </div>
                );
              })()}
              {(() => {
                let wallData = typeof previewAltar.wall_data === 'string' ? JSON.parse(previewAltar.wall_data) : previewAltar.wall_data;
                return wallData.interest && (
                  <div className="altar-preview-theme">
                    Theme: {wallData.interest}
                  </div>
                );
              })()}
            </div>
          </div>
        </div>
      )}
      
      {shareModal.open && (
        <div className="share-modal-overlay">
          <div className="share-modal-content">
            <button
              onClick={() => { setShareModal({ open: false, mode: null, link: '' }); setShareMenuOpen(false); }}
              className="share-modal-close"
              aria-label="Close"
            >
              &times;
            </button>
            {!shareModal.mode && (
              <>
                <h3 className="share-modal-title">Share this altar</h3>
                <button className="profile-blue-btn" onClick={() => handleSelectShareMode('view')}>Share View Link (read-only)</button>
                <button className="profile-blue-btn" onClick={() => handleSelectShareMode('edit')}>Share Edit Link (can edit)</button>
              </>
            )}
            {shareModal.mode && (
              <>
                <h3 className="share-modal-title">{shareModal.mode === 'view' ? 'View Link (read-only)' : 'Edit Link (can edit)'}</h3>
                <input
                  type="text"
                  value={shareModal.link}
                  readOnly
                  className="share-modal-input"
                  onFocus={e => e.target.select()}
                />
                <button className="profile-blue-btn" onClick={() => {navigator.clipboard.writeText(shareModal.link); setCopied(true); setTimeout(() => setCopied(false), 1500);}}>Copy Link</button>
                <div className="share-modal-buttons">
                  <div className="share-menu-container">
                    <button className="profile-blue-btn" onClick={() => setShareMenuOpen(open => !open)}>
                      Share via...
                    </button>
                    {shareMenuOpen && (
                      <div
                        ref={shareMenuRef}
                        className="share-menu-dropdown"
                      >
                        {shareOptions.map(opt => (
                          <a
                            key={opt.name}
                            href={opt.disabled ? undefined : opt.getUrl(shareModal.link)}
                            target="_blank"
                            rel="noopener noreferrer"
                            className={`share-menu-item${opt.disabled ? ' disabled' : ''}`}
                            style={{ color: opt.color }}
                            onClick={() => setShareMenuOpen(false)}
                            tabIndex={opt.disabled ? -1 : 0}
                          >
                            {opt.name}
                            {opt.disabled && <span style={{ fontSize: 12, color: '#888', marginLeft: 6 }}>(not supported)</span>}
                          </a>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
                {copied && <div className="share-copied-message">Link copied!</div>}
              </>
            )}
          </div>
        </div>
      )}
      
      {showUpgradeMsg && (
        <div className="upgrade-modal-overlay">
          <div className="upgrade-modal-content">
            <div className="upgrade-modal-title">Upgrade to Premium</div>
            <div className="upgrade-modal-description">Upgrade to a premium plan to use the share feature and unlock all features!</div>
            <div className="upgrade-modal-buttons">
              <button className="upgrade-btn" onClick={() => { setShowUpgradeMsg(false); navigate('/subscriptions'); }}>Upgrade</button>
              <button className="upgrade-cancel-btn" onClick={() => setShowUpgradeMsg(false)}>Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Profile; 