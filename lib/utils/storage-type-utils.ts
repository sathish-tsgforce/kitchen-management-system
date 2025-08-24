// Utility functions for storage types
import type { Ingredient } from "@/lib/types"

/**
 * Get the storage type name for display, with fallback to "Standard"
 */
export function getStorageTypeName(ingredient: Ingredient): string {
  // Use the foreign key relationship
  if (ingredient.storage_type_ref?.name) {
    return ingredient.storage_type_ref.name
  }
  
  // Default fallback
  return "Standard"
}

/**
 * Get the storage type ID, with fallback to 1 (Standard)
 */
export function getStorageTypeId(ingredient: Ingredient): number {
  return ingredient.storage_type_id || 1 // Default to Standard (ID 1)
}

/**
 * Check if ingredient has storage type information
 */
export function hasStorageType(ingredient: Ingredient): boolean {
  return !!(ingredient.storage_type_ref || ingredient.storage_type_id)
}
