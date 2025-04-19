import { 
  User, InsertUser, Transaction, InsertTransaction, 
  Withdrawal, InsertWithdrawal, Staking, InsertStaking,
  transactionTypeEnum, transactionStatusEnum, withdrawalStatusEnum, 
  stakingStatusEnum, userRoleEnum 
} from "@shared/schema";
import crypto from 'crypto';
import { addDays } from 'date-fns';

// Storage interface
export interface IStorage {
  // User methods
  getUser(id: number): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  getUserByTaiId(taiId: string): Promise<User | undefined>;
  getUserByReferralCode(referralCode: string): Promise<User | undefined>;
  createUser(user: InsertUser & { referralCode?: string }): Promise<User>;
  updateUser(id: number, data: Partial<User>): Promise<User>;
  updateUserBalances(id: number, taiDelta: number, usdtDelta: number): Promise<User>;
  listUsers(): Promise<User[]>;
  setUserOtp(id: number, otp: string): Promise<User>;
  verifyUserOtp(email: string, otp: string): Promise<boolean>;
  
  // Transaction methods
  createTransaction(transaction: InsertTransaction): Promise<Transaction>;
  getUserTransactions(userId: number): Promise<Transaction[]>;
  
  // Withdrawal methods
  createWithdrawal(withdrawal: InsertWithdrawal): Promise<Withdrawal>;
  getUserWithdrawals(userId: number): Promise<Withdrawal[]>;
  getWithdrawal(id: number): Promise<Withdrawal | undefined>;
  updateWithdrawalStatus(id: number, status: "approved" | "rejected", adminId: number): Promise<Withdrawal>;
  getPendingWithdrawals(): Promise<Withdrawal[]>;
  
  // Staking methods
  createStaking(staking: InsertStaking): Promise<Staking>;
  getUserStakings(userId: number): Promise<Staking[]>;
  getActiveStakings(): Promise<Staking[]>;
  
  // Admin methods
  getSystemStats(): Promise<{
    totalUsers: number;
    totalTaiBalance: number;
    totalUsdtBalance: number;
    totalPendingWithdrawals: number;
    totalActiveStakings: number;
  }>;
}

