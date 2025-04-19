import { db } from "../server/db";
import { users } from "../shared/schema";
import { eq } from "drizzle-orm";
import { generateTaiId, generateReferralCode } from "./utils";

async function createAdminUser() {
  console.log("Creating admin user...");
  
  try {
    // Check if admin already exists
    const [existingAdmin] = await db
      .select()
      .from(users)
      .where(eq(users.email, "ejemegwapeter@gmail.com"));
    
    if (existingAdmin) {
      console.log("Admin user already exists!");
      process.exit(0);
    }
    
    // Create admin user
    const [admin] = await db
      .insert(users)
      .values({
        name: "Admin",
        email: "ejemegwapeter@gmail.com",
        password: "Peter123@@@",
        role: "admin",
        tai_balance: 1000000,
        usdt_balance: 1000000,
        tai_id: generateTaiId(),
        referral_code: generateReferralCode(),
        email_verified: true,
        otp_code: null,
        created_at: new Date(),
        mining_active: false,
        last_mining_at: null,
        referred_by: null
      })
      .returning();
    
    console.log("Admin user created successfully:", admin);
  } catch (error) {
    console.error("Error creating admin user:", error);
  } finally {
    process.exit(0);
  }
}

createAdminUser();