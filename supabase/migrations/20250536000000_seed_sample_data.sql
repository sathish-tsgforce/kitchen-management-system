/* No need to run in production environment */
/* Sample data to insert into the Database */

-- Insert locations
INSERT INTO public.locations (name, address, is_active) VALUES
  ('Central Kitchen', 'Mountbatten Vocational School', true),
  ('Senkang', 'Senkang', true),
  ('Bedok', 'Bedok', true),
  ('JurongEast', 'JurongEast', true);

-- Insert menu items
INSERT INTO public.menu_items (name, description, image_url, minimum_order_quantity, price) VALUES
  ('Classic Margherita Pizza', 'Traditional Italian pizza with tomato sauce, fresh mozzarella, and basil', '/placeholder.svg?height=300&width=300', 1, 12.99),
  ('Vegetable Stir Fry', 'Fresh vegetables stir-fried with soy sauce and sesame oil', '/placeholder.svg?height=300&width=300', 2, 9.99),
  ('Chocolate Chip Cookies', 'Homemade cookies with chocolate chips', '/placeholder.svg?height=300&width=300', 6, 1.99),
  ('Grilled Chicken Salad', 'Fresh salad with grilled chicken, mixed greens, and house dressing', '/placeholder.svg?height=300&width=300', 1, 11.99),
  ('Beef Burger', 'Juicy beef patty with lettuce, tomato, and special sauce on a brioche bun', '/placeholder.svg?height=300&width=300', 1, 13.99);

-- Insert ingredients
INSERT INTO public.ingredients (name, quantity, threshold_quantity, unit, price, category, storage_type, location_id) VALUES
  ('Pizza Dough', 500, 100, 'g', 3.99, 'Grains', 'Refrigerator', 1),
  ('Tomato Sauce', 300, 50, 'g', 2.49, 'Vegetables', 'Dry Storage', 1),
  ('Fresh Mozzarella', 350, 100, 'g', 4.99, 'Dairy', 'Refrigerator', 1),
  ('Fresh Basil Leaves', 15, 5, 'leaves', 1.99, 'Herbs', 'Refrigerator', 1),
  ('Olive Oil', 200, 50, 'ml', 8.99, 'Oils', 'Dry Storage', 1),
  ('Broccoli Florets', 400, 100, 'g', 2.99, 'Vegetables', 'Refrigerator', 1),
  ('Bell Peppers', 3, 2, 'medium', 1.5, 'Vegetables', 'Refrigerator', 1),
  ('Carrots', 1, 1, 'large', 0.75, 'Vegetables', 'Refrigerator', 1),
  ('Soy Sauce', 100, 25, 'ml', 3.49, 'Condiments', 'Dry Storage', 1),
  ('Sesame Oil', 50, 15, 'ml', 5.99, 'Oils', 'Dry Storage', 1),
  ('All-Purpose Flour', 1000, 200, 'g', 2.99, 'Grains', 'Dry Storage', 1),
  ('Unsalted Butter', 400, 1200, 'g', 4.49, 'Dairy', 'Refrigerator', 1),
  ('Brown Sugar', 300, 5000, 'g', 2.29, 'Sweeteners', 'Dry Storage', 1),
  ('Granulated Sugar', 500, 5000, 'g', 1.99, 'Sweeteners', 'Dry Storage', 1),
  ('Eggs', 6, 50, 'large', 3.49, 'Dairy', 'Refrigerator', 1),
  ('Chocolate Chips', 200, 5000, 'g', 3.99, 'Baking', 'Dry Storage', 1);

-- Insert recipes
INSERT INTO public.recipes (menu_item_id, standard_serving_pax, accessibility_notes) VALUES
  (1, 2, 'High contrast visual instructions available for each step.'),
  (2, 4, null),
  (3, 12, 'Audio instructions available for all steps. High contrast images for visual guidance.');

-- Insert recipe ingredients
INSERT INTO public.recipe_ingredients (recipe_id, ingredient_id, quantity_for_recipe) VALUES
  (1, 1, 300),
  (1, 2, 150),
  (1, 3, 200),
  (1, 4, 10),
  (1, 5, 15),
  (2, 6, 300),
  (2, 7, 2),
  (2, 8, 2),
  (2, 9, 45),
  (2, 10, 15),
  (3, 11, 280),
  (3, 12, 225),
  (3, 13, 200),
  (3, 14, 100),
  (3, 15, 2),
  (3, 16, 300);

-- Insert recipe steps
INSERT INTO public.recipe_steps (recipe_id, step_number, instruction, image_url, audio_url) VALUES
  (1, 1, 'Preheat the oven to 475°F (245°C) with a pizza stone inside if available.', '/placeholder.svg?height=200&width=300', null),
  (1, 2, 'Roll out the pizza dough on a floured surface to your desired thickness.', '/placeholder.svg?height=200&width=300', '/audio-instructions.mp3'),
  (1, 3, 'Spread the tomato sauce evenly over the dough, leaving a small border for the crust.', '/placeholder.svg?height=200&width=300', null),
  (1, 4, 'Tear the fresh mozzarella into pieces and distribute evenly over the sauce.', '/placeholder.svg?height=200&width=300', null),
  (1, 5, 'Drizzle with olive oil and bake for 10-12 minutes until the crust is golden and cheese is bubbly.', null, '/audio-instructions.mp3'),
  (1, 6, 'Remove from oven, top with fresh basil leaves, slice and serve immediately.', '/placeholder.svg?height=200&width=300', null),
  (2, 1, 'Wash and chop all vegetables into bite-sized pieces.', '/placeholder.svg?height=200&width=300', null),
  (2, 2, 'Heat a wok or large frying pan over high heat. Add sesame oil.', null, '/audio-instructions.mp3'),
  (2, 3, 'Add carrots and stir-fry for 2 minutes.', '/placeholder.svg?height=200&width=300', null),
  (2, 4, 'Add broccoli and bell peppers, stir-fry for another 3-4 minutes until vegetables are crisp-tender.', '/placeholder.svg?height=200&width=300', null),
  (2, 5, 'Add soy sauce and toss to coat. Serve immediately.', null, '/audio-instructions.mp3'),
  (3, 1, 'Preheat oven to 375°F (190°C). Line baking sheets with parchment paper.', '/placeholder.svg?height=200&width=300', '/audio-instructions.mp3'),
  (3, 2, 'In a large bowl, cream together butter and both sugars until light and fluffy.', '/placeholder.svg?height=200&width=300', '/audio-instructions.mp3'),
  (3, 3, 'Beat in eggs one at a time, then stir in vanilla.', '/placeholder.svg?height=200&width=300', null),
  (3, 4, 'Combine flour, baking soda, and salt; gradually add to the creamed mixture.', '/placeholder.svg?height=200&width=300', '/audio-instructions.mp3'),
  (3, 5, 'Fold in chocolate chips.', '/placeholder.svg?height=200&width=300', null),
  (3, 6, 'Drop by rounded tablespoons onto the prepared baking sheets.', '/placeholder.svg?height=200&width=300', '/audio-instructions.mp3'),
  (3, 7, 'Bake for 9-11 minutes until golden. Cool on baking sheets for 2 minutes before transferring to wire racks.', '/placeholder.svg?height=200&width=300', null);