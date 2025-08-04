#!/bin/bash

# Monitoring and Backup Setup Script
# This script sets up monitoring and backup for your application

set -e

echo "📊 Setting up monitoring and backup..."

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

# Install monitoring tools
print_status "Installing monitoring tools..."
sudo apt update
sudo apt install -y htop iotop nethogs curl wget

# Create monitoring script
print_status "Creating monitoring script..."
cat > /home/ubuntu/monitor.sh << 'EOF'
#!/bin/bash

# System monitoring script
echo "=== System Monitoring Report ==="
echo "Date: $(date)"
echo ""

# CPU Usage
echo "CPU Usage:"
top -bn1 | grep "Cpu(s)" | awk '{print $2}' | cut -d'%' -f1
echo ""

# Memory Usage
echo "Memory Usage:"
free -h
echo ""

# Disk Usage
echo "Disk Usage:"
df -h
echo ""

# Application Status
echo "Application Status:"
pm2 list
echo ""

# Nginx Status
echo "Nginx Status:"
systemctl is-active nginx
echo ""

# Database Connection Test
echo "Database Connection Test:"
if curl -f http://localhost:5000/api/health > /dev/null 2>&1; then
    echo "✅ Application is responding"
else
    echo "❌ Application is not responding"
fi
echo ""

# Log file sizes
echo "Log File Sizes:"
ls -lh /home/ubuntu/.pm2/logs/
echo ""

# Recent errors
echo "Recent PM2 Errors:"
tail -n 10 /home/ubuntu/.pm2/logs/altar-app-error.log 2>/dev/null || echo "No error log found"
echo ""
EOF

chmod +x /home/ubuntu/monitor.sh

# Create backup script
print_status "Creating backup script..."
cat > /home/ubuntu/backup.sh << 'EOF'
#!/bin/bash

# Backup script for application data
BACKUP_DIR="/home/ubuntu/backups"
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_NAME="altar-app-backup-$DATE"

echo "Creating backup: $BACKUP_NAME"

# Create backup directory
mkdir -p $BACKUP_DIR

# Backup application files
tar -czf $BACKUP_DIR/$BACKUP_NAME-app.tar.gz -C /home/ubuntu altar-app/

# Backup PM2 configuration
pm2 save
cp /home/ubuntu/.pm2/dump.pm2 $BACKUP_DIR/$BACKUP_NAME-pm2.json

# Backup Nginx configuration
tar -czf $BACKUP_DIR/$BACKUP_NAME-nginx.tar.gz -C /etc nginx/

# Backup environment variables
cp /home/ubuntu/altar-app/backend/.env $BACKUP_DIR/$BACKUP_NAME-env.txt

# Create backup info file
cat > $BACKUP_DIR/$BACKUP_NAME-info.txt << INFO
Backup created: $(date)
Application: Altar App
Backup includes:
- Application files
- PM2 configuration
- Nginx configuration
- Environment variables

To restore:
1. Extract app files: tar -xzf $BACKUP_NAME-app.tar.gz
2. Restore PM2: pm2 resurrect
3. Restore Nginx: tar -xzf $BACKUP_NAME-nginx.tar.gz -C /
4. Restore env: cp $BACKUP_NAME-env.txt /home/ubuntu/altar-app/backend/.env
INFO

# Clean old backups (keep last 7 days)
find $BACKUP_DIR -name "altar-app-backup-*" -mtime +7 -delete

echo "Backup completed: $BACKUP_NAME"
echo "Backup location: $BACKUP_DIR"
EOF

chmod +x /home/ubuntu/backup.sh

# Create log rotation for application logs
print_status "Setting up log rotation..."
sudo tee /etc/logrotate.d/altar-app > /dev/null << 'EOF'
/home/ubuntu/altar-app/backend/logs/*.log {
    daily
    missingok
    rotate 14
    compress
    delaycompress
    notifempty
    create 644 ubuntu ubuntu
    postrotate
        pm2 reloadLogs
    endscript
}
EOF

# Create system monitoring cron job
print_status "Setting up monitoring cron jobs..."
(crontab -l 2>/dev/null; echo "*/5 * * * * /home/ubuntu/monitor.sh > /home/ubuntu/monitoring.log 2>&1") | crontab -

