/* eslint-disable @next/next/no-img-element */
"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { ChevronDown, ChevronUp, Clock, Users, ChefHat } from "lucide-react"
import { useState } from "react"
import type { Recipe } from "@/lib/recipe-url-scraper"

interface RecipeCardProps {
    recipe: Recipe
}

export function RecipeCard({ recipe }: RecipeCardProps) {
    const [isExpanded, setIsExpanded] = useState(false)

    return (
        <Card className="mt-4">
            <CardHeader>
                <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                        <CardTitle className="flex items-center gap-2">
                            <ChefHat className="h-5 w-5" />
                            {recipe.name || "Recipe"}
                        </CardTitle>
                        {recipe.description && (
                            <CardDescription className="mt-2 line-clamp-2">
                                {recipe.description}
                            </CardDescription>
                        )}
                    </div>
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setIsExpanded(!isExpanded)}
                        className="shrink-0"
                    >
                        {isExpanded ? (
                            <ChevronUp className="h-4 w-4" />
                        ) : (
                            <ChevronDown className="h-4 w-4" />
                        )}
                    </Button>
                </div>
            </CardHeader>
            {isExpanded && (
                <CardContent className="space-y-4">
                    {recipe.image && recipe.image.length > 0 && (
                        <div className="rounded-lg overflow-hidden">
                            <img
                                src={recipe.image[0]}
                                alt={recipe.name}
                                className="w-full h-48 object-cover"
                            />
                        </div>
                    )}

                    <div className="grid grid-cols-2 gap-4 text-sm">
                        {recipe.prepTime && (
                            <div className="flex items-center gap-2">
                                <Clock className="h-4 w-4 text-muted-foreground" />
                                <span className="text-muted-foreground">Prep:</span>
                                <span>{recipe.prepTime}</span>
                            </div>
                        )}
                        {recipe.cookTime && (
                            <div className="flex items-center gap-2">
                                <Clock className="h-4 w-4 text-muted-foreground" />
                                <span className="text-muted-foreground">Cook:</span>
                                <span>{recipe.cookTime}</span>
                            </div>
                        )}
                        {recipe.totalTime && (
                            <div className="flex items-center gap-2">
                                <Clock className="h-4 w-4 text-muted-foreground" />
                                <span className="text-muted-foreground">Total:</span>
                                <span>{recipe.totalTime}</span>
                            </div>
                        )}
                        {recipe.yield && (
                            <div className="flex items-center gap-2">
                                <Users className="h-4 w-4 text-muted-foreground" />
                                <span className="text-muted-foreground">Serves:</span>
                                <span>{recipe.yield}</span>
                            </div>
                        )}
                    </div>

                    {recipe.category && recipe.category.length > 0 && (
                        <div>
                            <p className="text-sm font-medium mb-2">Categories</p>
                            <div className="flex flex-wrap gap-2">
                                {recipe.category.map((cat, index) => (
                                    <span
                                        key={index}
                                        className="px-2 py-1 text-xs bg-muted rounded-md"
                                    >
                                        {cat}
                                    </span>
                                ))}
                            </div>
                        </div>
                    )}

                    {recipe.cuisine && recipe.cuisine.length > 0 && (
                        <div>
                            <p className="text-sm font-medium mb-2">Cuisine</p>
                            <div className="flex flex-wrap gap-2">
                                {recipe.cuisine.map((cuisine, index) => (
                                    <span
                                        key={index}
                                        className="px-2 py-1 text-xs bg-muted rounded-md"
                                    >
                                        {cuisine}
                                    </span>
                                ))}
                            </div>
                        </div>
                    )}

                    {recipe.ingredients && recipe.ingredients.length > 0 && (
                        <div>
                            <Separator className="my-4" />
                            <p className="text-sm font-medium mb-2">Ingredients</p>
                            <ul className="space-y-1 text-sm">
                                {recipe.ingredients.map((ingredient, index) => (
                                    <li key={index} className="text-muted-foreground">
                                        • {ingredient}
                                    </li>
                                ))}
                            </ul>
                        </div>
                    )}

                    {recipe.instructions && recipe.instructions.length > 0 && (
                        <div>
                            <Separator className="my-4" />
                            <p className="text-sm font-medium mb-2">Instructions</p>
                            <ol className="space-y-2 text-sm">
                                {recipe.instructions.map((instruction, index) => (
                                    <li key={index} className="text-muted-foreground">
                                        <span className="font-medium text-foreground">{index + 1}.</span>{" "}
                                        {instruction}
                                    </li>
                                ))}
                            </ol>
                        </div>
                    )}
                </CardContent>
            )}
        </Card>
    )
}

