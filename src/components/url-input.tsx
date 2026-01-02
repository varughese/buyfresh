"use client"

import type React from "react"

import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Link } from "lucide-react"

interface UrlInputProps {
    onSubmit: (url: string) => void
    isLoading: boolean
    hasSubmittedIngredients?: boolean
    progressMessage?: string
    progressValue?: number
    hasError?: boolean
}

export function UrlInput({ onSubmit, isLoading, hasSubmittedIngredients = false, progressMessage = "", progressValue = 0, hasError = false }: UrlInputProps) {
    const [url, setUrl] = useState("")
    const inputRef = useRef<HTMLInputElement>(null)

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault()
        if (url.trim()) {
            onSubmit(url.trim())
        }
    }

    const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
        e.preventDefault()
        const pastedText = e.clipboardData.getData("text")
        if (pastedText && pastedText.trim()) {
            setUrl(pastedText.trim())
        }
    }

    useEffect(() => {
        // Only listen to cmd+v if user hasn't already submitted ingredients
        if (hasSubmittedIngredients) {
            return
        }

        const handleKeyDown = (e: KeyboardEvent) => {
            // Handle Cmd+V (Mac) or Ctrl+V (Windows/Linux)
            if ((e.metaKey || e.ctrlKey) && e.key === "v") {
                // If input is not focused, focus it first
                if (document.activeElement !== inputRef.current) {
                    inputRef.current?.focus()
                }
            }
        }

        window.addEventListener("keydown", handleKeyDown)
        return () => {
            window.removeEventListener("keydown", handleKeyDown)
        }
    }, [hasSubmittedIngredients])

    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <Link className="h-5 w-5" />
                    Import from URL
                </CardTitle>
                <CardDescription>Paste a recipe URL to import ingredients</CardDescription>
            </CardHeader>
            <CardContent>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="space-y-2">
                        <Input
                            ref={inputRef}
                            type="url"
                            placeholder="https://example.com/recipe"
                            value={url}
                            onChange={(e) => setUrl(e.target.value)}
                            onPaste={handlePaste}
                            disabled={isLoading}
                            className="w-full"
                        />
                    </div>
                    <Button type="submit" disabled={isLoading || !url.trim()} className="w-full">
                        {isLoading ? "Importing..." : "Import Recipe"}
                    </Button>
                </form>
                {isLoading && progressMessage && (
                    <div className="mt-4 space-y-2">
                        <div className="flex items-center justify-between text-sm">
                            <span className="text-muted-foreground">{progressMessage}</span>
                            <span className="text-muted-foreground">{progressValue}%</span>
                        </div>
                        <Progress value={progressValue} className="h-2" />
                    </div>
                )}
                <p className="text-sm mt-4 text-center text-muted-foreground">
                    Use <kbd className="px-1.5 py-0.5 text-xs font-semibold text-foreground bg-muted border border-border rounded">⌘ V</kbd> to paste the URL
                </p>
                {hasError && (
                    <p className="text-sm mt-2 text-center text-destructive font-medium">
                        Error
                    </p>
                )}
            </CardContent>
        </Card>
    )
}

