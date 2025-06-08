-- Add location_id column to users table that references the locations table
ALTER TABLE public.users ADD COLUMN location_id INTEGER;

-- Add foreign key constraint
ALTER TABLE public.users 
  ADD CONSTRAINT fk_users_location 
  FOREIGN KEY (location_id) 
  REFERENCES public.locations(id) 
  ON DELETE SET NULL;

-- Add comment to the column
COMMENT ON COLUMN public.users.location_id IS 'Reference to the location where this user primarily works';