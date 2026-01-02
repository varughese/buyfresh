"use client"

import { useState, useEffect } from "react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Search, Loader2 } from "lucide-react"
import type { GroceryItem } from "@/lib/wegmans/types"
import { searchWegmans } from "@/lib/wegmans"

interface SearchModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  initialQuery: string
  initialResults: GroceryItem[]
  initialSelected?: GroceryItem
  onSave: (query: string, results: GroceryItem[], selected?: GroceryItem) => void
  ingredientName: string
}

export function SearchModal({
  open,
  onOpenChange,
  initialQuery,
  initialResults,
  initialSelected,
  onSave,
  ingredientName,
}: SearchModalProps) {
  const [searchQuery, setSearchQuery] = useState(initialQuery)
  const [results, setResults] = useState<GroceryItem[]>(initialResults)
  const [selectedItem, setSelectedItem] = useState<GroceryItem | undefined>(initialSelected)
  const [isSearching, setIsSearching] = useState(false)

  // Reset state when modal opens/closes
  useEffect(() => {
    if (open) {
      setSearchQuery(initialQuery)
      setResults(initialResults)
      setSelectedItem(initialSelected)
    }
  }, [open, initialQuery, initialResults, initialSelected])

  const handleSearch = async () => {
    if (!searchQuery.trim()) return

    setIsSearching(true)
    try {
      const data = await searchWegmans({ query: searchQuery })
      setResults(data)
    } catch (error) {
      console.error("Error searching:", error)
      setResults([])
    } finally {
      setIsSearching(false)
    }
  }

  const handleSelectItem = (product: GroceryItem) => {
    if (selectedItem?.href === product.href) {
      setSelectedItem(undefined)
    } else {
      setSelectedItem(product)
    }
  }

  const handleSave = () => {
    onSave(searchQuery, results, selectedItem)
    onOpenChange(false)
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      handleSearch()
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Search for {ingredientName}</DialogTitle>
          <DialogDescription>
            Edit the search query and browse more results
          </DialogDescription>
        </DialogHeader>

        <div className="flex gap-2">
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Search query..."
            className="flex-1"
            disabled={isSearching}
          />
          <Button
            onClick={handleSearch}
            disabled={isSearching || !searchQuery.trim()}
          >
            {isSearching ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                Searching...
              </>
            ) : (
              <>
                <Search className="h-4 w-4 mr-2" />
                Search
              </>
            )}
          </Button>
        </div>

        <div className="flex-1 overflow-y-auto mt-4">
          {results.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {results.map((product) => (
                <div
                  key={product.href}
                  className={`flex h-full flex-col rounded-lg border bg-card p-3 ${
                    selectedItem?.href === product.href ? "ring-2 ring-primary" : ""
                  }`}
                >
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
                      <p className="text-xs text-muted-foreground mt-1">
                        {product.size}
                      </p>
                      <p className="text-sm font-semibold mt-1">
                        ${product.price.toFixed(2)}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {product.planogram.aisle}
                      </p>
                    </div>
                    <Button
                      size="sm"
                      variant={selectedItem?.href === product.href ? "default" : "outline"}
                      onClick={() => handleSelectItem(product)}
                      className="mt-auto w-full"
                    >
                      {selectedItem?.href === product.href ? "Selected" : "Select"}
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <p className="text-muted-foreground">
                {isSearching
                  ? "Searching..."
                  : "No results found. Try a different search query."}
              </p>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={isSearching}>
            Save
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

