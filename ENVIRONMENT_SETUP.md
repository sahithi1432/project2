# Environment Setup Guide

This guide will help you set up environment variables to remove hardcoded values from the project.

## Backend Setup

### 1. Create Environment File

Create a `.env` file in the `backend` directory:

```bash
cd backend
cp env.example .env
```

### 2. Configure Backend Environment Variables

Edit the `backend/.env` file with your actual values:

```env
# Database Configuration
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_database_password
DB_NAME=virtual_wall_decor
DB_PORT=3306

# Server Configuration
PORT=5000
NODE_ENV=development

# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production

# Email Configuration (Gmail)
EMAIL_SERVICE=gmail
EMAIL_USER=your-email@gmail.com
EMAIL_PASSWORD=your-app-password
EMAIL_FROM=Altar App <your-email@gmail.com>

# CORS Configuration
CORS_ORIGIN=http://localhost:5173

# File Upload Configuration
MAX_FILE_SIZE=20mb
```

### 3. Email Setup (Gmail)

To use Gmail for sending emails:

1. Enable 2-Factor Authentication on your Gmail account
2. Generate an App Password:
   - Go to Google Account settings
   - Security → 2-Step Verification → App passwords
   - Generate a password for "Mail"
3. Use the generated password as `EMAIL_PASSWORD`

## Frontend Setup

### 1. Create Environment File

Create a `.env` file in the `frontend` directory:

```bash
cd frontend
cp env.example .env
```

### 2. Configure Frontend Environment Variables

Edit the `frontend/.env` file:

```env
# API Configuration
VITE_API_BASE_URL=http://localhost:5000/api

# App Configuration
VITE_APP_NAME=Altar Creation App
VITE_APP_VERSION=1.0.0

# Alert Configuration
VITE_ALERT_DURATION=5000

# Development Configuration
VITE_DEV_MODE=true
```

## Security Best Practices

### 1. Never Commit Environment Files

Add these lines to your `.gitignore`:

```gitignore
# Environment files
.env
.env.local
.env.development
.env.production
```

### 2. Use Different Values for Different Environments

- **Development**: Use local values
- **Staging**: Use staging database and services
- **Production**: Use production database and services

### 3. JWT Secret

- Use a strong, random string for `JWT_SECRET`
- Never share or commit your JWT secret
- Consider using a secret management service in production

### 4. Database Credentials

- Use strong passwords for database users
- Consider using connection pooling in production
- Use environment-specific databases

## Testing the Setup

### 1. Backend Test

```bash
cd backend
npm run dev
```

Check the console for:
- Database connection success
- Server running on correct port
- No hardcoded value warnings

### 2. Frontend Test

```bash
cd frontend
npm run dev
```

Check that:
- API calls work correctly
- Alerts display with configured duration
- No hardcoded URLs in network requests

## Troubleshooting

### Common Issues

1. **Database Connection Failed**
   - Check database credentials in `.env`
   - Ensure MySQL is running
   - Verify database exists

2. **Email Not Sending**
   - Check Gmail app password
   - Verify email credentials
   - Check Gmail security settings

3. **Frontend API Errors**
   - Verify `VITE_API_BASE_URL` matches backend port
   - Check CORS configuration
   - Ensure backend is running

4. **Environment Variables Not Loading**
   - Restart development servers
   - Check file naming (`.env` not `.env.txt`)
   - Verify file location in correct directories

## Production Deployment

### 1. Environment Variables

Set environment variables on your hosting platform:
- Vercel, Netlify, or similar for frontend
- Heroku, Railway, or similar for backend

### 2. Database

Use a managed database service:
- AWS RDS
- PlanetScale
- Railway Database

### 3. Email Service

Consider using dedicated email services:
- SendGrid
- Mailgun
- AWS SES

## Migration Checklist

- [ ] Created `.env` files in both backend and frontend
- [ ] Updated database credentials
- [ ] Set up email configuration
- [ ] Generated secure JWT secret
- [ ] Tested backend connection
- [ ] Tested frontend API calls
- [ ] Verified no hardcoded values remain
- [ ] Added `.env` to `.gitignore`
- [ ] Documented setup for team members 