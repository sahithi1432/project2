# Quick Start Guide: Deploy to AWS EC2 with RDS

This is a step-by-step quick start guide to deploy your React application to AWS EC2 with RDS MySQL database.

## 🚀 Quick Deployment Steps

### Step 1: AWS Setup (15 minutes)

1. **Create RDS Database**
   - Go to AWS RDS Console
   - Create database → MySQL → Free tier
   - Set database name: `virtual_wall_decor`
   - Note down the endpoint URL
   - Create security group allowing EC2 access

2. **Create EC2 Instance**
   - Go to EC2 Console
   - Launch instance → Ubuntu 22.04 LTS
   - Instance type: `t3.micro` (free tier)
   - Security group: Allow SSH (22), HTTP (80), HTTPS (443), Custom TCP (5000)
   - Download your key pair (.pem file)

### Step 2: Connect and Deploy (10 minutes)

1. **Connect to EC2**
   ```bash
   ssh -i your-key.pem ubuntu@your-ec2-ip
   ```

2. **Run Deployment Script**
   ```bash
   # Upload the deployment script to your EC2 instance
   # Then run:
   chmod +x deploy-ec2.sh
   ./deploy-ec2.sh
   ```

3. **Configure Environment**
   ```bash
   # Edit environment variables
   nano /home/ubuntu/altar-app/backend/.env
   ```

   Update with your RDS credentials:
   ```env
   DB_HOST=your-rds-endpoint.region.rds.amazonaws.com
   DB_USER=admin
   DB_PASSWORD=your-rds-password
   DB_NAME=virtual_wall_decor
   PORT=5000
   NODE_ENV=production
   JWT_SECRET=your-super-secret-jwt-key
   CORS_ORIGIN=http://your-ec2-ip
   ```

### Step 3: Database Setup (5 minutes)

1. **Connect to RDS and run schema**
   ```bash
   # On your local machine or EC2
   mysql -h your-rds-endpoint -u admin -p < database-setup.sql
   ```

### Step 4: Test Application (2 minutes)

1. **Check application status**
   ```bash
   ./health-check.sh
   ```

2. **Access your application**
   - Open browser: `http://your-ec2-ip`
   - Should see your React app running

## 📋 Required Files

Make sure you have these files in your project:

- `deploy-ec2.sh` - Main deployment script
- `database-setup.sql` - Database schema
- `setup-ssl.sh` - SSL setup (optional)
- `monitoring-setup.sh` - Monitoring setup (optional)

## 🔧 Post-Deployment Setup

### Optional: SSL Certificate
```bash
# If you have a domain
./setup-ssl.sh your-domain.com
```

### Optional: Monitoring
```bash
# Set up monitoring and backup
./monitoring-setup.sh
```

## 🛠️ Useful Commands

```bash
# View application logs
pm2 logs altar-app

# Restart application
pm2 restart altar-app

# Monitor system
./monitor.sh

# Create backup
./backup.sh

# Deploy updates
./deploy.sh

# Check health
./health-check.sh
```

## 🔍 Troubleshooting

### Common Issues:

1. **Application not starting**
   ```bash
   pm2 logs altar-app
   # Check for missing environment variables
   ```

2. **Database connection error**
   ```bash
   # Test database connection
   mysql -h your-rds-endpoint -u admin -p
   ```

3. **Nginx issues**
   ```bash
   sudo nginx -t
   sudo systemctl status nginx
   ```

4. **Port issues**
   ```bash
   # Check if port 5000 is in use
   sudo netstat -tlnp | grep :5000
   ```

## 📊 Monitoring

- **System monitoring**: `./monitor.sh`
- **PM2 monitoring**: `pm2 monit`
- **Nginx logs**: `sudo tail -f /var/log/nginx/error.log`
- **Application logs**: `pm2 logs altar-app`

## 🔒 Security Checklist

- [ ] Change default admin password
- [ ] Update JWT secret
- [ ] Configure firewall (UFW)
- [ ] Set up SSL certificate
- [ ] Regular security updates
- [ ] Database backups enabled

## 💰 Cost Optimization

- Use free tier for development
- Consider reserved instances for production
- Monitor usage with AWS Cost Explorer
- Set up billing alerts

## 🚀 Next Steps

1. **Domain Setup**: Point your domain to EC2 IP
2. **SSL Certificate**: Run SSL setup script
3. **Monitoring**: Set up CloudWatch alarms
4. **Backup**: Configure automated backups
5. **CI/CD**: Set up GitHub Actions for auto-deployment

## 📞 Support

If you encounter issues:

1. Check the detailed guide: `AWS_EC2_DEPLOYMENT_GUIDE.md`
2. Review logs: `pm2 logs altar-app`
3. Test connectivity: `./health-check.sh`
4. Monitor system: `./monitor.sh`

Your application should now be running on AWS EC2! 🎉

**Access URL**: `http://your-ec2-ip`
**Admin Login**: `admin@altarapp.com` / `admin123` (change in production!) 