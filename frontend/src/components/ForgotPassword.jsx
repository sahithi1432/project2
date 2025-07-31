import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { authAPI } from '../services/api';
import './ForgotPassword.css';

function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [step, setStep] = useState('email'); // 'email', 'otp', 'reset'
  // Timer and resend
  const [otpTimer, setOtpTimer] = useState(600); // 10 min in seconds
  const [resendCooldown, setResendCooldown] = useState(0); // 30s cooldown
  const timerRef = useRef();
  const cooldownRef = useRef();
  const [otpSent, setOtpSent] = useState(false);
  const [otpVerified, setOtpVerified] = useState(false);

  useEffect(() => {
    if (step === 'otp' && otpSent && otpTimer > 0) {
      timerRef.current = setInterval(() => {
        setOtpTimer(t => t - 1);
      }, 1000);
    }
    return () => clearInterval(timerRef.current);
  }, [step, otpSent]);
  useEffect(() => {
    if (otpTimer <= 0 && step === 'otp') {
      setError('OTP expired. Please resend OTP.');
    }
  }, [otpTimer, step]);
  useEffect(() => {
    if (resendCooldown > 0) {
      cooldownRef.current = setInterval(() => {
        setResendCooldown(c => c - 1);
      }, 1000);
    }
    return () => clearInterval(cooldownRef.current);
  }, [resendCooldown]);

  const handleEmailSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setMessage('');
    const cleanEmail = email.trim().toLowerCase();
    try {
      await authAPI.sendOtp(cleanEmail);
      setStep('otp');
      setMessage('OTP sent to your email');
      setOtpTimer(600);
      setResendCooldown(30);
      setOtpSent(true);
    } catch (err) {
      setError(err.message || 'Failed to send OTP');
    } finally {
      setLoading(false);
    }
  };

  const handleResendOtp = async () => {
    if (resendCooldown > 0) return;
    setError('');
    setLoading(true);
    const cleanEmail = email.trim().toLowerCase();
    try {
      await authAPI.sendOtp(cleanEmail);
      setMessage('OTP resent to your email');
      setOtpTimer(600);
      setResendCooldown(30);
    } catch (err) {
      setError(err.message || 'Failed to resend OTP');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    setError('');
    if (otpTimer <= 0) {
      setError('OTP expired. Please resend OTP.');
      return;
    }
    setLoading(true);
    const cleanEmail = email.trim().toLowerCase();
    try {
      await authAPI.verifyOtp(cleanEmail, otp);
      setStep('reset');
      setMessage('OTP verified! Enter your new password.');
      setOtpVerified(true);
    } catch (err) {
      setError(err.message || 'OTP verification failed');
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordReset = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setMessage('');
    if (newPassword !== confirmPassword) {
      setError('Passwords do not match');
      setLoading(false);
      return;
    }
    if (newPassword.length < 6) {
      setError('Password must be at least 6 characters long');
      setLoading(false);
      return;
    }
    const cleanEmail = email.trim().toLowerCase();
    try {
      await authAPI.resetPassword(cleanEmail, otp, newPassword);
      setMessage('Password reset successfully! Redirecting to login...');
      setTimeout(() => {
        alert('Password changed successfully!');
        window.location.href = '/Login';
      }, 2000);
    } catch (err) {
      setError(err.message || 'Failed to reset password');
    } finally {
      setLoading(false);
    }
  };

  const handleBackToEmail = () => {
    setStep('email');
    setOtp('');
    setNewPassword('');
    setConfirmPassword('');
    setMessage('');
    setError('');
    setOtpSent(false);
    setOtpVerified(false);
    setOtpTimer(600);
    setResendCooldown(0);
  };

  // Format timer mm:ss
  const formatTimer = (t) => `${String(Math.floor(t/60)).padStart(2,'0')}:${String(t%60).padStart(2,'0')}`;

  return (
    <div className="forgot-password-container">
      <h2 className="forgot-password-title">Forgot Password</h2>
      {step === 'email' && (
        <form className="forgot-password-form" onSubmit={handleEmailSubmit}>
          <label className="forgot-password-label">Email</label>
          <input
            className="forgot-password-input"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Enter your email"
            required
            disabled={otpSent}
          />
          {error && <p className="error-message">{error}</p>}
          {message && <p className="success-message">{message}</p>}
          <button className="forgot-password-btn" type="submit" disabled={loading || otpSent}>
            {loading ? 'Sending...' : 'Send OTP'}
          </button>
        </form>
      )}
      {step === 'otp' && (
        <form className="forgot-password-form" onSubmit={handleVerifyOtp}>
          <label className="forgot-password-label">Enter OTP sent to your email:</label>
          <input
            className="forgot-password-input"
            type="text"
            value={otp}
            onChange={(e) => setOtp(e.target.value)}
            placeholder="Enter OTP"
            required
            disabled={otpVerified || otpTimer<=0}
          />
          <div className="forgot-otp-row">
            <span className="forgot-otp-timer">Expires in: {formatTimer(otpTimer)}</span>
            <button type="button" className="forgot-password-btn forgot-otp-resend" onClick={handleResendOtp} disabled={resendCooldown>0 || loading}>
              {resendCooldown>0 ? `Resend OTP (${resendCooldown}s)` : 'Resend OTP'}
            </button>
          </div>
          {error && <p className="error-message">{error}</p>}
          {message && <p className="success-message">{message}</p>}
          <button className="forgot-password-btn" type="submit" disabled={loading || otpVerified || otpTimer<=0}>
            {loading ? 'Verifying...' : 'Verify OTP'}
          </button>
        </form>
      )}
      {step === 'reset' && (
        <form className="forgot-password-form" onSubmit={handlePasswordReset}>
          <label className="forgot-password-label">New Password</label>
          <input
            className="forgot-password-input"
            type="password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            placeholder="Enter new password"
            required
            minLength="6"
            disabled={!otpVerified}
            autoComplete="new-password"
          />
          <label className="forgot-password-label">Confirm New Password</label>
          <input
            className="forgot-password-input"
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            placeholder="Confirm new password"
            required
            minLength="6"
            disabled={!otpVerified}
            autoComplete="new-password"
          />
          {error && <p className="error-message">{error}</p>}
          {message && <p className="success-message">{message}</p>}
          <button className="forgot-password-btn" type="submit" disabled={loading || !otpVerified}>
            {loading ? 'Resetting...' : 'Reset Password'}
          </button>
        </form>
      )}
      <p className="forgot-password-login-link">
        Remember your password? <Link to="/Login">Back to Login</Link>
      </p>
    </div>
  );
}

export default ForgotPassword; 