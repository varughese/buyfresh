"use client"

import { useState } from "react"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { ShoppingCart, Share2 } from "lucide-react"
import type { IngredientParseResult } from "@/app/ingredient-parser"
import { formatIngredientAmount } from "@/app/ingredient-parser"
import type { GroceryItem } from "@/lib/wegmans/types"
import { recipeMultiplier } from "@/app/converter"
import { encodeShoppingList } from "@/lib/shopping-list-encoder"

interface ShoppingListItem {
  item: GroceryItem
  ingredient: IngredientParseResult
}

interface ShoppingListProps {
  items: ShoppingListItem[]
  onClear: () => void
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

export function ShoppingList({ items, onClear }: ShoppingListProps) {
  const [shareMessage, setShareMessage] = useState<string>("")
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
      const encoded = encodeShoppingList(items)
      const baseUrl = typeof window !== "undefined" ? window.location.origin : ""
      const shareUrl = `${baseUrl}/list/${encoded}`

      await navigator.clipboard.writeText(shareUrl)
      setShareMessage("Link copied to clipboard!")
      setTimeout(() => setShareMessage(""), 3000)
    } catch (error) {
      console.error("Failed to share:", error)
      setShareMessage("Failed to copy link")
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
              return (
                <div key={index} className="flex items-center gap-3">
                  {item.images[0] && (
                    <img
                      src={item.images[0]}
                      alt={item.name}
                      className="h-12 w-12 rounded object-cover"
                    />
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium leading-none truncate">{item.name}</p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {item.size}
                      {formatIngredientAmount(ingredient) && (
                        <span className="ml-1">Need {formatIngredientAmount(ingredient)}</span>
                      )}
                    </p>
                    <p className="text-xs text-muted-foreground">{formatPlanogram(item.planogram)}</p>
                    <p className="text-sm font-semibold mt-1">${item.price.toFixed(2)}</p>
                    {timesMore && (
                      <p className="text-xs text-muted-foreground">{timesMore}</p>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </CardContent>
      {items.length > 0 && (
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
            {shareMessage || "Share List"}
          </Button>
          {shareMessage && (
            <p className="text-xs text-center text-muted-foreground">{shareMessage}</p>
          )}
        </CardFooter>
      )}
    </Card>
  )
}