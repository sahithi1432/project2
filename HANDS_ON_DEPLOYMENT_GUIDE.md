# Hands-On EC2 Deployment Guide

Follow this guide step by step to deploy your altar creation app to Ubuntu EC2 with RDS.

## 🚀 Quick Start (30 minutes)

### Step 1: Create RDS Database (5 minutes)

1. **Go to AWS Console**
   - Open https://console.aws.amazon.com
   - Sign in to your account

2. **Create RDS Database**
   - Search for "RDS" in the services
   - Click "Create database"
   - Choose "Standard create"
   - Engine: MySQL
   - Version: 8.0.35
   - Template: Free tier (if available)

3. **Configure Settings**
   - DB instance identifier: `altar-app-db`
   - Master username: `admin`
   - Master password: `YourSecurePassword123!`
   - Instance class: db.t3.micro
   - Storage: 20 GB
   - Public access: Yes
   - Database name: `virtual_wall_decor`

4. **Click "Create database"**
   - Wait 5-10 minutes for creation

5. **Note Your RDS Endpoint**
   - Go to RDS → Databases → altar-app-db
   - Copy the endpoint (looks like: `altar-app-db.region.rds.amazonaws.com`)

### Step 2: Create EC2 Instance (5 minutes)

1. **Launch EC2 Instance**
   - Go to EC2 service
   - Click "Launch Instance"

2. **Configure Instance**
   - Name: `altar-app-server`
   - AMI: Ubuntu Server 22.04 LTS
   - Instance type: t2.micro (free tier)
   - Key pair: Create new (save the .pem file)

3. **Configure Security Group**
   - Create new security group
   - Add these rules:
     - SSH (22): Your IP
     - HTTP (80): 0.0.0.0/0
     - HTTPS (443): 0.0.0.0/0
     - Custom TCP (5000): 0.0.0.0/0

4. **Launch Instance**
   - Click "Launch instance"
   - Note your EC2 public IP

### Step 3: Connect to EC2 (2 minutes)

**For Windows:**
```bash
# Open PowerShell
ssh -i "your-key.pem" ubuntu@your-ec2-public-ip
```

**For Mac/Linux:**
```bash
chmod 400 your-key.pem
ssh -i "your-key.pem" ubuntu@your-ec2-public-ip
```

### Step 4: Deploy Application (15 minutes)

1. **Run the deployment script**
```bash
# Copy and paste this entire block
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs git nginx mysql-client htop curl wget unzip
sudo npm install -g pm2

# Clone your repository (replace with your actual repo URL)
cd ~
git clone https://github.com/yourusername/your-repo-name.git altar-app
cd altar-app

# Create environment file
cd backend
cat > .env << 'EOF'
NODE_ENV=production
PORT=5000
DB_HOST=YOUR_RDS_ENDPOINT_HERE
DB_USER=admin
DB_PASSWORD=YourSecurePassword123!
DB_NAME=virtual_wall_decor
DB_PORT=3306
JWT_SECRET=your_super_secret_jwt_key_here
EMAIL_SERVICE=gmail
EMAIL_USER=your_email@gmail.com
EMAIL_PASSWORD=your_app_password
EMAIL_FROM=your_email@gmail.com
CORS_ORIGIN=http://YOUR_EC2_PUBLIC_IP
MAX_FILE_SIZE=20mb
EOF

# Install dependencies
npm install
cd ../frontend
npm install
npm run build
cd ..

# Create PM2 config
cat > ecosystem.config.js << 'EOF'
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
EOF

# Start application
pm2 start ecosystem.config.js
pm2 save
pm2 startup

# Configure Nginx
sudo tee /etc/nginx/sites-available/altar-app > /dev/null << 'EOF'
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
EOF

sudo ln -sf /etc/nginx/sites-available/altar-app /etc/nginx/sites-enabled/
sudo rm -f /etc/nginx/sites-enabled/default
sudo nginx -t
sudo systemctl start nginx
sudo systemctl enable nginx

# Configure firewall
sudo ufw allow ssh
sudo ufw allow 80
sudo ufw allow 443
sudo ufw allow 5000
sudo ufw --force enable

echo "Deployment completed! Your app should be accessible at http://YOUR_EC2_PUBLIC_IP"
```

2. **Update Environment Variables**
```bash
# Edit the .env file with your actual values
cd ~/altar-app/backend
nano .env
```

Replace these values:
- `YOUR_RDS_ENDPOINT_HERE` → Your actual RDS endpoint
- `YOUR_EC2_PUBLIC_IP` → Your actual EC2 public IP
- `your_super_secret_jwt_key_here` → A strong random string
- `your_email@gmail.com` → Your actual email
- `your_app_password` → Your Gmail app password

3. **Test the deployment**
```bash
# Check if application is running
pm2 status

# Test API endpoint
curl http://localhost:5000/api/health

# Check Nginx
sudo systemctl status nginx
```

### Step 5: Configure RDS Security Group (3 minutes)

1. **Go to EC2 Security Groups**
   - AWS Console → EC2 → Security Groups
   - Find your RDS security group

2. **Add Inbound Rule**
   - Type: MySQL/Aurora
   - Port: 3306
   - Source: Your EC2 security group ID

### Step 6: Test Your Application (5 minutes)

1. **Open your browser**
   - Go to: `http://YOUR_EC2_PUBLIC_IP`
   - Your React app should load

2. **Test API endpoints**
   - `http://YOUR_EC2_PUBLIC_IP/api/health`
   - Should return: `{"message":"Backend is running successfully!"}`

## 🔧 Troubleshooting

### If application doesn't start:
```bash
# Check PM2 logs
pm2 logs altar-backend

# Restart application
pm2 restart altar-backend
```

### If database connection fails:
```bash
# Test RDS connection
mysql -h YOUR_RDS_ENDPOINT -u admin -p -D virtual_wall_decor

# Check security group rules
telnet YOUR_RDS_ENDPOINT 3306
```

### If website doesn't load:
```bash
# Check Nginx status
sudo systemctl status nginx

# Check Nginx logs
sudo tail -f /var/log/nginx/error.log

# Restart Nginx
sudo systemctl restart nginx
```

## 📋 Final Checklist

- [ ] RDS database created and accessible
- [ ] EC2 instance running
- [ ] Environment variables updated with real values
- [ ] Application builds successfully
- [ ] PM2 process running (`pm2 status` shows green)
- [ ] Nginx running (`sudo systemctl status nginx`)
- [ ] Website accessible via public IP
- [ ] API endpoints responding

## 🎉 Success!

Your altar creation app is now live at: `http://YOUR_EC2_PUBLIC_IP`

## 🔄 Future Updates

To deploy updates:
```bash
cd ~/altar-app
git pull origin main
cd frontend && npm install && npm run build
cd ../backend && npm install
pm2 restart altar-backend
```

## 💰 Cost Estimation

- **EC2 t2.micro**: Free tier (750 hours/month)
- **RDS db.t3.micro**: Free tier (750 hours/month)
- **Storage**: ~$2.30/GB/month
- **Data transfer**: ~$0.09/GB

Total cost for free tier: **$0/month**
Total cost after free tier: **~$15-25/month**

## 🆘 Need Help?

If you encounter any issues:
1. Check the troubleshooting section above
2. Verify all environment variables are correct
3. Ensure security groups are properly configured
4. Check AWS Console for any service issues

Your application should now be running successfully on Ubuntu EC2 with AWS RDS! 