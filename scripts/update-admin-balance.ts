import { db } from "../server/db";
import { users } from "../shared/schema";
import { eq } from "drizzle-orm";

async function updateAdminBalance() {
  console.log("Updating admin balance...");
  
  try {
    // Find the admin user
    const [admin] = await db
      .select()
      .from(users)
      .where(eq(users.email, "ejemegwapeter@gmail.com"));
    
    if (!admin) {
      console.log("Admin user not found!");
      process.exit(1);
    }
    
    // Update admin balance to 1 million TAI and 1 million USDT
    const [updatedAdmin] = await db
      .update(users)
      .set({
        tai_balance: 1000000,
        usdt_balance: 1000000
      })
      .where(eq(users.id, admin.id))
      .returning();
    
    console.log("Admin balance updated successfully:");
    console.log(`TAI Balance: ${updatedAdmin.tai_balance}`);
    console.log(`USDT Balance: ${updatedAdmin.usdt_balance}`);
  } catch (error) {
    console.error("Error updating admin balance:", error);
  } finally {
    process.exit(0);
  }
}

updateAdminBalance();