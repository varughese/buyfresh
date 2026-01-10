"use client"

import { useState, useEffect, useRef } from "react"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { Checkbox } from "@/components/ui/checkbox"
import { ShoppingCart, Share2 } from "lucide-react"
import type { IngredientParseResult } from "@/app/ingredient-parser"
import { formatIngredientAmount } from "@/app/ingredient-parser"
import type { GroceryItem } from "@/lib/wegmans/types"
import { recipeMultiplier } from "@/app/converter"
import type { ShoppingListItem as ShoppingListItemType } from "@/lib/shopping-list-types"

interface ShoppingListItem {
  item: GroceryItem
  ingredient: IngredientParseResult
}

interface ShoppingListProps {
  items: ShoppingListItem[]
  onClear: () => void
  enableCheckboxes?: boolean
  listId?: string
}

const formatPlanogram = (planogram: GroceryItem["planogram"]): string => {
  const parts: string[] = []

  if (planogram.aisle && planogram.aisle !== "Unknown") {
    parts.push(`Aisle ${planogram.aisle}`)
  }
  if (planogram.aisleSide && planogram.aisleSide !== "Unknown") {
    parts.push(planogram.aisleSide)
  }
  if (planogram.section && planogram.section !== "Unknown") {
    parts.push(`Section ${planogram.section}`)
  }
  if (planogram.shelf && planogram.shelf !== "Unknown") {
    parts.push(`Shelf ${planogram.shelf}`)
  }

  return parts.length > 0 ? parts.join(" • ") : "Location unknown"
}

const getItemKey = (item: ShoppingListItem): string => {
  return item.item.objectID || item.item.href
}

