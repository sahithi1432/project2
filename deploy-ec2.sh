#!/bin/bash

# AWS EC2 Deployment Script for Altar App
# This script automates the deployment process on Ubuntu EC2

set -e  # Exit on any error

echo "🚀 Starting AWS EC2 deployment for Altar App..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if running as root
if [ "$EUID" -eq 0 ]; then
    print_error "Please don't run this script as root"
    exit 1
fi

# Update system
print_status "Updating system packages..."
sudo apt update && sudo apt upgrade -y

# Install essential packages
print_status "Installing essential packages..."
sudo apt install -y curl wget git unzip software-properties-common apt-transport-https ca-certificates gnupg lsb-release

# Install Node.js 18.x
print_status "Installing Node.js 18.x..."
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Verify Node.js installation
print_status "Verifying Node.js installation..."
node --version
npm --version

# Install PM2 globally
print_status "Installing PM2 process manager..."
sudo npm install -g pm2

# Install Nginx
print_status "Installing Nginx..."
sudo apt install nginx -y
sudo systemctl start nginx
sudo systemctl enable nginx

# Install MySQL client (for database connection testing)
print_status "Installing MySQL client..."
sudo apt install mysql-client -y

# Create application directory
print_status "Setting up application directory..."
APP_DIR="/home/ubuntu/altar-app"
mkdir -p $APP_DIR
cd $APP_DIR

# Clone repository (replace with your actual repository URL)
print_status "Cloning repository..."
# git clone https://github.com/your-username/your-repo.git .
# OR if you're uploading files manually, skip this step

# Setup backend
print_status "Setting up backend..."
cd backend

# Create .env file if it doesn't exist
if [ ! -f .env ]; then
    print_warning "Creating .env file from template..."
    cp env.example .env
    print_warning "Please edit the .env file with your RDS credentials!"
    print_warning "Run: nano .env"
fi

# Install backend dependencies
print_status "Installing backend dependencies..."
npm install

# Setup frontend
print_status "Setting up frontend..."
cd ../frontend

# Install frontend dependencies
print_status "Installing frontend dependencies..."
npm install

# Build frontend
print_status "Building frontend..."
npm run build

# Go back to backend
cd ../backend

# Create PM2 ecosystem file
print_status "Creating PM2 configuration..."
cat > ecosystem.config.js << 'EOF'
module.exports = {
  apps: [{
    name: 'altar-app',
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

# Start application with PM2
print_status "Starting application with PM2..."
pm2 start ecosystem.config.js

# Save PM2 configuration
print_status "Saving PM2 configuration..."
pm2 save
pm2 startup

# Configure Nginx
print_status "Configuring Nginx..."
sudo tee /etc/nginx/sites-available/altar-app > /dev/null << 'EOF'
server {
    listen 80;
    server_name _;  # Replace with your domain

    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header Referrer-Policy "no-referrer-when-downgrade" always;
    add_header Content-Security-Policy "default-src 'self' http: https: data: blob: 'unsafe-inline'" always;

    # Gzip compression
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_proxied expired no-cache no-store private must-revalidate auth;
    gzip_types text/plain text/css text/xml text/javascript application/x-javascript application/xml+rss application/javascript;

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
        proxy_read_timeout 86400;
    }

    # Serve static files directly
    location /static/ {
        alias /home/ubuntu/altar-app/frontend/dist/;
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
}
EOF

# Enable the site
print_status "Enabling Nginx site..."
sudo ln -sf /etc/nginx/sites-available/altar-app /etc/nginx/sites-enabled/
sudo rm -f /etc/nginx/sites-enabled/default

# Test Nginx configuration
print_status "Testing Nginx configuration..."
sudo nginx -t

# Reload Nginx
print_status "Reloading Nginx..."
sudo systemctl reload nginx

# Create deployment script
print_status "Creating deployment script..."
cat > /home/ubuntu/deploy.sh << 'EOF'
#!/bin/bash
echo "🔄 Starting deployment..."

cd /home/ubuntu/altar-app

# Pull latest changes (if using git)
# git pull origin main

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

echo "✅ Deployment completed!"
EOF

chmod +x /home/ubuntu/deploy.sh

# Create health check script
print_status "Creating health check script..."
cat > /home/ubuntu/health-check.sh << 'EOF'
#!/bin/bash

# Check if PM2 process is running
if pm2 list | grep -q "altar-app.*online"; then
    echo "✅ PM2 process is running"
else
    echo "❌ PM2 process is not running"
    exit 1
fi

# Check if Nginx is running
if systemctl is-active --quiet nginx; then
    echo "✅ Nginx is running"
else
    echo "❌ Nginx is not running"
    exit 1
fi

# Check if application is responding
if curl -f http://localhost:5000/api/health > /dev/null 2>&1; then
    echo "✅ Application is responding"
else
    echo "❌ Application is not responding"
    exit 1
fi

echo "🎉 All health checks passed!"
EOF

chmod +x /home/ubuntu/health-check.sh

# Setup firewall
print_status "Setting up firewall..."
sudo ufw allow ssh
sudo ufw allow 'Nginx Full'
sudo ufw --force enable

# Create log rotation for PM2
print_status "Setting up log rotation..."
sudo tee /etc/logrotate.d/pm2 > /dev/null << 'EOF'
/home/ubuntu/.pm2/logs/*.log {
    daily
    missingok
    rotate 7
    compress
    delaycompress
    notifempty
    create 644 ubuntu ubuntu
}
EOF

print_status "Deployment completed successfully! 🎉"
print_status ""
print_status "Next steps:"
print_status "1. Edit the .env file with your RDS credentials: nano /home/ubuntu/altar-app/backend/.env"
print_status "2. Set up your database schema"
print_status "3. Configure your domain in Nginx configuration"
print_status "4. Set up SSL with Let's Encrypt (optional)"
print_status "5. Test the application: ./health-check.sh"
print_status ""
print_status "Useful commands:"
print_status "- View logs: pm2 logs altar-app"
print_status "- Monitor: pm2 monit"
print_status "- Restart: pm2 restart altar-app"
print_status "- Deploy updates: ./deploy.sh"
print_status "- Health check: ./health-check.sh" 