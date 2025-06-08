-- Create locations table
CREATE TABLE IF NOT EXISTS public.locations (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  address TEXT,
  is_active BOOLEAN DEFAULT TRUE
);

-- Add comment to the table
COMMENT ON TABLE public.locations IS 'Storage locations for ingredients';

-- Add some initial data
INSERT INTO public.locations (name, address, is_active) VALUES
  ('Central Kitchen', 'Mountbatten Vocational School', true),
  ('Senkang', 'Senkang', true),
  ('Bedok', 'Bedok', true),
  ('JurongEast', 'JurongEast', true);