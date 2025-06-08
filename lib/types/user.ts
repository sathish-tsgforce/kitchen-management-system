export interface UserRole {
  id: number
  name: string
}

export interface UserLocation {
  id: number
  name: string
  address?: string
  is_active: boolean
}

export interface User {
  id: string
  email: string
  name: string
  role_id: number
  role?: UserRole | null
  location_id?: number | null
  location?: UserLocation | null
}

export interface NewUser {
  email: string
  password: string
  name: string
  role_id: number
  location_id?: number | null
}

export interface UpdateUser {
  id: string
  email?: string
  password?: string
  name?: string
  role_id?: number
  location_id?: number | null
}