#!/usr/bin/env tsx
/**
 * Database setup script
 * Run with: pnpm tsx scripts/setup-db.ts
 */

import { query, execute } from "../src/lib/db";


async function setupDatabase() {
    try {
        console.log("Creating shopping_lists table...");

        await execute(`
      CREATE TABLE IF NOT EXISTS shopping_lists (
        id TEXT PRIMARY KEY,
        items JSONB NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
      )
    `);

        console.log("Creating indexes...");

        await execute(`
      CREATE INDEX IF NOT EXISTS idx_shopping_lists_id ON shopping_lists(id)
    `);

        await execute(`
      CREATE INDEX IF NOT EXISTS idx_shopping_lists_created_at ON shopping_lists(created_at)
    `);

        console.log("✅ Database setup complete!");
    } catch (error) {
        console.error("❌ Error setting up database:", error);
        process.exit(1);
    }
}

setupDatabase();
