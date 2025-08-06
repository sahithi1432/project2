import { useState, useEffect, useRef } from 'react';
import WallPreview from './WallPreview';
import { wallAPI } from '../services/api';
import { adminAPI } from '../services/api';
import { authAPI } from '../services/api';
import { useNavigate } from 'react-router-dom';
import { logout, goHome, handleClickOutside } from '../utils/authUtils.js';
import './admin.css';
import { getApiUrl } from '../config/environment.js';

function UsersSection() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [editId, setEditId] = useState(null);
  const [editData, setEditData] = useState({ username: '', email: '', role: '' });
  const [actionLoading, setActionLoading] = useState(false);
  const [actionError, setActionError] = useState('');
  const [search, setSearch] = useState("");
  const [passwordPrompt, setPasswordPrompt] = useState({ open: false, action: null, user: null });
  const [adminPassword, setAdminPassword] = useState('');
  const [verifying, setVerifying] = useState(false);
  const [verifyError, setVerifyError] = useState('');
  const [addUserModal, setAddUserModal] = useState(false);
  const [newUser, setNewUser] = useState({ username: '', email: '', password: '', role: 'user' });
  const [addUserLoading, setAddUserLoading] = useState(false);
  const [addUserError, setAddUserError] = useState('');
  const [addUserAdminPassword, setAddUserAdminPassword] = useState('');
  const [addUserVerifying, setAddUserVerifying] = useState(false);
  const [addUserVerifyError, setAddUserVerifyError] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [otp, setOtp] = useState('');
  const [otpVerified, setOtpVerified] = useState(false);
  const [otpError, setOtpError] = useState('');
  const [editUserModal, setEditUserModal] = useState(false);
  const [editUserOtpSent, setEditUserOtpSent] = useState(false);
  const [editUserOtp, setEditUserOtp] = useState('');
  const [editUserOtpVerified, setEditUserOtpVerified] = useState(false);
  const [editUserOtpError, setEditUserOtpError] = useState('');
  const [editUserOriginalEmail, setEditUserOriginalEmail] = useState('');

  // Fetch users
  const fetchUsers = () => {
    setLoading(true);
    setError('');
    const token = localStorage.getItem('token');
    fetch(`${getApiUrl()}/auth/users`, {
      headers: { 'Authorization': `Bearer ${token}` }
    })
      .then(res => {
        if (!res.ok) throw new Error('Failed to fetch users');
        return res.json();
      })
      .then(data => setUsers(data))
      .catch(err => setError(err.message))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  // Start editing
  const handleEdit = (user) => {
    setEditId(user.id);
    setEditData({ username: user.username, email: user.email, role: user.role });
    setEditUserOriginalEmail(user.email);
    setEditUserModal(true);
    setActionError('');
    setEditUserOtpSent(false);
    setEditUserOtp('');
    setEditUserOtpVerified(true); // If email not changed, allow save
    setEditUserOtpError('');
  };

  // Cancel editing
  const handleCancel = () => {
    setEditId(null);
    setEditData({ username: '', email: '', role: '' });
    setActionError('');
  };

  // Save changes (with OTP verification for email change)
  const handleEditUserSave = async (e) => {
    e.preventDefault();
    setActionLoading(true);
    setActionError('');
    try {
      if (editData.email !== editUserOriginalEmail && !editUserOtpVerified) {
        setActionError('Please verify the new email with OTP.');
        return;
      }
      // Update username/email
      const res1 = await fetch(`${getApiUrl()}/auth/users/${editId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ username: editData.username, email: editData.email })
      });
      if (!res1.ok) throw new Error('Failed to update user info');
      // Update role if changed
      if (editData.role !== users.find(u => u.id === editId).role) {
        const res2 = await fetch(`${getApiUrl()}/auth/set-role`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          },
          body: JSON.stringify({ userId: editId, role: editData.role })
        });
        if (!res2.ok) throw new Error('Failed to update user role');
      }
      fetchUsers();
      setEditId(null);
      setEditUserModal(false);
    } catch (err) {
      setActionError(err.message);
    } finally {
      setActionLoading(false);
    }
  };

  // Delete user
  const handleDelete = async (user) => {
    if (!window.confirm('Are you sure you want to delete this user?')) return;
    setActionLoading(true);
    setActionError('');
    try {
      const res = await fetch(`${getApiUrl()}/auth/users/${user.id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      if (!res.ok) throw new Error('Failed to delete user');
      fetchUsers();
    } catch (err) {
      setActionError(err.message);
    } finally {
      setActionLoading(false);
    }
  };

  // Show password prompt before edit or delete
  const requestPassword = (action, user) => {
    setPasswordPrompt({ open: true, action, user });
    setAdminPassword('');
    setVerifyError('');
  };

  // Handle password verification and action
  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    setVerifying(true);
    setVerifyError('');
    try {
      // Call backend to verify password
      const token = localStorage.getItem('token');
      const res = await fetch(`${getApiUrl()}/auth/verify-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ password: adminPassword })
      });
      if (!res.ok) throw new Error((await res.json()).message || 'Password verification failed');
      // If verified, proceed with action
      if (passwordPrompt.action === 'edit') {
        handleEdit(passwordPrompt.user);
        setPasswordPrompt({ open: false, action: null, user: null });
      } else if (passwordPrompt.action === 'delete') {
        setPasswordPrompt({ open: false, action: null, user: null }); // Close modal first
        setTimeout(() => {
          if (window.confirm('Are you sure you want to delete this user? This action cannot be undone.')) {
            handleDeleteConfirmed(passwordPrompt.user);
          }
        }, 0);
      }
    } catch (err) {
      setVerifyError(err.message);
    } finally {
      setVerifying(false);
    }
  };

  // Confirmed delete after password
  const handleDeleteConfirmed = async (user) => {
    setActionLoading(true);
    setActionError('');
    try {
      console.log('Attempting to delete user:', user.id);
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('No authentication token found. Please log in again.');
      }
      
      const res = await fetch(`${getApiUrl()}/auth/users/${user.id}`, {
        method: 'DELETE',
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      console.log('Delete response status:', res.status);
      
      if (!res.ok) {
        let errorMessage = 'Failed to delete user';
        try {
          const errorData = await res.json();
          errorMessage = errorData.message || errorMessage;
        } catch (parseError) {
          console.error('Error parsing response:', parseError);
        }
        throw new Error(`${errorMessage} (Status: ${res.status})`);
      }
      
      const result = await res.json();
      console.log('Delete successful:', result);
      
      fetchUsers();
      alert('User deleted successfully.');
    } catch (err) {
      console.error('Delete user error:', err);
      setActionError(err.message);
      alert(`Error deleting user: ${err.message}`);
    } finally {
      setActionLoading(false);
    }
  };

  // Add user handler
  const handleAddUser = async (e) => {
    e.preventDefault();
    setAddUserLoading(true);
    setAddUserError('');
    setAddUserVerifyError('');
    setOtpError('');
    try {
      // Verify admin password first
      setAddUserVerifying(true);
      const token = localStorage.getItem('token');
      const res = await fetch(`${getApiUrl()}/auth/verify-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ password: addUserAdminPassword })
      });
      if (!res.ok) throw new Error((await res.json()).message || 'Password verification failed');
      setAddUserVerifying(false);
      // Require OTP verification
      if (!otpVerified) {
        setAddUserError('Please verify the OTP sent to the user email.');
        return;
      }
      // Create user (admin bypasses OTP, so use a special endpoint or allow admin to create directly)
              const res2 = await fetch(`${getApiUrl()}/auth/users`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(newUser)
      });
      if (!res2.ok) throw new Error((await res2.json()).message || 'Failed to create user');
      setAddUserModal(false);
      setNewUser({ username: '', email: '', password: '', role: 'user' });
      setAddUserAdminPassword('');
      setOtp('');
      setOtpSent(false);
      setOtpVerified(false);
      fetchUsers();
      setTimeout(() => {
        alert('User added successfully.');
      }, 0);
    } catch (err) {
      setAddUserError(err.message);
    } finally {
      setAddUserLoading(false);
      setAddUserVerifying(false);
    }
  };

  // Send OTP to entered email
  const handleSendOtp = async () => {
    setOtpError('');
    setOtp('');
    setOtpVerified(false);
    try {
      await authAPI.sendOtp(newUser.email);
      setOtpSent(true);
    } catch (err) {
      setOtpError(err.message || 'Failed to send OTP');
    }
  };

  // Verify OTP
  const handleVerifyOtp = async () => {
    setOtpError('');
    try {
      await authAPI.verifyOtp(newUser.email, otp);
      setOtpVerified(true);
    } catch (err) {
      setOtpError(err.message || 'OTP verification failed');
      setOtpVerified(false);
    }
  };

  // Send OTP for edit email
  const handleEditUserSendOtp = async () => {
    setEditUserOtpError('');
    setEditUserOtp('');
    setEditUserOtpVerified(false);
    try {
      await authAPI.sendOtp(editData.email);
      setEditUserOtpSent(true);
    } catch (err) {
      setEditUserOtpError(err.message || 'Failed to send OTP');
    }
  };

  // Verify OTP for edit email
  const handleEditUserVerifyOtp = async () => {
    setEditUserOtpError('');
    try {
      await authAPI.verifyOtp(editData.email, editUserOtp);
      setEditUserOtpVerified(true);
    } catch (err) {
      setEditUserOtpError(err.message || 'OTP verification failed');
      setEditUserOtpVerified(false);
    }
  };

  return (
    <div>
      <h2>Users</h2>
      <button className="admin-export-btn" style={{ marginBottom: 12 }} onClick={() => setAddUserModal(true)}>Add User</button>
      <input
        type="text"
        placeholder="Search by username or email..."
        value={search}
        onChange={e => setSearch(e.target.value)}
        className="admin-search-input"
      />
      {loading ? <div className="admin-loading">Loading users...</div> : error ? <div className="admin-error">{error}</div> : (
        <div className="admin-table-container">
          <table className="admin-table users-table">
            <thead>
              <tr>
                <th>#</th>
                <th>ID</th>
                <th>Username</th>
                <th>Email</th>
                <th>Role</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {users
                .filter(user =>
                  user.username.toLowerCase().includes(search.toLowerCase()) ||
                  user.email.toLowerCase().includes(search.toLowerCase())
                )
                .map((user, idx) => (
                  <tr key={user.id}>
                    <td>{idx + 1}</td>
                    <td>{user.id}</td>
                    <td>
                      {editId === user.id ? (
                        <input value={editData.username} onChange={e => setEditData({ ...editData, username: e.target.value })} />
                      ) : (
                        <div className="user-info">
                          <div className="user-name">{user.username}</div>
                        </div>
                      )}
                    </td>
                    <td>
                      {editId === user.id ? (
                        <input value={editData.email} onChange={e => setEditData({ ...editData, email: e.target.value })} />
                      ) : (
                        <div className="user-email">{user.email}</div>
                      )}
                    </td>
                    <td>
                      {editId === user.id ? (
                        <select value={editData.role} onChange={e => setEditData({ ...editData, role: e.target.value })}>
                          <option value="user">user</option>
                          <option value="admin">admin</option>
                        </select>
                      ) : (
                        <div className="status-cell">
                          <span className={`status-dot status-${user.role === 'admin' ? 'active' : 'inactive'}`}></span>
                          <span>{user.role}</span>
                        </div>
                      )}
                    </td>
                    <td>
                      {editId === user.id ? (
                        <>
                          <button className="admin-export-btn" onClick={() => handleEditUserSave(user)} disabled={actionLoading}>Save</button>
                          <button className="admin-export-btn" onClick={handleCancel} disabled={actionLoading}>Cancel</button>
                        </>
                      ) : (
                        <>
                          <button className="admin-export-btn" onClick={() => requestPassword('edit', user)} disabled={actionLoading}>Edit</button>
                          <button className="admin-export-btn" onClick={() => requestPassword('delete', user)} disabled={actionLoading}>Delete</button>
                        </>
                      )}
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      )}
      {actionError && <div className="admin-error">{actionError}</div>}
      {addUserModal && (
        <div className="add-user-modal-overlay">
          <form onSubmit={handleAddUser} className="add-user-modal-dialog" style={{ position: 'relative' }}>
            <button type="button" className="add-user-modal-close" onClick={() => setAddUserModal(false)} aria-label="Close">&times;</button>
            <div className="add-user-modal-header">Add New User</div>
            <div className="add-user-modal-content">
              <input type="text" value={newUser.username} onChange={e => setNewUser({ ...newUser, username: e.target.value })} placeholder="Username" required disabled={addUserLoading} className="add-user-input" />
              <div style={{ display: 'flex', gap: 8 }}>
                <input type="email" value={newUser.email} onChange={e => { setNewUser({ ...newUser, email: e.target.value }); setOtpSent(false); setOtpVerified(false); setOtp(''); }} placeholder="Email" required disabled={addUserLoading} className="add-user-input" style={{ flex: 1 }} />
                <button type="button" onClick={handleSendOtp} disabled={addUserLoading || !newUser.email || otpSent} className={`add-user-btn${otpSent ? ' add-user-btn-success' : ''}`} style={{ fontSize: 15 }}>{otpSent ? 'OTP Sent' : 'Send OTP'}</button>
              </div>
              {otpSent && !otpVerified && (
                <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                  <input type="text" value={otp} onChange={e => setOtp(e.target.value)} placeholder="Enter OTP" required disabled={addUserLoading} className="add-user-input" style={{ flex: 1 }} />
                  <button type="button" onClick={handleVerifyOtp} disabled={addUserLoading || !otp} className="add-user-btn add-user-btn-success" style={{ fontSize: 15 }}>Verify OTP</button>
                </div>
              )}
              {otpVerified && <div className="add-user-status-success">OTP Verified</div>}
              {otpError && <div className="add-user-status-error">{otpError}</div>}
              <input type="password" value={newUser.password} onChange={e => setNewUser({ ...newUser, password: e.target.value })} placeholder="Password" required disabled={addUserLoading} className="add-user-input" autoComplete="new-password" />
              <select value={newUser.role} onChange={e => setNewUser({ ...newUser, role: e.target.value })} disabled={addUserLoading} className="add-user-input">
                <option value="user">user</option>
                <option value="admin">admin</option>
              </select>
              <input type="password" value={addUserAdminPassword} onChange={e => setAddUserAdminPassword(e.target.value)} placeholder="Admin Password" required disabled={addUserLoading || addUserVerifying} className="add-user-input" autoComplete="current-password" />
              {addUserError && <div className="add-user-status-error">{addUserError}</div>}
              {addUserVerifyError && <div className="add-user-status-error">{addUserVerifyError}</div>}
              <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end', marginTop: 8 }}>
                <button type="button" onClick={() => setAddUserModal(false)} className="add-user-btn add-user-btn-cancel" disabled={addUserLoading}>Cancel</button>
                <button type="submit" className="add-user-btn" disabled={addUserLoading || addUserVerifying || !otpVerified}>{addUserLoading ? 'Adding...' : 'Add User'}</button>
              </div>
            </div>
          </form>
        </div>
      )}
      {editUserModal && (
        <div className="add-user-modal-overlay">
          <form onSubmit={handleEditUserSave} className="add-user-modal-dialog" style={{ position: 'relative' }}>
            <button type="button" className="add-user-modal-close" onClick={() => { setEditUserModal(false); setEditId(null); }} aria-label="Close">&times;</button>
            <div className="add-user-modal-header">Edit User</div>
            <div className="add-user-modal-content">
              <input type="text" value={editData.username} onChange={e => setEditData({ ...editData, username: e.target.value })} placeholder="Username" required disabled={actionLoading} className="add-user-input" />
              <div style={{ display: 'flex', gap: 8 }}>
                <input type="email" value={editData.email} onChange={e => { setEditData({ ...editData, email: e.target.value }); setEditUserOtpSent(false); setEditUserOtpVerified(false); setEditUserOtp(''); }} placeholder="Email" required disabled={actionLoading} className="add-user-input" style={{ flex: 1 }} />
                <button type="button" onClick={handleEditUserSendOtp} disabled={actionLoading || !editData.email || editData.email === editUserOriginalEmail || editUserOtpSent} className={`add-user-btn${editUserOtpSent ? ' add-user-btn-success' : ''}`} style={{ fontSize: 15 }}>{editUserOtpSent ? 'OTP Sent' : 'Send OTP'}</button>
              </div>
              {editData.email !== editUserOriginalEmail && editUserOtpSent && !editUserOtpVerified && (
                <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                  <input type="text" value={editUserOtp} onChange={e => setEditUserOtp(e.target.value)} placeholder="Enter OTP" required disabled={actionLoading} className="add-user-input" style={{ flex: 1 }} />
                  <button type="button" onClick={handleEditUserVerifyOtp} disabled={actionLoading || !editUserOtp} className="add-user-btn add-user-btn-success" style={{ fontSize: 15 }}>Verify OTP</button>
                </div>
              )}
              {editData.email !== editUserOriginalEmail && editUserOtpVerified && <div className="add-user-status-success">OTP Verified</div>}
              {editUserOtpError && <div className="add-user-status-error">{editUserOtpError}</div>}
              <select value={editData.role} onChange={e => setEditData({ ...editData, role: e.target.value })} disabled={actionLoading} className="add-user-input">
                <option value="user">user</option>
                <option value="admin">admin</option>
              </select>
              {actionError && <div className="add-user-status-error">{actionError}</div>}
              <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end', marginTop: 8 }}>
                <button type="button" onClick={() => { setEditUserModal(false); setEditId(null); }} className="add-user-btn add-user-btn-cancel" disabled={actionLoading}>Cancel</button>
                <button type="submit" className="add-user-btn" disabled={actionLoading || (editData.email !== editUserOriginalEmail && !editUserOtpVerified)}>{actionLoading ? 'Saving...' : 'Save'}</button>
              </div>
            </div>
          </form>
        </div>
      )}
      {/* Password prompt modal */}
      {passwordPrompt.open && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', background: 'rgba(0,0,0,0.4)', zIndex: 2000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <form onSubmit={handlePasswordSubmit} style={{ background: '#fff', borderRadius: 10, padding: 32, minWidth: 320, boxShadow: '0 2px 16px #0002', display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div style={{ fontWeight: 600, fontSize: 18 }}>Admin Password Required</div>
            <input type="password" value={adminPassword} onChange={e => setAdminPassword(e.target.value)} placeholder="Enter your password" style={{ padding: 8, borderRadius: 6, border: '1px solid #cbd5e1' }} autoFocus required disabled={verifying} autoComplete="current-password" />
            {verifyError && <div style={{ color: '#dc2626' }}>{verifyError}</div>}
            <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
              <button type="button" onClick={() => setPasswordPrompt({ open: false, action: null, user: null })} style={{ background: '#e5e7eb', border: 'none', borderRadius: 6, padding: '6px 16px', cursor: 'pointer' }} disabled={verifying}>Cancel</button>
              <button type="submit" style={{ background: '#6366f1', color: '#fff', border: 'none', borderRadius: 6, padding: '6px 16px', cursor: 'pointer' }} disabled={verifying}>{verifying ? 'Verifying...' : 'Confirm'}</button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}

function SubscriptionsSection() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [granting, setGranting] = useState({}); // { userId: true/false }
  const [selectedPlan, setSelectedPlan] = useState({}); // { userId: plan }
  const [grantPasswordPrompt, setGrantPasswordPrompt] = useState({ open: false, userId: null });
  const [grantAdminPassword, setGrantAdminPassword] = useState('');
  const [grantVerifying, setGrantVerifying] = useState(false);
  const [grantVerifyError, setGrantVerifyError] = useState('');
  const [search, setSearch] = useState('');
  useEffect(() => {
    adminAPI.getAllUsers()
      .then(data => setUsers(data))
      .catch(err => setError(err.message || 'Failed to fetch users'))
      .finally(() => setLoading(false));
  }, []);
  const handleGrantFree = async (userId) => {
    setGranting(g => ({ ...g, [userId]: true }));
    try {
      const plan = selectedPlan[userId] || 'pro';
      await adminAPI.grantFreeSubscription(userId, plan);
      await adminAPI.getAllUsers().then(data => setUsers(data));
      alert('Free subscription granted!');
    } catch (err) {
      alert(err.message || 'Failed to grant free subscription');
    } finally {
      setGranting(g => ({ ...g, [userId]: false }));
    }
  };
  const handleGrantPasswordSubmit = async (e) => {
    e.preventDefault();
    setGrantVerifying(true);
    setGrantVerifyError('');
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${getApiUrl()}/auth/verify-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ password: grantAdminPassword })
      });
      if (!res.ok) throw new Error((await res.json()).message || 'Password verification failed');
      // If verified, proceed with grant
      await handleGrantFree(grantPasswordPrompt.userId);
      setGrantPasswordPrompt({ open: false, userId: null });
      setGrantAdminPassword('');
    } catch (err) {
      setGrantVerifyError(err.message);
    } finally {
      setGrantVerifying(false);
    }
  };
  return (
    <div>
      <h2>Subscriptions</h2>
      <input
        type="text"
        placeholder="Search by username, email, or plan..."
        value={search}
        onChange={e => setSearch(e.target.value)}
        className="admin-search-input"
      />
      {loading ? <div className="admin-loading">Loading subscriptions...</div> : error ? <div className="admin-error">{error}</div> : (
        <div className="admin-table-container">
          <table className="admin-table subscriptions-table">
            <thead>
              <tr>
                <th>#</th>
                <th>ID</th>
                <th>Username</th>
                <th>Email</th>
                <th>Plan</th>
                <th>Start Date</th>
                <th>End Date</th>
                <th>Grant Free Subscription</th>
              </tr>
            </thead>
            <tbody>
              {users
                .filter(user =>
                  user.username.toLowerCase().includes(search.toLowerCase()) ||
                  user.email.toLowerCase().includes(search.toLowerCase()) ||
                  (user.subscription_plan || '').toLowerCase().includes(search.toLowerCase())
                )
                .map((user, idx) => (
                  <tr key={user.id}>
                    <td>{idx + 1}</td>
                    <td>{user.id}</td>
                    <td>
                      <div className="user-info">
                        <div className="user-name">{user.username}</div>
                      </div>
                    </td>
                    <td>
                      <div className="user-email">{user.email}</div>
                    </td>
                    <td>
                      {user.subscription_plan ? (
                        <span className={`plan-badge plan-${user.subscription_plan.toLowerCase()}`}>
                          {user.subscription_plan}
                        </span>
                      ) : (
                        <span className="plan-badge plan-free">Free</span>
                      )}
                    </td>
                    <td className="date-cell">
                      {user.subscription_start ? new Date(user.subscription_start).toLocaleDateString() : '-'}
                    </td>
                    <td className="date-cell">
                      {user.subscription_end ? new Date(user.subscription_end).toLocaleDateString() : '-'}
                    </td>
                    <td>
                      <select value={selectedPlan[user.id] || ''} onChange={e => setSelectedPlan(p => ({ ...p, [user.id]: e.target.value }))} style={{ marginRight: 8 }}>
                        <option value="">Select Plan</option>
                        <option value="free">Free</option>
                        <option value="basic">Basic</option>
                        <option value="silver">Silver</option>
                        <option value="gold">Gold</option>
                        <option value="platinum">Platinum</option>
                      </select>
                      <button className="admin-export-btn" onClick={() => setGrantPasswordPrompt({ open: true, userId: user.id })} disabled={granting[user.id] || !selectedPlan[user.id]}>Grant</button>
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      )}
      {grantPasswordPrompt.open && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', background: 'rgba(0,0,0,0.4)', zIndex: 2000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <form onSubmit={handleGrantPasswordSubmit} style={{ background: '#fff', borderRadius: 10, padding: 32, minWidth: 320, boxShadow: '0 2px 16px #0002', display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div style={{ fontWeight: 600, fontSize: 18 }}>Admin Password Required</div>
            <input type="password" value={grantAdminPassword} onChange={e => setGrantAdminPassword(e.target.value)} placeholder="Enter your password" style={{ padding: 8, borderRadius: 6, border: '1px solid #cbd5e1' }} autoFocus required disabled={grantVerifying} autoComplete="current-password" />
            {grantVerifyError && <div style={{ color: '#dc2626' }}>{grantVerifyError}</div>}
            <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
              <button type="button" onClick={() => setGrantPasswordPrompt({ open: false, userId: null })} style={{ background: '#e5e7eb', border: 'none', borderRadius: 6, padding: '6px 16px', cursor: 'pointer' }} disabled={grantVerifying}>Cancel</button>
              <button type="submit" style={{ background: '#2563eb', color: '#fff', border: 'none', borderRadius: 6, padding: '6px 16px', cursor: 'pointer' }} disabled={grantVerifying}>{grantVerifying ? 'Verifying...' : 'Confirm'}</button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}

function BillingHistorySection() {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  useEffect(() => {
    adminAPI.getAllBillingHistory()
      .then(data => setHistory(data.history || []))
      .catch(err => setError(err.message || 'Failed to fetch billing history'))
      .finally(() => setLoading(false));
  }, []);
  return (
    <div>
      <h2>All Billing History</h2>
      <input
        type="text"
        placeholder="Search by user ID, plan, or amount..."
        value={search}
        onChange={e => setSearch(e.target.value)}
        className="admin-search-input"
      />
      {loading ? <div className="admin-loading">Loading billing history...</div> : error ? <div className="admin-error">{error}</div> : (
        <div className="admin-table-container">
        <table className="admin-table billing-table">
          <thead>
            <tr>
              <th>#</th>
              <th>User ID</th>
              <th>Plan</th>
              <th>Amount</th>
              <th>Start Date</th>
              <th>End Date</th>
            </tr>
          </thead>
          <tbody>
            {history
              .filter(item =>
                String(item.user_id).includes(search) ||
                (item.plan || '').toLowerCase().includes(search.toLowerCase()) ||
                String(item.amount).includes(search)
              )
              .map((item, idx) => (
                <tr key={item.id}>
                  <td>{idx + 1}</td>
                  <td>{item.user_id}</td>
                  <td>
                    <span className={`plan-badge plan-${(item.plan || 'free').toLowerCase()}`}>
                      {item.plan || 'Free'}
                    </span>
                  </td>
                  <td className="amount-cell">
                    ${item.amount || '0.00'}
                  </td>
                  <td className="date-cell">
                    {item.start_date ? new Date(item.start_date).toLocaleDateString() : '-'}
                  </td>
                  <td className="date-cell">
                    {item.end_date ? new Date(item.end_date).toLocaleDateString() : '-'}
                  </td>
                </tr>
              ))}
          </tbody>
        </table>
        </div>
      )}
    </div>
  );
}

function AltarsSection() {
  const [users, setUsers] = useState([]);
  const [userDesigns, setUserDesigns] = useState({}); // { userId: [designs] }
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [modalDesign, setModalDesign] = useState(null); // { wallData, wallName }
  const [search, setSearch] = useState("");

  useEffect(() => {
    setLoading(true);
    setError('');
    const token = localStorage.getItem('token');
    fetch(`${getApiUrl()}/auth/users`, {
      headers: { 'Authorization': `Bearer ${token}` }
    })
      .then(res => {
        if (!res.ok) throw new Error('Failed to fetch users');
        return res.json();
      })
      .then(async (usersData) => {
        setUsers(usersData);
        // Fetch designs for each user
        const designsMap = {};
        await Promise.all(usersData.map(async (user) => {
          try {
            const designs = await wallAPI.getUserDesigns(user.id);
            designsMap[user.id] = designs;
          } catch (err) {
            designsMap[user.id] = [];
          }
        }));
        setUserDesigns(designsMap);
      })
      .catch(err => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div>
      <h2>Altars</h2>
      <input
        type="text"
        placeholder="Search by username, email, or altar name..."
        value={search}
        onChange={e => setSearch(e.target.value)}
        className="admin-search-input"
      />
      {loading ? <div className="admin-loading">Loading altars...</div> : error ? <div className="admin-error">{error}</div> : (
        <div className="admin-table-container">
          <table className="admin-table altars-table">
            <thead>
              <tr>
                <th>#</th>
                <th>ID</th>
                <th>Username</th>
                <th>Email</th>
                <th>Designs</th>
              </tr>
            </thead>
            <tbody>
              {users
                .filter(user =>
                  user.username.toLowerCase().includes(search.toLowerCase()) ||
                  user.email.toLowerCase().includes(search.toLowerCase()) ||
                  (userDesigns[user.id] || []).some(design =>
                    design.wall_name && design.wall_name.toLowerCase().includes(search.toLowerCase())
                  )
                )
                .map((user, idx) => (
                  <tr key={user.id}>
                    <td>{idx + 1}</td>
                    <td>{user.id}</td>
                    <td>
                      <div className="user-info">
                        <div className="user-name">{user.username}</div>
                      </div>
                    </td>
                    <td>
                      <div className="user-email">{user.email}</div>
                    </td>
                    <td>
                      <div className="design-preview">
                        {(userDesigns[user.id] || [])
                          .filter(design =>
                            !search ||
                            user.username.toLowerCase().includes(search.toLowerCase()) ||
                            user.email.toLowerCase().includes(search.toLowerCase()) ||
                            (design.wall_name && design.wall_name.toLowerCase().includes(search.toLowerCase()))
                          )
                          .length === 0 ? (
                            <span style={{ color: '#64748b' }}>No designs</span>
                          ) : (
                            userDesigns[user.id]
                              .filter(design =>
                                !search ||
                                user.username.toLowerCase().includes(search.toLowerCase()) ||
                                user.email.toLowerCase().includes(search.toLowerCase()) ||
                                (design.wall_name && design.wall_name.toLowerCase().includes(search.toLowerCase()))
                              )
                              .map(design => {
                                let wallData = typeof design.wall_data === 'string' ? JSON.parse(design.wall_data) : design.wall_data;
                                return (
                                  <div key={design.id} className="design-item">
                                    <div style={{ cursor: 'pointer' }} onClick={() => setModalDesign({ wallData, wallName: design.wall_name })}>
                                      <WallPreview wallData={wallData} />
                                    </div>
                                    <div className="design-name">{design.wall_name}</div>
                                  </div>
                                );
                              })
                          )}
                      </div>
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      )}
      {modalDesign && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', background: 'rgba(0,0,0,0.5)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }} onClick={() => setModalDesign(null)}>
          <div style={{ background: '#fff', borderRadius: 12, padding: 24, position: 'relative', minWidth: 600, minHeight: 400 }} onClick={e => e.stopPropagation()}>
            <button style={{ position: 'absolute', top: 12, right: 16, background: 'none', border: 'none', fontSize: 24, cursor: 'pointer', color: '#334155' }} onClick={() => setModalDesign(null)}>&times;</button>
            <div style={{ textAlign: 'center', marginBottom: 12, fontWeight: 600 }}>{modalDesign.wallName}</div>
            <WallPreview wallData={modalDesign.wallData} width={600} height={375} />
          </div>
        </div>
      )}
    </div>
  );
}

function FlaggedSection() {
  return (
    <div>
      <h2>Flagged Content</h2>
      <p>No data to display yet.</p>
    </div>
  );
}
function AnalyticsSection() {
  return (
    <div>
      <h2>Analytics</h2>
      <p>No data to display yet.</p>
    </div>
  );
}
function ReportsSection() {
  return (
    <div>
      <h2>Reports</h2>
      <p>No data to display yet.</p>
    </div>
  );
}

const sections = [
  { key: 'users', label: 'Users', component: <UsersSection /> },
  { key: 'altars', label: 'Altars', component: <AltarsSection /> },
  { key: 'subscriptions', label: 'Subscriptions', component: <SubscriptionsSection /> },
  { key: 'billing', label: 'Billing History', component: <BillingHistorySection /> },
  { key: 'flagged', label: 'Flagged Content', component: <FlaggedSection /> },
  { key: 'analytics', label: 'Analytics', component: <AnalyticsSection /> },
  { key: 'reports', label: 'Reports', component: <ReportsSection /> },
];

export default function Admin() {
  const [active, setActive] = useState('users');
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef(null);
  const navigate = useNavigate();

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

  const handleLogout = () => logout(navigate);

  return (
    <div className="profile-container">
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
              <li>
                <button onClick={() => { setMenuOpen(false); navigate('/profile'); }}>👤 Profile</button>
              </li>
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
      
      <div className="profile-settings-container">
        <aside className="profile-settings-sidebar">
        {sections.map(s => (
          <button
            key={s.key}
              className={`settings-tab-btn${active === s.key ? ' active' : ''}`}
              data-section={s.key}
            onClick={() => setActive(s.key)}
          >
              {s.key === 'users' && '👥 '}
              {s.key === 'altars' && '🕯️ '}
              {s.key === 'subscriptions' && '💳 '}
              {s.key === 'billing' && '💰 '}
              {s.key === 'flagged' && '🚩 '}
              {s.key === 'analytics' && '📊 '}
              {s.key === 'reports' && '📋 '}
            {s.label}
          </button>
        ))}
        </aside>
        
        <main className="profile-settings-content">
        {sections.find(s => s.key === active)?.component}
      </main>
      </div>
    </div>
  );
}

 