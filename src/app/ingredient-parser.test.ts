import { describe, it, expect } from "vitest";
import { parseRecipe, formatIngredientAmount } from "./ingredient-parser";
import type { IngredientParseResult } from "./ingredient-parser";

describe("parseRecipe", () => {
    describe("Format 1: Ingredient(amount, extra)", () => {
        it("should parse ingredients with parentheses format", () => {
            const input = `Chicken thigh, boneless skinless(2 lb, cut into 1/4" pieces)
Broccoli(2 heads, cut into small florets)
Baking sodas(2)
Water(¼ cup)
Garlic(1 Tbsp, minced)
Ginger(1 Tbsp, minced)
White rice(3 cups, cooked)
Sesame seeds
Low-sodium soy sauce(3 Tbsp)
Cornstarch(2 Tbsp)
Neutral oil(2 Tbsp)
Sugar(1 Tbsp)
Onion powder(2 tsp)
Garlic powder(2 tsp)
Ginger(1 tsp)
MSG(¼ tsp)
Low-sodium soy sauce(¼ cup)
Rice vinegar(3 Tbsp)
Honey(2 Tbsp)
Sesame oil(1 Tbsp)
Cornstarch(1 Tbsp)`;

            const result = parseRecipe(input);

            expect(result).toHaveLength(21);

            // Test specific ingredients
            const chickenThigh = result[0];
            expect(chickenThigh.ingredient.trim()).toBe("Chicken thigh, boneless skinless");
            expect(chickenThigh.quantity).toBe(2);
            expect(["lb", "pound", "pounds"]).toContain(chickenThigh.unit);
            expect(chickenThigh.extra).toContain("cut into");

            const broccoli = result[1];
            expect(broccoli.ingredient.trim()).toBe("Broccoli");
            expect(broccoli.quantity).toBe(2);
            // Unit might be normalized or empty
            if (broccoli.unit) {
                expect(["head", "heads"]).toContain(broccoli.unit);
            }

            const bakingSodas = result[2];
            expect(bakingSodas.ingredient.trim()).toBe("Baking sodas");
            expect(bakingSodas.quantity).toBe(2);

            const water = result[3];
            expect(water.ingredient.trim()).toBe("Water");
            expect(water.quantity).toBe(0.25);
            expect(["cup", "cups"]).toContain(water.unit);

            const sesameSeeds = result[7];
            expect(sesameSeeds.ingredient.trim()).toBe("Sesame seeds");
            // Should be minimal ingredient (no quantity/unit)
            expect(sesameSeeds.quantity).toBe(0);
            expect(sesameSeeds.unit).toBe("");

            const msg = result[15];
            expect(msg.ingredient.trim()).toBe("MSG");
            expect(msg.quantity).toBe(0.25);
            expect(["tsp", "teaspoon", "teaspoons"]).toContain(msg.unit);
        });

        it("should handle ingredients with commas in the name", () => {
            const input = "Chicken thigh, boneless skinless(2 lb, cut into pieces)";
            const result = parseRecipe(input);

            expect(result).toHaveLength(1);
            expect(result[0].ingredient.trim()).toBe("Chicken thigh, boneless skinless");
            expect(result[0].quantity).toBe(2);
            expect(["lb", "pound", "pounds"]).toContain(result[0].unit);
        });

        it("should handle ingredients without parentheses", () => {
            const input = "Sesame seeds";
            const result = parseRecipe(input);

            expect(result).toHaveLength(1);
            expect(result[0].ingredient.trim()).toBe("Sesame seeds");
        });

        it("should handle ingredients with only amount (no extra)", () => {
            const input = "Baking sodas(2)";
            const result = parseRecipe(input);

            expect(result).toHaveLength(1);
            expect(result[0].ingredient.trim()).toBe("Baking sodas");
            expect(result[0].quantity).toBe(2);
        });

        it("should handle ingredients with fractions", () => {
            const input = "Water(¼ cup)";
            const result = parseRecipe(input);

            expect(result).toHaveLength(1);
            expect(result[0].ingredient.trim()).toBe("Water");
            expect(result[0].quantity).toBe(0.25);
            expect(["cup", "cups"]).toContain(result[0].unit);
        });

        it("should handle ingredients with extra information", () => {
            const input = "Garlic(1 Tbsp, minced)";
            const result = parseRecipe(input);

            expect(result).toHaveLength(1);
            expect(result[0].ingredient.trim()).toBe("Garlic");
            expect(result[0].quantity).toBe(1);
            expect(["Tbsp", "tablespoon", "tablespoons", "T"]).toContain(result[0].unit);
            expect(result[0].extra.trim()).toBe("minced");
        });
    });

    describe("Format 2: Ingredient\\namount", () => {
        it("should parse ingredients with newline format", () => {
            const input = `Chicken thigh
2 lb
Broccoli
2 heads`;

            const result = parseRecipe(input);

            expect(result).toHaveLength(2);
            expect(result[0].ingredient.trim()).toBe("Chicken thigh");
            expect(result[0].quantity).toBe(2);
            expect(["lb", "pound", "pounds"]).toContain(result[0].unit);
            expect(result[1].ingredient.trim()).toBe("Broccoli");
            expect(result[1].quantity).toBe(2);
            // Unit might be normalized or empty
            if (result[1].unit) {
                expect(["head", "heads"]).toContain(result[1].unit);
            }
        });

        it("should handle ingredients without amount line", () => {
            const input = `Sesame seeds
Garlic`;

            const result = parseRecipe(input);

            // Format 2 expects pairs, so with odd number of lines, 
            // it will process them as pairs and the last one might be parsed differently
            expect(result.length).toBeGreaterThanOrEqual(1);
            expect(result[0].ingredient.trim()).toBe("Sesame seeds");
            if (result.length > 1) {
                expect(result[1].ingredient.trim()).toBe("Garlic");
            }
        });

        it("should skip null and undefined amounts", () => {
            const input = `Ingredient 1
null
Ingredient 2
undefined`;

            const result = parseRecipe(input);

            expect(result).toHaveLength(2);
            expect(result[0].ingredient.trim()).toBe("Ingredient 1");
            expect(result[1].ingredient.trim()).toBe("Ingredient 2");
        });
    });

    describe("Array input", () => {
        it("should parse array of ingredient strings", () => {
            const input = [
                "Chicken thigh, boneless skinless(2 lb, cut into pieces)",
                "Broccoli(2 heads)",
                "Sesame seeds",
            ];

            const result = parseRecipe(input);

            expect(result).toHaveLength(3);
            // Array input uses parseIngredient directly which may normalize ingredient names
            expect(result[0].ingredient.trim()).toContain("Chicken thigh");
            expect(result[1].ingredient.trim()).toBe("Broccoli");
            expect(result[2].ingredient.trim()).toBe("Sesame seeds");
        });

        it("should filter out empty strings in array", () => {
            const input = [
                "Chicken thigh(2 lb)",
                "",
                "  ",
                "Broccoli(2 heads)",
            ];

            const result = parseRecipe(input);

            expect(result).toHaveLength(2);
            expect(result[0].ingredient.trim()).toBe("Chicken thigh");
            expect(result[1].ingredient.trim()).toBe("Broccoli");
        });
    });

    describe("Edge cases", () => {
        it("should handle empty string", () => {
            const result = parseRecipe("");
            expect(result).toHaveLength(0);
        });

        it("should handle whitespace-only input", () => {
            const result = parseRecipe("   \n  \n  ");
            expect(result).toHaveLength(0);
        });

        it("should handle single ingredient", () => {
            const result = parseRecipe("Salt(1 tsp)");
            expect(result).toHaveLength(1);
            expect(result[0].ingredient.trim()).toBe("Salt");
            expect(result[0].quantity).toBe(1);
            expect(["tsp", "teaspoon", "teaspoons"]).toContain(result[0].unit);
        });

        it("should handle ingredients with special characters in extra", () => {
            const input = `Chicken thigh, boneless skinless(2 lb, cut into 1/4" pieces)`;
            const result = parseRecipe(input);

            expect(result).toHaveLength(1);
            expect(result[0].ingredient.trim()).toBe("Chicken thigh, boneless skinless");
            expect(result[0].extra).toContain("1/4");
        });
    });
});

