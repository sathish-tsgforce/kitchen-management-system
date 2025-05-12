// Utility functions for formatting data
import { format as formatDate } from "date-fns"

export function formatCurrency(amount: number): string {
  return `$${amount.toFixed(2)}`
}

export function formatDateTime(dateString: string): string {
  return formatDate(new Date(dateString), "MMMM d, yyyy 'at' h:mm a")
}

export function formatDateShort(dateString: string): string {
  return formatDate(new Date(dateString), "MMM d, yyyy")
}

export function extractNumericValue(quantityString: string): number {
  const numericValue = Number.parseFloat(quantityString.replace(/[^0-9.]/g, ""))
  return !isNaN(numericValue) ? numericValue : 0
}

export function extractUnitPart(quantityString: string): string {
  return quantityString.replace(/[0-9.]/g, "")
}
