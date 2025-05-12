"use client"

import type React from "react"

import { useState, useRef, useEffect } from "react"
import { Slider } from "@/components/ui/slider"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Info, AlertTriangle, CheckCircle } from "lucide-react"
import { useIngredients } from "@/lib/hooks/use-ingredients"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useTextSize } from "@/lib/context/text-size-context"
import { TextSizeControls } from "@/components/accessibility/text-size-controls"
import type { Recipe } from "@/lib/types"

interface RecipeCalculatorProps {
  recipe: Recipe
}

export default function RecipeCalculator({ recipe }: RecipeCalculatorProps) {
  // State for serving size - default to standard value
  const [servingSize, setServingSize] = useState(recipe.standard_serving_pax)
  const [inputValue, setInputValue] = useState(recipe.standard_serving_pax.toString())
  const sliderRef = useRef<HTMLDivElement>(null)
  const { textSize } = useTextSize()

  // Use the cached inventory ingredients from React Query
  const { data: inventoryIngredients = [] } = useIngredients()

  // Update input when slider changes
  useEffect(() => {
    setInputValue(servingSize.toString())
  }, [servingSize])

  // Handle manual input change
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    setInputValue(value)

    const numValue = Number.parseInt(value, 10)
    if (!isNaN(numValue) && numValue > 0 && numValue <= Math.max(50, recipe.standard_serving_pax * 3)) {
      setServingSize(numValue)
    }
  }

  // Handle input blur to validate and correct values
  const handleInputBlur = () => {
    const numValue = Number.parseInt(inputValue, 10)
    if (isNaN(numValue) || numValue <= 0) {
      setServingSize(1)
      setInputValue("1")
    } else if (numValue > Math.max(50, recipe.standard_serving_pax * 3)) {
      const maxValue = Math.max(50, recipe.standard_serving_pax * 3)
      setServingSize(maxValue)
      setInputValue(maxValue.toString())
    }
  }

  // Apply text size classes based on the current text size
  const getTextSizeClasses = () => {
    switch (textSize) {
      case "large":
        return {
          title: "text-3xl",
          heading: "text-2xl",
          subheading: "text-xl",
          body: "text-lg",
          detail: "text-base",
        }
      case "x-large":
        return {
          title: "text-4xl",
          heading: "text-3xl",
          subheading: "text-2xl",
          body: "text-xl",
          detail: "text-lg",
        }
      default:
        return {
          title: "text-2xl",
          heading: "text-xl",
          subheading: "text-lg",
          body: "text-base",
          detail: "text-sm",
        }
    }
  }

  const textClasses = getTextSizeClasses()

  // Parse quantity string to extract numeric value and unit
  function parseQuantity(quantityStr: string) {
    const match = quantityStr.match(/^([\d.]+)\s*([a-zA-Z]+)$/)
    if (match) {
      return {
        value: Number.parseFloat(match[1]),
        unit: match[2],
      }
    }
    return { value: 0, unit: "" }
  }

  // Calculate ingredients directly in render function
  const ratio = servingSize / recipe.standard_serving_pax

  // Calculate ingredients directly - no state updates
  const calculatedIngredients =
    recipe.ingredients?.map((ingredient) => {
      const { value: originalValue, unit } = parseQuantity(ingredient.quantity)
      const calculatedValue = originalValue * ratio

      // Find matching inventory ingredient
      const inventoryItem = inventoryIngredients?.find?.((item) => item.id === ingredient.ingredient_id)

      const inStock = inventoryItem ? inventoryItem.quantity : 0
      const isShortage = calculatedValue > inStock
      const shortageAmount = isShortage ? `${(calculatedValue - inStock).toFixed(2)} ${unit}` : ""
      const excessAmount = !isShortage ? `${(inStock - calculatedValue).toFixed(2)} ${unit}` : ""

      return {
        id: ingredient.id,
        name: ingredient.name,
        calculatedQuantity: calculatedValue.toFixed(2),
        unit,
        inStock: inStock.toFixed(2),
        isShortage,
        shortageAmount,
        excessAmount,
      }
    }) || []

  // Count ingredients with shortages and available
  const shortageCount = calculatedIngredients.filter((ing) => ing.isShortage).length
  const allIngredientsAvailable = shortageCount === 0

  // Calculate slider marks for standard pax
  const sliderMax = Math.max(50, recipe.standard_serving_pax * 3)
  const standardPaxPercentage = (recipe.standard_serving_pax / sliderMax) * 100

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center mb-4">
        <h2 id="calculator-title" className={`${textClasses.title} font-bold`}>
          Recipe Calculator
        </h2>
        <TextSizeControls />
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span className={textClasses.heading}>Serving Size Adjustment</span>
            <Badge variant={shortageCount > 0 ? "destructive" : "success"} className="ml-2">
              {shortageCount > 0
                ? `${shortageCount} shortage${shortageCount > 1 ? "s" : ""}`
                : `All ingredients available`}
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {/* Status alert at the top - only show one */}
          <div className="mb-6">
            {shortageCount > 0 ? (
              <Alert variant="destructive" role="alert">
                <AlertTriangle className="h-5 w-5" aria-hidden="true" />
                <AlertTitle className={textClasses.subheading}>Inventory Shortage</AlertTitle>
                <AlertDescription className={textClasses.body}>
                  You don't have enough of {shortageCount} ingredient{shortageCount > 1 ? "s" : ""} in your inventory.
                </AlertDescription>
              </Alert>
            ) : (
              <Alert variant="default" className="bg-green-50 border-green-200 text-green-800" role="status">
                <CheckCircle className="h-5 w-5 text-green-600" aria-hidden="true" />
                <AlertTitle className={textClasses.subheading}>All Ingredients Available</AlertTitle>
                <AlertDescription className={textClasses.body}>
                  You have enough of all ingredients in your inventory for this recipe.
                </AlertDescription>
              </Alert>
            )}
          </div>

          <div className="mb-8">
            <div className="flex flex-col space-y-4">
              <div className="flex justify-between mb-2">
                <Label htmlFor="serving-size-input" className={`${textClasses.subheading} font-medium`}>
                  Serving Size
                </Label>
                <span className={`${textClasses.subheading} font-bold`} aria-live="polite">
                  {servingSize} {servingSize === 1 ? "person" : "people"}
                </span>
              </div>

              <div className="flex items-center gap-4">
                <div className="flex-1">
                  <div className="relative" ref={sliderRef} aria-hidden="true">
                    <Slider
                      value={[servingSize]}
                      min={1}
                      max={sliderMax}
                      step={1}
                      onValueChange={(value) => {
                        setServingSize(value[0])
                      }}
                      className="my-4"
                      aria-labelledby="serving-size-label"
                    />

                    {/* Standard pax marker */}
                    <div
                      className="absolute top-1/2 w-1 h-6 bg-blue-600 -translate-y-1/2 pointer-events-none"
                      style={{ left: `${standardPaxPercentage}%` }}
                      aria-hidden="true"
                    />
                    <div
                      className={`absolute top-full mt-1 ${textClasses.detail} text-blue-600 font-medium -translate-x-1/2 pointer-events-none`}
                      style={{ left: `${standardPaxPercentage}%` }}
                      aria-hidden="true"
                    >
                      Standard ({recipe.standard_serving_pax})
                    </div>
                  </div>

                  <div className={`flex justify-between ${textClasses.detail} text-gray-500 mt-6`}>
                    <span>1 person</span>
                    <span>{sliderMax} people</span>
                  </div>
                </div>

                <div className="w-24">
                  <Label htmlFor="serving-size-input" className="sr-only">
                    Enter serving size
                  </Label>
                  <Input
                    id="serving-size-input"
                    type="number"
                    min="1"
                    max={sliderMax}
                    value={inputValue}
                    onChange={handleInputChange}
                    onBlur={handleInputBlur}
                    className={`text-right ${textClasses.body}`}
                    aria-labelledby="serving-size-label"
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="mt-8" role="region" aria-labelledby="calculated-ingredients-heading">
            <h3 id="calculated-ingredients-heading" className={`${textClasses.subheading} font-semibold mb-4`}>
              Calculated Ingredients
            </h3>
            <div className="space-y-4">
              {calculatedIngredients.map((ingredient) => (
                <div
                  key={ingredient.id}
                  className={`p-4 rounded-lg border ${
                    ingredient.isShortage ? "border-red-500 bg-red-50" : "border-green-500 bg-green-50"
                  }`}
                  role="listitem"
                >
                  <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-2">
                    <div>
                      <p className={`font-medium ${textClasses.body}`}>{ingredient.name}</p>
                    </div>

                    <div className="grid grid-cols-2 gap-x-6 gap-y-1">
                      <div className={`font-semibold ${textClasses.body}`}>Needed:</div>
                      <div
                        className={`${ingredient.isShortage ? "text-red-700 font-bold" : "text-green-700 font-bold"} ${textClasses.body}`}
                      >
                        {ingredient.calculatedQuantity} {ingredient.unit}
                      </div>

                      <div className={`font-semibold ${textClasses.body}`}>Available:</div>
                      <div
                        className={`${ingredient.isShortage ? "text-red-700" : "text-green-700"} ${textClasses.body}`}
                      >
                        {ingredient.inStock} {ingredient.unit}
                      </div>

                      {ingredient.isShortage ? (
                        <>
                          <div className={`font-semibold text-red-700 ${textClasses.body}`}>Shortage:</div>
                          <div className={`text-red-700 font-bold ${textClasses.body}`}>
                            {ingredient.shortageAmount}
                          </div>
                        </>
                      ) : (
                        <>
                          <div className={`font-semibold text-green-700 ${textClasses.body}`}>Excess:</div>
                          <div className={`text-green-700 ${textClasses.body}`}>{ingredient.excessAmount}</div>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200" role="note">
            <div className="flex items-start">
              <Info className="h-5 w-5 text-blue-500 mr-2 mt-0.5 flex-shrink-0" aria-hidden="true" />
              <div>
                <p className={`${textClasses.body} text-blue-800`}>
                  This calculator helps you adjust ingredient quantities based on your desired serving size. The
                  standard recipe is for {recipe.standard_serving_pax}{" "}
                  {recipe.standard_serving_pax === 1 ? "person" : "people"}.
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
