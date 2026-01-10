import type { DatabaseConnection, QueryResult } from "./connection";

/**
 * Supabase database connection implementation
 * 
 * TODO: Implement when switching to Supabase
 * Example implementation:
 * 
 * import { createClient } from '@supabase/supabase-js'
 * 
 * class SupabaseConnection implements DatabaseConnection {
 *   private client: ReturnType<typeof createClient>
 * 
 *   constructor(connectionString: string) {
 *     this.client = createClient(connectionString, ...)
 *   }
 * 
 *   async query<T>(sql: string, params?: unknown[]): Promise<QueryResult<T>> {
 *     const { data, error } = await this.client.rpc('execute_sql', { sql, params })
 *     if (error) throw error
 *     return { rows: data }
 *   }
 * 
 *   async execute(sql: string, params?: unknown[]): Promise<void> {
 *     await this.query(sql, params)
 *   }
 * }
 */

/**
 * Create a Supabase database connection
 * 
 * Placeholder for future Supabase implementation
 */
export function createSupabaseConnection(connectionString: string): DatabaseConnection {
  throw new Error("Supabase connection not yet implemented. Please use Neon provider.");
}
