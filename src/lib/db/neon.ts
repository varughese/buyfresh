import { neon } from "@neondatabase/serverless";
import type { DatabaseConnection, QueryResult } from "./connection";

/**
 * Neon database connection implementation
 * 
 * Neon serverless supports:
 * - Tagged template: sql`SELECT * FROM table WHERE id = ${id}`
 * - Parameterized queries: sql.query("SELECT * FROM table WHERE id = $1", [id])
 */
class NeonConnection implements DatabaseConnection {
    private sql: ReturnType<typeof neon>;

    constructor(connectionString: string) {
        this.sql = neon(connectionString);
    }

    async query<T = unknown>(sqlString: string, params?: unknown[]): Promise<QueryResult<T>> {
        // Use sql.query() for parameterized queries with $1, $2 placeholders
        // Neon's query() returns an array of rows directly
        const sqlWithQuery = this.sql as { query: (sql: string, params?: unknown[]) => Promise<T[]> };
        const rows = await sqlWithQuery.query(sqlString, params || []);
        // Neon returns array directly, wrap it in QueryResult format
        return { rows: Array.isArray(rows) ? rows : [] };
    }

    async execute(sqlString: string, params?: unknown[]): Promise<void> {
        // Execute is the same as query for Neon
        const sqlWithQuery = this.sql as { query: (sql: string, params?: unknown[]) => Promise<unknown[]> };
        await sqlWithQuery.query(sqlString, params || []);
    }
}

/**
 * Create a Neon database connection
 */
export function createNeonConnection(connectionString: string): DatabaseConnection {
    return new NeonConnection(connectionString);
}
