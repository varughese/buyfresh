"use client"

import { Card, CardContent, CardHeader, CardTitle, CardAction } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Check, X } from "lucide-react"
import type { Ingredient } from "@/app/ingredient-parser"
import type { GroceryItem } from "@/lib/wegmans/types"

interface IngredientWithMatches {
  ingredient: Ingredient
  matches: GroceryItem[]
  selected?: GroceryItem
  skipped?: boolean
}

interface IngredientResultsProps {
  ingredients: IngredientWithMatches[]
  onSelectProduct: (ingredient: Ingredient, product: GroceryItem) => void
  onSkip: (ingredient: Ingredient) => void
}

export function IngredientResults({ ingredients, onSelectProduct, onSkip }: IngredientResultsProps) {
  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-semibold">Ingredient Matches</h2>
      {ingredients.map((item) => (
        <Card
          key={`${item.ingredient.ingredient}-${item.ingredient.amount}`}
          className={item.selected ? "border-primary bg-primary/5" : item.skipped ? "opacity-50" : ""}
        >
          <CardHeader>
            <CardTitle className="text-lg">
              <span>
                {item.ingredient.ingredient}
                {item.ingredient.amount && (
                  <span className="ml-2 text-sm font-normal text-muted-foreground">
                    {item.ingredient.amount}
                  </span>
                )}
              </span>
              {item.selected && (
                <Badge variant="default" className="gap-1 ml-2">
                  <Check className="h-3 w-3" />
                  Selected
                </Badge>
              )}
              {item.skipped && (
                <Badge variant="secondary" className="gap-1 ml-2">
                  <X className="h-3 w-3" />
                  Skipped
                </Badge>
              )}
            </CardTitle>
            {!item.selected && !item.skipped && (
              <CardAction>
                <Button variant="outline" size="sm" onClick={() => onSkip(item.ingredient)}>
                  Skip
                </Button>
              </CardAction>
            )}
          </CardHeader>
          <CardContent>
            {item.matches.length > 0 ? (
              <div className="space-y-3">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
                  {item.matches.map((product) => (
                    <div key={product.href} className="flex h-full flex-col rounded-lg border bg-card p-3">
                      <div className="flex flex-1 flex-col gap-2">
                        {product.images[0] && (
                          <img
                            src={product.images[0]}
                            alt={product.name}
                            className="h-32 w-full rounded object-cover"
                          />
                        )}
                        <div className="flex-1">
                          <a
                            href={product.href}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="font-medium text-sm hover:underline"
                          >
                            {product.name}
                          </a>
                          <p className="text-xs text-muted-foreground mt-1">{product.size}</p>
                          <p className="text-sm font-semibold mt-1">
                            ${product.price.toFixed(2)}
                          </p>
                          <p className="text-xs text-muted-foreground">{product.planogram.aisle}</p>
                        </div>
                        <Button
                          size="sm"
                          variant={item.selected?.href === product.href ? "default" : "outline"}
                          onClick={() => onSelectProduct(item.ingredient, product)}
                          className="mt-auto w-full"
                        >
                          {item.selected?.href === product.href ? "Remove" : "Select"}
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="text-center py-4">
                <p className="text-muted-foreground">No matches found</p>
              </div>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  )
}

