// Types for recipe scraper API response

export interface Recipe {
  name: string;
  image: string[];
  description: string;
  cookTime: string;
  prepTime: string;
  totalTime: string;
  category: string[];
  cuisine: string[];
  ingredients: string[];
  instructions: string[];
  yield: string;
}

export interface RecipeScraperResponse {
  success: boolean;
  recipe?: Recipe;
  message?: string;
  rawText?: string;
}

/**
 * Scrapes recipe data from a URL using the recipe scraper API
 * @param url - The URL of the recipe to scrape
 * @returns Promise with the recipe data or null if unsuccessful
 */
export async function scrapeRecipeUrl(
  url: string
): Promise<RecipeScraperResponse | null> {
  try {
    const apiUrl = `/api/recipe?url=${encodeURIComponent(url)}`;

    const response = await fetch(apiUrl, {
      headers: {
        Accept: "application/json",
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch recipe: ${response.statusText}`);
    }

    const data: RecipeScraperResponse = await response.json();

    // Return the full response including error details
    return data;
  } catch (error) {
    console.error("Error scraping recipe URL:", error);
    return null;
  }
}

