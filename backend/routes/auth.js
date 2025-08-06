import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import pool from '../config/database.js';
import nodemailer from 'nodemailer';
import crypto from 'crypto';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const router = express.Router();

// In-memory OTP store: { email: { otp, expiresAt } }
const otpStore = {};

// Nodemailer transporter (configure with your email service)
const transporter = nodemailer.createTransport({
  service: process.env.EMAIL_SERVICE || 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD,
  },
});

// Middleware to verify token and get user id
function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  
  if (!token) {
    return res.status(401).json({ 
      message: 'You have been logged out due to inactivity. Please log in again to continue.',
      code: 'NO_TOKEN'
    });
  }
  
  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) {
      let message = 'Your session has expired. Please log in again to continue.';
      let status = 403;
      
      // Provide more specific messages based on the error type
      if (err.name === 'TokenExpiredError') {
        message = 'You have been logged out due to inactivity. Please log in again to continue.';
        status = 401;
      } else if (err.name === 'JsonWebTokenError') {
        message = 'Your session is invalid. Please log in again to continue.';
        status = 403;
      }
      
      return res.status(status).json({ 
        message,
        code: err.name
      });
    }
    
    req.user = user;
    next();
  });
}

// Test email endpoint (remove this in production)
router.post('/test-email', async (req, res) => {
  try {
    const { to } = req.body;
    if (!to) {
      return res.status(400).json({ message: 'Please provide a recipient email address.' });
    }
    
    await transporter.sendMail({
      from: process.env.EMAIL_FROM || 'Altar App <your-email@gmail.com>',
      to: to,
      subject: 'Test Email from Altar App',
      text: 'This is a test email to verify that the email configuration is working correctly.',
    });
    
    res.json({ message: 'Test email sent successfully!' });
  } catch (error) {
    console.error('Test email error:', error);
    res.status(500).json({ 
      message: 'Failed to send test email. Check your email configuration.',
      error: error.message 
    });
  }
});

// Send OTP endpoint
router.post('/send-otp', async (req, res) => {
  const { email } = req.body;
  if (!email) return res.status(400).json({ message: 'Please enter your email address.' });
  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  const expiresAt = Date.now() + 10 * 60 * 1000; // 10 minutes
  otpStore[email] = { otp, expiresAt };
  try {
    await transporter.sendMail({
      from: process.env.EMAIL_FROM || 'Altar App <your-email@gmail.com>',
      to: email,
      subject: 'Your OTP Code',
      text: `Your OTP code is: ${otp}. It expires in 10 minutes.`,
    });
    res.json({ message: 'OTP sent to email' });
  } catch (err) {
    res.status(500).json({ message: 'Sorry, we could not send the OTP at this time. Please try again later.' });
  }
});

// Verify OTP endpoint
router.post('/verify-otp', (req, res) => {
  const { email, otp } = req.body;
  if (!email || !otp) return res.status(400).json({ message: 'Please enter both your email address and the OTP.' });
  const record = otpStore[email];
  if (!record) return res.status(400).json({ message: 'No OTP was sent to this email address. Please request an OTP first.' });
  if (Date.now() > record.expiresAt) return res.status(400).json({ message: 'The OTP has expired. Please request a new OTP.' });
  if (record.otp !== otp) return res.status(400).json({ message: 'The OTP you entered is incorrect. Please check and try again.' });
  // Mark as verified (do not delete here)
  otpStore[email].verified = true;
  res.json({ message: 'OTP verified' });
});

