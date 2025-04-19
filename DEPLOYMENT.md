# Deployment Guide

## Comprehensive Deployment Instructions

### 1. Server Requirements
- Node.js 14+ (16+ recommended)
- PostgreSQL 13+
- 1GB RAM minimum (2GB+ recommended)
- 10GB storage space

### 2. Installation

#### Clone the repository or extract the ZIP file
```bash
# If you have the ZIP file
unzip crypto-mining-platform.zip -d /path/to/destination
cd /path/to/destination
```

#### Install dependencies
```bash
npm install
```

### 3. Database Setup

#### Option 1: Local PostgreSQL
1. Install PostgreSQL if not already installed
2. Create a new database:
```sql
CREATE DATABASE crypto_mining;
CREATE USER crypto_user WITH ENCRYPTED PASSWORD 'your_password';
GRANT ALL PRIVILEGES ON DATABASE crypto_mining TO crypto_user;
```

#### Option 2: Cloud Database (Neon, Supabase, etc.)
1. Create a database instance in your preferred cloud provider
2. Get the connection string from your provider

### 4. Environment Configuration

Create a `.env` file in the project root:

```
# Database connection
DATABASE_URL=postgresql://username:password@hostname:port/database

# Server configuration
PORT=5000
NODE_ENV=production

# (Optional) Add any additional environment variables here
```

### 5. Initialize Database Schema
```bash
npm run db:push
```

### 6. Create Admin User
```bash
node scripts/create-admin.js
```

### 7. Build for Production
```bash
npm run build
```

### 8. Start the Application
```bash
npm start
```

### 9. Process Management (Optional)
Using PM2 for production deployment:

```bash
npm install -g pm2
pm2 start dist/index.js --name crypto-mining-platform
pm2 save
pm2 startup
```

### 10. Reverse Proxy Setup (Optional)

#### Nginx Configuration Example
```nginx
server {
    listen 80;
    server_name yourdomain.com www.yourdomain.com;

    location / {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

### 11. SSL Setup (Optional)
With Certbot:

```bash
sudo apt install certbot python3-certbot-nginx
sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com
```

### 12. Backup Strategy (Recommended)

#### Database Backup
```bash
# Create a backup script
mkdir -p /path/to/backups

# Add to crontab
# 0 0 * * * pg_dump -U username -d crypto_mining > /path/to/backups/crypto_$(date +\%Y\%m\%d).sql
```

### Troubleshooting
- If the application fails to start, check the logs for errors
- Verify the database connection string is correct
- Ensure all required environment variables are set
- Check server firewall settings for port access

### Updating the Application
1. Stop the application
2. Pull the latest changes or extract the new ZIP
3. Install dependencies
4. Rebuild the application
5. Restart the server
```bash
npm install
npm run build
npm start
```
