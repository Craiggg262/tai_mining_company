import { Pool } from 'pg';
export const pool = new Pool({ connectionString: process.env.DATABASE_URL });
import {routes} from "./routes"

// Render automatically injects env vars
export const db = new Client({
  connectionString: process.env.DATABASE_URL,
  ssl: { 
    rejectUnauthorized: false // Required for Neon
  }
});

// Connect with error handling
db.connect()
  .then(() => console.log("Connected to Neon PostgreSQL"))
  .catch(err => console.error("Connection error:", err));
 