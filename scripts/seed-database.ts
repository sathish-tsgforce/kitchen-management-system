import { createClient } from "@supabase/supabase-js"
import dotenv from "dotenv"

dotenv.config({ path: ".env.local" })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.NEXT_SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error("Missing Supabase URL or service role key")
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

// Mock data to seed the database
const roles = [
  { id: 1, name: "Admin" },
  { id: 2, name: "Chef" },
  { id: 3, name: "Server" },
]

const users = [
  {
    email: "admin@example.com",
    password: "password123",
    name: "Admin User",
    role_id: 1,
  },
  {
    email: "chef@example.com",
    password: "password123",
    name: "Chef User",
    role_id: 2,
  }
]

const menuItems = [
  {
    id: 101,
    name: "Classic Margherita Pizza",
    description: "Traditional Italian pizza with tomato sauce, fresh mozzarella, and basil",
    image_url: "/placeholder.svg?height=300&width=300",
    minimum_order_quantity: 1,
    price: 12.99,
  },
  {
    id: 102,
    name: "Vegetable Stir Fry",
    description: "Fresh vegetables stir-fried with soy sauce and sesame oil",
    image_url: "/placeholder.svg?height=300&width=300",
    minimum_order_quantity: 2,
    price: 9.99,
  },
  {
    id: 103,
    name: "Chocolate Chip Cookies",
    description: "Homemade cookies with chocolate chips",
    image_url: "/placeholder.svg?height=300&width=300",
    minimum_order_quantity: 6,
    price: 1.99,
  },
  {
    id: 104,
    name: "Grilled Chicken Salad",
    description: "Fresh salad with grilled chicken, mixed greens, and house dressing",
    image_url: "/placeholder.svg?height=300&width=300",
    minimum_order_quantity: 1,
    price: 11.99,
  },
  {
    id: 105,
    name: "Beef Burger",
    description: "Juicy beef patty with lettuce, tomato, and special sauce on a brioche bun",
    image_url: "/placeholder.svg?height=300&width=300",
    minimum_order_quantity: 1,
    price: 13.99,
  },
]

const ingredients = [
  { id: 1, name: "Pizza Dough", quantity: 500, threshold_quantity: 100, unit: "g", price: 3.99, category: "Grains", location: "Refrigerator" },
  {
    id: 2,
    name: "Tomato Sauce",
    quantity: 300,
    threshold_quantity: 50,
    unit: "g",
    price: 2.49,
    category: "Vegetables",
    storage_type: "Dry Storage",
  },  {
    id: 3,
    name: "Fresh Mozzarella",
    quantity: 350,
    threshold_quantity: 100,
    unit: "g",
    price: 4.99,
    category: "Dairy",
    storage_type: "Refrigerator",
  },
  {
    id: 4,
    name: "Fresh Basil Leaves",
    quantity: 15,
    threshold_quantity: 5,
    unit: "leaves",
    price: 1.99,
    category: "Herbs",
    storage_type: "Refrigerator",
  },
  { id: 5, name: "Olive Oil", quantity: 200, threshold_quantity: 50, unit: "ml", price: 8.99, category: "Oils", location: "Dry Storage" },  {
    id: 6,
    name: "Broccoli Florets",
    quantity: 400,
    threshold_quantity: 100,
    unit: "g",
    price: 2.99,
    category: "Vegetables",
    location: "Refrigerator",
  },
  {
    id: 7,
    name: "Bell Peppers",
    quantity: 3,
    threshold_quantity: 2,
    unit: "medium",
    price: 1.5,
    category: "Vegetables",
    location: "Refrigerator",
  },
  { id: 8, name: "Carrots", quantity: 1, threshold_quantity: 1, unit: "large", price: 0.75, category: "Vegetables", location: "Refrigerator" },  { id: 9, name: "Soy Sauce", quantity: 100, threshold_quantity: 25, unit: "ml", price: 3.49, category: "Condiments", location: "Dry Storage" },
  { id: 10, name: "Sesame Oil", quantity: 50, threshold_quantity: 15, unit: "ml", price: 5.99, category: "Oils", location: "Dry Storage" },
  {
    id: 11,
    name: "All-Purpose Flour",
    quantity: 1000,
    threshold_quantity: 200,
    unit: "g",
    price: 2.99,
    category: "Grains",
    location: "Dry Storage",
  },
  {
    id: 12,
    name: "Unsalted Butter",
    quantity: 400,
    threshold_quantity: 1200,
    unit: "g",
    price: 4.49,
    category: "Dairy",
    location: "Refrigerator",
  },
  {
    id: 13,
    name: "Brown Sugar",
    threshold_quantity: 5000,
    quantity: 300,
    unit: "g",
    price: 2.29,
    category: "Sweeteners",
    location: "Dry Storage",
  },
  {
    id: 14,
    name: "Granulated Sugar",
    quantity: 500,
    threshold_quantity: 5000,
    unit: "g",
    price: 1.99,
    category: "Sweeteners",
    location: "Dry Storage",
  },
  { id: 15, name: "Eggs", quantity: 6, unit: "large", price: 3.49, threshold_quantity: 50, category: "Dairy", location: "Refrigerator" },
  {
    id: 16,
    name: "Chocolate Chips",
    threshold_quantity: 5000,
    quantity: 200,
    unit: "g",
    price: 3.99,
    category: "Baking",
    location: "Dry Storage",
  },
]