router.post('/signup', async (req, res) => {
  try {
    const { username, email, password, otp } = req.body;
    // Check OTP
    const record = otpStore[email];
    if (!record || record.otp !== otp || Date.now() > record.expiresAt) {
      return res.status(400).json({ message: 'The OTP you entered is incorrect or has expired. Please request a new OTP and try again.' });
    }
    delete otpStore[email];

    const [existingUsers] = await pool.promise().execute(
      'SELECT * FROM users WHERE email = ?',
      [email]
    );

    if (existingUsers.length > 0) {
      return res.status(400).json({ message: 'An account with this email already exists. Please log in or use a different email.' });
    }

    const hashedPassword = await bcrypt.hash(password, 12);

    const [result] = await pool.promise().execute(
      'INSERT INTO users (username, email, password) VALUES (?, ?, ?)',
      [username, email, hashedPassword]
    );

    // Fetch the new user to get the role
    const [newUserRows] = await pool.promise().execute(
      'SELECT id, username, email, role, profile_photo FROM users WHERE id = ?',
      [result.insertId]
    );
    const newUser = newUserRows[0];

    // Send welcome email after signup (only if notifications are enabled)
    try {
      const [userPrefs] = await pool.promise().execute(
        'SELECT notifications_enabled FROM users WHERE id = ?',
        [newUser.id]
      );
      
      if (userPrefs.length > 0 && userPrefs[0].notifications_enabled === 1) {
        await transporter.sendMail({
          from: process.env.EMAIL_FROM || 'Altar App <your-email@gmail.com>',
          to: newUser.email,
          subject: 'Welcome to Altar App!',
          text: `Hi ${newUser.username},\n\nThank you for signing up for Altar App! We are excited to have you on board.`,
        });
      }
    } catch (emailErr) {
      console.error('Signup welcome email failed:', emailErr);
      // Do not block signup if email fails
    }

    const token = jwt.sign(
      { userId: newUser.id, email: newUser.email },
      process.env.JWT_SECRET, // TODO: Replace with actual JWT secret
      { expiresIn: '1h' }
    );

    res.status(201).json({
      message: 'User created successfully',
      token,
      user: newUser
    });
  } catch (error) {
    console.error('Signup error:', error);
    res.status(500).json({ message: 'Sorry, we could not create your account at this time. Please try again later.' });
  }
});

router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    const [users] = await pool.promise().execute(
      'SELECT * FROM users WHERE email = ?',
      [email]
    );

    if (users.length === 0) {
      return res.status(400).json({ message: 'The email or password you entered is incorrect. Please try again.' });
    }

    const user = users[0];

    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
      return res.status(400).json({ message: 'The email or password you entered is incorrect. Please try again.' });
    }

    const token = jwt.sign(
      { userId: user.id, email: user.email },
      process.env.JWT_SECRET, // TODO: Replace with actual JWT secret
      { expiresIn: '1h' }
    );

    // Send login notification email (only if notifications are enabled)
    try {
      const [userPrefs] = await pool.promise().execute(
        'SELECT notifications_enabled FROM users WHERE id = ?',
        [user.id]
      );
      
      if (userPrefs.length > 0 && userPrefs[0].notifications_enabled === 1) {
        await transporter.sendMail({
          from: process.env.EMAIL_FROM || 'Altar App <your-email@gmail.com>',
          to: user.email,
          subject: 'Login Notification',
          text: `Hi ${user.username},\n\nYou have successfully logged in to your Altar App account. If this wasn't you, please reset your password immediately.`,
        });
      }
    } catch (emailErr) {
      console.error('Login notification email failed:', emailErr);
      // Do not block login if email fails
    }

    res.json({
      message: 'Login successful',
      token,
      user: { id: user.id, username: user.username, email: user.email, role: user.role, profile_photo: user.profile_photo }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Sorry, something went wrong while logging you in. Please try again later.' });
  }
});

// Forgot Password endpoint
router.post('/forgot-password', async (req, res) => {
  try {
    const { email } = req.body;
    // Check if user exists
    const [users] = await pool.promise().execute(
      'SELECT * FROM users WHERE email = ?',
      [email]
    );
    if (users.length === 0) {
      // Don't reveal if email exists or not for security
      return res.json({ message: 'If an account with that email exists, you will receive an OTP shortly.' });
    }
    // Send OTP (reuse /send-otp logic)
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = Date.now() + 10 * 60 * 1000; // 10 minutes
    otpStore[email] = { otp, expiresAt };
    await transporter.sendMail({
      from: 'Altar App <your-email@gmail.com>', // TODO: Replace with actual email
      to: email,
      subject: 'Your Password Reset OTP',
      text: `Your OTP code for password reset is: ${otp}. It expires in 10 minutes.`,
    });
    res.json({ message: 'If an account with that email exists, you will receive an OTP shortly.' });
  } catch (error) {
    console.error('Forgot password error:', error);
    res.status(500).json({ message: 'Sorry, we could not process your password reset request at this time. Please try again later.' });
  }
});

