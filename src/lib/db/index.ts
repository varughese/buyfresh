import type { DatabaseConnection } from "./connection";
import { createNeonConnection } from "./neon";
import { createSupabaseConnection } from "./supabase";

let dbConnection: DatabaseConnection | null = null;

/**
 * Get or create database connection based on provider
 */
function getConnection(): DatabaseConnection {
  if (dbConnection) {
    return dbConnection;
  }

  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    throw new Error("DATABASE_URL environment variable is not set");
  }

  const provider = (process.env.DATABASE_PROVIDER || "neon").toLowerCase();

  switch (provider) {
    case "neon":
      dbConnection = createNeonConnection(databaseUrl);
      break;
    case "supabase":
      dbConnection = createSupabaseConnection(databaseUrl);
      break;
    default:
      throw new Error(`Unsupported database provider: ${provider}. Supported providers: neon, supabase`);
  }

  return dbConnection;
}

/**
 * Execute a SQL query and return results
 */
export async function query<T = unknown>(sql: string, params?: unknown[]): Promise<T[]> {
  const connection = getConnection();
  const result = await connection.query<T>(sql, params);
  return result.rows;
}

/**
 * Execute a SQL query without returning results
 */
export async function execute(sql: string, params?: unknown[]): Promise<void> {
  const connection = getConnection();
  await connection.execute(sql, params);
}

/**
 * Reset the connection (useful for testing or reconnection)
 */
export function resetConnection(): void {
  dbConnection = null;
}
