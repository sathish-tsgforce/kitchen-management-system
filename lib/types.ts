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
  ingredient_id: number
  name: string
  quantity: string
  quantity_for_recipe: number
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
  location_id: number
  location?: {
    id: number
    name: string
  }
  threshold_quantity?: number
  storage_type?: string
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
  chef_name?: string // Added chef name for display
  items: OrderItem[]
  total: number
  status: "pending" | "accepted" | "in_progress" | "completed" | "cancelled"
  notes?: string
}

export interface User {
  id: string
  email: string
  name?: string
  role_id?: number
  location_id?: number
  location?: {
    id: number
    name: string
  }
}

export interface Role {
  id: number
  name: string
}

export interface Location {
  id: number
  name: string
  address?: string
  is_active: boolean
}