// Reset Password endpoint
router.post('/reset-password', async (req, res) => {
  try {
    const { email, otp, newPassword } = req.body;
    // Check OTP
    const record = otpStore[email];
    if (!record || record.otp !== otp || Date.now() > record.expiresAt || !record.verified) {
      return res.status(400).json({ message: 'The OTP you entered is incorrect or has expired. Please request a new OTP and try again.' });
    }
    delete otpStore[email];
    // Find user
    const [users] = await pool.promise().execute(
      'SELECT * FROM users WHERE email = ?',
      [email]
    );
    if (users.length === 0) {
      return res.status(400).json({ message: 'We could not find an account with this email address.' });
    }
    const user = users[0];
    // Hash new password (no restrictions)
    const hashedPassword = await bcrypt.hash(newPassword, 12);
    // Update password
    await pool.promise().execute(
      'UPDATE users SET password = ? WHERE id = ?',
      [hashedPassword, user.id]
    );
    // Send password reset email
    try {
      await transporter.sendMail({
        from: 'Altar App <your-email@gmail.com>', // TODO: Replace with actual email
        to: user.email,
        subject: 'Password Reset Successful',
        text: `Hi ${user.username},\n\nYour password has been reset successfully. If you did not request this, please contact support immediately.`,
      });
    } catch (emailErr) {
      console.error('Password reset email failed:', emailErr);
      // Do not block reset if email fails
    }
    res.json({ message: 'Your password has been reset successfully!' });
  } catch (error) {
    console.error('Reset password error:', error);
    res.status(500).json({ message: 'Sorry, we could not reset your password at this time. Please try again later.' });
  }
});

// Promote user to admin
router.post('/make-admin', async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ message: 'Please enter the user\'s email address.' });
    }
    // Check if user exists
    const [users] = await pool.promise().execute(
      'SELECT * FROM users WHERE email = ?',
      [email]
    );
    if (users.length === 0) {
      return res.status(404).json({ message: 'We could not find a user with this email address.' });
    }
    // Update role to admin
    await pool.promise().execute(
      "UPDATE users SET role = 'admin' WHERE email = ?",
      [email]
    );
    res.json({ message: `User with email ${email} has been promoted to admin.` });
  } catch (error) {
    console.error('Make admin error:', error);
    res.status(500).json({ message: 'Sorry, we could not promote this user to admin at this time. Please try again later.' });
  }
});

// Get all users
router.get('/users', async (req, res) => {
  try {
    const [users] = await pool.promise().execute('SELECT id, username, email, role, profile_photo, subscription_plan, subscription_start, subscription_end FROM users');
    res.json(users);
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({ message: 'Sorry, we could not fetch the users at this time. Please try again later.' });
  }
});

// Set user role (admin/user)
router.post('/set-role', async (req, res) => {
  try {
    const { userId, role } = req.body;
    if (!userId || !role) {
      return res.status(400).json({ message: 'Please provide both the user ID and the role.' });
    }
    await pool.promise().execute('UPDATE users SET role = ? WHERE id = ?', [role, userId]);
    res.json({ message: `The user's role has been updated to ${role}.` });
  } catch (error) {
    console.error('Set role error:', error);
    res.status(500).json({ message: 'Sorry, we could not update the user\'s role at this time. Please try again later.' });
  }
});

