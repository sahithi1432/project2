#!/bin/bash

# SSL Setup Script with Let's Encrypt
# This script sets up SSL certificate for your domain

set -e

echo "🔒 Setting up SSL with Let's Encrypt..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
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

# Check if domain is provided
if [ -z "$1" ]; then
    print_error "Please provide your domain name"
    echo "Usage: $0 your-domain.com"
    exit 1
fi

DOMAIN=$1

print_status "Setting up SSL for domain: $DOMAIN"

# Install Certbot
print_status "Installing Certbot..."
sudo apt update
sudo apt install certbot python3-certbot-nginx -y

# Update Nginx configuration with domain
print_status "Updating Nginx configuration..."
sudo tee /etc/nginx/sites-available/altar-app > /dev/null << EOF
server {
    listen 80;
    server_name $DOMAIN www.$DOMAIN;

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
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_cache_bypass \$http_upgrade;
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

# Test Nginx configuration
print_status "Testing Nginx configuration..."
sudo nginx -t

# Reload Nginx
print_status "Reloading Nginx..."
sudo systemctl reload nginx

# Obtain SSL certificate
print_status "Obtaining SSL certificate..."
sudo certbot --nginx -d $DOMAIN -d www.$DOMAIN --non-interactive --agree-tos --email admin@$DOMAIN

# Test SSL certificate
print_status "Testing SSL certificate..."
sudo certbot certificates

# Setup auto-renewal
print_status "Setting up auto-renewal..."
sudo crontab -l 2>/dev/null | { cat; echo "0 12 * * * /usr/bin/certbot renew --quiet"; } | sudo crontab -

print_status "SSL setup completed successfully! 🎉"
print_status ""
print_status "Your site is now available at: https://$DOMAIN"
print_status ""
print_status "Certificate will auto-renew every 60 days"
print_status "You can test renewal with: sudo certbot renew --dry-run" 