# Final EC2 Deployment Guide - Ubuntu + RDS

Complete deployment procedure for your altar creation app on Ubuntu EC2 with AWS RDS.

## Prerequisites
- AWS Account
- Your project code in a Git repository
- RDS MySQL database already created

## Step 1: Set Up RDS Database

### 1.1 Create RDS MySQL Instance
1. Go to AWS Console → RDS → Create database
2. Configure:
   - **Engine**: MySQL 8.0.35
   - **Template**: Free tier or Production
   - **DB instance identifier**: `altar-app-db`
   - **Master username**: `admin`
   - **Master password**: `your_secure_password`
   - **Instance class**: db.t3.micro (free) or db.t3.small
   - **Storage**: 20 GB
   - **Public access**: Yes
   - **Database name**: `virtual_wall_decor`

### 1.2 Configure Security Groups
1. **RDS Security Group**:
   - Type: MySQL/Aurora
   - Port: 3306
   - Source: Your EC2 security group ID

2. **Note RDS Endpoint**:
   - Endpoint: `your-db-name.region.rds.amazonaws.com`
   - Username: `admin`
   - Password: `your_secure_password`
   - Database: `virtual_wall_decor`

## Step 2: Launch Ubuntu EC2 Instance

### 2.1 Create EC2 Instance
1. Go to AWS Console → EC2 → Launch Instance
2. Configure:
   - **Name**: `altar-app-server`
   - **AMI**: Ubuntu Server 22.04 LTS
   - **Instance Type**: t2.micro (free) or t3.small
   - **Key Pair**: Create or select existing
   - **Security Group**: Create new with rules:
     - SSH (22): Your IP
     - HTTP (80): 0.0.0.0/0
     - HTTPS (443): 0.0.0.0/0
     - Custom TCP (5000): 0.0.0.0/0

### 2.2 Connect to EC2
```bash
# Windows PowerShell
ssh -i "your-key.pem" ubuntu@your-ec2-public-ip

# Mac/Linux
chmod 400 your-key.pem
ssh -i "your-key.pem" ubuntu@your-ec2-public-ip
```

## Step 3: Deploy Application

### 3.1 Set Up Server Environment
```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Node.js 18.x
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Install required packages
sudo apt install -y git nginx mysql-client htop curl wget unzip

# Install PM2 globally
sudo npm install -g pm2
```

### 3.2 Clone and Set Up Project
```bash
# Navigate to home directory
cd ~

# Clone your repository
git clone https://github.com/yourusername/your-repo-name.git altar-app
cd altar-app

# Set up environment variables
cd backend
nano .env
```

### 3.3 Configure Environment Variables
Add this to your `.env` file:
```env
NODE_ENV=production
PORT=5000
DB_HOST=your-db-name.region.rds.amazonaws.com
DB_USER=admin
DB_PASSWORD=your_secure_password
DB_NAME=virtual_wall_decor
DB_PORT=3306
JWT_SECRET=your_jwt_secret_here
EMAIL_SERVICE=gmail
EMAIL_USER=your_email@gmail.com
EMAIL_PASSWORD=your_app_password
EMAIL_FROM=your_email@gmail.com
CORS_ORIGIN=http://your-ec2-public-ip
MAX_FILE_SIZE=20mb
```

### 3.4 Install Dependencies and Build
```bash
# Install backend dependencies
cd backend
npm install

# Install frontend dependencies and build
cd ../frontend
npm install
npm run build

# Go back to project root
cd ..
```

### 3.5 Test RDS Connection
```bash
# Test database connection
mysql -h your-db-name.region.rds.amazonaws.com -u admin -p -D virtual_wall_decor

# Test from application
cd backend
node -e "
const pool = require('./config/database.js');
pool.getConnection((err, connection) => {
  if (err) {
    console.error('Database connection failed:', err);
  } else {
    console.log('Database connection successful!');
    connection.release();
  }
  process.exit();
});
"
```

## Step 4: Set Up Process Management

### 4.1 Create PM2 Configuration
```bash
# Create ecosystem file
cd ~/altar-app
nano ecosystem.config.js
```

