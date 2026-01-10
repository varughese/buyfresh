"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardAction } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Check, Search, ChevronLeft, ChevronRight } from "lucide-react"
import type { IngredientParseResult } from "@/app/ingredient-parser"
import { formatIngredientAmount } from "@/app/ingredient-parser"
import type { GroceryItem } from "@/lib/wegmans/types"
import { SearchModal } from "@/components/search-modal"

interface IngredientWithMatches {
    ingredient: IngredientParseResult
    matches: GroceryItem[]
    selected?: GroceryItem
    skipped?: boolean
    searchQuery: string
}

interface IngredientResultsProps {
    ingredients: IngredientWithMatches[]
    onSelectProduct: (ingredient: IngredientParseResult, product: GroceryItem) => void
    onSkip: (ingredient: IngredientParseResult) => void
    onUnskip: (ingredient: IngredientParseResult) => void
    onUpdateSearch: (ingredient: IngredientParseResult, query: string, results: GroceryItem[], selected?: GroceryItem) => void
}

const ITEMS_PER_PAGE = 4

export function IngredientResults({ ingredients, onSelectProduct, onSkip, onUnskip, onUpdateSearch }: IngredientResultsProps) {
    const [openModalIndex, setOpenModalIndex] = useState<number | null>(null)
    const [currentPages, setCurrentPages] = useState<Record<number, number>>({})

    const handleOpenModal = (index: number) => {
        setOpenModalIndex(index)
    }

    const handleCloseModal = () => {
        setOpenModalIndex(null)
    }

    const handleSaveSearch = (index: number, query: string, results: GroceryItem[], selected?: GroceryItem) => {
        const item = ingredients[index]
        onUpdateSearch(item.ingredient, query, results, selected)
        setOpenModalIndex(null)
        // Reset to first page when results are updated
        setCurrentPages((prev) => ({ ...prev, [index]: 0 }))
    }

    const getCurrentPage = (index: number) => currentPages[index] || 0
    const setCurrentPage = (index: number, page: number) => {
        setCurrentPages((prev) => ({ ...prev, [index]: page }))
    }

    const getPaginatedResults = (matches: GroceryItem[], page: number) => {
        const start = page * ITEMS_PER_PAGE
        return matches.slice(start, start + ITEMS_PER_PAGE)
    }

    const getTotalPages = (matches: GroceryItem[]) => {
        return Math.ceil(matches.length / ITEMS_PER_PAGE)
    }

    return (
        <div className="space-y-4">
            {ingredients.map((item, index) => (
                <Card
                    key={`${item.ingredient.ingredient}-${formatIngredientAmount(item.ingredient) || ""}-${index}`}
                    className={item.selected ? "border-primary bg-primary/5" : item.skipped ? "opacity-50 grayscale" : ""}
                >
                    <CardHeader>
                        <CardTitle className="text-lg">
                            <span>
                                {formatIngredientAmount(item.ingredient) && (
                                    <span className="font-normal border border-gray-300 rounded-md px-1 py-0.5 mr-2">
                                        {formatIngredientAmount(item.ingredient)}
                                    </span>
                                )}
                                {item.ingredient.ingredient} {item.ingredient.extra && (
                                    <span className="ml-2 text-sm font-normal text-muted-foreground">
                                        {item.ingredient.extra}
                                    </span>
                                )}
                            </span>
                            {item.selected && (
                                <Badge variant="default" className="gap-1 ml-2">
                                    <Check className="h-3 w-3" />
                                    Selected
                                </Badge>
                            )}
                        </CardTitle>
                        <CardAction>
                            <div className="flex gap-2">
                                {!item.skipped && (
                                    <>
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => handleOpenModal(index)}
                                        >
                                            <Search className="h-3 w-3 mr-1" />
                                            Search More
                                        </Button>
                                        {!item.selected && (
                                            <Button variant="outline" size="sm" onClick={() => onSkip(item.ingredient)}>
                                                Skip
                                            </Button>
                                        )}
                                    </>
                                )}
                                {item.skipped && (
                                    <Button variant="outline" size="sm" onClick={() => onUnskip(item.ingredient)}>
                                        Unskip
                                    </Button>
                                )}
                            </div>
                        </CardAction>
                    </CardHeader>
                    {!item.skipped && (
                        <CardContent>
                            {item.matches.length > 0 ? (
                                <div className="space-y-3">
                                    {(() => {
                                        const currentPage = getCurrentPage(index)
                                        const totalPages = getTotalPages(item.matches)
                                        const paginatedResults = getPaginatedResults(item.matches, currentPage)

                                        return (
                                            <>
                                                <div className="flex gap-3 overflow-x-auto pb-2">
                                                    {paginatedResults.map((product) => {
                                                        const isSelected = item.selected?.href === product.href
                                                        return (
                                                            <div
                                                                key={product.href}
                                                                className={`relative flex flex-col items-center rounded-lg border bg-card overflow-hidden cursor-pointer hover:shadow-md transition-shadow flex-shrink-0 w-36 ${isSelected ? "border-green-500 border-2" : ""}`}
                                                                onClick={() => {
                                                                    onSelectProduct(item.ingredient, product)
                                                                }}
                                                            >
                                                                <div className="relative w-full mt-3 aspect-square bg-muted max-w-24 overflow-hidden flex items-center justify-center">
                                                                    {product.images[0] && (
                                                                        <div>
                                                                            <img
                                                                                src={product.images[0]}
                                                                                alt={product.name}
                                                                                className="w-full h-full"
                                                                            />
                                                                        </div>
                                                                    )}
                                                                </div>
                                                                <div className="p-3 space-y-1">
                                                                    <p className="text-lg font-semibold">
                                                                        ${product.price.toFixed(2)}
                                                                    </p>
                                                                    <a
                                                                        href={product.href}
                                                                        target="_blank"
                                                                        rel="noopener noreferrer"
                                                                        onClick={(e) => e.stopPropagation()}
                                                                        className="font-medium text-sm hover:underline block line-clamp-2"
                                                                    >
                                                                        {product.name}
                                                                    </a>
                                                                    <p className="text-xs text-muted-foreground">{product.size}</p>
                                                                </div>
                                                            </div>
                                                        )
                                                    })}
                                                </div>

                                                {totalPages > 1 && (
                                                    <div className="flex items-center justify-center gap-2 pt-2">
                                                        <Button
                                                            variant="outline"
                                                            size="sm"
                                                            onClick={() => setCurrentPage(index, Math.max(0, currentPage - 1))}
                                                            disabled={currentPage === 0}
                                                        >
                                                            <ChevronLeft className="h-4 w-4" />
                                                            Previous
                                                        </Button>
                                                        <span className="text-sm text-muted-foreground">
                                                            Page {currentPage + 1} of {totalPages}
                                                        </span>
                                                        <Button
                                                            variant="outline"
                                                            size="sm"
                                                            onClick={() => setCurrentPage(index, Math.min(totalPages - 1, currentPage + 1))}
                                                            disabled={currentPage >= totalPages - 1}
                                                        >
                                                            Next
                                                            <ChevronRight className="h-4 w-4" />
                                                        </Button>
                                                    </div>
                                                )}
                                            </>
                                        )
                                    })()}
                                </div>
                            ) : (
                                <div className="text-center py-4">
                                    <p className="text-muted-foreground">No matches found</p>
                                </div>
                            )}
                        </CardContent>
                    )}
                </Card>
            ))}

            {openModalIndex !== null && (
                <SearchModal
                    open={openModalIndex !== null}
                    onOpenChange={(open) => !open && handleCloseModal()}
                    initialQuery={ingredients[openModalIndex].searchQuery}
                    initialResults={ingredients[openModalIndex].matches}
                    initialSelected={ingredients[openModalIndex].selected}
                    onSave={(query, results, selected) => handleSaveSearch(openModalIndex, query, results, selected)}
                    ingredientName={ingredients[openModalIndex].ingredient.ingredient}
                />
            )}
        </div>
    )
}

