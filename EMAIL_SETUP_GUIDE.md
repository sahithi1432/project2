# Email Setup Guide for Altar App

## Why Emails Are Not Being Sent

The emails are not being sent because the email credentials in the code are placeholder values. You need to configure real email credentials.

## Option 1: Gmail Setup (Recommended)

### Step 1: Enable 2-Factor Authentication
1. Go to your Google Account settings
2. Navigate to Security
3. Enable 2-Step Verification

### Step 2: Generate App Password
1. Go to Google Account settings
2. Navigate to Security → App passwords
3. Select "Mail" and "Other (Custom name)"
4. Enter "Altar App" as the name
5. Click "Generate"
6. Copy the 16-character password

### Step 3: Update Email Configuration
In `backend/routes/auth.js`, replace the email configuration:

```javascript
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: 'your-actual-email@gmail.com', // Replace with your Gmail
    pass: 'your-16-character-app-password', // Replace with the app password
  },
});
```

Also update all "from" addresses in the file:
```javascript
from: 'Altar App <your-actual-email@gmail.com>', // Replace with your Gmail
```

## Option 2: Outlook/Hotmail Setup

If you prefer to use Outlook:

```javascript
const transporter = nodemailer.createTransport({
  service: 'outlook',
  auth: {
    user: 'your-email@outlook.com',
    pass: 'your-password',
  },
});
```

## Option 3: Custom SMTP Server

For other email providers:

```javascript
const transporter = nodemailer.createTransport({
  host: 'smtp.your-provider.com',
  port: 587,
  secure: false,
  auth: {
    user: 'your-email@your-provider.com',
    pass: 'your-password',
  },
});
```

## Testing Email Configuration

### Method 1: Use the Test Endpoint
1. Start your server: `npm start`
2. Send a POST request to: `http://localhost:5000/api/auth/test-email`
3. Body: `{ "to": "your-test-email@gmail.com" }`

### Method 2: Test via Frontend
1. Open your app
2. Try to sign up with a new email
3. Check if you receive the OTP email

## Common Issues and Solutions

### Issue 1: "Invalid login" error
- **Solution**: Make sure you're using an app password, not your regular Gmail password

### Issue 2: "Less secure app access" error
- **Solution**: Use app passwords instead of regular passwords

### Issue 3: "Authentication failed" error
- **Solution**: Double-check your email and app password

### Issue 4: "Connection timeout" error
- **Solution**: Check your internet connection and firewall settings

## Security Notes

1. **Never commit real credentials** to version control
2. **Use app passwords** instead of regular passwords
3. **Update credentials directly in the code** for production
4. **Remove the test endpoint** before deploying to production

## Production Recommendations

For production, consider:
1. Using a dedicated email service (SendGrid, Mailgun, etc.)
2. Setting up proper email templates
3. Implementing email queuing for better reliability
4. Adding email verification tracking

## Quick Test

After updating your credentials, test with:

```bash
curl -X POST http://localhost:5000/api/auth/test-email \
  -H "Content-Type: application/json" \
  -d '{"to": "your-test-email@gmail.com"}'
```

This should return: `{"message": "Test email sent successfully!"}` 