// In-memory storage implementation
export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private transactions: Map<number, Transaction>;
  private withdrawals: Map<number, Withdrawal>;
  private stakings: Map<number, Staking>;
  private userIdCounter: number;
  private transactionIdCounter: number;
  private withdrawalIdCounter: number;
  private stakingIdCounter: number;

  constructor() {
    this.users = new Map();
    this.transactions = new Map();
    this.withdrawals = new Map();
    this.stakings = new Map();
    this.userIdCounter = 1;
    this.transactionIdCounter = 1;
    this.withdrawalIdCounter = 1;
    this.stakingIdCounter = 1;
    
    // Create initial admin user
    this.createUser({
      name: "Admin",
      email: "ejemegwapeter@gmail.com",
      password: "Peter123@@@",
      role: "admin"
    }).then(admin => {
      // Update admin balance to 100 billion each
      this.updateUser(admin.id, {
        taiBalance: 100000000000,
        usdtBalance: 100000000000
      });
    });
  }

  generateOtp(): string {
    return Math.floor(100000 + Math.random() * 900000).toString();
  }

  generateReferralCode(): string {
    return crypto.randomBytes(4).toString('hex').toUpperCase();
  }

  generateTaiId(): string {
    return `TAI${Date.now().toString().substring(5)}${Math.floor(Math.random() * 1000)}`;
  }

  // User methods
  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(user => user.email.toLowerCase() === email.toLowerCase());
  }

  async getUserByTaiId(taiId: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(user => user.taiId === taiId);
  }

  async getUserByReferralCode(referralCode: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(user => user.referralCode === referralCode);
  }

  async createUser(userData: InsertUser & { referralCode?: string }): Promise<User> {
    const id = this.userIdCounter++;
    const referralCode = this.generateReferralCode();
    const taiId = this.generateTaiId();
    
    let referredBy: number | null = null;
    
    if (userData.referralCode) {
      const referrer = await this.getUserByReferralCode(userData.referralCode);
      if (referrer) {
        referredBy = referrer.id;
      }
    }
    
    const now = new Date();
    const user: User = {
      id,
      name: userData.name,
      email: userData.email,
      password: userData.password,
      role: userData.role || "user",
      taiBalance: 0,
      usdtBalance: 0,
      referralCode,
      referredBy: referredBy || null,
      taiId,
      createdAt: now,
      lastMiningAt: null,
      miningActive: false,
      emailVerified: false,
      otpCode: this.generateOtp(),
      otpExpiry: new Date(now.getTime() + 15 * 60000), // 15 minutes
    };
    
    this.users.set(id, user);
    
    // If user was referred, give the referrer a bonus
    if (referredBy) {
      const referrer = await this.getUser(referredBy);
      if (referrer) {
        // Add 0.5 TAI to referrer's balance
        await this.updateUserBalances(referrer.id, 0.5, 0);
        
        // Create a transaction record for the referral bonus
        await this.createTransaction({
          userId: referrer.id,
          type: "referral_bonus",
          amount: 0.5,
          currency: "TAI",
          status: "completed",
          description: `Referral bonus for user ${user.name}`
        });
      }
    }
    
    return user;
  }

  async updateUser(id: number, data: Partial<User>): Promise<User> {
    const user = await this.getUser(id);
    if (!user) {
      throw new Error(`User with ID ${id} not found`);
    }
    
    const updatedUser: User = { ...user, ...data };
    this.users.set(id, updatedUser);
    
    return updatedUser;
  }

  async updateUserBalances(id: number, taiDelta: number, usdtDelta: number): Promise<User> {
    const user = await this.getUser(id);
    if (!user) {
      throw new Error(`User with ID ${id} not found`);
    }
    
    const newTaiBalance = user.taiBalance + taiDelta;
    const newUsdtBalance = user.usdtBalance + usdtDelta;
    
    if (newTaiBalance < 0 || newUsdtBalance < 0) {
      throw new Error('Insufficient balance');
    }
    
    return this.updateUser(id, {
      taiBalance: newTaiBalance,
      usdtBalance: newUsdtBalance
    });
  }

  async listUsers(): Promise<User[]> {
    return Array.from(this.users.values());
  }

  async setUserOtp(id: number, otp: string): Promise<User> {
    const user = await this.getUser(id);
    if (!user) {
      throw new Error(`User with ID ${id} not found`);
    }
    
    const now = new Date();
    return this.updateUser(id, {
      otpCode: otp,
      otpExpiry: new Date(now.getTime() + 15 * 60000) // 15 minutes
    });
  }

  async verifyUserOtp(email: string, otp: string): Promise<boolean> {
    const user = await this.getUserByEmail(email);
    if (!user) {
      return false;
    }
    
    const now = new Date();
    
    if (user.otpCode === otp && user.otpExpiry && user.otpExpiry > now) {
      // Mark email as verified and clear OTP
      await this.updateUser(user.id, {
        emailVerified: true,
        otpCode: null,
        otpExpiry: null
      });
      return true;
    }
    
    return false;
  }

  // Transaction methods
  async createTransaction(transactionData: InsertTransaction): Promise<Transaction> {
    const id = this.transactionIdCounter++;
    const now = new Date();
    
    const transaction: Transaction = {
      id,
      userId: transactionData.userId,
      type: transactionData.type,
      amount: transactionData.amount,
      currency: transactionData.currency,
      status: transactionData.status || "completed",
      createdAt: now,
      description: transactionData.description || "",
      recipientId: transactionData.recipientId || null
    };
    
    this.transactions.set(id, transaction);
    return transaction;
  }

  async getUserTransactions(userId: number): Promise<Transaction[]> {
    return Array.from(this.transactions.values())
      .filter(tx => tx.userId === userId || tx.recipientId === userId)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  // Withdrawal methods
  async createWithdrawal(withdrawalData: InsertWithdrawal): Promise<Withdrawal> {
    const id = this.withdrawalIdCounter++;
    const now = new Date();
    
    const withdrawal: Withdrawal = {
      id,
      userId: withdrawalData.userId,
      amount: withdrawalData.amount,
      currency: withdrawalData.currency,
      address: withdrawalData.address,
      status: "pending",
      createdAt: now,
      processedAt: null,
      processedBy: null
    };
    
    this.withdrawals.set(id, withdrawal);
    return withdrawal;
  }

  async getUserWithdrawals(userId: number): Promise<Withdrawal[]> {
    return Array.from(this.withdrawals.values())
      .filter(w => w.userId === userId)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  async getWithdrawal(id: number): Promise<Withdrawal | undefined> {
    return this.withdrawals.get(id);
  }

  async updateWithdrawalStatus(id: number, status: "approved" | "rejected", adminId: number): Promise<Withdrawal> {
    const withdrawal = await this.getWithdrawal(id);
    if (!withdrawal) {
      throw new Error(`Withdrawal with ID ${id} not found`);
    }
    
    const now = new Date();
    const updatedWithdrawal: Withdrawal = {
      ...withdrawal,
      status,
      processedAt: now,
      processedBy: adminId
    };
    
    this.withdrawals.set(id, updatedWithdrawal);
    
    // If approved, update the user's balance and create a transaction
    if (status === "approved") {
      const user = await this.getUser(withdrawal.userId);
      if (user) {
        if (withdrawal.currency === "TAI") {
          await this.updateUserBalances(user.id, -withdrawal.amount, 0);
        } else {
          await this.updateUserBalances(user.id, 0, -withdrawal.amount);
        }
        
        await this.createTransaction({
          userId: user.id,
          type: "withdrawal",
          amount: withdrawal.amount,
          currency: withdrawal.currency,
          status: "completed",
          description: `Withdrawal to ${withdrawal.address}`
        });
      }
    }
    
    return updatedWithdrawal;
  }

  async getPendingWithdrawals(): Promise<Withdrawal[]> {
    return Array.from(this.withdrawals.values())
      .filter(w => w.status === "pending")
      .sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());
  }

  // Staking methods
  async createStaking(stakingData: InsertStaking): Promise<Staking> {
    const id = this.stakingIdCounter++;
    const now = new Date();
    
    const staking: Staking = {
      id,
      userId: stakingData.userId,
      amount: stakingData.amount,
      startedAt: now,
      endAt: stakingData.endAt || addDays(now, 30),
      status: "active",
      lastRewardAt: now
    };
    
    this.stakings.set(id, staking);
    return staking;
  }

  async getUserStakings(userId: number): Promise<Staking[]> {
    return Array.from(this.stakings.values())
      .filter(s => s.userId === userId)
      .sort((a, b) => b.startedAt.getTime() - a.startedAt.getTime());
  }

  async getActiveStakings(): Promise<Staking[]> {
    return Array.from(this.stakings.values())
      .filter(s => s.status === "active");
  }

  // Admin methods
  async getSystemStats(): Promise<{
    totalUsers: number;
    totalTaiBalance: number;
    totalUsdtBalance: number;
    totalPendingWithdrawals: number;
    totalActiveStakings: number;
  }> {
    const users = await this.listUsers();
    const pendingWithdrawals = await this.getPendingWithdrawals();
    const activeStakings = await this.getActiveStakings();
    
    const totalTaiBalance = users.reduce((sum, user) => sum + user.taiBalance, 0);
    const totalUsdtBalance = users.reduce((sum, user) => sum + user.usdtBalance, 0);
    
    return {
      totalUsers: users.length,
      totalTaiBalance,
      totalUsdtBalance,
      totalPendingWithdrawals: pendingWithdrawals.length,
      totalActiveStakings: activeStakings.length
    };
  }
}

