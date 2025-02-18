const MEASUREMENTS = {
    volume: [
        "teaspoon",
        "tsp",
        "tablespoon",
        "tbsp",
        "cup",
        "c",
        "fluid ounce",
        "fl oz",
        "pint",
        "pt",
        "quart",
        "qt",
        "gallon",
        "gal",
        "milliliter",
        "ml",
        "liter",
        "l",
    ],
    weight: ["ounce", "oz", "pound", "lb", "gram", "g", "kilogram", "kg"],
    units: ["unit", "head", "clove", "stalk", "bunch", "slice", "piece"],
};

// Combine all measurements for regex
const ALL_MEASUREMENTS = [
    ...MEASUREMENTS.volume,
    ...MEASUREMENTS.weight,
    ...MEASUREMENTS.units,
].sort((a, b) => b.length - a.length);

// Create regex patterns
const NUMBER_PATTERN = String.raw`(?:(?:\d+\s*\/\s*\d+)|(?:\d*\.?\d+)|(?:¼|½|¾))`;
const MEASUREMENT_PATTERN = String.raw`(?:${ALL_MEASUREMENTS.join("|")})s?`;
const AMOUNT_PATTERN = String.raw`(${NUMBER_PATTERN})\s*(${MEASUREMENT_PATTERN})`;

export type Ingredient = { ingredient: string; amount: string | null };
export function parseRecipe(input: string): Ingredient[] {
    // Split input into lines and remove empty lines
    const lines = input
        .trim()
        .split("\n")
        .filter((line) => line.trim());

    // Handle different input formats
    if (lines[0].includes("(")) {
        // Format 1: "Ingredient(amount)"
        return parseFormatOne(lines);
    } else {
        // Format 2: "Ingredient\namount"
        return parseFormatTwo(lines);
    }
}

function parseFormatOne(lines: string[]) {
    return lines.map((line) => {
        // Split ingredient and amount/details
        const match = line.match(/(.*?)\((.*?)\)/);
        if (!match) return { ingredient: line.trim(), amount: null };

        const [_, ingredient, details] = match;
        // Extract amount from details, keeping the full unit
        const amountMatch = details.match(
            new RegExp(`^${AMOUNT_PATTERN}`, "i")
        );

        if (!amountMatch)
            return { ingredient: ingredient.trim(), amount: null };

        const [fullMatch, number, unit] = amountMatch;
        if (!number && !unit)
            return { ingredient: ingredient.trim(), amount: null };

        // Combine number and unit, preserving the exact unit text
        const amount = `${normalizeAmount(number)} ${unit}`.trim();

        return {
            ingredient: ingredient.trim(),
            amount,
        };
    });
}

function parseFormatTwo(lines: string[]) {
    const ingredients = [];

    for (let i = 0; i < lines.length; i += 2) {
        const ingredient = lines[i].trim();
        const amount = i + 1 < lines.length ? lines[i + 1].trim() : null;

        // Skip ingredients without proper amount
        if (amount === "null" || amount === "undefined") {
            ingredients.push({ ingredient, amount: null });
            continue;
        }

        // Validate amount format
        const amountMatch = amount
            ? amount.match(new RegExp(`^${AMOUNT_PATTERN}$`, "i"))
            : null;

        ingredients.push({
            ingredient,
            amount: amountMatch ? normalizeAmount(amount) : null,
        });
    }

    return ingredients;
}

// Helper function to convert fractions and special characters to decimal
function normalizeAmount(amount: string | null) {
    if (!amount) return null;

    // Convert special fraction characters
    amount = amount
        .replace("¼", "0.25")
        .replace("½", "0.5")
        .replace("¾", "0.75");

    return amount;
}
