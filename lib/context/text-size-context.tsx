"use client"

import { createContext, useContext, useState, useEffect, type ReactNode } from "react"

type TextSizeContextType = {
  textSize: string
  increaseTextSize: () => void
  decreaseTextSize: () => void
  resetTextSize: () => void
}

const TextSizeContext = createContext<TextSizeContextType | undefined>(undefined)

const TEXT_SIZES = ["normal", "large", "x-large"]

interface TextSizeProviderProps {
  children: ReactNode
  userRole?: string
}

export function TextSizeProvider({ children, userRole }: TextSizeProviderProps) {
  // Set default text size based on user role
  const getDefaultTextSize = () => {
    if (userRole === "Admin") return "normal"
    if (userRole === "Chef") return "x-large"
    return "normal" // Default for other roles
  }

  const [textSize, setTextSize] = useState<string>(getDefaultTextSize())

  // Load saved preference from localStorage on mount, but respect role-based defaults
  useEffect(() => {
    const savedSize = localStorage.getItem("recipe-text-size")
    if (savedSize && TEXT_SIZES.includes(savedSize)) {
      setTextSize(savedSize)
    } else {
      // If no saved preference, use role-based default
      const defaultSize = getDefaultTextSize()
      setTextSize(defaultSize)
      localStorage.setItem("recipe-text-size", defaultSize)
    }
  }, [userRole])

  // Save preference to localStorage when it changes
  useEffect(() => {
    localStorage.setItem("recipe-text-size", textSize)
  }, [textSize])

  const increaseTextSize = () => {
    setTextSize((current) => {
      const currentIndex = TEXT_SIZES.indexOf(current)
      return currentIndex < TEXT_SIZES.length - 1 ? TEXT_SIZES[currentIndex + 1] : current
    })
  }

  const decreaseTextSize = () => {
    setTextSize((current) => {
      const currentIndex = TEXT_SIZES.indexOf(current)
      return currentIndex > 0 ? TEXT_SIZES[currentIndex - 1] : current
    })
  }

  const resetTextSize = () => {
    setTextSize(getDefaultTextSize())
  }

  return (
    <TextSizeContext.Provider value={{ textSize, increaseTextSize, decreaseTextSize, resetTextSize }}>
      {children}
    </TextSizeContext.Provider>
  )
}

export function useTextSize() {
  const context = useContext(TextSizeContext)
  if (context === undefined) {
    throw new Error("useTextSize must be used within a TextSizeProvider")
  }
  return context
}
