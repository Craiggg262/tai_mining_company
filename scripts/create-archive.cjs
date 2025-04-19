const fs = require('fs');
const path = require('path');
const archiver = require('archiver');

// Create a file to stream archive data to
const output = fs.createWriteStream(path.join(__dirname, '../crypto-mining-platform.zip'));
const archive = archiver('zip', {
  zlib: { level: 9 } // Sets the compression level
});

// Listen for all archive data to be written
output.on('close', function() {
  console.log('Archive created successfully!');
  console.log('Total bytes: ' + archive.pointer());
  console.log('The archive is located at: ' + path.join(__dirname, '../crypto-mining-platform.zip'));
  console.log('\nInstructions for deployment:');
  console.log('1. Extract the ZIP file to your server directory');
  console.log('2. Run `npm install` to install dependencies');
  console.log('3. Set up PostgreSQL database and update DATABASE_URL environment variable');
  console.log('4. Run `npm run db:push` to create database tables');
  console.log('5. Run `npm run dev` for development or `npm run build && npm start` for production');
});

// Warning for any errors
archive.on('warning', function(err) {
  if (err.code === 'ENOENT') {
    console.warn(err);
  } else {
    throw err;
  }
});

// Error handling
archive.on('error', function(err) {
  throw err;
});

// Pipe archive data to the output file
archive.pipe(output);

// Skip these directories/files
const skipItems = [
  'node_modules', 
  '.git', 
  '.next', 
  'dist', 
  '.DS_Store', 
  'crypto-mining-platform.zip',
  '.replit',
  '.cache',
  '.config',
  '.upm',
  '.github',
  '.vscode'
];

// Add required files and directories specifically
const files = [
  'package.json',
  'package-lock.json',
  'tsconfig.json',
  'tailwind.config.ts',
  'postcss.config.js',
  'vite.config.ts',
  'drizzle.config.ts',
  'theme.json',
  '.gitignore'
];

const directories = [
  'client',
  'server',
  'shared',
  'scripts'
];

// Root directory
const rootDir = path.join(__dirname, '..');

// Add individual files
for (const file of files) {
  const filePath = path.join(rootDir, file);
  if (fs.existsSync(filePath)) {
    archive.file(filePath, { name: file });
    console.log(`Adding file: ${file}`);
  }
}

// Function to add directories recursively
function addDirectoryRecursively(dirPath, targetPath) {
  const items = fs.readdirSync(dirPath);
  
  for (const item of items) {
    if (skipItems.includes(item)) {
      continue;
    }
    
    const itemPath = path.join(dirPath, item);
    const itemTargetPath = path.join(targetPath, item);
    const stat = fs.statSync(itemPath);
    
    if (stat.isDirectory()) {
      // Create directory in the archive
      archive.append(null, { name: `${itemTargetPath}/` });
      // Process subdirectory
      addDirectoryRecursively(itemPath, itemTargetPath);
    } else {
      // Add file to the archive
      archive.file(itemPath, { name: itemTargetPath });
      console.log(`Adding: ${itemTargetPath}`);
    }
  }
}

// Add directories
for (const dir of directories) {
  const dirPath = path.join(rootDir, dir);
  if (fs.existsSync(dirPath)) {
    console.log(`Processing directory: ${dir}`);
    addDirectoryRecursively(dirPath, dir);
  }
}