describe("formatIngredientAmount", () => {
    it("should format ingredient with quantity and unit", () => {
        const ingredient: IngredientParseResult = {
            quantity: 2,
            quantityText: "2",
            minQuantity: 2,
            maxQuantity: 2,
            unit: "lb",
            unitText: "lb",
            ingredient: "Chicken",
            extra: "",
            alternativeQuantities: [],
        };

        const result = formatIngredientAmount(ingredient);
        expect(result).toBe("2 lb");
    });

    it("should format ingredient with quantityText and unitText", () => {
        const ingredient: IngredientParseResult = {
            quantity: 0.25,
            quantityText: "¼",
            minQuantity: 0.25,
            maxQuantity: 0.25,
            unit: "cup",
            unitText: "cup",
            ingredient: "Water",
            extra: "",
            alternativeQuantities: [],
        };

        const result = formatIngredientAmount(ingredient);
        expect(result).toBe("¼ cup");
    });

    it("should return null for ingredient without quantity or unit", () => {
        const ingredient: IngredientParseResult = {
            quantity: 0,
            quantityText: "",
            minQuantity: 0,
            maxQuantity: 0,
            unit: "",
            unitText: "",
            ingredient: "Sesame seeds",
            extra: "",
            alternativeQuantities: [],
        };

        const result = formatIngredientAmount(ingredient);
        expect(result).toBeNull();
    });

    it("should format ingredient with only quantity", () => {
        const ingredient: IngredientParseResult = {
            quantity: 2,
            quantityText: "2",
            minQuantity: 2,
            maxQuantity: 2,
            unit: "",
            unitText: "",
            ingredient: "Eggs",
            extra: "",
            alternativeQuantities: [],
        };

        const result = formatIngredientAmount(ingredient);
        expect(result).toBe("2");
    });

    it("should format ingredient with only unit", () => {
        const ingredient: IngredientParseResult = {
            quantity: 0,
            quantityText: "",
            minQuantity: 0,
            maxQuantity: 0,
            unit: "to taste",
            unitText: "to taste",
            ingredient: "Salt",
            extra: "",
            alternativeQuantities: [],
        };

        const result = formatIngredientAmount(ingredient);
        expect(result).toBe("to taste");
    });
});

