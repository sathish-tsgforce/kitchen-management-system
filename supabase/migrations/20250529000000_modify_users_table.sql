-- Remove email and name columns from users table
ALTER TABLE public.users DROP COLUMN IF EXISTS email;
ALTER TABLE public.users DROP COLUMN IF EXISTS name;
ALTER TABLE public.users DROP COLUMN IF EXISTS password;

-- Step 1: Add location_id column (nullable initially)
ALTER TABLE ingredients ADD COLUMN location_id INTEGER;

-- Step 2: Add foreign key constraint
ALTER TABLE ingredients 
  ADD CONSTRAINT fk_ingredients_location 
  FOREIGN KEY (location_id) REFERENCES locations(id);

-- Step 3: Set default location (assuming location id 1 exists)
-- Replace '1' with your default location id
UPDATE ingredients SET location_id = 1 WHERE location_id IS NULL;

-- Step 4: Make location_id non-nullable
ALTER TABLE ingredients ALTER COLUMN location_id SET NOT NULL;

-- Step 5: Drop the old location column
ALTER TABLE ingredients DROP COLUMN location;