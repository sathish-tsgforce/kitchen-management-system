    -- Add storage_type column to ingredients table
ALTER TABLE public.ingredients ADD COLUMN storage_type VARCHAR(50);

-- Update existing records with default storage type
UPDATE public.ingredients SET storage_type = 'Standard' WHERE storage_type IS NULL;

-- Add comment to the column
COMMENT ON COLUMN public.ingredients.storage_type IS 'Type of storage (e.g., Refrigerated, Frozen, Dry)';