-- Update the users table schema to remove the password field
ALTER TABLE users DROP COLUMN IF EXISTS password;

-- Make sure the users table has the correct structure
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  name TEXT,
  role_id INTEGER REFERENCES roles(id)
);
