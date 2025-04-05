import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import pg from "pg";

// Check if DATABASE_URL is set
if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL environment variable is not set");
}

// Create postgres connection
const connectionString = process.env.DATABASE_URL;
console.log("Initializing database connection...");

// For Drizzle ORM
const queryClient = postgres(connectionString);
export const db = drizzle(queryClient);

// For raw queries and session store
export const pool = new pg.Pool({
  connectionString,
});

// Log connection status
pool.query("SELECT NOW()")
  .then(() => console.log("PostgreSQL database connection successful"))
  .catch(err => console.error("Error connecting to PostgreSQL database:", err));
