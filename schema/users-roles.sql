-- Create roles table if it doesn't exist
CREATE TABLE IF NOT EXISTS roles (
  id SERIAL PRIMARY KEY,
  name TEXT UNIQUE NOT NULL
);

-- Create users table if it doesn't exist
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  name TEXT,
  role_id INTEGER REFERENCES roles(id)
);

-- Insert default roles if they don't exist
INSERT INTO roles (name) 
VALUES ('Admin'), ('Manager'), ('Staff')
ON CONFLICT (name) DO NOTHING;
