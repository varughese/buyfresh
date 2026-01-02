/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest, NextResponse } from "next/server";
import tinyduration from "tinyduration";

// Types matching the existing Recipe interface
interface Recipe {
    name: string;
    image: string | string[];
    description: string;
    cookTime: string;
    prepTime: string;
    totalTime: string;
    category: string | string[];
    cuisine: string | string[];
    ingredients: string[];
    instructions: string[];
    yield: string | string[];
}

/**
 * Finds LD+JSON in HTML using regex (no cheerio needed)
 */
async function findLDJSON(url: string): Promise<any> {
    const req = await fetch(url);
    const html = await req.text();

    // Regex to match script tags with type="application/ld+json"
    const regex = /<script[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi;
    const matches = html.matchAll(regex);

    for (const match of matches) {
        try {
            const jsonContent = match[1].trim();
            const content = JSON.parse(jsonContent);

            // Handle array case - check each element for Recipe
            if (Array.isArray(content)) {
                for (const item of content) {
                    const type = item["@type"];
                    if (type === "Recipe" || (Array.isArray(type) && type.includes("Recipe"))) {
                        return item;
                    }
                }
                // If no Recipe found in array, try first element (original behavior)
                if (content.length > 0) {
                    return content[0];
                }
                continue;
            }

            // Handle @graph case
            if (content["@graph"] && Array.isArray(content["@graph"])) {
                for (const item of content["@graph"]) {
                    const type = item["@type"];
                    if (type === "Recipe" || (Array.isArray(type) && type.includes("Recipe"))) {
                        return item;
                    }
                }
            }

            // If it's already a Recipe type, return it
            const type = content["@type"];
            if (type === "Recipe" || (Array.isArray(type) && type.includes("Recipe"))) {
                return content;
            }
        } catch (_e) {
            // Skip invalid JSON
            continue;
        }
    }

    return null;
}

/**
 * Parses instructions from LD+JSON format
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function parseInstructions(instructions: any[]): string[] {
    const result: string[] = [];
    for (const instruction of instructions) {
        if (typeof instruction === "string") {
            result.push(instruction);
        } else if (instruction["@type"] === "HowToStep") {
            result.push(instruction.text || instruction.name || "");
        } else if (instruction.text) {
            result.push(instruction.text);
        }
    }
    return result;
}

/**
 * Converts ISO-8601 duration to human-readable string
 */
function durationToStr(d: string | undefined): string {
    if (!d) return "";
    try {
        const parsed = tinyduration.parse(d);
        const result: string[] = [];
        if (parsed.hours) {
            result.push(`${parsed.hours} ${parsed.hours === 1 ? "hour" : "hours"}`);
        }
        if (parsed.minutes) {
            result.push(`${parsed.minutes} ${parsed.minutes === 1 ? "minute" : "minutes"}`);
        }
        if (parsed.seconds) {
            result.push(`${parsed.seconds} ${parsed.seconds === 1 ? "second" : "seconds"}`);
        }

        const formatter = new Intl.ListFormat("en", {
            style: "long",
            type: "conjunction",
        });
        return formatter.format(result);
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (_error: unknown) {
        return "";
    }
}

/**
 * Extracts recipe data from LD+JSON object
 */
function findRecipe(ldjson: any): Recipe | null {
    const type = ldjson["@type"];
    const isRecipe =
        type === "Recipe" || (Array.isArray(type) && type.includes("Recipe"));
    if (!isRecipe) return null;

    // Normalize image - can be string, array, or object with url
    let image: string | string[] = "";
    if (ldjson.image) {
        if (typeof ldjson.image === "string") {
            image = ldjson.image;
        } else if (Array.isArray(ldjson.image)) {
            image = ldjson.image.map((img: any) =>
                typeof img === "string" ? img : img.url || img
            );
        } else if (ldjson.image.url) {
            image = ldjson.image.url;
        }
    }
    if (typeof image === "string") {
        image = [image];
    }

    // Normalize yield
    const yieldValue =
        typeof ldjson.recipeYield === "string"
            ? ldjson.recipeYield
            : Array.isArray(ldjson.recipeYield)
                ? ldjson.recipeYield[0]
                : "";

    // Normalize category and cuisine
    const category =
        typeof ldjson.recipeCategory === "string"
            ? [ldjson.recipeCategory]
            : Array.isArray(ldjson.recipeCategory)
                ? ldjson.recipeCategory
                : [];
    const cuisine =
        typeof ldjson.recipeCuisine === "string"
            ? [ldjson.recipeCuisine]
            : Array.isArray(ldjson.recipeCuisine)
                ? ldjson.recipeCuisine
                : [];

    const result: Recipe = {
        name: ldjson.name || "",
        image: image,
        description: ldjson.description || "",
        cookTime: durationToStr(ldjson.cookTime),
        prepTime: durationToStr(ldjson.prepTime),
        totalTime: durationToStr(ldjson.totalTime),
        category: category,
        cuisine: cuisine,
        ingredients: ldjson.recipeIngredient || [],
        instructions: parseInstructions(ldjson.recipeInstructions || []),
        yield: yieldValue,
    };

    return result;
}

export async function GET(request: NextRequest) {
    const searchParams = request.nextUrl.searchParams;
    const url = searchParams.get("url");

    if (!url) {
        return NextResponse.json(
            { success: false, message: "URL parameter is required" },
            { status: 400 }
        );
    }

    try {
        // Find LD+JSON
        const ldjson = await findLDJSON(url);

        if (!ldjson) {
            return NextResponse.json({
                success: false,
                message: "LD+JSON not found.",
            });
        }

        // Extract recipe
        const recipe = findRecipe(ldjson);

        if (!recipe) {
            return NextResponse.json({
                success: false,
                message: "Recipe not found.",
            });
        }

        return NextResponse.json(
            {
                success: true,
                recipe,
            },
            {
                headers: {
                    "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=86400",
                },
            }
        );
    } catch (error) {
        console.error("Error scraping recipe:", error);
        return NextResponse.json(
            {
                success: false,
                message: error instanceof Error ? error.message : "Unknown error",
            },
            { status: 500 }
        );
    }
}

