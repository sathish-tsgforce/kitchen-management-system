-- Create orders table if it doesn't exist
CREATE TABLE IF NOT EXISTS orders (
  id SERIAL PRIMARY KEY,
  date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  customer_name TEXT NOT NULL,
  delivery_address TEXT NOT NULL,
  delivery_date TIMESTAMP WITH TIME ZONE NOT NULL,
  kitchen_location TEXT NOT NULL,
  chef_id UUID REFERENCES users(id),
  status TEXT NOT NULL CHECK (status IN ('pending', 'accepted', 'in_progress', 'completed', 'cancelled')),
  notes TEXT
);

-- Create order_items table if it doesn't exist
CREATE TABLE IF NOT EXISTS order_items (
  id SERIAL PRIMARY KEY,
  order_id INTEGER REFERENCES orders(id) ON DELETE CASCADE,
  menu_item_id INTEGER REFERENCES menu_items(id),
  quantity INTEGER NOT NULL CHECK (quantity > 0),
  price NUMERIC NOT NULL CHECK (price >= 0),
  CONSTRAINT unique_menu_item_per_order UNIQUE (order_id, menu_item_id)
);

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_order_items_order_id ON order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_order_items_menu_item_id ON order_items(menu_item_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_chef_id ON orders(chef_id);
CREATE INDEX IF NOT EXISTS idx_orders_delivery_date ON orders(delivery_date);