// When using the database, replace MemStorage with DatabaseStorage
export class DatabaseStorage implements IStorage {
  private generateOtp(): string {
    return Math.floor(100000 + Math.random() * 900000).toString();
  }

  private generateReferralCode(): string {
    return `REF${Math.random().toString(36).substring(2, 10).toUpperCase()}`;
  }

  private generateTaiId(): string {
    return `TAI${Math.random().toString(36).substring(2, 10).toUpperCase()}`;
  }

  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user;
  }

  async getUserByTaiId(taiId: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.taiId, taiId));
    return user;
  }

  async getUserByReferralCode(referralCode: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.referralCode, referralCode));
    return user;
  }

  async createUser(userData: InsertUser & { referralCode?: string }): Promise<User> {
    const { referralCode, ...data } = userData;
    
    // Check if there's a referrer
    let referrerId: number | null = null;
    if (referralCode) {
      const referrer = await this.getUserByReferralCode(referralCode);
      if (referrer) {
        referrerId = referrer.id;
        
        // Give referral bonus to the referrer
        await this.updateUserBalances(referrer.id, 0.5, 0);
        
        // Create transaction record for referral bonus
        await this.createTransaction({
          userId: referrer.id,
          type: "referral_bonus",
          amount: 0.5,
          currency: "TAI",
          status: "completed",
          description: `Referral bonus for inviting ${data.email}`
        });
      }
    }
    
    // Generate OTP for email verification
    const otpCode = this.generateOtp();
    
    // Create user with generated fields
    const [user] = await db.insert(users).values({
      ...data,
      taiBalance: 0,
      usdtBalance: 0,
      otpCode,
      emailVerified: false,
      taiId: this.generateTaiId(),
      referralCode: this.generateReferralCode(),
      referrerId,
      createdAt: new Date(),
      miningActive: false,
      lastMiningAt: null
    }).returning();
    
    return user;
  }

  async updateUser(id: number, data: Partial<User>): Promise<User> {
    const [user] = await db
      .update(users)
      .set(data)
      .where(eq(users.id, id))
      .returning();
    
    return user;
  }

  async updateUserBalances(id: number, taiDelta: number, usdtDelta: number): Promise<User> {
    const user = await this.getUser(id);
    if (!user) throw new Error("User not found");
    
    const [updatedUser] = await db
      .update(users)
      .set({
        taiBalance: user.taiBalance + taiDelta,
        usdtBalance: user.usdtBalance + usdtDelta
      })
      .where(eq(users.id, id))
      .returning();
    
    return updatedUser;
  }

  async listUsers(): Promise<User[]> {
    return db.select().from(users);
  }

  async setUserOtp(id: number, otp: string): Promise<User> {
    const [updatedUser] = await db
      .update(users)
      .set({ otpCode: otp })
      .where(eq(users.id, id))
      .returning();
    
    return updatedUser;
  }

  async verifyUserOtp(email: string, otp: string): Promise<boolean> {
    const user = await this.getUserByEmail(email);
    if (!user || user.otpCode !== otp) return false;
    
    await db
      .update(users)
      .set({ 
        emailVerified: true,
        otpCode: null 
      })
      .where(eq(users.id, user.id));
    
    return true;
  }

  async createTransaction(transactionData: InsertTransaction): Promise<Transaction> {
    const [transaction] = await db
      .insert(transactions)
      .values({
        ...transactionData,
        createdAt: new Date()
      })
      .returning();
    
    return transaction;
  }

  async getUserTransactions(userId: number): Promise<Transaction[]> {
    return db
      .select()
      .from(transactions)
      .where(eq(transactions.userId, userId))
      .orderBy(desc(transactions.createdAt));
  }

  async createWithdrawal(withdrawalData: InsertWithdrawal): Promise<Withdrawal> {
    const [withdrawal] = await db
      .insert(withdrawals)
      .values({
        ...withdrawalData,
        status: "pending",
        createdAt: new Date(),
        processedAt: null
      })
      .returning();
    
    return withdrawal;
  }

  async getUserWithdrawals(userId: number): Promise<Withdrawal[]> {
    return db
      .select()
      .from(withdrawals)
      .where(eq(withdrawals.userId, userId))
      .orderBy(desc(withdrawals.createdAt));
  }

  async getWithdrawal(id: number): Promise<Withdrawal | undefined> {
    const [withdrawal] = await db
      .select()
      .from(withdrawals)
      .where(eq(withdrawals.id, id));
    
    return withdrawal;
  }

  async updateWithdrawalStatus(id: number, status: "approved" | "rejected", adminId: number): Promise<Withdrawal> {
    const withdrawal = await this.getWithdrawal(id);
    if (!withdrawal) throw new Error("Withdrawal not found");
    
    // If rejected, return funds to user
    if (status === "rejected") {
      await this.updateUserBalances(
        withdrawal.userId,
        withdrawal.currency === "TAI" ? withdrawal.amount : 0,
        withdrawal.currency === "USDT" ? withdrawal.amount : 0
      );
    }
    
    const [updatedWithdrawal] = await db
      .update(withdrawals)
      .set({
        status,
        processedAt: new Date()
      })
      .where(eq(withdrawals.id, id))
      .returning();
    
    return updatedWithdrawal;
  }

  async getPendingWithdrawals(): Promise<Withdrawal[]> {
    return db
      .select()
      .from(withdrawals)
      .where(eq(withdrawals.status, "pending"))
      .orderBy(asc(withdrawals.createdAt));
  }

  async createStaking(stakingData: InsertStaking): Promise<Staking> {
    const startDate = new Date();
    const endDate = new Date();
    endDate.setDate(endDate.getDate() + 30); // 30 days staking period
    
    const [staking] = await db
      .insert(stakings)
      .values({
        ...stakingData,
        status: "active",
        startedAt: startDate,
        endAt: endDate,
        createdAt: new Date()
      })
      .returning();
    
    return staking;
  }

  async getUserStakings(userId: number): Promise<Staking[]> {
    return db
      .select()
      .from(stakings)
      .where(eq(stakings.userId, userId))
      .orderBy(desc(stakings.createdAt));
  }

  async getActiveStakings(): Promise<Staking[]> {
    return db
      .select()
      .from(stakings)
      .where(eq(stakings.status, "active"));
  }

  async getSystemStats(): Promise<{
    totalUsers: number;
    totalTaiBalance: number;
    totalUsdtBalance: number;
    totalPendingWithdrawals: number;
    totalActiveStakings: number;
  }> {
    const [userStats] = await db
      .select({
        count: count(),
        totalTai: sum(users.taiBalance),
        totalUsdt: sum(users.usdtBalance)
      })
      .from(users);
    
    const [{ count: pendingWithdrawals }] = await db
      .select({ count: count() })
      .from(withdrawals)
      .where(eq(withdrawals.status, "pending"));
    
    const [{ count: activeStakings }] = await db
      .select({ count: count() })
      .from(stakings)
      .where(eq(stakings.status, "active"));
    
    return {
      totalUsers: Number(userStats.count) || 0,
      totalTaiBalance: Number(userStats.totalTai) || 0,
      totalUsdtBalance: Number(userStats.totalUsdt) || 0,
      totalPendingWithdrawals: Number(pendingWithdrawals) || 0,
      totalActiveStakings: Number(activeStakings) || 0
    };
  }
}

// Switch to database storage
import { db } from "./db";
import { asc, count, desc, eq, sum } from "drizzle-orm";
import { users, transactions, withdrawals, stakings } from "@shared/schema";
export const storage = new DatabaseStorage();
