-- This SQL script creates the initial database schema for a kitchen management system.
-- It includes tables for users, roles, locations, ingredients, menu items, recipes, recipe ingredients, and recipe steps.

CREATE TABLE public.config (
    id SERIAL PRIMARY KEY,
    key VARCHAR(255) NOT NULL UNIQUE,
    value TEXT NOT NULL,
    description TEXT,
    created_at TIMESTAMP
    WITH
        TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP
    WITH
        TIME ZONE DEFAULT CURRENT_TIMESTAMP
);


CREATE TABLE public.locations (
  name character varying NOT NULL,
  address text,
  id integer GENERATED ALWAYS AS IDENTITY NOT NULL,
  is_active boolean DEFAULT true,
  CONSTRAINT locations_pkey PRIMARY KEY (id)
);


CREATE TABLE public.roles (
  name text NOT NULL UNIQUE,
  id integer GENERATED ALWAYS AS IDENTITY NOT NULL,
  CONSTRAINT roles_pkey PRIMARY KEY (id)
);

CREATE TABLE public.users (
  role_id integer,
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  location_id integer,
  CONSTRAINT users_pkey PRIMARY KEY (id),
  CONSTRAINT fk_users_location FOREIGN KEY (location_id) REFERENCES public.locations(id),
  CONSTRAINT users_role_id_fkey FOREIGN KEY (role_id) REFERENCES public.roles(id)
);

CREATE TABLE public.storage_types (
  id integer GENERATED ALWAYS AS IDENTITY NOT NULL,
  name character varying(50) NOT NULL UNIQUE,
  description text,
  CONSTRAINT storage_types_pkey PRIMARY KEY (id),
  CONSTRAINT storage_types_name_check CHECK (char_length(name) > 0)
);


CREATE TABLE public.ingredients (
  name text NOT NULL,
  quantity numeric NOT NULL CHECK (quantity >= 0::numeric),
  threshold_quantity numeric NOT NULL CHECK (threshold_quantity >= 0::numeric),
  unit text NOT NULL,
  price numeric,
  category text,
  id integer GENERATED ALWAYS AS IDENTITY NOT NULL,
  storage_type character varying,
  storage_type_id integer REFERENCES public.storage_types(id),
  location_id integer NOT NULL,
  CONSTRAINT ingredients_pkey PRIMARY KEY (id),
  CONSTRAINT fk_inventory_location FOREIGN KEY (location_id) REFERENCES public.locations(id)
);

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_ingredients_name ON ingredients(name);
CREATE INDEX IF NOT EXISTS idx_ingredients_category ON ingredients(category);

CREATE TABLE public.menu_items (
  name text NOT NULL,
  description text,
  image_url text NOT NULL,
  minimum_order_quantity integer NOT NULL CHECK (minimum_order_quantity > 0),
  price double precision NOT NULL CHECK (price > 0::double precision),
  id integer GENERATED ALWAYS AS IDENTITY NOT NULL,
  CONSTRAINT menu_items_pkey PRIMARY KEY (id)
);


CREATE TABLE public.recipes (
  menu_item_id integer UNIQUE,
  standard_serving_pax integer NOT NULL CHECK (standard_serving_pax > 0),
  accessibility_notes text,
  id integer GENERATED ALWAYS AS IDENTITY NOT NULL,
  CONSTRAINT recipes_pkey PRIMARY KEY (id),
  CONSTRAINT recipes_menu_item_id_fkey FOREIGN KEY (menu_item_id) REFERENCES public.menu_items(id)
);

CREATE TABLE public.recipe_steps (
  recipe_id integer,
  step_number integer NOT NULL,
  instruction text NOT NULL,
  image_url text,
  audio_url text,
  id integer GENERATED ALWAYS AS IDENTITY NOT NULL,
  CONSTRAINT recipe_steps_pkey PRIMARY KEY (id),
  CONSTRAINT recipe_steps_recipe_id_fkey FOREIGN KEY (recipe_id) REFERENCES public.recipes(id)
);

CREATE TABLE public.recipe_ingredients (
  recipe_id integer,
  ingredient_id integer,
  quantity_for_recipe numeric NOT NULL CHECK (quantity_for_recipe > 0::numeric),
  id integer GENERATED ALWAYS AS IDENTITY NOT NULL,
  CONSTRAINT recipe_ingredients_pkey PRIMARY KEY (id),
  CONSTRAINT recipe_ingredients_recipe_id_fkey FOREIGN KEY (recipe_id) REFERENCES public.recipes(id),
  CONSTRAINT recipe_ingredients_ingredient_id_fkey FOREIGN KEY (ingredient_id) REFERENCES public.ingredients(id)
);

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_recipe_ingredients_recipe_id ON recipe_ingredients(recipe_id);
CREATE INDEX IF NOT EXISTS idx_recipe_ingredients_ingredient_id ON recipe_ingredients(ingredient_id);
CREATE INDEX IF NOT EXISTS idx_recipe_steps_recipe_id ON recipe_steps(recipe_id);

INSERT INTO public.roles (name) VALUES
('Admin'),
('Chef');
