// API functions for menu items
import { supabase } from "@/lib/supabase"
import type { MenuItem } from "@/lib/types"
import { uploadFile, deleteFile } from "@/lib/utils/storage"

// Constants
const STORAGE_BUCKET = "fortitude-culina-media"
const STORAGE_FOLDER = "menu/items"

// Fetch all menu items
export async function fetchMenuItems(): Promise<MenuItem[]> {
  try {
    const { data, error } = await supabase.from("menu_items").select("*")

    if (error) throw error
    return data as MenuItem[]
  } catch (err) {
    console.error("Error fetching menu items:", err)
    return []
  }
}

// Fetch a single menu item by ID
export async function fetchMenuItemById(id: number): Promise<MenuItem | null> {
  try {
    const { data, error } = await supabase.from("menu_items").select("*").eq("id", id).single()

    if (error) throw error
    return data as MenuItem
  } catch (err) {
    console.error(`Error fetching menu item with ID ${id}:`, err)
    return null
  }
}

// Add a new menu item
export async function addMenuItem(menuItem: Omit<MenuItem, "id">, imageFile?: File): Promise<MenuItem | null> {
  try {
    let imageUrl = menuItem.image_url || ''

    // Upload image if provided
    if (imageFile) {
      console.log(`Uploading image to bucket: ${STORAGE_BUCKET}, folder: ${STORAGE_FOLDER}`)
      imageUrl = await uploadFile(imageFile, STORAGE_BUCKET, STORAGE_FOLDER)
      if (!imageUrl) {
        throw new Error("Failed to upload image")
      }
      console.log(`Image uploaded successfully: ${imageUrl}`)
    }

    // Insert menu item with image URL
    const { data, error } = await supabase
      .from("menu_items")
      .insert([{ ...menuItem, image_url: imageUrl }])
      .select()
      .single()

    if (error) throw error
    return data as MenuItem
  } catch (err) {
    console.error("Error adding menu item:", err)
    throw new Error(`Error adding menu item: ${err.message}`)
  }
}

// Update an existing menu item
export async function updateMenuItem(
  id: number,
  menuItem: Partial<MenuItem>,
  imageFile?: File,
): Promise<MenuItem | null> {
  try {
    let imageUrl = menuItem.image_url

    // Upload new image if provided
    if (imageFile) {
      // Get current menu item to delete old image
      const currentMenuItem = await fetchMenuItemById(id)

      // Delete old image if it exists
      if (currentMenuItem?.image_url) {
        await deleteFile(currentMenuItem.image_url, STORAGE_BUCKET, STORAGE_FOLDER)
      }

      // Upload new image
      imageUrl = await uploadFile(imageFile, STORAGE_BUCKET, STORAGE_FOLDER)
      if (!imageUrl) {
        throw new Error("Failed to upload image")
      }
    }

    // Update menu item with new data
    const { data, error } = await supabase
      .from("menu_items")
      .update({ ...menuItem, image_url: imageUrl })
      .eq("id", id)
      .select()
      .single()

    if (error) throw error
    return data as MenuItem
  } catch (err) {
    console.error(`Error updating menu item with ID ${id}:`, err)
    throw new Error(`Error updating menu item: ${err.message}`)
  }
}

// Delete a menu item
export async function deleteMenuItem(id: number): Promise<boolean> {
  try {
    // Get current menu item to delete image
    const menuItem = await fetchMenuItemById(id)

    // Delete image if it exists
    if (menuItem?.image_url) {
      await deleteFile(menuItem.image_url, STORAGE_BUCKET, STORAGE_FOLDER)
    }

    // Delete menu item
    const { error } = await supabase.from("menu_items").delete().eq("id", id)

    if (error) throw error
    return true
  } catch (err) {
    console.error(`Error deleting menu item with ID ${id}:`, err)
    throw new Error(`Error deleting menu item: ${err.message}`)
  }
}
