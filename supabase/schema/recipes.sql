-- Create recipes table if it doesn't exist
CREATE TABLE IF NOT EXISTS recipes (
  id SERIAL PRIMARY KEY,
  menu_item_id INTEGER UNIQUE REFERENCES menu_items(id) ON DELETE CASCADE,
  standard_serving_pax INTEGER NOT NULL CHECK (standard_serving_pax > 0),
  accessibility_notes TEXT
);

-- Create recipe_ingredients table if it doesn't exist
CREATE TABLE IF NOT EXISTS recipe_ingredients (
  id SERIAL PRIMARY KEY,
  recipe_id INTEGER REFERENCES recipes(id) ON DELETE CASCADE,
  ingredient_id INTEGER REFERENCES ingredients(id),
  quantity_for_recipe NUMERIC NOT NULL CHECK (quantity_for_recipe > 0)
);

-- Create recipe_steps table if it doesn't exist
CREATE TABLE IF NOT EXISTS recipe_steps (
  id SERIAL PRIMARY KEY,
  recipe_id INTEGER REFERENCES recipes(id) ON DELETE CASCADE,
  step_number INTEGER NOT NULL,
  instruction TEXT NOT NULL,
  image_url TEXT,
  audio_url TEXT,
  CONSTRAINT unique_step_per_recipe UNIQUE (recipe_id, step_number)
);

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_recipe_ingredients_recipe_id ON recipe_ingredients(recipe_id);
CREATE INDEX IF NOT EXISTS idx_recipe_ingredients_ingredient_id ON recipe_ingredients(ingredient_id);
CREATE INDEX IF NOT EXISTS idx_recipe_steps_recipe_id ON recipe_steps(recipe_id);
