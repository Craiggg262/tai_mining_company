# Cryptocurrency Mining Platform

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
   ```
   npm install
   ```
3. Set up environment variables:
   - Create a `.env` file with your database connection string:
   ```
   DATABASE_URL=postgresql://username:password@hostname:port/database
   ```
4. Create database tables:
   ```
   npm run db:push
   ```
5. Create an admin user:
   ```
   node scripts/create-admin.js
   ```
6. Start the application:
   - For development:
   ```
   npm run dev
   ```
   - For production:
   ```
   npm run build
   npm start
   ```

## Default Admin Credentials
- Email: ejemegwapeter@gmail.com
- Password: Peter123@@@

## Important Settings
- Mining rate: 0.25 TAI per hour
- Exchange rate: 1 TAI = 0.6 USDT
- Referral bonus: 0.5 TAI per referral
- Staking: 12% APY for 30 days
