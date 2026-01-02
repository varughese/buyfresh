import { describe, it, expect } from "vitest";
import { GET } from "./route";
import { NextRequest } from "next/server";

describe("Recipe API Route", () => {
    it("should parse recipe from Dr. Matt Cooks - Chicken and Broccoli", async () => {
        const url = "https://www.drmattcooks.com/recipes/chicken-and-broccoli";
        const request = new NextRequest(
            new URL(`http://localhost:3000/api/recipe?url=${encodeURIComponent(url)}`)
        );

        const response = await GET(request);
        const data = await response.json();

        console.log(data);
        expect(data).toHaveProperty("success");

        if (data.success) {
            expect(data.recipe).toBeDefined();
            expect(data.recipe.name).toBeTruthy();
            expect(Array.isArray(data.recipe.ingredients)).toBe(true);
            expect(Array.isArray(data.recipe.instructions)).toBe(true);
            expect(data.recipe.ingredients.length).toBeGreaterThan(0);
            expect(data.recipe.instructions.length).toBeGreaterThan(0);
        }
    });
});

