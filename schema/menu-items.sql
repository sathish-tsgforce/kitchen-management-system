-- Create menu_items table if it doesn't exist
CREATE TABLE IF NOT EXISTS menu_items (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  image_url TEXT NOT NULL,
  minimum_order_quantity INTEGER NOT NULL CHECK (minimum_order_quantity > 0),
  price FLOAT NOT NULL CHECK (price > 0)
);

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_menu_items_name ON menu_items(name);
