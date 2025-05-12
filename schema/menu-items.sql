-- Create menu_items table if it doesn't exist
CREATE TABLE IF NOT EXISTS menu_items (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  image_url TEXT,
  minimum_order_quantity INTEGER NOT NULL DEFAULT 1,
  price NUMERIC(10, 2) NOT NULL CHECK (price >= 0)
);

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_menu_items_name ON menu_items(name);
