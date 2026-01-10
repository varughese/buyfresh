/**
 * Database connection interface for provider-agnostic database operations
 */
export interface DatabaseConnection {
  /**
   * Execute a SQL query and return results
   */
  query<T = unknown>(sql: string, params?: unknown[]): Promise<{ rows: T[] }>;
  
  /**
   * Execute a SQL query without returning results (for INSERT, UPDATE, DELETE)
   */
  execute(sql: string, params?: unknown[]): Promise<void>;
}

/**
 * Database query result type
 */
export interface QueryResult<T = unknown> {
  rows: T[];
}
