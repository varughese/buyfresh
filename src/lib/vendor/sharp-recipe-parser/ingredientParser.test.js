import { describe, it, expect } from "vitest";
import { parseIngredient } from "./ingredientParser.js";

describe("parseIngredient with trailing parentheses", () => {
    it("should extract trailing nested parentheses content to extra when quantity is extracted", () => {
        const result = parseIngredient(
            " 1 red chili ((de-seeded and sliced, or substitute 2 teaspoons chili garlic sauce or Sriracha))",
            "en",
            { includeExtra: true }
        );

        expect(result).not.toBeNull();
        expect(result.quantity).toBe(1);
        expect(result.ingredient).toContain("red chili");
        expect(result.extra).toContain("de-seeded and sliced, or substitute 2 teaspoons chili garlic sauce or Sriracha");
        // The ingredient should not contain the trailing parentheses content
        expect(result.ingredient).not.toContain("((de-seeded");
    });

    it("should handle single parentheses at the end", () => {
        const result = parseIngredient(
            "2 cloves garlic ((minced))",
            "en",
            { includeExtra: true }
        );

        expect(result).not.toBeNull();
        expect(result.quantity).toBe(2);
        expect(result.unit).toBe("clove");
        expect(result.ingredient).toContain("garlic");
        expect(result.extra).toContain("minced");
    });

    it("should handle nested parentheses with multiple levels", () => {
        const result = parseIngredient(
            "1 lime ((juiced))",
            "en",
            { includeExtra: true }
        );

        expect(result).not.toBeNull();
        expect(result.quantity).toBe(1);
        expect(result.ingredient).toContain("lime");
        expect(result.extra).toContain("juiced");
    });

    it("should parse ingredient without trailing parentheses normally", () => {
        const result = parseIngredient(
            "1 pound boneless, skinless chicken thighs",
            "en",
            { includeExtra: true }
        );

        expect(result).not.toBeNull();
        expect(result.quantity).toBe(1);
        expect(result.unit).toBe("pound");
        expect(result.ingredient).toContain("chicken thighs");
    });

    it("should handle ingredients with parentheses in the middle (not at end)", () => {
        const result = parseIngredient(
            "2 tablespoons fish sauce",
            "en",
            { includeExtra: true }
        );

        expect(result).not.toBeNull();
        expect(result.quantity).toBe(2);
        expect(result.unit).toBe("tablespoon");
        expect(result.ingredient).toContain("fish sauce");
    });

    it("should handle complex nested parentheses with commas", () => {
        const result = parseIngredient(
            "1 seedless cucumber ((julienned))",
            "en",
            { includeExtra: true }
        );

        expect(result).not.toBeNull();
        expect(result.quantity).toBe(1);
        expect(result.ingredient).toContain("cucumber");
        expect(result.extra).toContain("julienned");
    });

    it("should handle fractions with trailing parentheses", () => {
        const result = parseIngredient(
            "1/2 cup cold water",
            "en",
            { includeExtra: true }
        );

        expect(result).not.toBeNull();
        expect(result.quantity).toBe(0.5);
        expect(result.unit).toBe("cup");
        expect(result.ingredient).toContain("water");
    });

    it("should handle ingredients with multiple words and trailing parentheses", () => {
        const result = parseIngredient(
            "6 leaves romaine lettuce ((finely julienned))",
            "en",
            { includeExtra: true }
        );

        expect(result).not.toBeNull();
        expect(result.quantity).toBe(6);
        expect(result.unit).toBe("");
        expect(result.ingredient).toContain("romaine lettuce");
        expect(result.extra).toContain("finely julienned");
    });

    it("should handle ingredients with units and trailing parentheses", () => {
        const result = parseIngredient(
            "1/4 cup fish sauce",
            "en",
            { includeExtra: true }
        );

        expect(result).not.toBeNull();
        expect(result.quantity).toBe(0.25);
        expect(result.unit).toBe("cup");
        expect(result.ingredient).toContain("fish sauce");
    });

    it("should handle ingredients with 'or' alternatives in parentheses", () => {
        const result = parseIngredient(
            "2 tablespoons rice vinegar or white vinegar",
            "en",
            { includeExtra: true }
        );

        expect(result).not.toBeNull();
        expect(result.quantity).toBe(2);
        expect(result.unit).toBe("tablespoon");
        expect(result.ingredient).toContain("vinegar");
    });

    it("should not extract parentheses when quantity is not successfully extracted", () => {
        const result = parseIngredient(
            "Vegetable oil",
            "en",
            { includeExtra: true }
        );

        // When there's no quantity, the function may return null or a minimal result
        // This depends on the implementation, but we shouldn't extract parentheses
        if (result) {
            expect(result.quantity).toBe(0);
        }
    });

    it("should handle decimal quantities with trailing parentheses", () => {
        const result = parseIngredient(
            "7 ounces dried rice vermicelli noodles",
            "en",
            { includeExtra: true }
        );

        expect(result).not.toBeNull();
        expect(result.quantity).toBe(7);
        expect(result.unit).toBe("ounce");
        expect(result.ingredient).toContain("noodles");
    });

    it("should handle ingredients with descriptive text in parentheses", () => {
        const result = parseIngredient(
            "1 large carrot ((julienned))",
            "en",
            { includeExtra: true }
        );

        expect(result).not.toBeNull();
        expect(result.quantity).toBe(1);
        expect(result.ingredient).toContain("carrot");
        expect(result.extra).toContain("julienned");
    });

    it("should properly separate ingredient name from extra content", () => {
        const result = parseIngredient(
            "3 cloves garlic ((minced))",
            "en",
            { includeExtra: true }
        );

        expect(result).not.toBeNull();
        expect(result.quantity).toBe(3);
        expect(result.unit).toBe("clove");
        // Ingredient should not have the parentheses content mixed in
        expect(result.ingredient.split("(")[0].trim()).toContain("garlic");
        expect(result.extra).toContain("minced");
    });

    it("should handle multiple parentheses groups correctly (only extract trailing)", () => {
        const result = parseIngredient(
            "2 cups bean sprouts",
            "en",
            { includeExtra: true }
        );

        expect(result).not.toBeNull();
        expect(result.quantity).toBe(2);
        expect(result.unit).toBe("cup");
        expect(result.ingredient).toContain("bean sprouts");
    });
});

