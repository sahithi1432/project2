# AWS RDS Setup Guide for Altar App

## Prerequisites

1. **AWS Account**: You need an active AWS account
2. **AWS CLI** (optional): For easier management
3. **MySQL Client**: For testing connections

## Step-by-Step AWS RDS Setup

### Step 1: Create RDS Instance

1. **Access AWS RDS Console**:
   - Go to [AWS RDS Console](https://console.aws.amazon.com/rds/)
   - Sign in to your AWS account

2. **Create Database**:
   - Click "Create database"
   - Choose "Standard create"
   - Select "MySQL" as the engine
   - Choose "MySQL 8.0.35" (or latest stable version)

3. **Configure Settings**:
   - **Templates**: Choose "Free tier" (if available) or "Production"
   - **DB instance identifier**: `altar-db` (or your preferred name)
   - **Master username**: `admin` (or your preferred username)
   - **Master password**: Create a strong password (save this!)
   - **Confirm password**: Re-enter the password

4. **Instance Configuration**:
   - **DB instance class**: `db.t3.micro` (free tier) or `db.t3.small` for production
   - **Storage type**: General Purpose SSD (gp2)
   - **Allocated storage**: 20 GB (minimum for free tier)
   - **Enable storage autoscaling**: Yes (recommended)

5. **Connectivity**:
   - **VPC**: Default VPC (or create new)
   - **Public access**: **Yes** (required for Render to connect)
   - **VPC security group**: Create new security group
   - **Availability Zone**: No preference
   - **Database port**: 3306

6. **Database Authentication**:
   - **Database authentication options**: Password authentication

7. **Additional Configuration**:
   - **Initial database name**: `virtual_wall_decor`
   - **Backup retention period**: 7 days (free tier) or 30 days
   - **Enable encryption**: Yes (recommended)
   - **Enable CloudWatch logs**: Yes (for monitoring)

8. **Create Database**:
   - Review all settings
   - Click "Create database"

### Step 2: Configure Security Group

1. **Find Your Security Group**:
   - Go to EC2 → Security Groups
   - Find the security group associated with your RDS instance

2. **Add Inbound Rule**:
   - Select your security group
   - Go to "Inbound rules" tab
   - Click "Edit inbound rules"
   - Click "Add rule"
   - Configure:
     - **Type**: MySQL/Aurora
     - **Protocol**: TCP
     - **Port range**: 3306
     - **Source**: 0.0.0.0/0 (for development) or specific IP ranges
   - Click "Save rules"

### Step 3: Get Connection Details

1. **Find Your Endpoint**:
   - Go back to RDS Console
   - Click on your database instance
   - Note the "Endpoint" (e.g., `altar-db.abc123.us-east-1.rds.amazonaws.com`)

2. **Connection Information**:
   ```
   Host: your-rds-endpoint.amazonaws.com
   Port: 3306
   Username: admin (or what you set)
   Password: (what you created)
   Database: virtual_wall_decor
   ```

### Step 4: Test Connection

1. **Using MySQL Client**:
   ```bash
   mysql -h your-rds-endpoint -u admin -p virtual_wall_decor
   ```

2. **Using AWS CLI** (if installed):
   ```bash
   aws rds describe-db-instances --db-instance-identifier altar-db
   ```

### Step 5: Create Database Schema

1. **Connect to Your Database**:
   ```bash
   mysql -h your-rds-endpoint -u admin -p virtual_wall_decor
   ```

2. **Run the Schema**:
   ```sql
   -- Copy and paste the contents of database_schema.sql
   -- Or run each command individually
   ```

## Environment Variables for Render

Set these in your Render dashboard:

```
DB_HOST=your-rds-endpoint.amazonaws.com
DB_USER=admin
DB_PASSWORD=your-rds-password
DB_NAME=virtual_wall_decor
DB_PORT=3306
```

## Troubleshooting

### Common Issues:

1. **Connection Timeout**:
   - Check if RDS is publicly accessible
   - Verify security group rules
   - Check if RDS instance is running

2. **Access Denied**:
   - Verify username and password
   - Check if database name exists
   - Ensure user has proper permissions

3. **Security Group Issues**:
   - Make sure inbound rule allows port 3306
   - Check if source IP is correct
   - Verify security group is attached to RDS

### Useful Commands:

```bash
# Test connectivity
telnet your-rds-endpoint 3306

# Check RDS status
aws rds describe-db-instances --db-instance-identifier altar-db

# Connect to database
mysql -h your-rds-endpoint -u admin -p

# Show databases
SHOW DATABASES;

# Use your database
USE virtual_wall_decor;

# Show tables
SHOW TABLES;
```

## Cost Optimization

1. **Free Tier**: AWS RDS free tier includes:
   - 750 hours per month of db.t3.micro
   - 20 GB of storage
   - 20 GB of backup storage

2. **Production Considerations**:
   - Use Multi-AZ deployment for high availability
   - Enable automated backups
   - Set up monitoring and alerts
   - Consider reserved instances for cost savings

## Security Best Practices

1. **Network Security**:
   - Use specific IP ranges instead of 0.0.0.0/0
   - Consider using VPC endpoints
   - Enable SSL connections

2. **Access Control**:
   - Use strong passwords
   - Consider using IAM database authentication
   - Regularly rotate credentials

3. **Monitoring**:
   - Enable CloudWatch logs
   - Set up alerts for unusual activity
   - Monitor connection attempts

## Support Resources

- [AWS RDS Documentation](https://docs.aws.amazon.com/rds/)
- [AWS RDS Best Practices](https://docs.aws.amazon.com/rds/latest/UserGuide/CHAP_BestPractices.html)
- [AWS Support](https://aws.amazon.com/support/) 