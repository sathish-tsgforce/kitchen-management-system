-- Schema definition for locations table
CREATE TABLE IF NOT EXISTS public.locations (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  address TEXT,
  is_active BOOLEAN DEFAULT TRUE
);

-- Add comment to the table
COMMENT ON TABLE public.locations IS 'Storage locations for ingredients';

-- Add RLS policies
ALTER TABLE public.locations ENABLE ROW LEVEL SECURITY;

-- Allow read access to all authenticated users
CREATE POLICY "Allow read access for all authenticated users" 
  ON public.locations FOR SELECT 
  USING (auth.role() = 'authenticated');

-- Allow insert/update/delete for admin users only
CREATE POLICY "Allow full access for admin users" 
  ON public.locations FOR ALL 
  USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE users.id = auth.uid()
      AND users.role_id = 1 -- Admin role
    )
  );