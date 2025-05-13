export interface UserRole {
  id: number
  name: string
}

export interface User {
  id: string
  email: string
  name: string
  role_id: number
  role?: UserRole | null
}

export interface NewUser {
  email: string
  password: string
  name: string
  role_id: number
}

export interface UpdateUser {
  id: string
  email?: string
  password?: string
  name?: string
  role_id?: number
}
