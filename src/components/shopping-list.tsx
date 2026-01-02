"use client"

import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { ShoppingCart } from "lucide-react"
import type { Ingredient } from "@/app/ingredient-parser"
import type { GroceryItem } from "@/lib/wegmans/types"
import { recipeMultiplier } from "@/app/converter"

interface ShoppingListItem {
  item: GroceryItem
  ingredient: Ingredient
}

interface ShoppingListProps {
  items: ShoppingListItem[]
  onClear: () => void
}

export function ShoppingList({ items, onClear }: ShoppingListProps) {
  const total = items.reduce((sum, item) => sum + item.item.price, 0)

  const sortedItems = [...items].sort((a, b) =>
    a.item.planogram.aisle.localeCompare(b.item.planogram.aisle)
  )

  const calculateIngredientMultiplier = (item: GroceryItem, ingredient: Ingredient) => {
    const conversion = recipeMultiplier(item.size, ingredient.amount)

    if (!conversion || conversion.error) {
      return null
    }

    return conversion.conversion
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
                      {ingredient.amount && (
                        <span className="ml-1">Need {ingredient.amount}</span>
                      )}
                    </p>
                    <p className="text-xs text-muted-foreground">{item.planogram.aisle}</p>
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
          <Button variant="ghost" size="sm" onClick={onClear} className="w-full">
            Clear List
          </Button>
        </CardFooter>
      )}
    </Card>
  )
}

