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

export function TextSizeProvider({ children }: { children: ReactNode }) {
  const [textSize, setTextSize] = useState<string>("normal")

  // Load saved preference from localStorage on mount
  useEffect(() => {
    const savedSize = localStorage.getItem("recipe-text-size")
    if (savedSize && TEXT_SIZES.includes(savedSize)) {
      setTextSize(savedSize)
    }
  }, [])

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
    setTextSize("normal")
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