const recipes = [
  {
    id: 1,
    menu_item_id: 101,
    standard_serving_pax: 2,
    accessibility_notes: "High contrast visual instructions available for each step.",
  },
  {
    id: 2,
    menu_item_id: 102,
    standard_serving_pax: 4,
    accessibility_notes: null,
  },
  {
    id: 3,
    menu_item_id: 103,
    standard_serving_pax: 12,
    accessibility_notes: "Audio instructions available for all steps. High contrast images for visual guidance.",
  },
]

const recipeIngredients = [
  { recipe_id: 1, ingredient_id: 1, quantity_for_recipe: 300 },
  { recipe_id: 1, ingredient_id: 2, quantity_for_recipe: 150 },
  { recipe_id: 1, ingredient_id: 3, quantity_for_recipe: 200 },
  { recipe_id: 1, ingredient_id: 4, quantity_for_recipe: 10 },
  { recipe_id: 1, ingredient_id: 5, quantity_for_recipe: 15 },
  { recipe_id: 2, ingredient_id: 6, quantity_for_recipe: 300 },
  { recipe_id: 2, ingredient_id: 7, quantity_for_recipe: 2 },
  { recipe_id: 2, ingredient_id: 8, quantity_for_recipe: 2 },
  { recipe_id: 2, ingredient_id: 9, quantity_for_recipe: 45 },
  { recipe_id: 2, ingredient_id: 10, quantity_for_recipe: 15 },
  { recipe_id: 3, ingredient_id: 11, quantity_for_recipe: 280 },
  { recipe_id: 3, ingredient_id: 12, quantity_for_recipe: 225 },
  { recipe_id: 3, ingredient_id: 13, quantity_for_recipe: 200 },
  { recipe_id: 3, ingredient_id: 14, quantity_for_recipe: 100 },
  { recipe_id: 3, ingredient_id: 15, quantity_for_recipe: 2 },
  { recipe_id: 3, ingredient_id: 16, quantity_for_recipe: 300 },
]

