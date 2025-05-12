# Fortitude Culina - Development Guide

This document provides detailed information about the application's architecture, UI/UX flows, and development processes.

## Table of Contents

- [Architecture Overview](#architecture-overview)
- [UI/UX Flows](#uiux-flows)
- [Supabase Integration](#supabase-integration)
- [File Storage](#file-storage)
- [Adding New Features](#adding-new-features)
- [Component Structure](#component-structure)
- [State Management](#state-management)
- [Authentication](#authentication)
- [API Structure](#api-structure)
- [Testing](#testing)
- [Best Practices](#best-practices)

## Architecture Overview

Fortitude Culina is built with:

- **Next.js 14**: For server-side rendering and API routes
- **React 18**: For UI components
- **Supabase**: For database, authentication, and file storage
- **TypeScript**: For type safety
- **Tailwind CSS**: For styling

The application follows a modular architecture with:

- **App Router**: Next.js App Router for page routing
- **Server Components**: For data fetching and initial rendering
- **Client Components**: For interactive UI elements
- **API Routes**: For server-side operations
- **Context Providers**: For global state management

## UI/UX Flows

### Authentication Flow

1. User navigates to the application
2. If not authenticated, redirected to `/login`
3. User enters credentials or signs up
4. On successful authentication, redirected to the dashboard

### Recipe Management Flow

1. **Viewing Recipes**:
   - Navigate to `/recipes` to see all recipes
   - Click on a recipe to view details at `/recipes/[id]`

2. **Creating a Recipe**:
   - Navigate to `/recipes/new`
   - Fill in recipe details, ingredients, and steps
   - Upload images or record audio for steps
   - Submit the form to create the recipe

3. **Editing a Recipe**:
   - Navigate to `/recipes/[id]/edit`
   - Modify recipe details, ingredients, or steps
   - Update images or audio
   - Save changes

4. **Calculating Ingredients**:
   - Navigate to `/recipes/[id]/calculator`
   - Adjust serving size to recalculate ingredient quantities

### Inventory Management Flow

1. **Viewing Inventory**:
   - Navigate to `/inventory`
   - View all ingredients with quantities
   - Filter to show only low-quantity ingredients
   - Export inventory to CSV

2. **Adding/Editing Ingredients**:
   - Use the form to add new ingredients
   - Click on an ingredient to edit its details
   - Submit the form to save changes

### Order Management Flow

1. **Viewing Orders**:
   - Navigate to `/orders`
   - View all orders with their status
   - Filter orders by status

2. **Creating an Order**:
   - Navigate to `/orders/new`
   - Select menu items and quantities
   - Submit the form to create the order

3. **Managing an Order**:
   - Navigate to `/orders/[id]`
   - View order details
   - Update order status
   - Assign chefs to the order

## Supabase Integration

### Setting Up a New Table

1. **Create the table in Supabase**:
   - Navigate to the SQL editor in Supabase
   - Write and execute a CREATE TABLE statement
   - Add any necessary indexes or foreign keys

   Example:
   \`\`\`sql
   CREATE TABLE new_table (
     id SERIAL PRIMARY KEY,
     name TEXT NOT NULL,
     created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
   );
   \`\`\`

2. **Update TypeScript types**:
   - Add the new table to `lib/database.types.ts`
   
   Example:
   \`\`\`typescript
   export interface Database {
     public: {
       Tables: {
         // Existing tables...
         new_table: {
           Row: {
             id: number
             name: string
             created_at: string
           }
           Insert: {
             id?: number
             name: string
             created_at?: string
           }
           Update: {
             id?: number
             name?: string
             created_at?: string
           }
         }
       }
     }
   }
   \`\`\`

3. **Create API functions**:
   - Add CRUD functions in `lib/api/new-table.ts`
   
   Example:
   \`\`\`typescript
   import { supabase } from '@/lib/supabase'
   
   export async function getItems() {
     const { data, error } = await supabase
       .from('new_table')
       .select('*')
     
     if (error) throw error
     return data
   }
   
   export async function getItemById(id: number) {
     const { data, error } = await supabase
       .from('new_table')
       .select('*')
       .eq('id', id)
       .single()
     
     if (error) throw error
     return data
   }
   
   export async function createItem(item: { name: string }) {
     const { data, error } = await supabase
       .from('new_table')
       .insert(item)
       .select()
     
     if (error) throw error
     return data[0]
   }
   
   export async function updateItem(id: number, item: { name?: string }) {
     const { data, error } = await supabase
       .from('new_table')
       .update(item)
       .eq('id', id)
       .select()
     
     if (error) throw error
     return data[0]
   }
   
   export async function deleteItem(id: number) {
     const { error } = await supabase
       .from('new_table')
       .delete()
       .eq('id', id)
     
     if (error) throw error
     return true
   }
   \`\`\`

4. **Create a custom hook**:
   - Add a hook in `lib/hooks/use-new-table.ts`
   
   Example:
   \`\`\`typescript
   import { useState, useEffect } from 'react'
   import { getItems, createItem, updateItem, deleteItem } from '@/lib/api/new-table'
   
   export function useNewTable() {
     const [items, setItems] = useState([])
     const [loading, setLoading] = useState(true)
     const [error, setError] = useState(null)
     
     useEffect(() => {
       async function fetchItems() {
         try {
           const data = await getItems()
           setItems(data)
         } catch (err) {
           setError(err)
         } finally {
           setLoading(false)
         }
       }
       
       fetchItems()
     }, [])
     
     return { items, loading, error }
   }
   \`\`\`

### Connecting UI Components to Backend Data

1. **Create a page component**:
   - Add a new page in `app/new-feature/page.tsx`
   
   Example:
   \`\`\`typescript
   import { Suspense } from 'react'
   import NewFeatureList from '@/components/new-feature/new-feature-list'
   import NewFeatureListSkeleton from '@/components/new-feature/new-feature-list-skeleton'
   
   export default function NewFeaturePage() {
     return (
       <div className="container mx-auto py-8">
         <h1 className="text-2xl font-bold mb-4">New Feature</h1>
         <Suspense fallback={<NewFeatureListSkeleton />}>
           <NewFeatureList />
         </Suspense>
       </div>
     )
   }
   \`\`\`

2. **Create UI components**:
   - Add components in `components/new-feature/`
   
   Example:
   \`\`\`typescript
   'use client'
   
   import { useNewTable } from '@/lib/hooks/use-new-table'
   
   export default function NewFeatureList() {
     const { items, loading, error } = useNewTable()
     
     if (loading) return <p>Loading...</p>
     if (error) return <p>Error: {error.message}</p>
     
     return (
       <ul>
         {items.map(item => (
           <li key={item.id}>{item.name}</li>
         ))}
       </ul>
     )
   }
   \`\`\`

3. **Add the route to navigation**:
   - Update `components/layout/main-nav.tsx`
   
   Example:
   \`\`\`typescript
   const items = [
     // Existing items...
     {
       title: "New Feature",
       href: "/new-feature",
     },
   ]
   \`\`\`

## File Storage

### How File Storage Works

1. **Storage Structure**:
   - Bucket: `fortitude-culina-media`
   - Folders:
     - `recipes/images`: For recipe step images
     - `recipes/audio`: For recipe step audio recordings
     - `menu`: For menu item images

2. **Upload Process**:
   - Files are uploaded via API routes (`/api/upload`)
   - The API route uses the Supabase service role key for authentication
   - Files are stored with unique names (UUIDs) to prevent conflicts
   - The file URL is returned and stored in the database

3. **File Cleanup**:
   - When a recipe or step is deleted, associated files are automatically deleted
   - When a file is replaced, the old file is deleted
   - File deletion is handled via API routes (`/api/delete-file`)

### Adding File Upload to a New Feature

1. **Update the API route**:
   - Modify `/api/upload/route.ts` to handle the new file type
   
   Example:
   \`\`\`typescript
   // Add a new folder for your feature
   if (type === 'new-feature') {
     filePath = `new-feature/${uuid()}.${fileExt}`
   }
   \`\`\`

2. **Create an upload function**:
   - Add a function to handle file uploads
   
   Example:
   \`\`\`typescript
   async function handleFileUpload(file: File) {
     if (!file) return null
     
     const formData = new FormData()
     formData.append('file', file)
     formData.append('type', 'new-feature')
     
     try {
       const response = await fetch('/api/upload', {
         method: 'POST',
         body: formData,
       })
       
       if (!response.ok) {
         throw new Error('Upload failed')
       }
       
       const data = await response.json()
       return data.url
     } catch (error) {
       console.error('Error uploading file:', error)
       return null
     }
   }
   \`\`\`

3. **Add file input to your component**:
   - Create a file input and connect it to the upload function
   
   Example:
   \`\`\`typescript
   import { useState } from 'react'
   
   export default function FileUploadForm() {
     const [file, setFile] = useState<File | null>(null)
     const [fileUrl, setFileUrl] = useState<string | null>(null)
     const [loading, setLoading] = useState(false)
     
     async function handleSubmit(e: React.FormEvent) {
       e.preventDefault()
       if (!file) return
       
       setLoading(true)
       try {
         const url = await handleFileUpload(file)
         setFileUrl(url)
       } finally {
         setLoading(false)
       }
     }
     
     return (
       <form onSubmit={handleSubmit}>
         <input
           type="file"
           onChange={(e) => setFile(e.target.files?.[0] || null)}
         />
         <button type="submit" disabled={!file || loading}>
           {loading ? 'Uploading...' : 'Upload'}
         </button>
         {fileUrl && (
           <div>
             <p>File uploaded successfully!</p>
             <img src={fileUrl || "/placeholder.svg"} alt="Uploaded file" />
           </div>
         )}
       </form>
     )
   }
   \`\`\`

## Adding New Features

### Creating a New Page

1. **Add a new page**:
   - Create a file in `app/new-feature/page.tsx`
   
   Example:
   \`\`\`typescript
   export default function NewFeaturePage() {
     return (
       <div className="container mx-auto py-8">
         <h1 className="text-2xl font-bold mb-4">New Feature</h1>
         {/* Page content */}
       </div>
     )
   }
   \`\`\`

2. **Add loading and error states**:
   - Create `app/new-feature/loading.tsx` for loading state
   - Create `app/new-feature/error.tsx` for error handling

3. **Add to navigation**:
   - Update `components/layout/main-nav.tsx` to include the new page

### Creating a New Component

1. **Create the component**:
   - Add a file in `components/new-feature/new-component.tsx`
   
   Example:
   \`\`\`typescript
   'use client'
   
   import { useState } from 'react'
   
   interface NewComponentProps {
     initialValue: string
   }
   
   export default function NewComponent({ initialValue }: NewComponentProps) {
     const [value, setValue] = useState(initialValue)
     
     return (
       <div>
         <input
           type="text"
           value={value}
           onChange={(e) => setValue(e.target.value)}
         />
         <p>Current value: {value}</p>
       </div>
     )
   }
   \`\`\`

2. **Use the component**:
   - Import and use the component in your page or other components

### Adding a New API Route

1. **Create the API route**:
   - Add a file in `app/api/new-feature/route.ts`
   
   Example:
   \`\`\`typescript
   import { NextResponse } from 'next/server'
   import { supabase } from '@/lib/supabase'
   
   export async function GET() {
     try {
       const { data, error } = await supabase
         .from('new_table')
         .select('*')
       
       if (error) throw error
       
       return NextResponse.json(data)
     } catch (error) {
       return NextResponse.json(
         { error: error.message },
         { status: 500 }
       )
     }
   }
   
   export async function POST(request: Request) {
     try {
       const body = await request.json()
       
       const { data, error } = await supabase
         .from('new_table')
         .insert(body)
         .select()
       
       if (error) throw error
       
       return NextResponse.json(data[0])
     } catch (error) {
       return NextResponse.json(
         { error: error.message },
         { status: 500 }
       )
     }
   }
   \`\`\`

2. **Use the API route**:
   - Call the API route from your components or other API functions

## Component Structure

### UI Components

UI components are located in `components/ui/` and include:

- **Button**: For button elements
- **Card**: For card containers
- **Dialog**: For modal dialogs
- **Input**: For form inputs
- **Select**: For dropdown selects
- **Textarea**: For multiline text inputs
- **Toast**: For notifications

### Page Components

Page components are organized by feature:

- **recipes/**: Recipe-related components
- **inventory/**: Inventory-related components
- **orders/**: Order-related components
- **menu/**: Menu-related components
- **layout/**: Layout components (header, navigation, etc.)

### Component Best Practices

1. **Use TypeScript interfaces** for component props
2. **Split large components** into smaller, focused components
3. **Use client/server directives** appropriately:
   - Add `'use client'` for interactive components
   - Keep server components as the default for data fetching
4. **Implement proper loading and error states**
5. **Use Suspense boundaries** for asynchronous operations

## State Management

### Local State

- Use `useState` for component-specific state
- Use `useReducer` for complex state logic

### Global State

- Use React Context for shared state:
  - `AuthContext`: For authentication state
  - `DataContext`: For shared data across components

### Server State

- Use React Query for server state management
- Implement optimistic updates for better UX

## Authentication

### Authentication Flow

1. **Login/Signup**:
   - User enters credentials on `/login` page
   - Credentials are validated against Supabase Auth
   - On success, user is redirected to the dashboard

2. **Session Management**:
   - Sessions are managed by Supabase Auth
   - The `AuthContext` provides the current user state
   - Protected routes check for authentication

3. **Logout**:
   - User clicks logout in the user navigation
   - Session is cleared from Supabase Auth
   - User is redirected to the login page

### Adding Authentication to a New Feature

1. **Protect the page**:
   - Use the middleware to protect routes
   - The middleware is defined in `middleware.ts`

2. **Access the current user**:
   - Use the `useAuth` hook to access the current user
   
   Example:
   \`\`\`typescript
   'use client'
   
   import { useAuth } from '@/lib/auth-context'
   
   export default function ProtectedComponent() {
     const { user } = useAuth()
     
     if (!user) return <p>Loading...</p>
     
     return (
       <div>
         <p>Welcome, {user.email}!</p>
       </div>
     )
   }
   \`\`\`

## API Structure

### API Routes

API routes are located in `app/api/` and include:

- **upload/**: For file uploads
- **delete-file/**: For file deletion
- **orders/**: For order management
- **inventory/**: For inventory management

### API Functions

API functions are located in `lib/api/` and include:

- **recipes.ts**: For recipe CRUD operations
- **ingredients.ts**: For ingredient CRUD operations
- **menu-items.ts**: For menu item CRUD operations
- **orders.ts**: For order CRUD operations

### Adding a New API Function

1. **Create the function**:
   - Add a function to the appropriate file in `lib/api/`
   
   Example:
   \`\`\`typescript
   export async function getFilteredItems(filter: string) {
     const { data, error } = await supabase
       .from('items')
       .select('*')
       .ilike('name', `%${filter}%`)
     
     if (error) throw error
     return data
   }
   \`\`\`

2. **Use the function**:
   - Import and use the function in your components or API routes

## Testing

### Manual Testing

1. **Test each feature** with different inputs and scenarios
2. **Test error handling** by simulating errors
3. **Test responsive design** on different screen sizes
4. **Test accessibility** using keyboard navigation and screen readers

### Automated Testing

1. **Unit tests** for individual functions and components
2. **Integration tests** for feature workflows
3. **End-to-end tests** for complete user journeys

## Best Practices

### Code Style

1. **Follow TypeScript best practices**:
   - Use proper types for all variables and functions
   - Avoid `any` type when possible
   - Use interfaces for complex objects

2. **Follow React best practices**:
   - Use functional components with hooks
   - Split large components into smaller ones
   - Use proper key props in lists

3. **Follow Next.js best practices**:
   - Use the App Router for routing
   - Use server components for data fetching
   - Use client components for interactivity

### Performance

1. **Optimize images** using Next.js Image component
2. **Implement pagination** for large data sets
3. **Use React.memo** for expensive components
4. **Implement proper loading states** with Suspense

### Security

1. **Validate all user inputs** on both client and server
2. **Use proper authentication** for protected routes
3. **Implement proper error handling** to avoid exposing sensitive information
4. **Use environment variables** for sensitive data

### Accessibility

1. **Use semantic HTML** elements
2. **Add proper ARIA attributes** for custom components
3. **Ensure keyboard navigation** works for all interactive elements
4. **Provide text alternatives** for non-text content
5. **Test with screen readers** to ensure compatibility

By following these guidelines, you'll be able to maintain and extend the Fortitude Culina application effectively.
