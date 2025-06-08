export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      ingredients: {
        Row: {
          id: number
          name: string
          quantity: number
          unit: string
          category: string | null
          location_id: number
          min_quantity: number | null
          created_at: string
          updated_at: string | null
        }
        Insert: {
          id?: number
          name: string
          quantity: number
          unit: string
          category?: string | null
          location_id: number
          min_quantity?: number | null
          created_at?: string
          updated_at?: string | null
        }
        Update: {
          id?: number
          name?: string
          quantity?: number
          unit?: string
          category?: string | null
          location_id?: number
          min_quantity?: number | null
          created_at?: string
          updated_at?: string | null
        }
      }
      locations: {
        Row: {
          id: number
          name: string
          address: string | null
          is_active: boolean
        }
        Insert: {
          id?: number
          name: string
          address?: string | null
          is_active?: boolean
        }
        Update: {
          id?: number
          name?: string
          address?: string | null
          is_active?: boolean
        }
      }
      // Other tables...
    }
  }
}