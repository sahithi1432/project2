#!/bin/bash

# Final Deployment Script for Altar Creation App
# Ubuntu EC2 + RDS Deployment

set -e

echo "🚀 Deploying Altar Creation App to Ubuntu EC2 with RDS..."

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

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

# Install Node.js 18.x
print_status "Installing Node.js 18.x..."
if ! command -v node &> /dev/null; then
    curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
    sudo apt-get install -y nodejs
else
    print_warning "Node.js is already installed"
fi

# Install required packages
print_status "Installing required packages..."
sudo apt install -y git nginx mysql-client htop curl wget unzip

# Install PM2 globally
print_status "Installing PM2..."
sudo npm install -g pm2

# Create project directory
PROJECT_DIR="$HOME/altar-app"
print_status "Setting up project directory: $PROJECT_DIR"

if [ -d "$PROJECT_DIR" ]; then
    print_warning "Project directory already exists. Updating..."
    cd "$PROJECT_DIR"
    git pull origin main || true
else
    mkdir -p "$PROJECT_DIR"
    cd "$PROJECT_DIR"
    print_warning "Please clone your repository manually to $PROJECT_DIR"
    print_warning "Then run: git clone https://github.com/yourusername/your-repo.git ."
fi

# Create .env file for backend
print_status "Setting up environment variables..."
cd "$PROJECT_DIR/backend"

if [ ! -f ".env" ]; then
    cat > .env << EOF
NODE_ENV=production
PORT=5000
DB_HOST=your-db-name.region.rds.amazonaws.com
DB_USER=admin
DB_PASSWORD=your_secure_password_here
DB_NAME=virtual_wall_decor
DB_PORT=3306
JWT_SECRET=your_jwt_secret_here
EMAIL_SERVICE=gmail
EMAIL_USER=your_email@gmail.com
EMAIL_PASSWORD=your_app_password
EMAIL_FROM=your_email@gmail.com
CORS_ORIGIN=http://$(curl -s http://169.254.169.254/latest/meta-data/public-ipv4)
MAX_FILE_SIZE=20mb
EOF
    print_warning "Created .env file. Please update with your actual RDS credentials!"
    print_warning "Important: Update DB_HOST with your actual RDS endpoint!"
else
    print_warning ".env file already exists. Please verify the RDS configuration."
fi

# Install backend dependencies
print_status "Installing backend dependencies..."
npm install

# Install frontend dependencies and build
print_status "Installing frontend dependencies..."
cd "$PROJECT_DIR/frontend"
npm install

print_status "Building frontend..."
npm run build

# Create PM2 ecosystem file
print_status "Setting up PM2 configuration..."
cd "$PROJECT_DIR"

cat > ecosystem.config.js << EOF
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

# Start application with PM2
print_status "Starting application with PM2..."
pm2 start ecosystem.config.js
pm2 save
pm2 startup

# Configure Nginx
print_status "Configuring Nginx..."
sudo tee /etc/nginx/sites-available/altar-app > /dev/null << EOF
server {
    listen 80;
    server_name _;

    location / {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_cache_bypass \$http_upgrade;
    }
}
EOF

# Enable Nginx site
print_status "Enabling Nginx site..."
sudo ln -sf /etc/nginx/sites-available/altar-app /etc/nginx/sites-enabled/
sudo rm -f /etc/nginx/sites-enabled/default

# Start Nginx
print_status "Starting Nginx..."
sudo nginx -t
sudo systemctl start nginx
sudo systemctl enable nginx

# Configure UFW firewall
print_status "Configuring UFW firewall..."
sudo ufw allow ssh
sudo ufw allow 80
sudo ufw allow 443
sudo ufw allow 5000
sudo ufw --force enable

# Create RDS connection test script
print_status "Creating RDS connection test script..."
cat > test-rds-connection.sh << 'EOF'
#!/bin/bash
echo "Testing RDS connection..."

# Get RDS endpoint from .env file
DB_HOST=$(grep DB_HOST .env | cut -d '=' -f2)
DB_USER=$(grep DB_USER .env | cut -d '=' -f2)
DB_NAME=$(grep DB_NAME .env | cut -d '=' -f2)

echo "Testing connection to: $DB_HOST"

# Test basic connectivity
if ping -c 1 $DB_HOST &> /dev/null; then
    echo "✅ Network connectivity to RDS is working"
else
    echo "❌ Network connectivity to RDS failed"
    echo "Please check:"
    echo "1. RDS endpoint is correct"
    echo "2. Security group allows EC2 to RDS"
    echo "3. RDS is publicly accessible"
fi

# Test MySQL connection
echo "Testing MySQL connection..."
mysql -h $DB_HOST -u $DB_USER -p -D $DB_NAME -e "SELECT 1;" 2>/dev/null
if [ $? -eq 0 ]; then
    echo "✅ MySQL connection successful"
else
    echo "❌ MySQL connection failed"
    echo "Please check:"
    echo "1. Username and password are correct"
    echo "2. Database name exists"
    echo "3. User has proper permissions"
fi
EOF

chmod +x test-rds-connection.sh

# Create deployment script
print_status "Creating deployment script..."
cat > deploy.sh << 'EOF'
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
EOF

chmod +x deploy.sh

# Get public IP
PUBLIC_IP=$(curl -s http://169.254.169.254/latest/meta-data/public-ipv4)

print_status "Deployment completed successfully!"
echo ""
echo "🎉 Your application should now be accessible at:"
echo "   http://$PUBLIC_IP"
echo ""
echo "📋 Next steps:"
echo "1. Update the .env file with your actual RDS credentials"
echo "2. Test RDS connection: cd ~/altar-app/backend && ./test-rds-connection.sh"
echo "3. Test your application"
echo ""
echo "🔧 Useful commands:"
echo "   pm2 status          - Check application status"
echo "   pm2 logs altar-backend - View application logs"
echo "   ./deploy.sh        - Deploy updates"
echo "   sudo systemctl status nginx - Check Nginx status"
echo "   sudo ufw status    - Check firewall status"
echo "   ./test-rds-connection.sh - Test RDS connection"
echo ""
echo "⚠️  Important:"
echo "   - Update DB_HOST in .env with your actual RDS endpoint"
echo "   - Ensure RDS security group allows EC2 access"
echo "   - Test database connection before proceeding"
echo ""
echo "🔍 Troubleshooting:"
echo "   - Check PM2 logs: pm2 logs altar-backend"
echo "   - Check Nginx logs: sudo tail -f /var/log/nginx/error.log"
echo "   - Test RDS: telnet your-rds-endpoint 3306" 