/* eslint-disable @next/next/no-img-element */
"use client";

import { useState } from "react";

interface GroceryItem {
    aisle: string;
    href: string;
    store: "wegmans";
    image: string;
    name: string;
    price: number;
    size: string;
}

const GrocerySearch: React.FC = () => {
    const [queries, setQueries] = useState<string>(DEFAULT_QUERY);
    const [items, setItems] = useState<{ [key: string]: GroceryItem[] }>({});
    const [selectedItems, setSelectedItems] = useState<GroceryItem[]>([]);
    const [skippedQueries, setSkippedQueries] = useState<Set<string>>(
        new Set()
    );

    const searchGroceries = async () => {
        setItems({});
        const queryList = queries
            .split("\n")
            .map((q) => q.trim())
            .filter(Boolean);
        const results: { [key: string]: GroceryItem[] } = {};

        await Promise.all(
            queryList.map(async (query) => {
                const response = await fetch(
                    `https://buyfresh-backend.matvarughese3.workers.dev/search?q=${query}`
                );
                const data: GroceryItem[] = await response.json();
                results[query] = data.slice(0, 4);
                setItems((prevItems) => ({
                    ...prevItems,
                    [query]: results[query],
                }));
            })
        );
    };

    const chooseItem = (item: GroceryItem) => {
        setSelectedItems((prev) => [...prev, item]);
    };

    const skipQuery = (query: string) => {
        setSkippedQueries((prev) => new Set([...prev, query]));
    };

    const isItemSelected = (item: GroceryItem) => {
        return selectedItems.some((selected) => selected.href === item.href);
    };

    const totalPrice = selectedItems.reduce((sum, item) => sum + item.price, 0);

    return (
        <div>
            <div className="flex gap-8">
                <h3 className="text-lg font-semibold">
                    Bulk search Astor Pl Wegmans for ingredients
                </h3>
            </div>
            <div className="flex gap-8">
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
                    {Object.entries(items)
                        .sort((a, b) => {
                            const queryList = queries
                                .split("\n")
                                .map((q) => q.trim())
                                .filter(Boolean);

                            return (
                                queryList.indexOf(a[0]) -
                                queryList.indexOf(b[0])
                            );
                        })
                        .map(([query, results]) => (
                            <div key={query}>
                                <div className="flex justify-between items-center mt-4">
                                    <h2 className="font-bold">{query}</h2>
                                    {!skippedQueries.has(query) && (
                                        <button
                                            onClick={() => skipQuery(query)}
                                            className="bg-red-500 text-white rounded px-2 py-1"
                                        >
                                            Skip this ingredient
                                        </button>
                                    )}
                                </div>
                                {!skippedQueries.has(query) && (
                                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-2">
                                        {results.map((item) => (
                                            <div
                                                key={item.href}
                                                className={`border p-4 rounded ${
                                                    isItemSelected(item)
                                                        ? "border-green-500 border-2"
                                                        : ""
                                                }`}
                                            >
                                                <img
                                                    src={item.image}
                                                    alt={item.name}
                                                    className="w-32 h-32 object-cover"
                                                />
                                                <a
                                                    className="font-bold"
                                                    href={item.href}
                                                >
                                                    {item.name}
                                                </a>
                                                <p>{item.size}</p>
                                                <p>${item.price.toFixed(2)}</p>
                                                <button
                                                    onClick={() =>
                                                        chooseItem(item)
                                                    }
                                                    className="bg-green-500 text-white rounded px-2 py-1 mt-2"
                                                    disabled={isItemSelected(
                                                        item
                                                    )}
                                                >
                                                    {isItemSelected(item)
                                                        ? "Added"
                                                        : "Choose"}
                                                </button>
                                            </div>
                                        ))}
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
                                .sort((a, b) => a.aisle.localeCompare(b.aisle))
                                .map((item, index) => (
                                    <div
                                        key={index}
                                        className="flex items-center gap-4"
                                    >
                                        <img
                                            src={item.image}
                                            alt={item.name}
                                            className="w-12 h-12 object-cover rounded"
                                        />
                                        <div className="flex-grow">
                                            <p className="font-semibold text-sm">
                                                {item.name}
                                            </p>
                                            <p className="text-sm text-gray-600">
                                                {item.aisle}
                                            </p>
                                            <p className="text-sm text-gray-600">
                                                ${item.price.toFixed(2)}
                                            </p>
                                        </div>
                                    </div>
                                ))}
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
