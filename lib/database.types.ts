export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

export interface Database {
  public: {
    Tables: {
      roles: {
        Row: {
          id: number
          name: string
        }
        Insert: {
          id?: number
          name: string
        }
        Update: {
          id?: number
          name?: string
        }
      }
      users: {
        Row: {
          id: string
          email: string
          name: string | null
          role_id: number | null
        }
        Insert: {
          id: string
          email: string
          name?: string | null
          role_id?: number | null
        }
        Update: {
          id?: string
          email?: string
          name?: string | null
          role_id?: number | null
        }
      }
      menu_items: {
        Row: {
          id: number
          name: string
          description: string | null
          image_url: string
          minimum_order_quantity: number
          price: number
        }
        Insert: {
          id?: number
          name: string
          description?: string | null
          image_url: string
          minimum_order_quantity: number
          price: number
        }
        Update: {
          id?: number
          name?: string
          description?: string | null
          image_url?: string
          minimum_order_quantity?: number
          price?: number
        }
      }
      ingredients: {
        Row: {
          id: number
          name: string
          quantity: number
          unit: string
          price: number | null
          category: string | null
          location: string | null
          threshold_quantity: number | null
        }
        Insert: {
          id?: number
          name: string
          quantity: number
          unit: string
          price?: number | null
          category?: string | null
          location?: string | null
          threshold_quantity?: number | null
        }
        Update: {
          id?: number
          name?: string
          quantity?: number
          unit?: string
          price?: number | null
          category?: string | null
          location?: string | null
          threshold_quantity?: number | null
        }
      }
      recipes: {
        Row: {
          id: number
          menu_item_id: number
          standard_serving_pax: number
          accessibility_notes: string | null
        }
        Insert: {
          id?: number
          menu_item_id: number
          standard_serving_pax: number
          accessibility_notes?: string | null
        }
        Update: {
          id?: number
          menu_item_id?: number
          standard_serving_pax?: number
          accessibility_notes?: string | null
        }
      }
      recipe_ingredients: {
        Row: {
          id: number
          recipe_id: number
          ingredient_id: number
          quantity_for_recipe: number
        }
        Insert: {
          id?: number
          recipe_id: number
          ingredient_id: number
          quantity_for_recipe: number
        }
        Update: {
          id?: number
          recipe_id?: number
          ingredient_id?: number
          quantity_for_recipe?: number
        }
      }
      recipe_steps: {
        Row: {
          id: number
          recipe_id: number
          step_number: number
          instruction: string
          image_url: string | null
          audio_url: string | null
        }
        Insert: {
          id?: number
          recipe_id: number
          step_number: number
          instruction: string
          image_url?: string | null
          audio_url?: string | null
        }
        Update: {
          id?: number
          recipe_id?: number
          step_number?: number
          instruction?: string
          image_url?: string | null
          audio_url?: string | null
        }
      }
      orders: {
        Row: {
          id: number
          date: string
          customer_name: string
          delivery_address: string
          delivery_date: string
          kitchen_location: string
          chef_id: string | null
          status: string
          notes: string | null
        }
        Insert: {
          id?: number
          date?: string
          customer_name: string
          delivery_address: string
          delivery_date: string
          kitchen_location: string
          chef_id?: string | null
          status: string
          notes?: string | null
        }
        Update: {
          id?: number
          date?: string
          customer_name?: string
          delivery_address?: string
          delivery_date?: string
          kitchen_location?: string
          chef_id?: string | null
          status?: string
          notes?: string | null
        }
      }
      order_items: {
        Row: {
          id: number
          order_id: number
          menu_item_id: number
          quantity: number
          price: number
        }
        Insert: {
          id?: number
          order_id: number
          menu_item_id: number
          quantity: number
          price: number
        }
        Update: {
          id?: number
          order_id?: number
          menu_item_id?: number
          quantity?: number
          price?: number
        }
      }
    }
  }
}