// Update user info (username/email)
router.put('/users/:id', authenticateToken, async (req, res) => {
  const userId = parseInt(req.params.id, 10);
  // Fetch current user
  const [users] = await pool.promise().execute('SELECT * FROM users WHERE id = ?', [req.user.userId]);
  if (users.length === 0) {
    return res.status(404).json({ message: 'We could not find your account.' });
  }
  const currentUser = users[0];
  // Allow if admin, or editing own account
  if (currentUser.role !== 'admin' && req.user.userId !== userId) {
    return res.status(403).json({ message: 'You are not authorized to update this profile.' });
  }
  const { username, email } = req.body;
  try {
    await pool.promise().execute(
      'UPDATE users SET username = ?, email = ? WHERE id = ?',
      [username, email, userId]
    );
    // Return updated user with profile_photo
    const [updatedUsers] = await pool.promise().execute('SELECT id, username, email, role, profile_photo FROM users WHERE id = ?', [userId]);
    const updatedUser = updatedUsers[0];
    // Send email notification about profile update
    if (updatedUser && updatedUser.email) {
      try {
        const [userPrefs] = await pool.promise().execute(
          'SELECT notifications_enabled FROM users WHERE id = ?',
          [updatedUser.id]
        );
        if (userPrefs.length > 0 && userPrefs[0].notifications_enabled === 1) {
          const byAdmin = currentUser.role === 'admin' && req.user.userId !== userId;
          await transporter.sendMail({
            from: 'Altar App <your-email@gmail.com>', // TODO: Replace with actual email
            to: updatedUser.email,
            subject: 'Profile Updated',
            text: byAdmin
              ? `Hi ${updatedUser.username},\n\nYour profile was updated by an administrator. If you did not request this, please contact support.`
              : `Hi ${updatedUser.username},\n\nYour profile has been updated successfully. If you did not request this, please contact support.`,
          });
        }
      } catch (emailErr) {
        console.error('Profile update email failed:', emailErr);
        // Do not block update if email fails
      }
    }
    res.json({ message: 'Your profile has been updated successfully.', user: updatedUser });
  } catch (error) {
    res.status(500).json({ message: 'Sorry, we could not update your profile at this time. Please try again later.' });
  }
});

// Add this endpoint after other user endpoints
router.put('/users/:id/photo', authenticateToken, async (req, res) => {
  try {
    const userId = req.params.id;
    const { profile_photo } = req.body;
    if (profile_photo === undefined) {
      return res.status(400).json({ message: 'Please provide a profile photo.' });
    }
    await pool.promise().execute(
      'UPDATE users SET profile_photo = ? WHERE id = ?',
      [profile_photo, userId]
    );
    res.json({ message: 'Your profile photo has been updated successfully.', profile_photo });
  } catch (error) {
    console.error('Update profile photo error:', error);
    res.status(500).json({ message: 'Sorry, we could not update your profile photo at this time. Please try again later.' });
  }
});

// Get user notification preferences
router.get('/notification-preferences', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.userId;
    const [users] = await pool.promise().execute(
      'SELECT notifications_enabled FROM users WHERE id = ?', 
      [userId]
    );
    
    if (users.length === 0) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    const notificationsEnabled = users[0].notifications_enabled === 1;
    res.json({ notificationsEnabled });
  } catch (error) {
    console.error('Get notification preferences error:', error);
    res.status(500).json({ message: 'Failed to get notification preferences' });
  }
});

// Update user notification preferences
router.put('/notification-preferences', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.userId;
    const { notificationsEnabled } = req.body;
    
    await pool.promise().execute(
      'UPDATE users SET notifications_enabled = ? WHERE id = ?',
      [notificationsEnabled ? 1 : 0, userId]
    );
    
    res.json({ 
      message: notificationsEnabled 
        ? 'Notifications enabled successfully' 
        : 'Notifications disabled successfully',
      notificationsEnabled 
    });
  } catch (error) {
    console.error('Update notification preferences error:', error);
    res.status(500).json({ message: 'Failed to update notification preferences' });
  }
});

