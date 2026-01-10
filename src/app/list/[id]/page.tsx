"use client"

import { useEffect, useState } from "react"
import { useParams } from "next/navigation"
import { ShoppingList } from "@/components/shopping-list"
import type { ShoppingListItem as ShoppingListItemType } from "@/lib/shopping-list-types"
import { fetchProductsBySlugs } from "@/lib/wegmans/search"
import type { GroceryItem } from "@/lib/wegmans/types"
import type { IngredientParseResult } from "@/app/ingredient-parser"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { AlertCircle, AlertTriangle } from "lucide-react"

interface ShoppingListItem {
    item: GroceryItem
    ingredient: IngredientParseResult
}

/**
 * Convert shopping list item from database back to IngredientParseResult
 */
function createIngredientFromItem(item: ShoppingListItemType): IngredientParseResult {
    return {
        quantity: 0,
        quantityText: item.amount || "",
        minQuantity: 0,
        maxQuantity: 0,
        unit: "",
        unitText: "",
        ingredient: item.ingredient,
        extra: "",
        alternativeQuantities: [],
    }
}

export default function SharedListPage() {
    const params = useParams()
    const id = params.id as string
    const [items, setItems] = useState<ShoppingListItem[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [missingProducts, setMissingProducts] = useState<string[]>([])

    useEffect(() => {
        async function loadList() {
            try {
                setIsLoading(true)
                setError(null)

                // Fetch shopping list from API
                const response = await fetch(`/api/lists/${id}`)

                if (!response.ok) {
                    if (response.status === 404) {
                        setError("Shopping list not found")
                    } else {
                        const errorData = await response.json()
                        throw new Error(errorData.error || "Failed to load shopping list")
                    }
                    setIsLoading(false)
                    return
                }

                const data = await response.json()
                const listItems: ShoppingListItemType[] = data.items

                if (!listItems || listItems.length === 0) {
                    setError("Shopping list is empty")
                    setIsLoading(false)
                    return
                }

                // Extract slugs and objectIDs
                const slugs = listItems.map((item) => item.slug).filter(Boolean) as string[]
                const objectIDs = listItems.map((item) => item.objectID).filter((id): id is string => Boolean(id))

                if (slugs.length === 0 && objectIDs.length === 0) {
                    setError("No valid products found in shopping list")
                    setIsLoading(false)
                    return
                }

                // Fetch products by objectID (more reliable) or slugs (fallback)
                const products = await fetchProductsBySlugs({
                    slugs,
                    objectIDs: objectIDs.length > 0 ? objectIDs : undefined
                })

                // Match products with list items
                const matchedItems: ShoppingListItem[] = []
                const slugToProduct = new Map<string, GroceryItem>()
                products.forEach((product) => {
                    // Extract slug from product href
                    const slugMatch = product.href.match(/\/product\/([^\/]+)/)
                    if (slugMatch) {
                        slugToProduct.set(slugMatch[1], product)
                    }
                })

                const missing: string[] = []
                listItems.forEach((listItem) => {
                    const product = slugToProduct.get(listItem.slug)
                    if (product) {
                        matchedItems.push({
                            item: product,
                            ingredient: createIngredientFromItem(listItem),
                        })
                    } else {
                        missing.push(listItem.ingredient)
                    }
                })

                setItems(matchedItems)
                setMissingProducts(missing)
            } catch (err) {
                console.error("Failed to load shared list:", err)
                setError(err instanceof Error ? err.message : "Failed to load shopping list")
            } finally {
                setIsLoading(false)
            }
        }

        if (id) {
            loadList()
        }
    }, [id])

    if (isLoading) {
        return (
            <div className="min-h-screen bg-background flex items-center justify-center">
                <Card className="w-full max-w-md">
                    <CardHeader>
                        <CardTitle>Loading shopping list...</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-muted-foreground">Fetching product details...</p>
                    </CardContent>
                </Card>
            </div>
        )
    }

    if (error) {
        return (
            <div className="min-h-screen bg-background flex items-center justify-center">
                <Card className="w-full max-w-md">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-destructive">
                            <AlertCircle className="h-5 w-5" />
                            Error
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-muted-foreground">{error}</p>
                    </CardContent>
                </Card>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-background">
            <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
                <div className="mb-8">
                    <h1 className="text-4xl font-bold tracking-tight text-foreground">
                        Shared Shopping List
                    </h1>
                    <p className="mt-2 text-lg text-muted-foreground">
                        {items.length} {items.length === 1 ? "item" : "items"}
                    </p>
                </div>

                <div className="flex justify-center">
                    <div className="w-full max-w-md space-y-4">
                        {missingProducts.length > 0 && (
                            <Card className="border-yellow-500 bg-yellow-50 dark:bg-yellow-950">
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2 text-yellow-800 dark:text-yellow-200 text-sm">
                                        <AlertTriangle className="h-4 w-4" />
                                        Some products not found
                                    </CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <p className="text-sm text-yellow-700 dark:text-yellow-300">
                                        {missingProducts.length} {missingProducts.length === 1 ? "product" : "products"} could not be found: {missingProducts.join(", ")}
                                    </p>
                                </CardContent>
                            </Card>
                        )}
                        <ShoppingList items={items} onClear={() => { }} enableCheckboxes={true} listId={id} />
                    </div>
                </div>
            </div>
        </div>
    )
}
