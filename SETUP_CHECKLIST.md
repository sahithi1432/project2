# Environment Setup Checklist

## ✅ Completed Steps

- [x] Removed all hardcoded values from backend and frontend
- [x] Created environment example files (`backend/env.example`, `frontend/env.example`)
- [x] Created `.env` files from examples
- [x] Updated `.gitignore` files to exclude environment files
- [x] Installed `dotenv` package in backend
- [x] Created centralized frontend configuration
- [x] Updated all components to use environment variables
- [x] Created comprehensive documentation
- [x] Tested backend health endpoint (✅ Working)

## 🔧 Next Steps to Complete

### 1. Update Environment Variables

**Backend `.env` file** (`backend/.env`):
```env
# Update these with your actual values:
DB_PASSWORD=your_actual_database_password
JWT_SECRET=your_actual_jwt_secret_key
EMAIL_USER=your_actual_email@gmail.com
EMAIL_PASSWORD=your_actual_gmail_app_password
```

**Frontend `.env` file** (`frontend/.env`):
```env
# Update if needed:
VITE_API_BASE_URL=http://localhost:5000/api
```

### 2. Test the Complete Setup

**Test Backend:**
```bash
cd backend
npm run dev
```
Expected output:
- ✅ Database connection successful
- ✅ Server running on port 5000
- ✅ No hardcoded value errors

**Test Frontend:**
```bash
cd frontend
npm run dev
```
Expected output:
- ✅ Development server starts
- ✅ Can connect to backend API
- ✅ No hardcoded URLs in network requests

### 3. Verify Security

- [ ] Check that `.env` files are in `.gitignore`
- [ ] Verify no sensitive data in source code
- [ ] Test that environment variables load correctly

### 4. Test Application Features

- [ ] User registration/login works
- [ ] Email functionality works (if configured)
- [ ] API calls use environment variables
- [ ] Alerts display with configured duration

## 🚨 Important Security Notes

1. **Never commit `.env` files** - They contain sensitive data
2. **Use strong JWT secrets** - Generate a random string
3. **Use Gmail App Passwords** - Don't use regular passwords
4. **Use different values for different environments** (dev/staging/prod)

## 🔍 Verification Commands

**Check if backend is running:**
```bash
curl http://localhost:5000/api/health
```

**Check if frontend can connect:**
- Open browser to `http://localhost:5173`
- Check browser network tab for API calls
- Verify no hardcoded URLs

**Check environment variables are loaded:**
```bash
# Backend
cd backend
node -e "require('dotenv').config(); console.log('DB_HOST:', process.env.DB_HOST)"

# Frontend
cd frontend
node -e "console.log('API_URL:', process.env.VITE_API_BASE_URL)"
```

## 📚 Documentation Created

- `ENVIRONMENT_SETUP.md` - Detailed setup guide
- `HARDCODE_REMOVAL_SUMMARY.md` - Summary of changes
- `SETUP_CHECKLIST.md` - This checklist

## 🎉 Success Criteria

Your setup is complete when:
- [ ] Backend starts without errors
- [ ] Frontend connects to backend successfully
- [ ] No hardcoded values appear in browser network tab
- [ ] All sensitive data is in environment variables
- [ ] `.env` files are properly excluded from git

## 🆘 Troubleshooting

**If backend fails to start:**
- Check database credentials in `.env`
- Ensure MySQL is running
- Verify database exists

**If frontend can't connect to backend:**
- Check `VITE_API_BASE_URL` in frontend `.env`
- Ensure backend is running on correct port
- Check CORS configuration

**If environment variables aren't loading:**
- Restart development servers
- Check file naming (`.env` not `.env.txt`)
- Verify file location in correct directories 