# Deployment Guide for Render

This guide will help you deploy both your frontend and backend to Render.

## Prerequisites

1. **Render Account**: Sign up at [render.com](https://render.com)
2. **GitHub Repository**: Your code should be pushed to GitHub
3. **AWS RDS Database**: Your MySQL database should be accessible from external connections

## Step 1: Prepare Your Repository

### 1.1 Push your code to GitHub
```bash
git add .
git commit -m "Prepare for Render deployment"
git push origin main
```

### 1.2 Update Environment Variables

You'll need to set up environment variables in Render for both services.

## Step 2: Deploy Backend

### 2.1 Create Backend Service in Render

1. Go to [render.com](https://render.com) and sign in
2. Click "New +" → "Web Service"
3. Connect your GitHub repository
4. Configure the service:
   - **Name**: `altar-backend`
   - **Root Directory**: `backend`
   - **Environment**: `Node`
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
   - **Plan**: Starter (Free)

### 2.2 Set Environment Variables for Backend

In the Render dashboard, go to your backend service → Environment → Environment Variables and add:

```
NODE_ENV=production
PORT=10000
DB_HOST=your-aws-rds-endpoint.amazonaws.com
DB_USER=your-database-username
DB_PASSWORD=your-database-password
DB_NAME=virtual_wall_decor
DB_PORT=3306
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
EMAIL_SERVICE=gmail
EMAIL_USER=your-email@gmail.com
EMAIL_PASSWORD=your-app-password
EMAIL_FROM=Altar App <your-email@gmail.com>
CORS_ORIGIN=https://your-frontend-url.onrender.com
MAX_FILE_SIZE=20mb
```

**Important Notes:**
- Replace `your-aws-rds-endpoint.amazonaws.com` with your actual AWS RDS endpoint
- Replace `your-database-username` and `your-database-password` with your AWS RDS credentials
- Generate a strong JWT_SECRET (you can use a random string generator)
- For Gmail, you'll need to use an App Password, not your regular password
- The CORS_ORIGIN will be your frontend URL (we'll get this after deploying the frontend)

### 2.3 Deploy Backend

1. Click "Create Web Service"
2. Wait for the deployment to complete
3. Note the URL (e.g., `https://altar-backend.onrender.com`)

## Step 3: Deploy Frontend

### 3.1 Create Frontend Service in Render

1. Go back to Render dashboard
2. Click "New +" → "Static Site"
3. Connect your GitHub repository
4. Configure the service:
   - **Name**: `altar-frontend`
   - **Root Directory**: `frontend`
   - **Build Command**: `npm install && npm run build`
   - **Publish Directory**: `dist`
   - **Plan**: Starter (Free)

### 3.2 Set Environment Variables for Frontend

In the Render dashboard, go to your frontend service → Environment → Environment Variables and add:

```
VITE_API_BASE_URL=https://altar-backend.onrender.com/api
VITE_APP_NAME=Altar Creation App
VITE_APP_VERSION=1.0.0
VITE_ALERT_DURATION=5000
VITE_DEV_MODE=false
```

**Important:** Replace `altar-backend.onrender.com` with your actual backend URL.

### 3.3 Deploy Frontend

1. Click "Create Static Site"
2. Wait for the deployment to complete
3. Note the URL (e.g., `https://altar-frontend.onrender.com`)

## Step 4: Update CORS Configuration

### 4.1 Update Backend CORS

After both services are deployed, go back to your backend service in Render and update the CORS_ORIGIN environment variable with your frontend URL:

```
CORS_ORIGIN=https://altar-frontend.onrender.com
```

### 4.2 Redeploy Backend

Trigger a manual redeploy of your backend service to apply the CORS changes.

## Step 5: Test Your Deployment

1. Visit your frontend URL
2. Test the application functionality
3. Check the backend health endpoint: `https://altar-backend.onrender.com/api/health`

## Troubleshooting

### Common Issues:

1. **Database Connection Issues**
   - Ensure your AWS RDS security group allows connections from Render's IP ranges
   - Verify your database credentials are correct

2. **CORS Errors**
   - Make sure the CORS_ORIGIN is set correctly
   - Check that both frontend and backend URLs are using HTTPS

3. **Build Failures**
   - Check the build logs in Render dashboard
   - Ensure all dependencies are properly listed in package.json

4. **Environment Variables**
   - Double-check all environment variables are set correctly
   - Ensure sensitive data is not exposed in logs

### Useful Commands:

```bash
# Check your backend logs
# Go to Render dashboard → Your backend service → Logs

# Check your frontend build logs
# Go to Render dashboard → Your frontend service → Logs

# Test your API endpoints
curl https://altar-backend.onrender.com/api/health
```

## Security Considerations

1. **Database Security**: Ensure your AWS RDS instance is properly secured
2. **Environment Variables**: Never commit sensitive data to your repository
3. **HTTPS**: Render provides HTTPS by default
4. **CORS**: Only allow your frontend domain in CORS configuration

## Cost Considerations

- Render's free tier includes:
  - 750 hours per month for web services
  - Static sites are always free
  - Automatic sleep after 15 minutes of inactivity

## Support

If you encounter issues:
1. Check Render's documentation: [docs.render.com](https://docs.render.com)
2. Review your application logs in the Render dashboard
3. Ensure your local development environment works correctly 