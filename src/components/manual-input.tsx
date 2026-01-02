"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { List } from "lucide-react"

interface ManualInputProps {
  onSubmit: (items: string) => void
  isLoading: boolean
  defaultValue?: string
}

export function ManualInput({ onSubmit, isLoading, defaultValue = "" }: ManualInputProps) {
  const [text, setText] = useState(defaultValue)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (text.trim()) {
      onSubmit(text)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <List className="h-5 w-5" />
          Manual Entry
        </CardTitle>
        <CardDescription>Enter ingredients one per line</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <Textarea
            placeholder="Chicken thigh, boneless skinless(2 lb, cut into 1/4&quot; pieces)&#10;Broccoli(2 heads, cut into small florets)&#10;Garlic(1 Tbsp, minced)"
            value={text}
            onChange={(e) => setText(e.target.value)}
            disabled={isLoading}
            rows={12}
            className="resize-none"
          />
          <Button type="submit" disabled={isLoading || !text.trim()} className="w-full">
            {isLoading ? "Searching..." : "Search Store"}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}

