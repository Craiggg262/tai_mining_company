import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { 


  registerSchema, 
  loginSchema, 
  verifyOtpSchema, 
  resetPasswordSchema,
  conversionSchema,
  transferSchema,
  withdrawalSchema,
  stakingSchema,
  processWithdrawalSchema
} from "@shared/schema";
import { ZodError } from "zod";
import { fromZodError } from "zod-validation-error";
import { add, differenceInMinutes, differenceInHours, format } from "date-fns";
import crypto from "crypto";
import {db} from "./db";
export default Router;

// Helper function to validate data with zod
function validateRequest<T>(schema: any, data: any): T {
  return schema.parse(data);
}

// Helper function to handle errors
function handleError(res: Response, error: any) {
  console.error("API Error:", error);
  
  if (error instanceof ZodError) {
    const formattedError = fromZodError(error);
    return res.status(400).json({ message: formattedError.message });
  }
  
  return res.status(500).json({ message: error.message || "Internal server error" });
}

export async function registerRoutes(app: Express): Promise<Server> {
  const httpServer = createServer(app);

  // Authentication endpoints
  app.post("/api/auth/register", async (req: Request, res: Response) => {
    try {
      const data = validateRequest(registerSchema, req.body);
  
      // Check if user already exists
      const existingUser = await storage.getUserByEmail(data.email);
      if (existingUser) {
        return res.status(400).json({ message: "Email already in use" });
      }
  
      // Create new user (remove referral, OTP stuff)
      const user = await storage.createUser({
       name: data.name,
        email: data.email,
        password: data.password,
        role: "user",
        emailVerified: true // No OTP needed
      });
  
      const { password, otpCode, ...safeUser } = user;
  
      res.status(201).json({
        message: "User registered successfully!",
        user: safeUser
      });
    } catch (error) {
      handleError(res, error);
    }
  });
  
// REMOVE this whole block:
/*
app.post("/api/auth/verify-otp", async (req: Request, res: Response) => {
  try {
    const { email, otp } = validateRequest(verifyOtpSchema, req.body);

    const verified = await storage.verifyUserOtp(email, otp);
    if (!verified) {
      return res.status(400).json({ message: "Invalid or expired OTP" });
    }

    const user = await storage.getUserByEmail(email);

    const { password, otpCode, ...safeUser } = user!;

    res.json({
      message: "Email verified successfully",
      user: safeUser
    });
  } catch (error) {
    handleError(res, error);
  }
});
*/
 
app.post("/api/auth/login", async (req: Request, res: Response) => {
  try {
    const { email, password } = validateRequest(loginSchema, req.body);

    const user = await storage.getUserByEmail(email);
    if (!user || !(await storage.comparePasswords(password, user.password))) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    const { password: _, otpCode, ...safeUser } = user;

    res.json({
      message: "Login successful",
      user: safeUser
    });
  } catch (error) {
    handleError(res, error);
  }
});


  app.post("/api/auth/reset-password", async (req: Request, res: Response) => {
    try {
      const { email } = validateRequest(resetPasswordSchema, req.body);
      
      const user = await storage.getUserByEmail(email);
      if (!user) {
        // Don't reveal whether the email exists
        return res.json({ message: "If your email is registered, you will receive a reset code" });
      }
      
      // Generate new OTP
      const otp = Math.floor(100000 + Math.random() * 900000).toString();
      await storage.setUserOtp(user.id, otp);
      
      // In a real app, send OTP via email here
      console.log(`Password reset OTP for ${user.email}: ${otp}`);
      
      res.json({ 
        message: "Password reset code sent to your email",
        email: user.email
      });
    } catch (error) {
      handleError(res, error);
    }
  });

  // User management endpoints
  app.get("/api/user/profile", async (req: Request, res: Response) => {
    try {
      // In a real app, get the user ID from the auth token
      const userId = parseInt(req.query.userId as string);
      if (!userId) {
        return res.status(401).json({ message: "Unauthorized" });
      }
      
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      // Remove sensitive data
      const { password, otpCode, ...safeUser } = user;
      
      res.json({ user: safeUser });
    } catch (error) {
      handleError(res, error);
    }
  });

  // Mining endpoints
  app.post("/api/mining/start", async (req: Request, res: Response) => {
    try {
      const userId = parseInt(req.body.userId);
      if (!userId) {
        return res.status(401).json({ message: "Unauthorized" });
      }
      
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      // Update user's mining status
      const now = new Date();
      await storage.updateUser(userId, {
        miningActive: true,
        lastMiningAt: now
      });
      
      res.json({ 
        message: "Mining started successfully",
        startTime: now
      });
    } catch (error) {
      handleError(res, error);
    }
  });

  app.post("/api/mining/stop", async (req: Request, res: Response) => {
    try {
      const userId = parseInt(req.body.userId);
      if (!userId) {
        return res.status(401).json({ message: "Unauthorized" });
      }
      
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      if (!user.miningActive || !user.lastMiningAt) {
        return res.status(400).json({ message: "Mining not active" });
      }
      
      // Calculate rewards
      const now = new Date();
      const miningDurationHours = differenceInHours(now, user.lastMiningAt);
      const miningDurationMinutes = differenceInMinutes(now, user.lastMiningAt) % 60;
      const totalReward = Math.floor(differenceInMinutes(now, user.lastMiningAt) / 60 * 0.25 * 100) / 100;
      
      // Update user's balance and mining status
      await storage.updateUserBalances(userId, totalReward, 0);
      await storage.updateUser(userId, {
        miningActive: false,
        lastMiningAt: null
      });
      
      // Create transaction record
      await storage.createTransaction({
        userId,
        type: "mining_reward",
        amount: totalReward,
        currency: "TAI",
        status: "completed",
        description: `Mining reward for ${miningDurationHours}h ${miningDurationMinutes}m`
      });
      
      res.json({ 
        message: "Mining stopped successfully",
        duration: `${miningDurationHours}h ${miningDurationMinutes}m`,
        reward: totalReward
      });
    } catch (error) {
      handleError(res, error);
    }
  });

  app.post("/api/mining/reward", async (req: Request, res: Response) => {
    try {
      const userId = parseInt(req.body.userId);
      if (!userId) {
        return res.status(401).json({ message: "Unauthorized" });
      }
      
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      if (!user.miningActive || !user.lastMiningAt) {
        return res.status(400).json({ message: "Mining not active" });
      }
      
      // Calculate reward
      const now = new Date();
      const hoursSinceLastMining = differenceInHours(now, user.lastMiningAt);
      if (hoursSinceLastMining < 1) {
        return res.status(400).json({ 
          message: "No reward available yet",
          minutesLeft: 60 - differenceInMinutes(now, user.lastMiningAt)
        });
      }
      
      // Calculate reward based on full hours
      const reward = Math.floor(hoursSinceLastMining) * 0.25;
      
      // Update user's balance and last mining time
      await storage.updateUserBalances(userId, reward, 0);
      await storage.updateUser(userId, {
        lastMiningAt: new Date()
      });
      
      // Create transaction record
      await storage.createTransaction({
        userId,
        type: "mining_reward",
        amount: reward,
        currency: "TAI",
        status: "completed",
        description: `Mining reward for ${Math.floor(hoursSinceLastMining)} hours`
      });
      
      res.json({ 
        message: "Mining reward claimed successfully",
        reward
      });
    } catch (error) {
      handleError(res, error);
    }
  });

  // Wallet endpoints
  app.get("/api/wallet/balance", async (req: Request, res: Response) => {
    try {
      const userId = parseInt(req.query.userId as string);
      if (!userId) {
        return res.status(401).json({ message: "Unauthorized" });
      }
      
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      res.json({ 
        taiBalance: user.taiBalance,
        usdtBalance: user.usdtBalance
      });
    } catch (error) {
      handleError(res, error);
    }
  });

  app.post("/api/wallet/convert", async (req: Request, res: Response) => {
    try {
      const userId = parseInt(req.body.userId);
      if (!userId) {
        return res.status(401).json({ message: "Unauthorized" });
      }
      
      const conversionData = validateRequest(conversionSchema, req.body);
      const { amount, fromCurrency, toCurrency } = conversionData;
      
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      // Check if user has enough balance
      if (fromCurrency === 'TAI' && user.taiBalance < amount) {
        return res.status(400).json({ message: "Insufficient TAI balance" });
      }
      if (fromCurrency === 'USDT' && user.usdtBalance < amount) {
        return res.status(400).json({ message: "Insufficient USDT balance" });
      }
      
      // Perform conversion (1 TAI = 0.6 USDT)
      let taiDelta = 0;
      let usdtDelta = 0;
      let convertedAmount = 0;
      
      if (fromCurrency === 'TAI' && toCurrency === 'USDT') {
        taiDelta = -amount;
        convertedAmount = amount * 0.6;
        usdtDelta = convertedAmount;
      } else if (fromCurrency === 'USDT' && toCurrency === 'TAI') {
        usdtDelta = -amount;
        convertedAmount = amount / 0.6;
        taiDelta = convertedAmount;
      }
      
      // Update balances
      await storage.updateUserBalances(userId, taiDelta, usdtDelta);
      
      // Create transaction record
      await storage.createTransaction({
        userId,
        type: "conversion",
        amount,
        currency: fromCurrency,
        status: "completed",
        description: `Converted ${amount} ${fromCurrency} to ${convertedAmount.toFixed(2)} ${toCurrency}`
      });
      
      res.json({ 
        message: "Conversion successful",
        convertedAmount,
        fromCurrency,
        toCurrency
      });
    } catch (error) {
      handleError(res, error);
    }
  });

  app.post("/api/wallet/transfer", async (req: Request, res: Response) => {
    try {
      const senderId = parseInt(req.body.userId);
      if (!senderId) {
        return res.status(401).json({ message: "Unauthorized" });
      }
      
      const transferData = validateRequest(transferSchema, req.body);
      const { taiId, amount } = transferData;
      
      const sender = await storage.getUser(senderId);
      if (!sender) {
        return res.status(404).json({ message: "User not found" });
      }
      
      // Check if sender has enough balance
      if (sender.taiBalance < amount) {
        return res.status(400).json({ message: "Insufficient TAI balance" });
      }
      
      // Find recipient by TAI ID
      const recipient = await storage.getUserByTaiId(taiId);
      if (!recipient) {
        return res.status(404).json({ message: "Recipient not found" });
      }
      
      if (recipient.id === senderId) {
        return res.status(400).json({ message: "Cannot transfer to yourself" });
      }
      
      // Update balances
      await storage.updateUserBalances(senderId, -amount, 0);
      await storage.updateUserBalances(recipient.id, amount, 0);
      
      // Create transaction records
      await storage.createTransaction({
        userId: senderId,
        type: "transfer_sent",
        amount,
        currency: "TAI",
        status: "completed",
        description: `Transfer to ${recipient.name} (${recipient.taiId})`,
        recipientId: recipient.id
      });
      
      await storage.createTransaction({
        userId: recipient.id,
        type: "transfer_received",
        amount,
        currency: "TAI",
        status: "completed",
        description: `Transfer from ${sender.name} (${sender.taiId})`,
        recipientId: senderId
      });
      
      res.json({ 
        message: "Transfer successful",
        amount,
        recipient: {
          name: recipient.name,
          taiId: recipient.taiId
        }
      });
    } catch (error) {
      handleError(res, error);
    }
  });

  app.post("/api/wallet/withdraw", async (req: Request, res: Response) => {
    try {
      const userId = parseInt(req.body.userId);
      if (!userId) {
        return res.status(401).json({ message: "Unauthorized" });
      }
      
      const withdrawalData = validateRequest(withdrawalSchema, req.body);
      const { amount, currency, address } = withdrawalData;
      
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      // Check if user has enough balance
      if (currency === 'TAI' && user.taiBalance < amount) {
        return res.status(400).json({ message: "Insufficient TAI balance" });
      }
      if (currency === 'USDT' && user.usdtBalance < amount) {
        return res.status(400).json({ message: "Insufficient USDT balance" });
      }
      
      // Create withdrawal request
      const withdrawal = await storage.createWithdrawal({
        userId,
        amount,
        currency,
        address
      });
      
      res.json({ 
        message: "Withdrawal request submitted successfully",
        withdrawal
      });
    } catch (error) {
      handleError(res, error);
    }
  });

  app.post("/api/wallet/stake", async (req: Request, res: Response) => {
    try {
      const userId = parseInt(req.body.userId);
      if (!userId) {
        return res.status(401).json({ message: "Unauthorized" });
      }
      
      const stakingData = validateRequest(stakingSchema, req.body);
      const { amount } = stakingData;
      
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      // Check if user has enough balance
      if (user.taiBalance < amount) {
        return res.status(400).json({ message: "Insufficient TAI balance" });
      }
      
      // Update user's balance
      await storage.updateUserBalances(userId, -amount, 0);
      
      // Create staking record
      const now = new Date();
      const endDate = add(now, { days: 30 });
      
      const staking = await storage.createStaking({
        userId,
        amount,
        endAt: endDate
      });
      
      // Create transaction record
      await storage.createTransaction({
        userId,
        type: "staking",
        amount,
        currency: "TAI",
        status: "completed",
        description: `Staked ${amount} TAI for 30 days until ${format(endDate, 'MMM dd, yyyy')}`
      });
      
      res.json({ 
        message: "Staking successful",
        staking
      });
    } catch (error) {
      handleError(res, error);
    }
  });

  // Transaction and history endpoints
  app.get("/api/transactions", async (req: Request, res: Response) => {
    try {
      const userId = parseInt(req.query.userId as string);
      if (!userId) {
        return res.status(401).json({ message: "Unauthorized" });
      }
      
      const transactions = await storage.getUserTransactions(userId);
      
      res.json({ transactions });
    } catch (error) {
      handleError(res, error);
    }
  });

  app.get("/api/withdrawals", async (req: Request, res: Response) => {
    try {
      const userId = parseInt(req.query.userId as string);
      if (!userId) {
        return res.status(401).json({ message: "Unauthorized" });
      }
      
      const withdrawals = await storage.getUserWithdrawals(userId);
      
      res.json({ withdrawals });
    } catch (error) {
      handleError(res, error);
    }
  });

  app.get("/api/stakings", async (req: Request, res: Response) => {
    try {
      const userId = parseInt(req.query.userId as string);
      if (!userId) {
        return res.status(401).json({ message: "Unauthorized" });
      }
      
      const stakings = await storage.getUserStakings(userId);
      
      res.json({ stakings });
    } catch (error) {
      handleError(res, error);
    }
  });

  // Referral endpoints
  app.get("/api/referrals", async (req: Request, res: Response) => {
    try {
      const userId = parseInt(req.query.userId as string);
      if (!userId) {
        return res.status(401).json({ message: "Unauthorized" });
      }
      
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      // Get all users referred by this user
      const allUsers = await storage.listUsers();
      const referrals = allUsers.filter(u => u.referredBy === userId);
      
      // Calculate total earnings from referrals
      const referralTransactions = await storage.getUserTransactions(userId);
      const referralEarnings = referralTransactions
        .filter(tx => tx.type === "referral_bonus")
        .reduce((sum, tx) => sum + tx.amount, 0);
      
      // Get safe user data for referrals
      const safeReferrals = referrals.map(ref => {
        const { password, otpCode, ...safeRef } = ref;
        return safeRef;
      });
      
      res.json({ 
        referrals: safeReferrals,
        totalReferrals: referrals.length,
        activeReferrals: referrals.filter(r => r.miningActive).length,
        earnings: referralEarnings
      });
    } catch (error) {
      handleError(res, error);
    }
  });

  // Admin endpoints
  app.get("/api/admin/users", async (req: Request, res: Response) => {
    try {
      const adminId = parseInt(req.query.adminId as string);
      if (!adminId) {
        return res.status(401).json({ message: "Unauthorized" });
      }
      
      const admin = await storage.getUser(adminId);
      if (!admin || admin.role !== "admin") {
        return res.status(403).json({ message: "Forbidden: Admin access required" });
      }
      
      const users = await storage.listUsers();
      
      // Filter out sensitive data
      const safeUsers = users.map(user => {
        const { password, otpCode, ...safeUser } = user;
        return safeUser;
      });
      
      res.json({ users: safeUsers });
    } catch (error) {
      handleError(res, error);
    }
  });

  app.get("/api/admin/withdrawals", async (req: Request, res: Response) => {
    try {
      const adminId = parseInt(req.query.adminId as string);
      if (!adminId) {
        return res.status(401).json({ message: "Unauthorized" });
      }
      
      const admin = await storage.getUser(adminId);
      if (!admin || admin.role !== "admin") {
        return res.status(403).json({ message: "Forbidden: Admin access required" });
      }
      
      const withdrawals = await storage.getPendingWithdrawals();
      
      // Get user details for each withdrawal
      const withdrawalsWithUserInfo = await Promise.all(withdrawals.map(async (w) => {
        const user = await storage.getUser(w.userId);
        return {
          ...w,
          user: user ? {
            id: user.id,
            name: user.name,
            email: user.email,
            taiId: user.taiId
          } : null
        };
      }));
      
      res.json({ withdrawals: withdrawalsWithUserInfo });
    } catch (error) {
      handleError(res, error);
    }
  });

  app.post("/api/admin/process-withdrawal", async (req: Request, res: Response) => {
    try {
      const adminId = parseInt(req.body.adminId);
      if (!adminId) {
        return res.status(401).json({ message: "Unauthorized" });
      }
      
      const admin = await storage.getUser(adminId);
      if (!admin || admin.role !== "admin") {
        return res.status(403).json({ message: "Forbidden: Admin access required" });
      }
      
      const processData = validateRequest(processWithdrawalSchema, req.body);
      const { withdrawalId, status } = processData;
      
      const withdrawal = await storage.updateWithdrawalStatus(withdrawalId, status, adminId);
      
      // Get user to send email
      const user = await storage.getUser(withdrawal.userId);
      
      // In a real app, send email notification here
      if (user) {
        console.log(`Withdrawal notification for ${user.email}: Your withdrawal request of ${withdrawal.amount} ${withdrawal.currency} has been ${status}`);
      }
      
      res.json({ 
        message: `Withdrawal ${status} successfully`,
        withdrawal
      });
    } catch (error) {
      handleError(res, error);
    }
  });

  app.post("/api/admin/fund-user", async (req: Request, res: Response) => {
    try {
      const adminId = parseInt(req.body.adminId);
      if (!adminId) {
        return res.status(401).json({ message: "Unauthorized" });
      }
      
      const admin = await storage.getUser(adminId);
      if (!admin || admin.role !== "admin") {
        return res.status(403).json({ message: "Forbidden: Admin access required" });
      }
      
      const { userId, taiAmount, usdtAmount } = req.body;
      if (!userId || (taiAmount === undefined && usdtAmount === undefined)) {
        return res.status(400).json({ message: "Missing required parameters" });
      }
      
      const user = await storage.getUser(parseInt(userId));
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      // Update user balances
      await storage.updateUserBalances(user.id, taiAmount || 0, usdtAmount || 0);
      
      // Create transaction records
      if (taiAmount && taiAmount > 0) {
        await storage.createTransaction({
          userId: user.id,
          type: "deposit",
          amount: taiAmount,
          currency: "TAI",
          status: "completed",
          description: "Admin funded TAI balance"
        });
      }
      
      if (usdtAmount && usdtAmount > 0) {
        await storage.createTransaction({
          userId: user.id,
          type: "deposit",
          amount: usdtAmount,
          currency: "USDT",
          status: "completed",
          description: "Admin funded USDT balance"
        });
      }
      
      res.json({ 
        message: "User funded successfully",
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          taiBalance: user.taiBalance + (taiAmount || 0),
          usdtBalance: user.usdtBalance + (usdtAmount || 0)
        }
      });
    } catch (error) {
      handleError(res, error);
    }
  });

  app.get("/api/admin/stats", async (req: Request, res: Response) => {
    try {
      const adminId = parseInt(req.query.adminId as string);
      if (!adminId) {
        return res.status(401).json({ message: "Unauthorized" });
      }
      
      const admin = await storage.getUser(adminId);
      if (!admin || admin.role !== "admin") {
        return res.status(403).json({ message: "Forbidden: Admin access required" });
      }
      
      const stats = await storage.getSystemStats();
      
      res.json({ stats });
    } catch (error) {
      handleError(res, error);
    }
  });

  return httpServer;
}
