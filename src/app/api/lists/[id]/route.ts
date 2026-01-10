import { NextRequest, NextResponse } from "next/server";
import { query } from "@/lib/db";
import type { ShoppingListItem } from "@/lib/shopping-list-types";

interface ShoppingListRow {
    id: string;
    items: ShoppingListItem[];
    created_at: Date;
}

/**
 * GET /api/lists/[id] - Get a shopping list by ID
 */
export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> | { id: string } }
) {
    const resolvedParams = params instanceof Promise ? await params : params;
    const id = resolvedParams.id || "unknown";

    try {
        if (!resolvedParams.id) {
            return NextResponse.json({ error: "ID is required" }, { status: 400 });
        }

        // Query database
        const rows = await query<ShoppingListRow>(
            "SELECT id, items, created_at FROM shopping_lists WHERE id = $1",
            [id]
        );

        console.log(`[GET /api/lists/${id}] Found ${rows.length} rows`);

        if (rows.length === 0) {
            console.log(`[GET /api/lists/${id}] No rows found`);
            return NextResponse.json({ error: "Shopping list not found" }, { status: 404 });
        }

        const list = rows[0];
        console.log(`[GET /api/lists/${id}] Returning list with ${Array.isArray(list.items) ? list.items.length : 'unknown'} items`);

        return NextResponse.json({
            id: list.id,
            items: list.items,
            created_at: list.created_at,
        });
    } catch (error) {
        console.error(`[GET /api/lists/${id}] Error:`, error);
        if (error instanceof Error) {
            console.error(`[GET /api/lists/${id}] Error message:`, error.message);
            console.error(`[GET /api/lists/${id}] Error stack:`, error.stack);
        }
        return NextResponse.json(
            {
                error: "Failed to fetch shopping list",
                message: error instanceof Error ? error.message : "Unknown error",
            },
            { status: 500 }
        );
    }
}
