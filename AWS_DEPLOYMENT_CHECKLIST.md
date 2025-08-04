# AWS RDS Deployment Checklist

## ✅ Pre-Deployment Checklist

### AWS RDS Setup
- [ ] AWS account created and active
- [ ] RDS MySQL instance created
- [ ] Database endpoint noted down
- [ ] Master username and password saved
- [ ] Security group configured (port 3306 open)
- [ ] Database schema created (run `database_schema.sql`)
- [ ] Connection tested locally

### Email Setup
- [ ] Gmail account with 2FA enabled
- [ ] Gmail App Password generated
- [ ] Email credentials saved

### Code Preparation
- [ ] Code pushed to GitHub
- [ ] All deployment files present:
  - [ ] `render.yaml`
  - [ ] `backend/Procfile`
  - [ ] `DEPLOYMENT_GUIDE.md`
  - [ ] `AWS_RDS_SETUP.md`
  - [ ] `database_schema.sql`

## ✅ Render Deployment Checklist

### Render Account Setup
- [ ] Render account created
- [ ] GitHub repository connected
- [ ] New web service created

### Service Configuration
- [ ] Service name: `altar-app` (or your choice)
- [ ] Environment: `Node`
- [ ] Build Command: `cd backend && npm install && cd ../frontend && npm install && npm run build`
- [ ] Start Command: `cd backend && npm start`
- [ ] Plan: Free (or appropriate plan)

### Environment Variables (Critical!)
- [ ] `DB_HOST` = your-aws-rds-endpoint.amazonaws.com
- [ ] `DB_USER` = admin (or your username)
- [ ] `DB_PASSWORD` = your-rds-password
- [ ] `DB_NAME` = virtual_wall_decor
- [ ] `DB_PORT` = 3306
- [ ] `JWT_SECRET` = strong-random-secret-key
- [ ] `EMAIL_USER` = your-gmail@gmail.com
- [ ] `EMAIL_PASSWORD` = your-gmail-app-password
- [ ] `EMAIL_FROM` = Altar App <your-gmail@gmail.com>
- [ ] `EMAIL_SERVICE` = gmail
- [ ] `NODE_ENV` = production
- [ ] `PORT` = 10000
- [ ] `CORS_ORIGIN` = https://your-app-name.onrender.com
- [ ] `MAX_FILE_SIZE` = 20mb

## ✅ Post-Deployment Checklist

### Testing
- [ ] Health check: `https://your-app-name.onrender.com/api/health`
- [ ] User registration works
- [ ] User login works
- [ ] Email functionality works
- [ ] Database operations work
- [ ] Frontend loads correctly

### Configuration Updates
- [ ] Frontend API URL updated to Render URL
- [ ] CORS origin updated in Render environment variables
- [ ] All features tested end-to-end

## 🔧 Troubleshooting Quick Reference

### If Build Fails:
- Check Render build logs
- Verify all dependencies in package.json
- Check Node.js version compatibility

### If Database Connection Fails:
- Verify AWS RDS endpoint is correct
- Check security group allows port 3306
- Ensure RDS is publicly accessible
- Test connection locally first

### If CORS Errors:
- Update CORS_ORIGIN to exact Render URL
- Check browser console for specific errors
- Verify environment variables are set correctly

### If Email Doesn't Work:
- Verify Gmail App Password is correct
- Check if 2FA is enabled on Gmail
- Test email configuration

## 📞 Support Resources

- **Render Documentation**: https://render.com/docs
- **AWS RDS Documentation**: https://docs.aws.amazon.com/rds/
- **Render Community**: https://community.render.com
- **AWS Support**: https://aws.amazon.com/support/

## 💰 Cost Monitoring

- **AWS RDS**: Monitor usage in AWS Console
- **Render**: Check usage in Render dashboard
- **Set up billing alerts** for both services

## 🔒 Security Checklist

- [ ] Strong passwords used for all services
- [ ] Environment variables not committed to Git
- [ ] RDS security group properly configured
- [ ] HTTPS enabled (automatic with Render)
- [ ] Regular backups configured (AWS RDS) 