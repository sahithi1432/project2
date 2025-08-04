# Deployment Guide for Render

## Prerequisites

1. **Database Setup**: You'll need a MySQL database. You can use:
   - AWS RDS (recommended for production)
   - PlanetScale (good for free tier)
   - Railway
   - Or any other MySQL provider

2. **Email Service**: Set up Gmail App Password for email functionality

3. **GitHub Repository**: Make sure your code is pushed to GitHub

## Step-by-Step Deployment Process

### Step 1: AWS Database Setup

1. **AWS RDS MySQL Setup**:
   - Go to [AWS RDS Console](https://console.aws.amazon.com/rds/)
   - Click "Create database"
   - Choose "Standard create" and "MySQL"
   - Select "Free tier" (if available) or choose appropriate instance
   - Configure settings:
     - **DB instance identifier**: `altar-db` (or your preferred name)
     - **Master username**: `admin` (or your preferred username)
     - **Master password**: Create a strong password
     - **DB instance class**: `db.t3.micro` (free tier) or appropriate size
     - **Storage**: 20 GB (minimum for free tier)
     - **Multi-AZ deployment**: No (for free tier)
     - **Public access**: Yes (for Render to connect)
     - **VPC security group**: Create new or use existing
     - **Database name**: `virtual_wall_decor`
   - Click "Create database"

2. **Configure Security Group**:
   - Go to EC2 → Security Groups
   - Find your RDS security group
   - Add inbound rule:
     - Type: MySQL/Aurora
     - Port: 3306
     - Source: 0.0.0.0/0 (or specific IP ranges for security)

3. **Get Connection Details**:
   - Note down your endpoint URL (e.g., `altar-db.abc123.us-east-1.rds.amazonaws.com`)
   - Username: `admin` (or what you set)
   - Password: (what you created)
   - Database: `virtual_wall_decor`
   - Port: 3306

4. **Database Schema**: Run the SQL commands from `database_schema.sql` in your AWS RDS database

### Step 2: Environment Variables Setup

You'll need to set these environment variables in Render:

**Database Configuration:**
- `DB_HOST` - Your AWS RDS endpoint (e.g., `altar-db.abc123.us-east-1.rds.amazonaws.com`)
- `DB_USER` - Your RDS master username (e.g., `admin`)
- `DB_PASSWORD` - Your RDS master password
- `DB_NAME` - `virtual_wall_decor`
- `DB_PORT` - 3306

**JWT Configuration:**
- `JWT_SECRET` - A strong secret key for JWT tokens

**Email Configuration:**
- `EMAIL_USER` - Your Gmail address
- `EMAIL_PASSWORD` - Your Gmail App Password
- `EMAIL_FROM` - "Altar App <your-email@gmail.com>"

**Other Configuration:**
- `CORS_ORIGIN` - Your Render app URL (will be set automatically)
- `NODE_ENV` - production
- `PORT` - 10000 (Render's default)

### Step 3: Deploy to Render

1. **Sign up/Login to Render**:
   - Go to [render.com](https://render.com)
   - Sign up or login

2. **Create New Web Service**:
   - Click "New +"
   - Select "Web Service"
   - Connect your GitHub repository

3. **Configure the Service**:
   - **Name**: altar-app (or your preferred name)
   - **Environment**: Node
   - **Build Command**: `cd backend && npm install && cd ../frontend && npm install && npm run build`
   - **Start Command**: `cd backend && npm start`
   - **Plan**: Free (or paid if needed)

4. **Set Environment Variables**:
   - Go to the "Environment" tab
   - Add all the environment variables listed in Step 2
   - Make sure to use your actual database credentials

5. **Deploy**:
   - Click "Create Web Service"
   - Render will automatically build and deploy your app

### Step 4: Update Frontend Configuration

After deployment, update your frontend environment variables:

1. **Update API Base URL**:
   - In your frontend code, update `VITE_API_BASE_URL` to point to your Render URL
   - Example: `https://your-app-name.onrender.com/api`

2. **Update CORS Origin**:
   - In your backend environment variables, set `CORS_ORIGIN` to your Render URL

### Step 5: Test Your Deployment

1. **Health Check**: Visit `https://your-app-name.onrender.com/api/health`
2. **Test Registration/Login**: Try creating a new account
3. **Test Email**: Verify email functionality works
4. **Test Database**: Ensure data is being saved to your database

## Troubleshooting

### Common Issues:

1. **Build Failures**:
   - Check the build logs in Render
   - Ensure all dependencies are in package.json
   - Verify Node.js version compatibility

2. **Database Connection Issues**:
   - Verify AWS RDS credentials
   - Check if RDS security group allows connections from Render
   - Ensure database schema is created
   - Verify RDS instance is publicly accessible
   - Check if RDS endpoint is correct

3. **CORS Issues**:
   - Update CORS_ORIGIN to your actual Render URL
   - Check browser console for CORS errors

4. **Email Issues**:
   - Verify Gmail App Password is correct
   - Check if 2FA is enabled on Gmail
   - Test email configuration

### Useful Commands:

```bash
# Check build logs
# View in Render dashboard

# Test AWS RDS connection locally
mysql -h your-rds-endpoint -u admin -p virtual_wall_decor

# Check environment variables
echo $DB_HOST
echo $JWT_SECRET

# Test AWS RDS connectivity
telnet your-rds-endpoint 3306
```

## Post-Deployment

1. **Monitor Logs**: Use Render's log viewer to monitor your app
2. **Set up Custom Domain** (optional): Configure a custom domain in Render
3. **Set up Monitoring** (optional): Configure uptime monitoring
4. **Backup Strategy**: Set up database backups

## Security Considerations

1. **Environment Variables**: Never commit secrets to Git
2. **Database Security**: Use strong passwords and restrict access
3. **HTTPS**: Render provides SSL certificates automatically
4. **Rate Limiting**: Consider implementing rate limiting for your API

## Cost Optimization

1. **Free Tier Limits**: Be aware of Render's free tier limitations
2. **Database Costs**: Choose cost-effective database providers
3. **Bandwidth**: Monitor bandwidth usage

## Support

- Render Documentation: https://render.com/docs
- Render Community: https://community.render.com
- Your app logs: Available in Render dashboard 