// Change password for logged-in user
router.post('/change-password', authenticateToken, async (req, res) => {
  const { currentPassword, newPassword } = req.body;
  const userId = req.user.userId;
  try {
    const [users] = await pool.promise().execute('SELECT * FROM users WHERE id = ?', [userId]);
    if (users.length === 0) return res.status(404).json({ message: 'We could not find your account.' });
    const user = users[0];
    const isValid = await bcrypt.compare(currentPassword, user.password);
    if (!isValid) return res.status(400).json({ message: 'The current password you entered is incorrect. Please try again.' });
    const hashed = await bcrypt.hash(newPassword, 12);
    await pool.promise().execute('UPDATE users SET password = ? WHERE id = ?', [hashed, userId]);
    // Send password change email
    try {
      await transporter.sendMail({
        from: 'Altar App <your-email@gmail.com>', // TODO: Replace with actual email
        to: user.email,
        subject: 'Password Changed Successfully',
        text: `Hi ${user.username},\n\nYour password has been changed successfully. If you did not request this, please contact support immediately.`,
      });
    } catch (emailErr) {
      console.error('Password change email failed:', emailErr);
      // Do not block change if email fails
    }
    res.json({ message: 'Your password has been changed successfully.' });
  } catch (error) {
    res.status(500).json({ message: 'Sorry, we could not change your password at this time. Please try again later.' });
  }
});

// Password verification for admin actions
router.post('/verify-password', authenticateToken, async (req, res) => {
  try {
    const { password } = req.body;
    const userId = req.user.userId;
    if (!password) {
      return res.status(400).json({ message: 'Please enter your password.' });
    }
    const [users] = await pool.promise().execute('SELECT * FROM users WHERE id = ?', [userId]);
    if (users.length === 0) {
      return res.status(404).json({ message: 'We could not find your account.' });
    }
    const user = users[0];
    const isValid = await bcrypt.compare(password, user.password);
    if (!isValid) {
      return res.status(401).json({ message: 'The password you entered is incorrect. Please try again.' });
    }
    res.json({ success: true });
  } catch (error) {
    console.error('Verify password error:', error);
    res.status(500).json({ message: 'Sorry, we could not verify your password at this time. Please try again later.' });
  }
});

// Delete user endpoint
router.delete('/users/:id', authenticateToken, async (req, res) => {
  const userId = parseInt(req.params.id, 10);
  const currentUserId = req.user.userId;
  // Fetch current user
  const [users] = await pool.promise().execute('SELECT * FROM users WHERE id = ?', [currentUserId]);
  if (users.length === 0) {
    return res.status(404).json({ message: 'We could not find your account.' });
  }
  const currentUser = users[0];
  // Allow if admin, or deleting own account
  if (currentUser.role !== 'admin' && currentUserId !== userId) {
    return res.status(403).json({ message: 'You are not authorized to perform this action.' });
  }
  try {
    // Fetch the user to be deleted
    const [targetUsers] = await pool.promise().execute('SELECT * FROM users WHERE id = ?', [userId]);
    const targetUser = targetUsers[0];
    await pool.promise().execute('DELETE FROM users WHERE id = ?', [userId]);
    // Send account deletion email
    if (targetUser && targetUser.email) {
      try {
        const byAdmin = currentUser.role === 'admin' && currentUserId !== userId;
        await transporter.sendMail({
          from: 'Altar App <your-email@gmail.com>', // TODO: Replace with actual email
          to: targetUser.email,
          subject: 'Account Deleted',
          text: byAdmin
            ? `Hi ${targetUser.username},\n\nYour Altar App account has been deleted by an administrator. please contact support.`
            : `Hi ${targetUser.username},\n\nYour Altar App account has been deleted. If this wasn't you, please contact support.`,
        });
      } catch (emailErr) {
        console.error('Account deletion email failed:', emailErr);
        // Do not block deletion if email fails
      }
    }
    res.json({ message: 'Your account has been deleted successfully.' });
  } catch (error) {
    res.status(500).json({ message: 'Sorry, we could not delete your account at this time. Please try again later.' });
  }
});

