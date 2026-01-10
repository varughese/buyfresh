"use client";

import { useState, useEffect, useCallback, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { IngredientParseResult, parseRecipe } from "./ingredient-parser";
import { searchWegmans, type GroceryItem } from "@/lib/wegmans";
import { scrapeRecipeUrl, type Recipe } from "@/lib/recipe-url-scraper";
import { ManualInput } from "@/components/manual-input";
import { UrlInput } from "@/components/url-input";
import { IngredientResults } from "@/components/ingredient-results";
import { ShoppingList } from "@/components/shopping-list";
import { RecipeCard } from "@/components/recipe-card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";

interface IngredientWithMatches {
    ingredient: IngredientParseResult;
    matches: GroceryItem[];
    selected?: GroceryItem;
    skipped?: boolean;
    searchQuery: string;
}

const DEFAULT_QUERY = `Chicken thigh, boneless skinless(2 lb, cut into 1/4" pieces)
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

function UrlParamProcessor({
    onUrlSubmit,
    hasProcessedUrl,
    setHasProcessedUrl
}: {
    onUrlSubmit: (url: string) => void;
    hasProcessedUrl: boolean;
    setHasProcessedUrl: (value: boolean) => void;
}) {
    const searchParams = useSearchParams();

    useEffect(() => {
        const urlParam = searchParams.get("url");
        if (urlParam && !hasProcessedUrl) {
            setHasProcessedUrl(true);
            onUrlSubmit(urlParam);
        }
    }, [searchParams, hasProcessedUrl, onUrlSubmit, setHasProcessedUrl]);

    return null;
}

export default function Home() {
    const [ingredients, setIngredients] = useState<IngredientWithMatches[]>([]);
    const [selectedItems, setSelectedItems] = useState<
        {
            item: GroceryItem;
            ingredient: IngredientParseResult;
        }[]
    >([]);
    const [isLoading, setIsLoading] = useState(false);
    const [recipe, setRecipe] = useState<Recipe | null>(null);
    const [progressMessage, setProgressMessage] = useState<string>("");
    const [progressValue, setProgressValue] = useState<number>(0);
    const [hasProcessedUrl, setHasProcessedUrl] = useState(false);
    const [showRawTextModal, setShowRawTextModal] = useState(false);
    const [rawText, setRawText] = useState<string>("");
    const [hasError, setHasError] = useState(false);
    const [activeTab, setActiveTab] = useState<string>("url");

    const handleManualSubmit = async (text: string) => {
        setIsLoading(true);
        try {
            // Clear recipe when using manual input
            setRecipe(null);

            const parsedIngredients = parseRecipe(text);

            // Search store for each ingredient
            const ingredientsWithMatches = await Promise.all(
                parsedIngredients.map(async (ingredient) => {
                    const query = ingredient.ingredient;
                    const data = await searchWegmans({ query });
                    return {
                        ingredient,
                        matches: data, // Store all results for pagination
                        searchQuery: query,
                    };
                })
            );

            setIngredients(ingredientsWithMatches);
        } catch (error) {
            console.error("Error searching store:", error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleUrlSubmit = useCallback(async (url: string) => {
        setIsLoading(true);
        setHasError(false); // Clear previous error
        setShowRawTextModal(false); // Close modal if open
        setRawText(""); // Clear previous raw text
        setProgressMessage("Downloading website...");
        setProgressValue(10);

        // Fake progress updates during download
        const progressSteps = [
            { message: "Downloading website...", value: 15 },
            { message: "Downloading website...", value: 25 },
            { message: "Extracting recipe...", value: 35 },
            { message: "Extracting recipe...", value: 45 },
            { message: "Parsing ingredients...", value: 50 },
        ];

        let stepIndex = 0;
        let progressInterval: NodeJS.Timeout | null = null;

        progressInterval = setInterval(() => {
            if (stepIndex < progressSteps.length) {
                const step = progressSteps[stepIndex];
                setProgressMessage(step.message);
                setProgressValue(step.value);
                stepIndex++;
            }
        }, 1500); // Update every 1.5 seconds

        try {
            const recipeData = await scrapeRecipeUrl(url);
            if (progressInterval) {
                clearInterval(progressInterval);
            }

            if (!recipeData || !recipeData.success || !recipeData.recipe || !recipeData.recipe.ingredients) {
                // Handle error case - show error, switch to manual tab, and show raw text modal
                setHasError(true);

                if (recipeData?.rawText) {
                    setRawText(recipeData.rawText);
                    setShowRawTextModal(true);
                }

                // Switch to manual entry tab
                setActiveTab("manual");

                setProgressMessage("");
                setProgressValue(0);
                return;
            }

            // Store the recipe
            setRecipe(recipeData.recipe);

            // Parse ingredients directly from array
            const parsedIngredients = parseRecipe(recipeData.recipe.ingredients);

            setProgressMessage("Searching store...");
            setProgressValue(80);

            // Search store for each ingredient
            const ingredientsWithMatches = await Promise.all(
                parsedIngredients.map(async (ingredient) => {
                    const query = ingredient.ingredient;
                    const data = await searchWegmans({ query });
                    return {
                        ingredient,
                        matches: data, // Store all results for pagination
                        searchQuery: query,
                    };
                })
            );

            setProgressMessage("Complete!");
            setProgressValue(100);
            setIngredients(ingredientsWithMatches);
        } catch (error) {
            console.error("Error scraping recipe or searching store:", error);
            setHasError(true);
            // Switch to manual entry tab on error
            setActiveTab("manual");
            setProgressMessage("");
            setProgressValue(0);
        } finally {
            // Ensure interval is cleared even on error
            if (progressInterval) {
                clearInterval(progressInterval);
            }
            setIsLoading(false);
            // Reset progress after a short delay to allow 100% to be visible
            setTimeout(() => {
                setProgressMessage("");
                setProgressValue(0);
            }, 300);
        }
    }, []);

    const handleSelectProduct = (ingredient: IngredientParseResult, product: GroceryItem) => {
        // Check if this exact product is already selected for this ingredient
        const isAlreadySelected = selectedItems.some(
            (item) => item.item.href === product.href && item.ingredient.ingredient === ingredient.ingredient
        );

        if (isAlreadySelected) {
            // Remove from selected items (toggle off)
            setSelectedItems((prev) =>
                prev.filter((item) => !(item.item.href === product.href && item.ingredient.ingredient === ingredient.ingredient))
            );
            // Update ingredient state
            setIngredients((prev) =>
                prev.map((ing) =>
                    ing.ingredient.ingredient === ingredient.ingredient
                        ? { ...ing, selected: undefined, skipped: false }
                        : ing
                )
            );
        } else {
            // Remove any existing product for this ingredient first, then add the new one
            setSelectedItems((prev) => {
                // Filter out any existing products for this ingredient
                const filtered = prev.filter(
                    (item) => item.ingredient.ingredient !== ingredient.ingredient
                );
                // Add the new product
                return [...filtered, { item: product, ingredient }];
            });
            // Update ingredient state
            setIngredients((prev) =>
                prev.map((ing) =>
                    ing.ingredient.ingredient === ingredient.ingredient
                        ? { ...ing, selected: product, skipped: false }
                        : ing
                )
            );
        }
    };

    const handleSkip = (ingredient: IngredientParseResult) => {
        setIngredients((prev) =>
            prev.map((ing) =>
                ing.ingredient.ingredient === ingredient.ingredient
                    ? { ...ing, selected: undefined, skipped: true }
                    : ing
            )
        );
        // Remove from selected items if it was selected
        setSelectedItems((prev) =>
            prev.filter(
                (item) => item.ingredient.ingredient !== ingredient.ingredient
            )
        );
    };

    const handleUnskip = (ingredient: IngredientParseResult) => {
        setIngredients((prev) =>
            prev.map((ing) =>
                ing.ingredient.ingredient === ingredient.ingredient
                    ? { ...ing, skipped: false }
                    : ing
            )
        );
    };

    const handleUpdateSearch = (ingredient: IngredientParseResult, query: string, results: GroceryItem[], selected?: GroceryItem) => {
        setIngredients((prev) =>
            prev.map((ing) => {
                if (ing.ingredient.ingredient === ingredient.ingredient) {
                    return {
                        ...ing,
                        matches: results, // Store all results for pagination
                        searchQuery: query,
                        selected: selected || ing.selected,
                        skipped: selected ? false : ing.skipped,
                    };
                }
                return ing;
            })
        );

        // Update selectedItems if a product was selected
        if (selected) {
            setSelectedItems((prevItems) => {
                // Remove old selection if it exists, then add new selection
                const filtered = prevItems.filter(
                    (item) => item.ingredient.ingredient !== ingredient.ingredient
                );
                return [...filtered, { item: selected, ingredient }];
            });
        }
    };

    const handleClear = () => {
        setIngredients([]);
        setSelectedItems([]);
        setRecipe(null);
    };

    return (
        <div className="min-h-screen bg-background">
            <Suspense fallback={null}>
                <UrlParamProcessor
                    onUrlSubmit={handleUrlSubmit}
                    hasProcessedUrl={hasProcessedUrl}
                    setHasProcessedUrl={setHasProcessedUrl}
                />
            </Suspense>
            <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
                <div className="mb-8">
                    <h1 className="text-4xl font-bold tracking-tight text-foreground">
                        Bulk search Astor Pl Wegmans for ingredients
                    </h1>
                    <p className="mt-2 text-lg text-muted-foreground">
                        Turn recipes into shoppable ingredient lists
                    </p>
                </div>

                <div className="grid gap-8 lg:grid-cols-3">
                    <div className="lg:col-span-2">
                        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                            <TabsContent value="url">
                                <UrlInput
                                    onSubmit={handleUrlSubmit}
                                    isLoading={isLoading}
                                    hasSubmittedIngredients={ingredients.length > 0}
                                    progressMessage={progressMessage}
                                    progressValue={progressValue}
                                    hasError={hasError}
                                />
                            </TabsContent>
                            <TabsContent value="manual" className="mt-4">
                                <ManualInput
                                    onSubmit={handleManualSubmit}
                                    isLoading={isLoading}
                                    defaultValue={DEFAULT_QUERY}
                                />
                            </TabsContent>
                            <TabsList>
                                <TabsTrigger value="url">Import from URL</TabsTrigger>
                                <TabsTrigger value="manual">Manual Entry</TabsTrigger>
                            </TabsList>
                        </Tabs>

                        {recipe && (
                            <div className="mt-6">
                                <RecipeCard recipe={recipe} />
                            </div>
                        )}

                        {ingredients.length > 0 && (
                            <div className="mt-6">
                                <IngredientResults
                                    ingredients={ingredients}
                                    onSelectProduct={handleSelectProduct}
                                    onSkip={handleSkip}
                                    onUnskip={handleUnskip}
                                    onUpdateSearch={handleUpdateSearch}
                                />
                            </div>
                        )}
                    </div>

                    <div className="lg:col-span-1">
                        <ShoppingList items={selectedItems} onClear={handleClear} />
                    </div>
                </div>
            </div>

            <Dialog open={showRawTextModal} onOpenChange={setShowRawTextModal}>
                <DialogContent className="max-w-4xl max-h-[80vh]">
                    <DialogHeader>
                        <DialogTitle>Raw Text from Recipe URL</DialogTitle>
                        <DialogDescription>
                            The recipe could not be parsed automatically. Here is the raw text extracted from the page.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="mt-4">
                        <Textarea
                            value={rawText}
                            readOnly
                            className="min-h-[400px] font-mono text-sm"
                        />
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
}