const recipeSteps = [
  {
    recipe_id: 1,
    step_number: 1,
    instruction: "Preheat the oven to 475°F (245°C) with a pizza stone inside if available.",
    image_url: "/placeholder.svg?height=200&width=300",
    audio_url: null,
  },
  {
    recipe_id: 1,
    step_number: 2,
    instruction: "Roll out the pizza dough on a floured surface to your desired thickness.",
    image_url: "/placeholder.svg?height=200&width=300",
    audio_url: "/audio-instructions.mp3",
  },
  {
    recipe_id: 1,
    step_number: 3,
    instruction: "Spread the tomato sauce evenly over the dough, leaving a small border for the crust.",
    image_url: "/placeholder.svg?height=200&width=300",
    audio_url: null,
  },
  {
    recipe_id: 1,
    step_number: 4,
    instruction: "Tear the fresh mozzarella into pieces and distribute evenly over the sauce.",
    image_url: "/placeholder.svg?height=200&width=300",
    audio_url: null,
  },
  {
    recipe_id: 1,
    step_number: 5,
    instruction: "Drizzle with olive oil and bake for 10-12 minutes until the crust is golden and cheese is bubbly.",
    image_url: null,
    audio_url: "/audio-instructions.mp3",
  },
  {
    recipe_id: 1,
    step_number: 6,
    instruction: "Remove from oven, top with fresh basil leaves, slice and serve immediately.",
    image_url: "/placeholder.svg?height=200&width=300",
    audio_url: null,
  },
  {
    recipe_id: 2,
    step_number: 1,
    instruction: "Wash and chop all vegetables into bite-sized pieces.",
    image_url: "/placeholder.svg?height=200&width=300",
    audio_url: null,
  },
  {
    recipe_id: 2,
    step_number: 2,
    instruction: "Heat a wok or large frying pan over high heat. Add sesame oil.",
    image_url: null,
    audio_url: "/audio-instructions.mp3",
  },
  {
    recipe_id: 2,
    step_number: 3,
    instruction: "Add carrots and stir-fry for 2 minutes.",
    image_url: "/placeholder.svg?height=200&width=300",
    audio_url: null,
  },
  {
    recipe_id: 2,
    step_number: 4,
    instruction: "Add broccoli and bell peppers, stir-fry for another 3-4 minutes until vegetables are crisp-tender.",
    image_url: "/placeholder.svg?height=200&width=300",
    audio_url: null,
  },
  {
    recipe_id: 2,
    step_number: 5,
    instruction: "Add soy sauce and toss to coat. Serve immediately.",
    image_url: null,
    audio_url: "/audio-instructions.mp3",
  },
  {
    recipe_id: 3,
    step_number: 1,
    instruction: "Preheat oven to 350°F (175°C) and line baking sheets with parchment paper.",
    image_url: "/placeholder.svg?height=200&width=300",
    audio_url: "/audio-instructions.mp3",
  },
  {
    recipe_id: 3,
    step_number: 2,
    instruction:
      "In a large bowl, cream together the butter, brown sugar, and granulated sugar until light and fluffy.",
    image_url: "/placeholder.svg?height=200&width=300",
    audio_url: "/audio-instructions.mp3",
  },
  {
    recipe_id: 3,
    step_number: 3,
    instruction: "Beat in eggs one at a time, then stir in vanilla.",
    image_url: "/placeholder.svg?height=200&width=300",
    audio_url: "/audio-instructions.mp3",
  },
  {
    recipe_id: 3,
    step_number: 4,
    instruction: "Gradually blend in the flour mixture, then fold in chocolate chips.",
    image_url: "/placeholder.svg?height=200&width=300",
    audio_url: "/audio-instructions.mp3",
  },
  {
    recipe_id: 3,
    step_number: 5,
    instruction: "Drop by rounded tablespoons onto the prepared baking sheets.",
    image_url: "/placeholder.svg?height=200&width=300",
    audio_url: "/audio-instructions.mp3",
  },
  {
    recipe_id: 3,
    step_number: 6,
    instruction:
      "Bake for 10-12 minutes until edges are golden. Cool on baking sheets for 2 minutes before transferring to wire racks.",
    image_url: "/placeholder.svg?height=200&width=300",
    audio_url: "/audio-instructions.mp3",
  },
]