Add this configuration:
```javascript
module.exports = {
  apps: [{
    name: 'altar-backend',
    cwd: './backend',
    script: 'server.js',
    instances: 1,
    autorestart: true,
    watch: false,
    max_memory_restart: '1G',
    env: {
      NODE_ENV: 'production',
      PORT: 5000
    }
  }]
};
```

### 4.2 Start Application with PM2
```bash
# Start application
pm2 start ecosystem.config.js

# Save PM2 configuration
pm2 save

# Set PM2 to start on system boot
pm2 startup
```

## Step 5: Configure Nginx

### 5.1 Set Up Nginx Reverse Proxy
```bash
# Create Nginx configuration
sudo nano /etc/nginx/sites-available/altar-app
```

Add this configuration:
```nginx
server {
    listen 80;
    server_name _;

    location / {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

### 5.2 Enable Nginx Site
```bash
# Create symbolic link
sudo ln -s /etc/nginx/sites-available/altar-app /etc/nginx/sites-enabled/

# Remove default site
sudo rm /etc/nginx/sites-enabled/default

# Test and start Nginx
sudo nginx -t
sudo systemctl start nginx
sudo systemctl enable nginx
```

## Step 6: Configure Firewall

### 6.1 Set Up UFW
```bash
# Allow required ports
sudo ufw allow ssh
sudo ufw allow 80
sudo ufw allow 443
sudo ufw allow 5000

# Enable firewall
sudo ufw enable

# Check status
sudo ufw status
```

## Step 7: Test Deployment

### 7.1 Verify Application
```bash
# Check PM2 status
pm2 status

# View application logs
pm2 logs altar-backend

# Test API endpoint
curl http://localhost:5000/api/health
```

### 7.2 Access Application
- Open browser and go to: `http://your-ec2-public-ip`
- Your React app should load
- Test the API endpoints: `http://your-ec2-public-ip/api/health`

## Step 8: Create Deployment Script

### 8.1 Create Automated Deployment
```bash
# Create deployment script
nano deploy.sh
```

Add this script:
```bash
#!/bin/bash
cd ~/altar-app
git pull origin main
cd frontend
npm install
npm run build
cd ../backend
npm install
pm2 restart altar-backend
echo "Deployment completed!"
```

### 8.2 Make Script Executable
```bash
chmod +x deploy.sh
```

## Step 9: Monitoring and Maintenance

### 9.1 Useful Commands
```bash
# Check application status
pm2 status
pm2 logs altar-backend

# Check system resources
htop
free -h
df -h

# Check Nginx status
sudo systemctl status nginx
sudo tail -f /var/log/nginx/error.log

# Check RDS connection
mysql -h your-db-name.region.rds.amazonaws.com -u admin -p -D virtual_wall_decor
```

### 9.2 Troubleshooting
```bash
# If application not starting
pm2 restart altar-backend
pm2 logs altar-backend

# If Nginx issues
sudo nginx -t
sudo systemctl restart nginx

# If database connection issues
telnet your-db-name.region.rds.amazonaws.com 3306
```

## Step 10: Security and Optimization

### 10.1 Security Checklist
- [ ] Update system regularly: `sudo apt update && sudo apt upgrade -y`
- [ ] Use strong passwords for database and JWT
- [ ] Limit SSH access to your IP only
- [ ] Configure SSL certificate (optional)
- [ ] Set up regular backups

### 10.2 Performance Optimization
- [ ] Monitor RDS metrics in CloudWatch
- [ ] Enable Performance Insights
- [ ] Set up CloudWatch alarms
- [ ] Configure automated backups

## Quick Commands Summary

```bash
# Connect to server
ssh -i "your-key.pem" ubuntu@your-ec2-public-ip

# Deploy updates
./deploy.sh

# Check status
pm2 status
pm2 logs altar-backend

# Restart application
pm2 restart altar-backend

# Check system
htop
sudo ufw status
sudo systemctl status nginx
```

## Final Checklist

- [ ] RDS database created and accessible
- [ ] EC2 instance launched with correct security groups
- [ ] Environment variables configured with RDS details
- [ ] Application builds successfully
- [ ] PM2 process running
- [ ] Nginx configured and running
- [ ] Firewall configured
- [ ] Application accessible via public IP
- [ ] Database connection working
- [ ] API endpoints responding

Your application should now be running on Ubuntu EC2 with AWS RDS! Access it via your EC2 public IP address. 