# AWS EC2 Deployment Guide with Ubuntu and RDS

This guide will help you deploy your React application to AWS EC2 with Ubuntu and RDS MySQL database.

## Prerequisites

1. AWS Account with appropriate permissions
2. AWS CLI installed and configured
3. SSH key pair for EC2 access
4. Domain name (optional but recommended)

## Step 1: Create RDS MySQL Database

### 1.1 Create RDS Instance
1. Go to AWS RDS Console
2. Click "Create database"
3. Choose "Standard create"
4. Select "MySQL" as engine
5. Choose "Free tier" for development or appropriate tier for production
6. Configure settings:
   - **DB instance identifier**: `altar-app-db`
   - **Master username**: `admin`
   - **Master password**: Create a strong password
   - **DB instance class**: `db.t3.micro` (free tier) or appropriate size
   - **Storage**: 20 GB (minimum)
   - **Multi-AZ deployment**: No (for cost savings)
   - **Publicly accessible**: Yes (for EC2 connection)
   - **VPC security group**: Create new security group
   - **Database name**: `virtual_wall_decor`

### 1.2 Configure Security Group
1. Go to EC2 → Security Groups
2. Find the security group created for RDS
3. Add inbound rule:
   - Type: MySQL/Aurora
   - Port: 3306
   - Source: Custom (your EC2 security group)

## Step 2: Create EC2 Instance

### 2.1 Launch EC2 Instance
1. Go to EC2 Console
2. Click "Launch Instance"
3. Configure:
   - **Name**: `altar-app-server`
   - **AMI**: Ubuntu Server 22.04 LTS
   - **Instance type**: `t3.micro` (free tier) or `t3.small` for production
   - **Key pair**: Select your existing key pair or create new
   - **Network settings**: Create security group with rules:
     - SSH (Port 22): Your IP
     - HTTP (Port 80): Anywhere
     - HTTPS (Port 443): Anywhere
     - Custom TCP (Port 5000): Anywhere (for Node.js app)

### 2.2 Configure Security Group for EC2
Create inbound rules:
- SSH (22): Your IP address
- HTTP (80): 0.0.0.0/0
- HTTPS (443): 0.0.0.0/0
- Custom TCP (5000): 0.0.0.0/0

## Step 3: Connect to EC2 and Setup Environment

### 3.1 Connect to EC2
```bash
ssh -i your-key.pem ubuntu@your-ec2-public-ip
```

### 3.2 Update System
```bash
sudo apt update && sudo apt upgrade -y
```

### 3.3 Install Node.js and npm
```bash
# Install Node.js 18.x
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Verify installation
node --version
npm --version
```

### 3.4 Install PM2 (Process Manager)
```bash
sudo npm install -g pm2
```

### 3.5 Install Nginx
```bash
sudo apt install nginx -y
sudo systemctl start nginx
sudo systemctl enable nginx
```

## Step 4: Deploy Application

### 4.1 Clone Repository
```bash
# Install Git
sudo apt install git -y

# Clone your repository
git clone https://github.com/your-username/your-repo.git
cd your-repo
```

### 4.2 Setup Environment Variables
```bash
# Create .env file for backend
cd backend
cp env.example .env
nano .env
```

Update the `.env` file with your RDS credentials:
```env
# Database Configuration
DB_HOST=your-rds-endpoint.region.rds.amazonaws.com
DB_USER=admin
DB_PASSWORD=your-rds-password
DB_NAME=virtual_wall_decor
DB_PORT=3306

# Server Configuration
PORT=5000
NODE_ENV=production

# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production

# Email Configuration (Gmail)
EMAIL_SERVICE=gmail
EMAIL_USER=your-email@gmail.com
EMAIL_PASSWORD=your-app-password
EMAIL_FROM=Altar App <your-email@gmail.com>

# CORS Configuration
CORS_ORIGIN=http://your-domain.com

# File Upload Configuration
MAX_FILE_SIZE=20mb
```

### 4.3 Install Dependencies and Build
```bash
# Install backend dependencies
cd backend
npm install

# Install frontend dependencies and build
cd ../frontend
npm install
npm run build

# Go back to backend
cd ../backend
```