// Create README.md with deployment instructions
const readmeContent = `# Cryptocurrency Mining Platform

## Overview
A cryptocurrency mining platform with user and admin portals, featuring mining simulation, wallet management, and referral system.

## Features
- User registration and login
- Cryptocurrency mining simulation
- Wallet management (TAI and USDT currencies)
- Currency conversion
- Deposit and withdrawal
- Staking with interest
- Referral system
- Admin dashboard with user management
- Transaction history

## Technology Stack
- Frontend: React, TailwindCSS, Shadcn UI
- Backend: Express.js, Node.js
- Database: PostgreSQL with Drizzle ORM
- API: RESTful endpoints

## Deployment Instructions

### Prerequisites
- Node.js (version 14 or higher)
- PostgreSQL database

### Setup Steps
1. Extract the ZIP file to your server directory
2. Install dependencies:
   \`\`\`
   npm install
   \`\`\`
3. Set up environment variables:
   - Create a \`.env\` file with your database connection string:
   \`\`\`
   DATABASE_URL=postgresql://username:password@hostname:port/database
   \`\`\`
4. Create database tables:
   \`\`\`
   npm run db:push
   \`\`\`
5. Create an admin user:
   \`\`\`
   node scripts/create-admin.js
   \`\`\`
6. Start the application:
   - For development:
   \`\`\`
   npm run dev
   \`\`\`
   - For production:
   \`\`\`
   npm run build
   npm start
   \`\`\`

## Default Admin Credentials
- Email: ejemegwapeter@gmail.com
- Password: Peter123@@@

## Important Settings
- Mining rate: 0.25 TAI per hour
- Exchange rate: 1 TAI = 0.6 USDT
- Referral bonus: 0.5 TAI per referral
- Staking: 12% APY for 30 days
`;

archive.append(readmeContent, { name: 'README.md' });

// Create a DEPLOYMENT.md file with advanced deployment instructions
const deploymentContent = `# Deployment Guide

## Comprehensive Deployment Instructions

### 1. Server Requirements
- Node.js 14+ (16+ recommended)
- PostgreSQL 13+
- 1GB RAM minimum (2GB+ recommended)
- 10GB storage space

### 2. Installation

#### Clone the repository or extract the ZIP file
\`\`\`bash
# If you have the ZIP file
unzip crypto-mining-platform.zip -d /path/to/destination
cd /path/to/destination
\`\`\`

#### Install dependencies
\`\`\`bash
npm install
\`\`\`

### 3. Database Setup

#### Option 1: Local PostgreSQL
1. Install PostgreSQL if not already installed
2. Create a new database:
\`\`\`sql
CREATE DATABASE crypto_mining;
CREATE USER crypto_user WITH ENCRYPTED PASSWORD 'your_password';
GRANT ALL PRIVILEGES ON DATABASE crypto_mining TO crypto_user;
\`\`\`

#### Option 2: Cloud Database (Neon, Supabase, etc.)
1. Create a database instance in your preferred cloud provider
2. Get the connection string from your provider

### 4. Environment Configuration

Create a \`.env\` file in the project root:

\`\`\`
# Database connection
DATABASE_URL=postgresql://username:password@hostname:port/database

# Server configuration
PORT=3000
"start": "cross-env NODE_ENV=production node dist/index.js"

# (Optional) Add any additional environment variables here
\`\`\`

### 5. Initialize Database Schema
\`\`\`bash
npm run db:push
\`\`\`

### 6. Create Admin User
\`\`\`bash
node scripts/create-admin.js
\`\`\`

### 7. Build for Production
\`\`\`bash
npm run build
\`\`\`

### 8. Start the Application
\`\`\`bash
npm start
\`\`\`

### 9. Process Management (Optional)
Using PM2 for production deployment:

\`\`\`bash
npm install -g pm2
pm2 start dist/index.js --name crypto-mining-platform
pm2 save
pm2 startup
\`\`\`

### 10. Reverse Proxy Setup (Optional)

#### Nginx Configuration Example
\`\`\`nginx
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
\`\`\`

### 11. SSL Setup (Optional)
With Certbot:

\`\`\`bash
sudo apt install certbot python3-certbot-nginx
sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com
\`\`\`

### 12. Backup Strategy (Recommended)

#### Database Backup
\`\`\`bash
# Create a backup script
mkdir -p /path/to/backups

# Add to crontab
# 0 0 * * * pg_dump -U username -d crypto_mining > /path/to/backups/crypto_$(date +\\%Y\\%m\\%d).sql
\`\`\`

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
\`\`\`bash
npm install
npm run build
npm start
\`\`\`
`;

archive.append(deploymentContent, { name: 'DEPLOYMENT.md' });

// Finalize the archive
archive.finalize();