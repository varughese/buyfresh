import { parseIngredient } from "@/lib/vendor/sharp-recipe-parser/ingredientParser.js";
import type { IngredientParseResult } from "@/lib/vendor/sharp-recipe-parser/types";

// Re-export the type for convenience
export type { IngredientParseResult } from "@/lib/vendor/sharp-recipe-parser/types";

/**
 * Creates a minimal IngredientParseResult when parsing fails
 */
function createMinimalIngredient(ingredientName: string): IngredientParseResult {
    return {
        quantity: 0,
        quantityText: "",
        minQuantity: 0,
        maxQuantity: 0,
        unit: "",
        unitText: "",
        ingredient: ingredientName,
        extra: "",
        alternativeQuantities: [],
    };
}

/**
 * Parses a recipe ingredient list into structured ingredients.
 * Handles two formats:
 * 1. "Ingredient(amount, extra)" - e.g., "Chicken thigh(2 lb, cut into pieces)"
 * 2. "Ingredient\namount" - alternate format with newlines
 * 
 * @param input - Multiline string of ingredients or array of ingredient strings
 * @returns Array of parsed ingredients
 */
export function parseRecipe(input: string | string[]): IngredientParseResult[] {
    // If input is an array, map over it directly
    if (Array.isArray(input)) {
        return input
            .filter((line) => line.trim())
            .map((line) => {
                const parsed = parseIngredient(line.trim(), "en", {
                    includeExtra: true,
                    includeAlternativeUnits: false,
                    fallbackLanguage: "",
                });

                if (!parsed || !parsed.ingredient) {
                    return createMinimalIngredient(line.trim());
                }

                return parsed;
            });
    }

    // Split input into lines and remove empty lines
    const lines = input
        .trim()
        .split("\n")
        .filter((line) => line.trim());

    if (lines.length === 0) {
        return [];
    }

    // Handle different input formats. these do not work with the new parser.
    if (lines[0].includes("(")) {
        // Format 1: "Ingredient(amount, extra)"
        return parseFormatOne(lines);
    } else {
        // Format 2: "Ingredient\namount"
        return parseFormatTwo(lines);
    }
}

/**
 * Parses format: "Ingredient(amount, extra)"
 */
function parseFormatOne(lines: string[]): IngredientParseResult[] {
    return lines.map((line) => {
        const trimmedLine = line.trim();

        // Extract ingredient name and parenthetical content
        // Use a more robust regex that finds the last opening parenthesis
        // to handle cases like "Ingredient, with comma(amount, extra)"
        const lastOpenParen = trimmedLine.lastIndexOf('(');
        const lastCloseParen = trimmedLine.lastIndexOf(')');

        if (lastOpenParen === -1 || lastCloseParen === -1 || lastCloseParen <= lastOpenParen) {
            // No valid parentheses - try parsing the whole line
            const parsed = parseIngredient(trimmedLine, "en", {
                includeExtra: true,
                includeAlternativeUnits: false,
                fallbackLanguage: "",
            });

            if (!parsed || !parsed.ingredient) {
                return createMinimalIngredient(trimmedLine);
            }

            return parsed;
        }

        const ingredientName = trimmedLine.substring(0, lastOpenParen).trim();
        const parentheticalContent = trimmedLine.substring(lastOpenParen + 1, lastCloseParen).trim();

        // Split parenthetical content by first comma to separate amount from extra
        // This handles formats like "2 lb, cut into pieces" or just "2 lb"
        const commaIndex = parentheticalContent.indexOf(',');
        const amountPart = commaIndex >= 0
            ? parentheticalContent.substring(0, commaIndex).trim()
            : parentheticalContent.trim();
        const extraPart = commaIndex >= 0
            ? parentheticalContent.substring(commaIndex + 1).trim()
            : "";

        // Try parsing the amount part
        let parsed = parseIngredient(amountPart, "en", {
            includeExtra: false,
            includeAlternativeUnits: false,
            fallbackLanguage: "",
        });

        if (!parsed || (!parsed.quantity && !parsed.unit)) {
            // If parsing the amount fails, try parsing the whole parenthetical content
            parsed = parseIngredient(parentheticalContent, "en", {
                includeExtra: true,
                includeAlternativeUnits: false,
                fallbackLanguage: "",
            });

            if (!parsed || (!parsed.quantity && !parsed.unit && !parsed.ingredient)) {
                // If that also fails, try parsing the whole line
                const fullParsed = parseIngredient(trimmedLine, "en", {
                    includeExtra: true,
                    includeAlternativeUnits: false,
                    fallbackLanguage: "",
                });

                if (!fullParsed || !fullParsed.ingredient) {
                    return createMinimalIngredient(ingredientName);
                }

                // Use the ingredient name from before the parentheses
                return {
                    ...fullParsed,
                    ingredient: ingredientName,
                };
            }
        }

        // Combine the parsed amount with the extra information
        // Use the ingredient name from before the parentheses
        return {
            ...parsed,
            ingredient: ingredientName,
            extra: extraPart || parsed.extra || "",
        };
    });
}

/**
 * Parses format: "Ingredient\namount"
 */
function parseFormatTwo(lines: string[]): IngredientParseResult[] {
    const ingredients: IngredientParseResult[] = [];

    for (let i = 0; i < lines.length; i += 2) {
        const ingredientLine = lines[i].trim();
        const amountLine = i + 1 < lines.length ? lines[i + 1].trim() : null;

        // Skip invalid amounts
        if (amountLine === "null" || amountLine === "undefined") {
            ingredients.push(createMinimalIngredient(ingredientLine));
            continue;
        }

        // Try parsing the amount line
        if (amountLine) {
            const parsed = parseIngredient(amountLine, "en", {
                includeExtra: false,
                includeAlternativeUnits: false,
                fallbackLanguage: "",
            });

            if (parsed && (parsed.quantity || parsed.unit)) {
                // Use the ingredient name from the ingredient line
                ingredients.push({
                    ...parsed,
                    ingredient: ingredientLine,
                });
                continue;
            }
        }

        // If no amount line or parsing failed, try parsing the ingredient line itself
        const parsed = parseIngredient(ingredientLine, "en", {
            includeExtra: true,
            includeAlternativeUnits: false,
            fallbackLanguage: "",
        });

        if (parsed && parsed.ingredient) {
            ingredients.push(parsed);
        } else {
            ingredients.push(createMinimalIngredient(ingredientLine));
        }
    }

    return ingredients;
}

/**
 * Formats an IngredientParseResult into a displayable amount string
 */
export function formatIngredientAmount(ingredient: IngredientParseResult): string | null {
    if (!ingredient.quantity && !ingredient.unit) {
        return null;
    }

    const quantity = ingredient.quantityText || ingredient.quantity?.toString() || "";
    const unit = ingredient.unitText || ingredient.unit || "";

    if (!quantity && !unit) {
        return null;
    }

    // If quantity is 0 or empty and we have a unit, just return the unit
    if ((!quantity || quantity === "0") && unit) {
        return unit;
    }

    return `${quantity}${unit ? ` ${unit}` : ""}`.trim() || null;
}