// Subscription endpoints
router.post('/subscribe', authenticateToken, async (req, res) => {
  let userId = req.user.userId;
  const { plan, amount: customAmount, userId: targetUserId } = req.body;
  // Check if admin and targetUserId is provided
  if (targetUserId && targetUserId !== userId) {
    // Fetch current user
    const [users] = await pool.promise().execute('SELECT role FROM users WHERE id = ?', [userId]);
    if (users.length && users[0].role === 'admin') {
      userId = targetUserId;
    } else {
      return res.status(403).json({ message: 'Forbidden' });
    }
  }
  if (!plan) return res.status(400).json({ message: 'No plan specified.' });
  // Plan pricing and duration
  const planPrices = {
    free: 0,
    basic: 99,
    silver: 249,
    gold: 449,
    platinum: 799
  };
  const amount = (typeof customAmount === 'number') ? customAmount : (planPrices[plan] !== undefined ? planPrices[plan] : 0);
  let endDateSql = 'NULL';
  if (plan === 'free') {
    endDateSql = `DATE_ADD(NOW(), INTERVAL 10 DAY)`;
  } else if (plan === 'basic') {
    endDateSql = `DATE_ADD(NOW(), INTERVAL 1 MONTH)`;
  } else if (plan === 'silver') {
    endDateSql = `DATE_ADD(NOW(), INTERVAL 3 MONTH)`;
  } else if (plan === 'gold') {
    endDateSql = `DATE_ADD(NOW(), INTERVAL 6 MONTH)`;
  } else if (plan === 'platinum') {
    endDateSql = `DATE_ADD(NOW(), INTERVAL 12 MONTH)`;
  }
  try {
    // Update user subscription dates
    await pool.promise().execute(
      `UPDATE users SET subscription_plan = ?, subscription_start = NOW(), subscription_end = ${endDateSql} WHERE id = ?`,
      [plan, userId]
    );
    // Insert billing history
    await pool.promise().execute(
      `INSERT INTO billing_history (user_id, plan, amount, start_date, end_date) VALUES (?, ?, ?, NOW(), ${endDateSql})`,
      [userId, plan, amount]
    );
    // Fetch user info for email
    const [userRows] = await pool.promise().execute('SELECT username, email FROM users WHERE id = ?', [userId]);
    const user = userRows[0];
    if (user && user.email) {
      try {
        await transporter.sendMail({
          from: 'Altar App <your-email@gmail.com>', // TODO: Replace with actual email
          to: user.email,
          subject: 'Subscription Plan Changed',
          text: `Hi ${user.username},\n\nYour subscription plan has been changed to '${plan}'. If you did not request this, please contact support immediately.`,
        });
      } catch (emailErr) {
        console.error('Subscription change email failed:', emailErr);
        // Do not block subscription if email fails
      }
    }
    res.json({ message: `Subscribed to ${plan} plan.` });
  } catch (error) {
    console.error('Failed to subscribe:', error);
    res.status(500).json({ message: 'Failed to subscribe.' });
  }
});

router.post('/unsubscribe', authenticateToken, async (req, res) => {
  const userId = req.user.userId;
  try {
    await pool.promise().execute('UPDATE users SET subscription_plan = ? WHERE id = ?', ['none', userId]);
    res.json({ message: 'Unsubscribed successfully.' });
  } catch (error) {
    res.status(500).json({ message: 'Failed to unsubscribe.' });
  }
});

router.get('/subscription', authenticateToken, async (req, res) => {
  const userId = req.user.userId;
  try {
    const [rows] = await pool.promise().execute('SELECT subscription_plan, subscription_start, subscription_end FROM users WHERE id = ?', [userId]);
    if (rows.length === 0) return res.status(404).json({ message: 'User not found.' });
    res.json({ 
      subscription_plan: rows[0].subscription_plan,
      subscription_start: rows[0].subscription_start,
      subscription_end: rows[0].subscription_end
    });
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch subscription.' });
  }
});

// Billing history endpoint
router.get('/billing-history', authenticateToken, async (req, res) => {
  const userId = req.user.userId;
  try {
    const [rows] = await pool.promise().execute(
      'SELECT id, plan, amount, start_date, end_date FROM billing_history WHERE user_id = ? ORDER BY start_date DESC',
      [userId]
    );
    res.json({ history: rows });
  } catch (error) {
    console.error('Failed to fetch billing history:', error);
    res.status(500).json({ message: 'Failed to fetch billing history.' });
  }
});

