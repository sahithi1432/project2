# Quick Deployment Guide

## 🚀 Deploy to Render

### Prerequisites
- ✅ AWS RDS MySQL database created
- ✅ Render account (sign up at [render.com](https://render.com))
- ✅ GitHub repository with your code

### Quick Start

1. **Prepare your repository:**
   ```bash
   # Make the deployment script executable
   chmod +x deploy.sh
   
   # Run the deployment preparation
   ./deploy.sh
   ```

2. **Deploy Backend:**
   - Go to [render.com](https://render.com)
   - Click "New +" → "Web Service"
   - Connect your GitHub repository
   - Set Root Directory to: `backend`
   - Build Command: `npm install`
   - Start Command: `npm start`
   - Add environment variables (see DEPLOYMENT_GUIDE.md)

3. **Deploy Frontend:**
   - Click "New +" → "Static Site"
   - Connect your GitHub repository
   - Set Root Directory to: `frontend`
   - Build Command: `npm install && npm run build`
   - Publish Directory: `dist`
   - Add environment variables (see DEPLOYMENT_GUIDE.md)

### Environment Variables Needed

**Backend:**
```
NODE_ENV=production
PORT=10000
DB_HOST=your-aws-rds-endpoint.amazonaws.com
DB_USER=your-database-username
DB_PASSWORD=your-database-password
DB_NAME=virtual_wall_decor
DB_PORT=3306
JWT_SECRET=your-super-secret-jwt-key
EMAIL_SERVICE=gmail
EMAIL_USER=your-email@gmail.com
EMAIL_PASSWORD=your-app-password
EMAIL_FROM=Altar App <your-email@gmail.com>
CORS_ORIGIN=https://your-frontend-url.onrender.com
MAX_FILE_SIZE=20mb
```

**Frontend:**
```
VITE_API_BASE_URL=https://your-backend-url.onrender.com/api
VITE_APP_NAME=Altar Creation App
VITE_APP_VERSION=1.0.0
VITE_ALERT_DURATION=5000
VITE_DEV_MODE=false
```

### Important Notes

1. **Database Security**: Ensure your AWS RDS security group allows connections from Render
2. **CORS**: Update CORS_ORIGIN after both services are deployed
3. **Environment Variables**: Never commit sensitive data to your repository
4. **Free Tier**: Render's free tier includes 750 hours/month for web services

### Troubleshooting

- Check logs in Render dashboard
- Verify environment variables are set correctly
- Ensure database is accessible from external connections
- Test API endpoints: `https://your-backend-url.onrender.com/api/health`

### Full Documentation

📖 See `DEPLOYMENT_GUIDE.md` for detailed step-by-step instructions. 