### 4.4 Start Application with PM2
```bash
# Start the application
pm2 start server.js --name "altar-app"

# Save PM2 configuration
pm2 save
pm2 startup
```

## Step 5: Configure Nginx as Reverse Proxy

### 5.1 Create Nginx Configuration
```bash
sudo nano /etc/nginx/sites-available/altar-app
```

Add the following configuration:
```nginx
server {
    listen 80;
    server_name your-domain.com www.your-domain.com;

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

### 5.2 Enable Site
```bash
sudo ln -s /etc/nginx/sites-available/altar-app /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

## Step 6: Setup SSL with Let's Encrypt (Optional)

### 6.1 Install Certbot
```bash
sudo apt install certbot python3-certbot-nginx -y
```

### 6.2 Obtain SSL Certificate
```bash
sudo certbot --nginx -d your-domain.com -d www.your-domain.com
```

## Step 7: Database Setup

### 7.1 Create Database Tables
You'll need to create the necessary database tables. Create a SQL file with your schema:

```sql
-- Create database if not exists
CREATE DATABASE IF NOT EXISTS virtual_wall_decor;
USE virtual_wall_decor;

-- Create users table
CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(255) UNIQUE NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Create walls table
CREATE TABLE IF NOT EXISTS walls (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT,
    name VARCHAR(255) NOT NULL,
    data JSON,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Add any other tables your application needs
```

### 7.2 Execute SQL
Connect to your RDS instance and execute the SQL:
```bash
mysql -h your-rds-endpoint -u admin -p virtual_wall_decor < schema.sql
```

## Step 8: Monitoring and Maintenance

### 8.1 PM2 Commands
```bash
# View logs
pm2 logs altar-app

# Monitor processes
pm2 monit

# Restart application
pm2 restart altar-app

# Stop application
pm2 stop altar-app
```

### 8.2 Nginx Commands
```bash
# Test configuration
sudo nginx -t

# Reload configuration
sudo systemctl reload nginx

# View logs
sudo tail -f /var/log/nginx/access.log
sudo tail -f /var/log/nginx/error.log
```

## Step 9: Auto-deployment Script

Create a deployment script for easy updates:

```bash
#!/bin/bash
# deploy.sh

echo "Starting deployment..."

# Pull latest changes
git pull origin main

# Install backend dependencies
cd backend
npm install

# Install frontend dependencies and build
cd ../frontend
npm install
npm run build

# Restart application
cd ../backend
pm2 restart altar-app

echo "Deployment completed!"
```

Make it executable:
```bash
chmod +x deploy.sh
```

## Troubleshooting

### Common Issues:

1. **Database Connection Error**
   - Check RDS security group allows EC2 security group
   - Verify database credentials in .env file
   - Ensure RDS is publicly accessible

2. **Application Not Starting**
   - Check PM2 logs: `pm2 logs altar-app`
   - Verify environment variables are set correctly
   - Check if port 5000 is available

3. **Nginx Issues**
   - Test configuration: `sudo nginx -t`
   - Check error logs: `sudo tail -f /var/log/nginx/error.log`

4. **SSL Issues**
   - Ensure domain points to your EC2 IP
   - Check firewall allows port 443
   - Verify certbot installation

## Security Considerations

1. **Update Security Groups**: Only allow necessary ports
2. **Regular Updates**: Keep Ubuntu and packages updated
3. **Firewall**: Configure UFW firewall
4. **Backup**: Set up automated backups for RDS
5. **Monitoring**: Set up CloudWatch alarms

## Cost Optimization

1. **Use Free Tier**: EC2 t3.micro and RDS free tier for development
2. **Reserved Instances**: For production, consider reserved instances
3. **Auto Scaling**: Implement auto scaling for traffic spikes
4. **Backup Retention**: Adjust RDS backup retention period

## Next Steps

1. Set up CI/CD pipeline with GitHub Actions
2. Implement monitoring with CloudWatch
3. Set up automated backups
4. Configure domain and DNS
5. Implement CDN for static assets

Your application should now be running on AWS EC2 with RDS database! 