// Admin: Get all billing history
router.get('/all-billing-history', authenticateToken, async (req, res) => {
  const userId = req.user.userId;
  const [users] = await pool.promise().execute('SELECT role FROM users WHERE id = ?', [userId]);
  if (!users.length || users[0].role !== 'admin') {
    return res.status(403).json({ message: 'Forbidden' });
  }
  const [rows] = await pool.promise().execute(
    'SELECT * FROM billing_history ORDER BY created_at DESC'
  );
  res.json({ history: rows });
});

// Admin: Create user directly (no OTP)
router.post('/users', authenticateToken, async (req, res) => {
  const adminId = req.user.userId;
  // Check if admin
  const [admins] = await pool.promise().execute('SELECT role FROM users WHERE id = ?', [adminId]);
  if (!admins.length || admins[0].role !== 'admin') {
    return res.status(403).json({ message: 'Forbidden' });
  }
  const { username, email, password, role } = req.body;
  if (!username || !email || !password || !role) {
    return res.status(400).json({ message: 'All fields are required.' });
  }
  // Check if user exists
  const [existing] = await pool.promise().execute('SELECT id FROM users WHERE email = ?', [email]);
  if (existing.length > 0) {
    return res.status(400).json({ message: 'A user with this email already exists.' });
  }
  const bcrypt = (await import('bcryptjs')).default;
  const hashedPassword = await bcrypt.hash(password, 12);
  await pool.promise().execute(
    'INSERT INTO users (username, email, password, role) VALUES (?, ?, ?, ?)',
    [username, email, hashedPassword, role]
  );
  // Send welcome email after admin creates user
  try {
    await transporter.sendMail({
      from: process.env.EMAIL_FROM || 'Altar App <your-email@gmail.com>',
      to: email,
      subject: 'Welcome to Altar App!',
      text: `Hi ${username},\n\nYour account has been created by an administrator. You can now log in to Altar App.`,
    });
  } catch (emailErr) {
    console.error('Admin user creation email failed:', emailErr);
    // Do not block creation if email fails
  }
  res.json({ message: 'User created successfully.' });
});

// Get user profile privacy
router.get('/profile-privacy', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.userId;
    const [users] = await pool.promise().execute(
      'SELECT profile_public FROM users WHERE id = ?',
      [userId]
    );
    if (users.length === 0) {
      return res.status(404).json({ message: 'User not found' });
    }
    const profilePublic = users[0].profile_public === 1;
    res.json({ profilePublic });
  } catch (error) {
    console.error('Get profile privacy error:', error);
    res.status(500).json({ message: 'Failed to get profile privacy' });
  }
});

// Update user profile privacy
router.put('/profile-privacy', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.userId;
    const { profilePublic } = req.body;
    await pool.promise().execute(
      'UPDATE users SET profile_public = ? WHERE id = ?',
      [profilePublic ? 1 : 0, userId]
    );
    res.json({
      message: profilePublic ? 'Profile set to public' : 'Profile set to private',
      profilePublic
    });
  } catch (error) {
    console.error('Update profile privacy error:', error);
    res.status(500).json({ message: 'Failed to update profile privacy' });
  }
});

// Contact form endpoint
router.post('/contact', async (req, res) => {
  try {
    const { name, email, message } = req.body;
    
    if (!name || !email || !message) {
      return res.status(400).json({ message: 'Please fill in all fields.' });
    }

    // Send email to admin
    await transporter.sendMail({
      from: process.env.EMAIL_FROM || 'DreamWall Contact Form <your-email@gmail.com>',
      to: process.env.EMAIL_USER || 'your-email@gmail.com',
      subject: `New Contact Form Message from ${name}`,
      text: `
Name: ${name}
Email: ${email}
Message: ${message}

This message was sent from the DreamWall contact form.
      `,
      html: `
        <h2>New Contact Form Message</h2>
        <p><strong>Name:</strong> ${name}</p>
        <p><strong>Email:</strong> ${email}</p>
        <p><strong>Message:</strong></p>
        <p>${message.replace(/\n/g, '<br>')}</p>
        <hr>
        <p><em>This message was sent from the DreamWall contact form.</em></p>
      `
    });

    res.json({ message: 'Message sent successfully! We will get back to you soon.' });
  } catch (error) {
    console.error('Contact form error:', error);
    res.status(500).json({ message: 'Sorry, we could not send your message at this time. Please try again later.' });
  }
});

