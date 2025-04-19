import users from "@/pages/admin/users";
import { pgTable, text, serial, integer, timestamp, boolean, real, pgEnum } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { Users } from "lucide-react";
import { z } from "zod";

// Enum for transaction types
export const transactionTypeEnum = pgEnum('transaction_type', [
  'mining_reward', 
  'referral_bonus', 
  'deposit', 
  'withdrawal', 
  'transfer_sent', 
  'transfer_received', 
  'conversion',
  'staking',
  'staking_reward'
]);

// Enum for transaction status
export const transactionStatusEnum = pgEnum('transaction_status', [
  'pending', 
  'completed', 
  'rejected'
]);
(
// Enum for withdrawal status
export const withdrawalStatusEnum = pgEnum('withdrawal_status', [
  'pending', 
  'approved', 
  'rejected'
]);

// Enum for staking status
export const stakingStatusEnum = pgEnum('staking_status', [
  'active', 
  'completed', 
  'withdrawn'
]);

// Enum for user roles
export const userRoleEnum = pgEnum('user_role', [
  'user',
  'admin'
]);

// User schema
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  password: text("password").notNull(),
  role: userRoleEnum("role").notNull().default('user'),
  taiBalance: real("tai_balance").notNull().default(0),
  usdtBalance: real("usdt_balance").notNull().default(0),
  referralCode: text("referral_code").notNull().unique(),
  referredBy: integer("referred_by").references(() => users.id),
  taiId: text("tai_id").notNull().unique(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  lastMiningAt: timestamp("last_mining_at"),
  miningActive: boolean("mining_active").default(false),
  emailVerified: boolean("email_verified").default(false),
  otpCode: text("otp_code"),
  otpExpiry: timestamp("otp_expiry"),
});

// Transactions schema
export const transactions = pgTable("transactions", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  type: transactionTypeEnum("type").notNull(),
  amount: real("amount").notNull(),
  currency: text("currency").notNull(), // 'TAI' or 'USDT'
  status: transactionStatusEnum("status").notNull().default('completed'),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  description: text("description"),
  recipientId: integer("recipient_id").references(() => users.id),
});

// Withdrawals schema
export const withdrawals = pgTable("withdrawals", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  amount: real("amount").notNull(),
  currency: text("currency").notNull(), // 'TAI' or 'USDT'
  address: text("address").notNull(),
  status: withdrawalStatusEnum("status").notNull().default('pending'),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  processedAt: timestamp("processed_at"),
  processedBy: integer("processed_by").references(() => users.id),
});

// Staking schema
export const stakings = pgTable("stakings", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  amount: real("amount").notNull(),
  startedAt: timestamp("started_at").defaultNow().notNull(),
  endAt: timestamp("end_at").notNull(),
  status: stakingStatusEnum("status").notNull().default('active'),
  lastRewardAt: timestamp("last_reward_at"),
});

// Insert schemas
export const insertUserSchema = createInsertSchema(users).pick({
  name: true,
  email: true,
  password: true,
  role: true,
});

export const insertTransactionSchema = createInsertSchema(transactions).pick({
  userId: true,
  type: true,
  amount: true,
  currency: true,
  status: true,
  description: true,
  recipientId: true,
});

export const insertWithdrawalSchema = createInsertSchema(withdrawals).pick({
  userId: true,
  amount: true,
  currency: true,
  address: true,
});

export const insertStakingSchema = createInsertSchema(stakings).pick({
  userId: true,
  amount: true,
  endAt: true,
});

// Custom schemas for specific operations
export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});

export const registerSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  password: z.string().min(6),
  confirmPassword: z.string().min(6),
  referralCode: z.string().optional(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords do not match",
  path: ["confirmPassword"],
});

export const verifyOtpSchema = z.object({
  email: z.string().email(),
  otp: z.string().length(6),
});

export const resetPasswordSchema = z.object({
  email: z.string().email(),
});

export const conversionSchema = z.object({
  amount: z.number().positive(),
  fromCurrency: z.enum(['TAI', 'USDT']),
  toCurrency: z.enum(['TAI', 'USDT']),
});

export const transferSchema = z.object({
  taiId: z.string().min(1),
  amount: z.number().positive(),
});

export const withdrawalSchema = z.object({
  amount: z.number().positive(),
  currency: z.enum(['TAI', 'USDT']),
  address: z.string().min(1),
});

export const stakingSchema = z.object({
  amount: z.number().positive(),
});

export const processWithdrawalSchema = z.object({
  withdrawalId: z.number().int().positive(),
  status: z.enum(['approved', 'rejected']),
});

// Type definitions
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;
export type Transaction = typeof transactions.$inferSelect;
export type InsertTransaction = z.infer<typeof insertTransactionSchema>;
export type Withdrawal = typeof withdrawals.$inferSelect;
export type InsertWithdrawal = z.infer<typeof insertWithdrawalSchema>;
export type Staking = typeof stakings.$inferSelect;
export type InsertStaking = z.infer<typeof insertStakingSchema>;

export type Login = z.infer<typeof loginSchema>;
export type Register = z.infer<typeof registerSchema>;
export type VerifyOtp = z.infer<typeof verifyOtpSchema>;
export type ResetPassword = z.infer<typeof resetPasswordSchema>;
export type Conversion = z.infer<typeof conversionSchema>;
export type Transfer = z.infer<typeof transferSchema>;
export type WithdrawalRequest = z.infer<typeof withdrawalSchema>;
export type StakingRequest = z.infer<typeof stakingSchema>;