# Create daily backup cron job
(crontab -l 2>/dev/null; echo "0 2 * * * /home/ubuntu/backup.sh > /home/ubuntu/backup.log 2>&1") | crontab -

# Create log cleanup cron job
(crontab -l 2>/dev/null; echo "0 3 * * * find /home/ubuntu/.pm2/logs/ -name '*.log' -mtime +30 -delete") | crontab -

# Create CloudWatch monitoring script (if AWS CLI is installed)
if command -v aws &> /dev/null; then
    print_status "Setting up CloudWatch monitoring..."
    cat > /home/ubuntu/cloudwatch-metrics.sh << 'EOF'
#!/bin/bash

# CloudWatch metrics script
INSTANCE_ID=$(curl -s http://169.254.169.254/latest/meta-data/instance-id)
REGION=$(curl -s http://169.254.169.254/latest/meta-data/placement/region)

# CPU Usage
CPU_USAGE=$(top -bn1 | grep "Cpu(s)" | awk '{print $2}' | cut -d'%' -f1)

# Memory Usage
MEMORY_USAGE=$(free | grep Mem | awk '{printf "%.2f", $3/$2 * 100.0}')

# Disk Usage
DISK_USAGE=$(df / | tail -1 | awk '{print $5}' | sed 's/%//')

# Send metrics to CloudWatch
aws cloudwatch put-metric-data \
    --namespace "AltarApp" \
    --metric-data \
        MetricName=CPUUtilization,Value=$CPU_USAGE,Unit=Percent \
        MetricName=MemoryUtilization,Value=$MEMORY_USAGE,Unit=Percent \
        MetricName=DiskUtilization,Value=$DISK_USAGE,Unit=Percent \
    --region $REGION
EOF

    chmod +x /home/ubuntu/cloudwatch-metrics.sh
    
    # Add CloudWatch metrics to cron (every 5 minutes)
    (crontab -l 2>/dev/null; echo "*/5 * * * * /home/ubuntu/cloudwatch-metrics.sh > /dev/null 2>&1") | crontab -
fi

# Create alert script
print_status "Creating alert script..."
cat > /home/ubuntu/alert.sh << 'EOF'
#!/bin/bash

# Alert script for critical issues
ALERT_EMAIL="admin@yourdomain.com"  # Change this to your email

# Check if application is running
if ! pm2 list | grep -q "altar-app.*online"; then
    echo "ALERT: Altar app is not running!" | mail -s "Altar App Alert" $ALERT_EMAIL
fi

# Check disk usage
DISK_USAGE=$(df / | tail -1 | awk '{print $5}' | sed 's/%//')
if [ $DISK_USAGE -gt 80 ]; then
    echo "ALERT: Disk usage is ${DISK_USAGE}%" | mail -s "Altar App Alert" $ALERT_EMAIL
fi

# Check memory usage
MEMORY_USAGE=$(free | grep Mem | awk '{printf "%.0f", $3/$2 * 100.0}')
if [ $MEMORY_USAGE -gt 90 ]; then
    echo "ALERT: Memory usage is ${MEMORY_USAGE}%" | mail -s "Altar App Alert" $ALERT_EMAIL
fi
EOF

chmod +x /home/ubuntu/alert.sh

# Add alert to cron (every 10 minutes)
(crontab -l 2>/dev/null; echo "*/10 * * * * /home/ubuntu/alert.sh > /dev/null 2>&1") | crontab -

print_status "Monitoring and backup setup completed! 🎉"
print_status ""
print_status "Monitoring tools installed:"
print_status "- htop: System monitoring"
print_status "- iotop: I/O monitoring"
print_status "- nethogs: Network monitoring"
print_status ""
print_status "Scripts created:"
print_status "- /home/ubuntu/monitor.sh: System monitoring"
print_status "- /home/ubuntu/backup.sh: Application backup"
print_status "- /home/ubuntu/alert.sh: Alert notifications"
print_status ""
print_status "Cron jobs set up:"
print_status "- System monitoring: Every 5 minutes"
print_status "- Daily backup: 2 AM daily"
print_status "- Log cleanup: 3 AM daily"
print_status "- Alerts: Every 10 minutes"
print_status ""
print_status "To view monitoring: ./monitor.sh"
print_status "To create backup: ./backup.sh"
print_status "To view cron jobs: crontab -l" 