// GET /users - Fetch all users (admin only)
router.get('/users', authenticateToken, async (req, res) => {
  try {
    // Check if user is admin
    const [adminCheck] = await pool.promise().execute(
      'SELECT role FROM users WHERE id = ?', 
      [req.user.userId]
    );
    
    if (!adminCheck.length || adminCheck[0].role !== 'admin') {
      return res.status(403).json({ message: 'Access denied. Admin privileges required.' });
    }

    // Fetch all users
    const [users] = await pool.promise().execute(
      'SELECT id, username, email, role, created_at FROM users ORDER BY created_at DESC'
    );

    res.json(users);
  } catch (error) {
    console.error('Fetch users error:', error);
    res.status(500).json({ message: 'Failed to fetch users.' });
  }
});

// DELETE /users/:id - Delete a user (admin only)
router.delete('/users/:id', authenticateToken, async (req, res) => {
  try {
    const userIdToDelete = parseInt(req.params.id, 10);
    
    // Check if user is admin
    const [adminCheck] = await pool.promise().execute(
      'SELECT role FROM users WHERE id = ?', 
      [req.user.userId]
    );
    
    if (!adminCheck.length || adminCheck[0].role !== 'admin') {
      return res.status(403).json({ message: 'Access denied. Admin privileges required.' });
    }

    // Prevent admin from deleting themselves
    if (userIdToDelete === req.user.userId) {
      return res.status(400).json({ message: 'You cannot delete your own account.' });
    }

    // Check if user exists
    const [userCheck] = await pool.promise().execute(
      'SELECT id, username FROM users WHERE id = ?', 
      [userIdToDelete]
    );
    
    if (!userCheck.length) {
      return res.status(404).json({ message: 'User not found.' });
    }

    // Delete user's walls first (foreign key constraint)
    await pool.promise().execute('DELETE FROM walls WHERE user_id = ?', [userIdToDelete]);
    
    // Delete user's subscriptions
    await pool.promise().execute('DELETE FROM subscriptions WHERE user_id = ?', [userIdToDelete]);
    
    // Delete the user
    await pool.promise().execute('DELETE FROM users WHERE id = ?', [userIdToDelete]);

    res.json({ message: `User ${userCheck[0].username} deleted successfully.` });
  } catch (error) {
    console.error('Delete user error:', error);
    res.status(500).json({ message: 'Failed to delete user.' });
  }
});

// POST /verify-password - Verify admin password
router.post('/verify-password', authenticateToken, async (req, res) => {
  try {
    const { password } = req.body;
    
    if (!password) {
      return res.status(400).json({ message: 'Password is required.' });
    }

    // Get current user's password hash
    const [users] = await pool.promise().execute(
      'SELECT password, role FROM users WHERE id = ?', 
      [req.user.userId]
    );
    
    if (!users.length) {
      return res.status(404).json({ message: 'User not found.' });
    }

    // Check if user is admin
    if (users[0].role !== 'admin') {
      return res.status(403).json({ message: 'Access denied. Admin privileges required.' });
    }

    // Verify password
    const isValidPassword = await bcrypt.compare(password, users[0].password);
    
    if (!isValidPassword) {
      return res.status(401).json({ message: 'Invalid password.' });
    }

    res.json({ message: 'Password verified successfully.' });
  } catch (error) {
    console.error('Verify password error:', error);
    res.status(500).json({ message: 'Failed to verify password.' });
  }
});

export { authenticateToken };
export default router; 