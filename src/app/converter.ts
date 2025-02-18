import convert from "convert-units";

export function recipeMultiplier(
    ingredient1: string | null,
    ingredient2: string | null
) {
    if (!ingredient1 || !ingredient2) {
        return null;
    }
    try {
        // Regular expressions to extract numbers and units
        const numberRegex = /[\d.]+/;
        const unitRegex = /[a-zA-Z]+\s*[a-zA-Z]*/;

        // Extract values and units with null handling
        const value1Match = ingredient1.match(numberRegex);
        const value1 = value1Match ? parseFloat(value1Match[0]) : null;
        const value2Match = ingredient2.match(numberRegex);
        const value2 = value2Match ? parseFloat(value2Match[0]) : null;
        const unit1Match = ingredient1.match(unitRegex);
        const unit1 = unit1Match ? unit1Match[0].trim().toLowerCase() : null;
        const unit2Match = ingredient2.match(unitRegex);
        const unit2 = unit2Match ? unit2Match[0].trim().toLowerCase() : null;

        if (!value1 || value2 || !unit1 || !unit2) {
            return null;
        }

        // Map common recipe units to convert-units library units
        const unitMap = {
            tbsp: "Tbs",
            tsp: "tsp",
            cup: "cup",
            cups: "cup",
            oz: "fl-oz",
            "fl oz": "fl-oz",
            ml: "ml",
            l: "l",
            g: "g",
            kg: "kg",
            lb: "lb",
            lbs: "lb",
        } as Record<string, string>;

        // Convert units to library format
        const mappedUnit1 = unitMap[unit1] || unit1;
        const mappedUnit2 = unitMap[unit2] || unit2;

        // Convert first ingredient to second ingredient's unit
        const convertedValue = convert(value1)
            .from(mappedUnit1)
            .to(mappedUnit2);

        // Calculate multiplier
        const multiplier = value2 / convertedValue;

        return {
            multiplier,
            originalValues: {
                first: `${value1} ${unit1}`,
                second: `${value2} ${unit2}`,
            },
            conversion: `1 ${unit1} = ${(1 / multiplier).toFixed(3)} ${unit2}`,
        };
    } catch (error) {
        return {
            error: "Invalid units or conversion not possible",
            details: error.message,
        };
    }
}
