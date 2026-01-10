import { NextRequest, NextResponse } from "next/server";
import { nanoid } from "nanoid";
import { query, execute } from "@/lib/db";
import type { ShoppingListItem } from "@/lib/shopping-list-types";

interface CreateListRequest {
    items: ShoppingListItem[];
}

/**
 * POST /api/lists - Create a new shopping list
 */
export async function POST(request: NextRequest) {
    try {
        const body: CreateListRequest = await request.json();

        if (!body.items || !Array.isArray(body.items) || body.items.length === 0) {
            return NextResponse.json(
                { error: "Items array is required and must not be empty" },
                { status: 400 }
            );
        }

        // Generate short ID
        const id = nanoid(8); // 8 characters should be enough for uniqueness

        // Insert into database
        await execute(
            `INSERT INTO shopping_lists (id, items, created_at) 
       VALUES ($1, $2::jsonb, NOW())`,
            [id, JSON.stringify(body.items)]
        );

        return NextResponse.json({ id }, { status: 201 });
    } catch (error) {
        console.error("Error creating shopping list:", error);
        return NextResponse.json(
            {
                error: "Failed to create shopping list",
                message: error instanceof Error ? error.message : "Unknown error",
            },
            { status: 500 }
        );
    }
}
