// Centralized type definitions
export interface Recipe {
  id: number
  menu_item_id: number
  name: string
  standard_serving_pax: number
  accessibility_notes?: string
  ingredients: RecipeIngredient[]
  steps: RecipeStep[]
}

export interface RecipeIngredient {
  id: number
  recipe_id: number
  ingredient_id: number | null
  name: string
  quantity: string
  quantity_for_recipe: number
  custom?: boolean
}

export interface RecipeStep {
  id: number
  recipe_id: number
  step_number: number
  instruction: string
  image_url?: string
  audio_url?: string
}

export interface Ingredient {
  id: number
  name: string
  quantity: number
  unit: string
  price?: number
  category?: string
  location?: string
}

export interface MenuItem {
  id: number
  name: string
  description?: string
  image_url: string
  minimum_order_quantity: number
  price: number
}

export interface OrderItem {
  menu_item_id: number
  name: string
  quantity: number
  price: number
}

export interface Order {
  id: number
  date: string
  customer_name: string
  delivery_address: string
  delivery_date: string
  kitchen_location: string
  chef_id?: string
  items: OrderItem[]
  total: number
  status: "pending" | "completed" | "cancelled"
  notes?: string
}

export interface User {
  id: string
  email: string
  name?: string
  role_id?: number
}

export interface Role {
  id: number
  name: string
}
