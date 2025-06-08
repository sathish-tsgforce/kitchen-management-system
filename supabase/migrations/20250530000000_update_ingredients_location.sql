-- Add location_id column to ingredients table
ALTER TABLE ingredients ADD COLUMN location_id INTEGER;

-- Add foreign key constraint
ALTER TABLE ingredients 
  ADD CONSTRAINT fk_ingredients_location 
  FOREIGN KEY (location_id) REFERENCES locations(id);

-- Migrate existing location data
-- First, create any missing locations from existing text values
INSERT INTO locations (name)
SELECT DISTINCT location FROM ingredients 
WHERE location IS NOT NULL AND location != ''
AND NOT EXISTS (SELECT 1 FROM locations WHERE name = ingredients.location);

-- Then update the location_id based on the location name
UPDATE ingredients
SET location_id = (SELECT id FROM locations WHERE name = ingredients.location)
WHERE location IS NOT NULL AND location != '';

-- Set default location for any NULL values
UPDATE ingredients 
SET location_id = (SELECT id FROM locations ORDER BY id LIMIT 1)
WHERE location_id IS NULL;

-- Make location_id non-nullable
ALTER TABLE ingredients ALTER COLUMN location_id SET NOT NULL;

-- Drop the old location column
ALTER TABLE ingredients DROP COLUMN location;