# Deployment Guide - Event Platform Backend

This guide will walk you through deploying your Event Platform backend and PostgreSQL database on Render.

## Prerequisites

- GitHub account with your backend code pushed to a repository
- Render account (free tier available)
- Your local project should be working correctly

## Step 1: Prepare Your Backend for Deployment

### 1.1 Update package.json

Ensure your `package.json` has the correct start script:

```json
{
  "scripts": {
    "start": "node src/server.js",
    "dev": "nodemon src/server.js",
    "build": "npx prisma generate"
  },
  "engines": {
    "node": ">=18.0.0"
  }
}
```

### 1.2 Create Build Command Script

Create a `build.sh` file in your project root (optional but recommended):

```bash
#!/bin/bash
echo "Installing dependencies..."
npm install

echo "Generating Prisma client..."
npx prisma generate

echo "Running database migrations..."
npx prisma migrate deploy

echo "Build completed!"
```

Make it executable:
```bash
chmod +x build.sh
```

### 1.3 Environment Variables Setup

Create a `.env.production` file with production environment variables (don't commit this):

```env
NODE_ENV=production
PORT=3000
DATABASE_URL=your_postgres_url_here
JWT_SECRET=your_super_secret_jwt_key_here
JWT_EXPIRES_IN=7d
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your_email@gmail.com
EMAIL_PASS=your_app_password
CHAT_EXPIRY_DAYS=2
```

## Step 2: Deploy PostgreSQL Database on Render

### 2.1 Create PostgreSQL Database

1. **Login to Render Dashboard**
   - Go to [render.com](https://render.com)
   - Sign in or create account

2. **Create New PostgreSQL Database**
   - Click "New +" button
   - Select "PostgreSQL"

3. **Configure Database Settings**
   ```
   Name: event-platform-db
   Database: event_platform
   User: event_user
   Region: Choose closest to your users
   PostgreSQL Version: 15 (recommended)
   Plan: Free (or paid for production)
   ```

4. **Wait for Database Creation**
   - This takes 2-3 minutes
   - Note down the connection details

5. **Get Database URL**
   - Go to your database dashboard
   - Copy the "External Database URL"
   - Format: `postgresql://user:password@host:port/database`

## Step 3: Deploy Backend Application on Render

### 3.1 Create Web Service

1. **Create New Web Service**
   - Click "New +" button
   - Select "Web Service"

2. **Connect GitHub Repository**
   - Choose "Connect a repository"
   - Select your backend repository
   - Choose the main/master branch

3. **Configure Service Settings**
   ```
   Name: event-platform-backend
   Environment: Node
   Region: Same as your database
   Branch: main (or master)
   Build Command: npm install && npx prisma generate
   Start Command: npm start
   Plan: Free (or paid for production)
   ```

### 3.2 Add Environment Variables

In the "Environment Variables" section, add:

```env
NODE_ENV=production
DATABASE_URL=<paste_your_postgres_url_here>
JWT_SECRET=your_super_secret_jwt_key_minimum_32_characters
JWT_EXPIRES_IN=7d
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your_email@gmail.com
EMAIL_PASS=your_gmail_app_password
CHAT_EXPIRY_DAYS=2
PORT=3000
```

**Important Environment Variables:**

- **DATABASE_URL**: Use the External Database URL from Step 2.5
- **JWT_SECRET**: Generate a secure secret (32+ characters)
- **EMAIL_USER/EMAIL_PASS**: Use Gmail App Password (not your regular password)

### 3.3 Deploy Service

1. Click "Create Web Service"
2. Wait for deployment (5-10 minutes)
3. Monitor logs for any errors

## Step 4: Run Database Migrations

### 4.1 Using Render Shell (Recommended)

1. **Access Render Shell**
   - Go to your web service dashboard
   - Click "Shell" tab
   - Wait for shell to connect

2. **Run Migrations**
   ```bash
   npx prisma migrate deploy
   ```

3. **Verify Database**
   ```bash
   npx prisma db seed  # if you have seed data
   ```

### 4.2 Alternative: Local Migration (if shell fails)

If Render shell doesn't work, run migration from your local machine:

```bash
# Set production database URL locally
export DATABASE_URL="your_production_database_url"

# Run migration
npx prisma migrate deploy

# Don't forget to unset after migration
unset DATABASE_URL
```

## Step 5: Configure Email Service (Gmail)

### 5.1 Enable 2-Factor Authentication

1. Go to your Google Account settings
2. Enable 2-Factor Authentication

### 5.2 Generate App Password

1. Go to Google Account → Security
2. Select "App passwords"
3. Generate password for "Mail"
4. Use this password in `EMAIL_PASS` environment variable

## Step 6: Test Deployment

### 6.1 Health Check

Your service should be available at: `https://your-service-name.onrender.com`

Test endpoints:
```bash
# Health check
curl https://your-service-name.onrender.com/health

# API status
curl https://your-service-name.onrender.com/api/v1/
```

### 6.2 Test Authentication

```bash
# Request OTP
curl -X POST https://your-service-name.onrender.com/api/v1/auth/request-otp \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com"}'
```

## Step 7: Domain Setup (Optional)

### 7.1 Custom Domain

1. Go to your web service dashboard
2. Click "Settings" tab
3. Add your custom domain
4. Configure DNS records as shown

## Troubleshooting

### Common Issues

**Database Connection Errors:**
- Verify DATABASE_URL format
- Check if database is running
- Ensure IP whitelist allows Render IPs

**Migration Failures:**
```bash
# Reset and retry migrations
npx prisma migrate reset --force
npx prisma migrate deploy
```

**Email Not Working:**
- Verify Gmail App Password (not regular password)
- Check EMAIL_HOST and EMAIL_PORT
- Test with a different email provider

**Build Failures:**
```bash
# Check Node.js version
node --version

# Clear npm cache
npm cache clean --force

# Reinstall dependencies
rm -rf node_modules package-lock.json
npm install
```

### Environment Variables Check

Create a debug endpoint (remove after testing):

```javascript
// Add to your routes for debugging
app.get('/debug/env', (req, res) => {
  res.json({
    NODE_ENV: process.env.NODE_ENV,
    DATABASE_URL: process.env.DATABASE_URL ? 'Set' : 'Not Set',
    JWT_SECRET: process.env.JWT_SECRET ? 'Set' : 'Not Set',
    EMAIL_USER: process.env.EMAIL_USER ? 'Set' : 'Not Set'
  });
});
```

## Security Checklist

- [ ] JWT_SECRET is secure (32+ characters)
- [ ] DATABASE_URL uses SSL (`?sslmode=require`)
- [ ] Email credentials are App Passwords, not regular passwords
- [ ] No sensitive data in logs
- [ ] CORS configured for your frontend domain
- [ ] Rate limiting enabled for auth endpoints

## Monitoring

### 7.1 Render Metrics

- Monitor CPU, Memory usage in Render dashboard
- Set up alerts for service downtime
- Check logs regularly for errors

### 7.2 Database Monitoring

- Monitor database connections
- Check query performance
- Set up backup schedule (paid plans)

## Scaling Considerations

**Free Tier Limitations:**
- Service sleeps after 15 minutes of inactivity
- 500 hours/month limit
- Limited database storage

**Upgrade to Paid Plans for:**
- Always-on services
- More database storage
- Better performance
- Custom domains
- Priority support

## Backup Strategy

### Database Backups

**Manual Backup:**
```bash
pg_dump $DATABASE_URL > backup_$(date +%Y%m%d_%H%M%S).sql
```

**Automated Backups:**
- Paid Render plans include automated backups
- Consider external backup solutions for critical data

## Next Steps

1. **Frontend Deployment**: Deploy your React frontend on Render/Vercel/Netlify
2. **CI/CD Pipeline**: Set up automated deployments on git push
3. **Monitoring**: Add application monitoring (e.g., Sentry)
4. **Performance**: Add Redis for caching
5. **Security**: Add rate limiting, input validation

## Support

- **Render Documentation**: [render.com/docs](https://render.com/docs)
- **Render Community**: [community.render.com](https://community.render.com)
- **PostgreSQL Docs**: [postgresql.org/docs](https://postgresql.org/docs)

---

**Your deployment URLs:**
- Backend API: `https://your-service-name.onrender.com`
- Database: Available via DATABASE_URL environment variable
- Admin Panel: `https://your-service-name.onrender.com/admin` (if implemented)

Remember to update your frontend's API configuration to use the production backend URL!