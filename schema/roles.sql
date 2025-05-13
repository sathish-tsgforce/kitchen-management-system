-- Create roles table if it doesn't exist
CREATE TABLE IF NOT EXISTS roles (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL UNIQUE
);

-- Check if roles exist, if not insert default roles
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM roles WHERE name = 'Admin') THEN
    INSERT INTO roles (name) VALUES ('Admin');
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM roles WHERE name = 'Chef') THEN
    INSERT INTO roles (name) VALUES ('Chef');
  END IF;
END $$;

-- Create a stored procedure to set up roles
CREATE OR REPLACE FUNCTION setup_roles()
RETURNS void AS $$
BEGIN
  -- Create roles table if it doesn't exist
  CREATE TABLE IF NOT EXISTS roles (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL UNIQUE
  );
  
  -- Insert default roles if they don't exist
  IF NOT EXISTS (SELECT 1 FROM roles WHERE name = 'Admin') THEN
    INSERT INTO roles (name) VALUES ('Admin');
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM roles WHERE name = 'Chef') THEN
    INSERT INTO roles (name) VALUES ('Chef');
  END IF;
END;
$$ LANGUAGE plpgsql;

-- Add role_id to users table if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_name = 'users' AND column_name = 'role_id'
  ) THEN
    ALTER TABLE users ADD COLUMN role_id INTEGER REFERENCES roles(id);
  END IF;
END $$;
