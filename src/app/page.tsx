/* eslint-disable @next/next/no-img-element */
"use client";

import { useState } from "react";
import { Ingredient, parseRecipe } from "./ingredient-parser";
import { recipeMultiplier } from "./converter";
import { searchWegmans, type GroceryItem } from "@/lib/wegmans";

const GrocerySearch: React.FC = () => {
    const [queries, setQueries] = useState<string>(DEFAULT_QUERY);
    const [items, setItems] = useState<{ [key: string]: GroceryItem[] }>({});
    const [selectedItems, setSelectedItems] = useState<
        {
            item: GroceryItem;
            ingredient: Ingredient;
        }[]
    >([]);
    const [skippedQueries, setSkippedQueries] = useState<Set<string>>(
        new Set()
    );
    const [ingredients, setIngredients] = useState<Ingredient[]>([]);

    const searchGroceries = async () => {
        setItems({});
        const queryList = parseRecipe(queries);
        setIngredients(queryList);

        const results: { [key: string]: GroceryItem[] } = {};

        await Promise.all(
            queryList.map(async (parsedIngredient) => {
                const ingredient = parsedIngredient.ingredient;
                const data = await searchWegmans({ query: ingredient });
                results[ingredient] = data.slice(0, 4);
                setItems((prevItems) => ({
                    ...prevItems,
                    [ingredient]: results[ingredient],
                }));
            })
        );
    };

    const chooseItem = (item: GroceryItem, ingredient: Ingredient) => {
        setSelectedItems((prev) => [...prev, { item, ingredient }]);
    };

    const unchooseItem = (item: GroceryItem) => {
        setSelectedItems((prev) =>
            prev.filter((i) => i.item.href !== item.href)
        );
    };

    const skipQuery = (query: string) => {
        setSkippedQueries((prev) => new Set([...prev, query]));
    };

    const isItemSelected = (item: GroceryItem) => {
        return selectedItems
            .map((i) => i.item)
            .some((selected) => selected.href === item.href);
    };

    const totalPrice = selectedItems
        .map((i) => i.item)
        .reduce((sum, item) => sum + item.price, 0);

    const calculateIngredientMultiplier = (
        item: GroceryItem,
        ingredient: Ingredient
    ) => {
        const conversion = recipeMultiplier(item.size, ingredient.amount);

        if (!conversion || conversion.error) {
            return null;
        }

        return conversion.conversion;
    };

    return (
        <div>
            <div className="flex gap-8">
                <h3 className="text-lg font-semibold">
                    Bulk search Astor Pl Wegmans for ingredients
                </h3>
            </div>
            <div className="flex gap-8 flex-col md:flex-row">
                <div className="flex-grow flex flex-col gap-4">
                    {/* Input for multiple items */}
                    <textarea
                        value={queries}
                        onChange={(e) => setQueries(e.target.value)}
                        placeholder="Enter recipe items, one per line"
                        className="border p-2 w-full"
                        rows={30}
                    />
                    <button
                        onClick={searchGroceries}
                        className="bg-blue-500 text-white px-4 py-2 rounded"
                    >
                        Search
                    </button>

                    {/* Display search results */}
                    {ingredients.map((ingredient) => (
                        <div
                            key={
                                ingredient.ingredient + "-" + ingredient.amount
                            }
                        >
                            <div className="flex justify-between items-center mt-4">
                                <div>
                                    <h2 className="font-bold">
                                        {ingredient.ingredient}
                                    </h2>
                                    <h2 className="text-gray-600">
                                        {ingredient.amount}
                                    </h2>
                                </div>
                                {!skippedQueries.has(ingredient.ingredient) && (
                                    <button
                                        onClick={() =>
                                            skipQuery(ingredient.ingredient)
                                        }
                                        className="bg-red-500 text-white rounded px-2 py-1"
                                    >
                                        Skip this ingredient
                                    </button>
                                )}
                            </div>
                            {!items[ingredient.ingredient] && (
                                <div>
                                    <p className="text-gray-700">Loading...</p>
                                </div>
                            )}
                            {!skippedQueries.has(ingredient.ingredient) &&
                                items[ingredient.ingredient] && (
                                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mt-2">
                                        {items[ingredient.ingredient].map(
                                            (item) => (
                                                <div
                                                    key={item.href}
                                                    className={`border p-4 rounded ${isItemSelected(item)
                                                        ? "border-green-500 border-2"
                                                        : ""
                                                        }`}
                                                >
                                                    <img
                                                        src={item.images[0] || ""}
                                                        alt={item.name}
                                                        className="w-32 h-32 object-cover"
                                                    />
                                                    <a
                                                        className="font-bold"
                                                        target="_blank"
                                                        href={item.href}
                                                    >
                                                        {item.name}
                                                    </a>
                                                    <p>{item.size}</p>
                                                    <p>
                                                        ${item.price.toFixed(2)}
                                                    </p>
                                                    <button
                                                        onClick={() => {
                                                            if (
                                                                isItemSelected(
                                                                    item
                                                                )
                                                            ) {
                                                                unchooseItem(
                                                                    item
                                                                );
                                                            } else {
                                                                chooseItem(
                                                                    item,
                                                                    ingredient
                                                                );
                                                            }
                                                        }}
                                                        className="bg-green-500 text-white rounded px-2 py-1 mt-2"
                                                        disabled={
                                                            isItemSelected(
                                                                item
                                                            ) &&
                                                            selectedItems.length ===
                                                            0
                                                        }
                                                    >
                                                        {isItemSelected(item)
                                                            ? "Unadd"
                                                            : "Choose"}
                                                    </button>
                                                </div>
                                            )
                                        )}
                                    </div>
                                )}
                        </div>
                    ))}
                </div>

                {/* Shopping Cart */}
                <div className="w-80 shrink-0">
                    <div className="sticky top-8 border rounded-lg p-4">
                        <h2 className="font-bold text-lg mb-4">
                            Shopping Cart
                        </h2>
                        <div className="space-y-4">
                            {selectedItems
                                .sort((a, b) =>
                                    a.item.planogram.aisle.localeCompare(b.item.planogram.aisle)
                                )
                                .map(({ item, ingredient }, index) => {
                                    const timesMore =
                                        calculateIngredientMultiplier(
                                            item,
                                            ingredient
                                        );
                                    return (
                                        <div
                                            key={index}
                                            className="flex items-center gap-4"
                                        >
                                            <img
                                                src={item.images[0] || ""}
                                                alt={item.name}
                                                className="w-12 h-12 object-cover rounded"
                                            />
                                            <div className="flex-grow">
                                                <p className="font-semibold text-sm">
                                                    {item.name}
                                                </p>
                                                <p className="text-sm">
                                                    {item.size}
                                                    {ingredient.amount && (
                                                        <span className="text-gray-500">
                                                            {" "}
                                                            Need{" "}
                                                            {ingredient.amount}
                                                        </span>
                                                    )}
                                                </p>
                                                <p className="text-sm text-gray-500">
                                                    {item.planogram.aisle}
                                                </p>
                                                <p className="text-sm text-gray-600">
                                                    ${item.price.toFixed(2)}
                                                </p>
                                                <p className="text-sm">
                                                    {timesMore
                                                        ? timesMore +
                                                        " times more"
                                                        : ""}
                                                </p>
                                            </div>
                                        </div>
                                    );
                                })}
                            <div className="border-t pt-4 mt-4">
                                <div className="flex justify-between items-center font-bold">
                                    <span>Total:</span>
                                    <span>${totalPrice.toFixed(2)}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default function Home() {
    return (
        <div className="min-h-screen p-8 pb-20 grid place-items-center">
            <main className="w-full max-w-6xl">
                <GrocerySearch />
            </main>
        </div>
    );
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