export function ShoppingList({ items, onClear, enableCheckboxes = false, listId }: ShoppingListProps) {
  const [shareMessage, setShareMessage] = useState<string>("")

  const storageKey = listId ? `shopping-list-${listId}-checked` : null

  const [checkedItems, setCheckedItems] = useState<Set<string>>(new Set())
  const isInitialLoad = useRef(true)
  const hasLoadedFromStorage = useRef(false)
  const previousItemKeysRef = useRef<string>("")

  // Load checked state from localStorage when listId changes
  useEffect(() => {
    if (!enableCheckboxes || !storageKey) return

    isInitialLoad.current = true
    try {
      const stored = localStorage.getItem(storageKey)
      if (stored) {
        const checkedSet = new Set<string>(JSON.parse(stored))
        setCheckedItems(checkedSet)
        hasLoadedFromStorage.current = true
      } else {
        hasLoadedFromStorage.current = true
      }
    } catch (error) {
      console.error("Failed to load checked state from localStorage:", error)
      hasLoadedFromStorage.current = true
    }
    // Mark initial load as complete after state has been set
    // Use a small delay to ensure state update completes
    const timer = setTimeout(() => {
      isInitialLoad.current = false
    }, 100)
    return () => clearTimeout(timer)
  }, [storageKey, enableCheckboxes])

  // Save checked state to localStorage when it changes (but not during initial load)
  useEffect(() => {
    if (!enableCheckboxes || !storageKey || isInitialLoad.current) return

    try {
      localStorage.setItem(storageKey, JSON.stringify(Array.from(checkedItems)))
    } catch (error) {
      console.error("Failed to save checked state to localStorage:", error)
    }
  }, [checkedItems, enableCheckboxes, storageKey])

  // Clean up checked items that no longer exist in the items list
  // Only run after initial load is complete and items are stable
  useEffect(() => {
    if (!enableCheckboxes || items.length === 0 || !hasLoadedFromStorage.current) return

    // Wait for initial load to complete before cleaning up
    if (isInitialLoad.current) {
      // Set the previous keys so we don't clean up on first run after items load
      previousItemKeysRef.current = items.map((item) => getItemKey(item)).sort().join(',')
      return
    }

    // Only clean up if items have actually changed (track by serializing item keys)
    const currentItemKeys = items.map((item) => getItemKey(item)).sort().join(',')

    if (currentItemKeys === previousItemKeysRef.current) return
    previousItemKeysRef.current = currentItemKeys

    const currentItemKeysSet = new Set(items.map((item) => getItemKey(item)))
    setCheckedItems((prev) => {
      // Only filter out items that don't exist, don't clear everything
      const cleaned = new Set<string>()
      prev.forEach((key) => {
        if (currentItemKeysSet.has(key)) {
          cleaned.add(key)
        }
      })
      // Only update if something was actually removed
      if (cleaned.size !== prev.size) {
        return cleaned
      }
      return prev
    })
  }, [items, enableCheckboxes])

  const handleToggleChecked = (item: ShoppingListItem) => {
    const key = getItemKey(item)
    setCheckedItems((prev) => {
      const next = new Set(prev)
      if (next.has(key)) {
        next.delete(key)
      } else {
        next.add(key)
      }
      return next
    })
  }

  const total = items.reduce((sum, item) => sum + item.item.price, 0)

  const sortedItems = [...items].sort((a, b) => {
    const planogramA = a.item.planogram
    const planogramB = b.item.planogram

    // Sort by aisle first
    const aisleCompare = planogramA.aisle?.localeCompare(planogramB.aisle ?? "") ?? 0
    if (aisleCompare !== 0) return aisleCompare

    // Then by aisle side
    const sideCompare = planogramA.aisleSide?.localeCompare(planogramB.aisleSide ?? "") ?? 0
    if (sideCompare !== 0) return sideCompare

    // Then by section
    const sectionCompare = planogramA.section?.localeCompare(planogramB.section ?? "") ?? 0
    if (sectionCompare !== 0) return sectionCompare

    // Finally by shelf
    return planogramA.shelf?.localeCompare(planogramB.shelf ?? "") ?? 0
  })

  const calculateIngredientMultiplier = (item: GroceryItem, ingredient: IngredientParseResult) => {
    const amount = formatIngredientAmount(ingredient)
    const conversion = recipeMultiplier(item.size, amount)

    if (!conversion || conversion.error) {
      return null
    }

    return conversion.conversion
  }

  const handleShare = async () => {
    try {
      setShareMessage("Creating shareable link...")

      // Convert items to database format
      const listItems: ShoppingListItemType[] = items.map((item) => {
        const slugMatch = item.item.href.match(/\/product\/([^\/]+)/)
        const slug = slugMatch ? slugMatch[1] : ""
        const amount = formatIngredientAmount(item.ingredient)

        return {
          slug, // Keep for backward compatibility
          objectID: item.item.objectID, // Store objectID for reliable lookups
          ingredient: item.ingredient.ingredient,
          amount: amount || undefined,
        }
      })

      // Save to database via API
      const response = await fetch("/api/lists", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ items: listItems }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || "Failed to create shopping list")
      }

      const data = await response.json()
      const baseUrl = typeof window !== "undefined" ? window.location.origin : ""
      const shareUrl = `${baseUrl}/list/${data.id}`

      await navigator.clipboard.writeText(shareUrl)
      setShareMessage("Link copied to clipboard!")
      setTimeout(() => setShareMessage(""), 3000)
    } catch (error) {
      console.error("Failed to share:", error)
      setShareMessage(error instanceof Error ? error.message : "Failed to share")
      setTimeout(() => setShareMessage(""), 3000)
    }
  }

  return (
    <Card className="sticky top-8">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <ShoppingCart className="h-5 w-5" />
          Shopping List
        </CardTitle>
      </CardHeader>
      <CardContent>
        {items.length === 0 ? (
          <div className="py-8 text-center text-muted-foreground">No items selected yet</div>
        ) : (
          <div className="space-y-3">
            {sortedItems.map(({ item, ingredient }, index) => {
              const timesMore = calculateIngredientMultiplier(item, ingredient)
              const itemKey = getItemKey({ item, ingredient })
              const isChecked = checkedItems.has(itemKey)

              return (
                <div
                  key={index}
                  className={`flex items-center gap-3 ${isChecked ? "opacity-60" : ""}`}
                >
                  {enableCheckboxes && (
                    <Checkbox
                      checked={isChecked}
                      onCheckedChange={() => handleToggleChecked({ item, ingredient })}
                      className="shrink-0"
                    />
                  )}
                  {item.images[0] && (
                    <img
                      src={item.images[0]}
                      alt={item.name}
                      className="h-12 w-12 rounded object-cover shrink-0"
                    />
                  )}
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm font-medium leading-none truncate ${isChecked ? "line-through" : ""}`}>
                      {item.name}
                    </p>
                    <p className={`mt-1 text-xs text-muted-foreground ${isChecked ? "line-through" : ""}`}>
                      {item.size}
                      {formatIngredientAmount(ingredient) && (
                        <span className="ml-1">Need {formatIngredientAmount(ingredient)}</span>
                      )}
                    </p>
                    <p className={`text-xs text-muted-foreground ${isChecked ? "line-through" : ""}`}>
                      {formatPlanogram(item.planogram)}
                    </p>
                    <p className={`text-sm font-semibold mt-1 ${isChecked ? "line-through" : ""}`}>
                      ${item.price.toFixed(2)}
                    </p>
                    {timesMore && (
                      <p className={`text-xs text-muted-foreground ${isChecked ? "line-through" : ""}`}>
                        {timesMore}
                      </p>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </CardContent>
      {items.length > 0 && !enableCheckboxes && (
        <CardFooter className="flex-col gap-3">
          <Separator />
          <div className="flex w-full items-center justify-between">
            <span className="text-lg font-semibold">Total</span>
            <span className="text-lg font-semibold">${total.toFixed(2)}</span>
          </div>
          <Button
            onClick={handleShare}
            variant="outline"
            className="w-full"
            disabled={items.length === 0}
          >
            <Share2 className="h-4 w-4 mr-2" />
            {shareMessage || "Save list"}
          </Button>
        </CardFooter>
      )}
    </Card>
  )
}