const orders = [
  {
    id: 1001,
    date: new Date("2023-05-15T14:30:00Z").toISOString(),
    customer_name: "John Smith",
    delivery_address: "123 Main St, Anytown, USA",
    delivery_date: new Date("2023-05-16T18:00:00Z").toISOString(),
    kitchen_location: "Main Kitchen",
    status: "completed",
    notes: null,
  },
  {
    id: 1002,
    date: new Date("2023-05-16T18:45:00Z").toISOString(),
    customer_name: "Sarah Johnson",
    delivery_address: "456 Oak Ave, Somewhere, USA",
    delivery_date: new Date("2023-05-17T12:00:00Z").toISOString(),
    kitchen_location: "Downtown Kitchen",
    status: "pending",
    notes: "No onions in the stir fry please.",
  },
  {
    id: 1003,
    date: new Date("2023-05-16T12:15:00Z").toISOString(),
    customer_name: "Michael Brown",
    delivery_address: "789 Pine St, Nowhere, USA",
    delivery_date: new Date("2023-05-17T19:00:00Z").toISOString(),
    kitchen_location: "Main Kitchen",
    status: "cancelled",
    notes: "Cancelled due to delivery delay.",
  },
]

const orderItems = [
  { order_id: 1001, menu_item_id: 101, quantity: 2, price: 12.99 },
  { order_id: 1001, menu_item_id: 103, quantity: 12, price: 1.99 },
  { order_id: 1002, menu_item_id: 102, quantity: 3, price: 9.99 },
  { order_id: 1002, menu_item_id: 104, quantity: 1, price: 11.99 },
  { order_id: 1003, menu_item_id: 105, quantity: 4, price: 13.99 },
  { order_id: 1003, menu_item_id: 103, quantity: 24, price: 1.99 },
]

async function seedDatabase() {
  try {
    console.log("Starting database seeding...")

    // Insert roles
    console.log("Inserting roles...")
    const { error: rolesError } = await supabase.from("roles").upsert(roles)
    if (rolesError) throw rolesError

    // Create users in Supabase Auth and then in our users table
    console.log("Creating users...")
    for (const user of users) {
      // First create the user in Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.admin.createUser({
        email: user.email,
        password: user.password,
        email_confirm: true, // Auto-confirm the email
      })

      if (authError) {
        console.error(`Error creating auth user ${user.email}:`, authError)
        continue
      }

      console.log(`Created auth user: ${user.email}`)

      // Then insert the user data in our users table
      const { error: userError } = await supabase.from("users").upsert({
        id: authData.user.id,
        email: user.email,
        name: user.name,
        role_id: user.role_id,
      })

      if (userError) {
        console.error(`Error inserting user ${user.email}:`, userError)
      }
    }

    // Continue with the rest of the seeding...
    // (Insert menuItems, ingredients, recipes, recipeIngredients, recipeSteps, orders, orderItems)

    // Insert menu items
    console.log("Inserting menu items...")
    const { error: menuItemsError } = await supabase.from("menu_items").upsert(menuItems)
    if (menuItemsError) throw menuItemsError

    // Insert ingredients
    console.log("Inserting ingredients...")
    const { error: ingredientsError } = await supabase.from("ingredients").upsert(ingredients)
    if (ingredientsError) throw ingredientsError

    // Insert recipes
    console.log("Inserting recipes...")
    const { error: recipesError } = await supabase.from("recipes").upsert(recipes)
    if (recipesError) throw recipesError

    // Insert recipe ingredients
    console.log("Inserting recipe ingredients...")
    const { error: recipeIngredientsError } = await supabase.from("recipe_ingredients").upsert(recipeIngredients)
    if (recipeIngredientsError) throw recipeIngredientsError

    // Insert recipe steps
    console.log("Inserting recipe steps...")
    const { error: recipeStepsError } = await supabase.from("recipe_steps").upsert(recipeSteps)
    if (recipeStepsError) throw recipeStepsError

    // Insert orders
    console.log("Inserting orders...")
    const { error: ordersError } = await supabase.from("orders").upsert(orders)
    if (ordersError) throw ordersError

    // Insert order items
    console.log("Inserting order items...")
    const { error: orderItemsError } = await supabase.from("order_items").upsert(orderItems)
    if (orderItemsError) throw orderItemsError

    console.log("Database seeding completed successfully!")
  } catch (error) {
    console.error("Error seeding database:", error)
  }
}

seedDatabase()
