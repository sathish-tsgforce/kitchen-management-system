-- Insert recipes, recipe ingredients and recipe steps

-- Insert recipes
INSERT INTO public.recipes (menu_item_id, standard_serving_pax, accessibility_notes) VALUES
((select id from public.menu_items where name='Tomato Pasta'), 35, 'Contains gluten from pasta'),
((select id from public.menu_items where name='Carbonara Pasta'), 35, 'Contains gluten from pasta, dairy from cream and cheese'),
((select id from public.menu_items where name='Mac & Cheese'), 20, 'Contains gluten from pasta, dairy from multiple cheeses'),
((select id from public.menu_items where name='Seasoning for Chicken Katsu'), 1, 'Seasoning blend - check for allergens'),
((select id from public.menu_items where name='Crispy Lemon Chicken Katsu'), 1, 'Contains gluten from flour coating'),
((select id from public.menu_items where name='Lemon Sauce'), 50, 'Citrus-based sauce'),
((select id from public.menu_items where name='Sweet & Sour Dory'), 70, 'Fish dish - check for fish allergies'),
((select id from public.menu_items where name='Sweet & Sour Sauce'), 35, 'Contains tomatoes and various vegetables'),
((select id from public.menu_items where name='Jasmine Rice'), 70, 'Plain rice dish - generally allergen-free');

-- Insert recipe ingredients
INSERT INTO public.recipe_ingredients (recipe_id, ingredient_id, quantity_for_recipe) VALUES
-- Tomato Pasta (recipe_id: 1)
(1, (SELECT id FROM ingredients WHERE name = 'Dolmio Tomato Pasta Sauce'), 2.5),
(1, (SELECT id FROM ingredients WHERE name = 'Onions'), 0.12),
(1, (SELECT id FROM ingredients WHERE name = 'Garlic'), 0.12),
(1, (SELECT id FROM ingredients WHERE name = 'Olive Oil'), 0.02),
(1, (SELECT id FROM ingredients WHERE name = 'Chicken Seasoning'), 0.03),
(1, (SELECT id FROM ingredients WHERE name = 'Italian Seasoning'), 0.03),
(1, (SELECT id FROM ingredients WHERE name = 'Spaghetti'), 2),
(1, (SELECT id FROM ingredients WHERE name = 'Cherry Tomatoes'), 0.5),

-- Carbonara Pasta (recipe_id: 2)
(2, (SELECT id FROM ingredients WHERE name = 'Onions'), 0.05),
(2, (SELECT id FROM ingredients WHERE name = 'Mushrooms'), 0.5),
(2, (SELECT id FROM ingredients WHERE name = 'Turkey Bacon'), 0.2),
(2, (SELECT id FROM ingredients WHERE name = 'Chicken Seasoning'), 0.045),
(2, (SELECT id FROM ingredients WHERE name = 'Thyme'), 0.005),
(2, (SELECT id FROM ingredients WHERE name = 'UHT Milk'), 1),
(2, (SELECT id FROM ingredients WHERE name = 'Heavy Cream'), 1),
(2, (SELECT id FROM ingredients WHERE name = 'Potato Starch'), 0.015),
(2, (SELECT id FROM ingredients WHERE name = 'Oyster Sauce'), 0.03),
(2, (SELECT id FROM ingredients WHERE name = 'Sea Salt'), 0.005),
(2, (SELECT id FROM ingredients WHERE name = 'Black Pepper'), 0.0025),

-- Mac & Cheese (recipe_id: 3)
(3, (SELECT id FROM ingredients WHERE name = 'Unsalted Butter'), 0.3),
(3, (SELECT id FROM ingredients WHERE name = 'Cream Cheese'), 0.3),
(3, (SELECT id FROM ingredients WHERE name = 'Mozzarella Cheese'), 1),
(3, (SELECT id FROM ingredients WHERE name = 'Cheddar Cheese'), 1),
(3, (SELECT id FROM ingredients WHERE name = 'Parmesan Cheese'), 0.6),
(3, (SELECT id FROM ingredients WHERE name = 'UHT Milk'), 2.5),
(3, (SELECT id FROM ingredients WHERE name = 'Evaporated Milk'), 1.56),
(3, (SELECT id FROM ingredients WHERE name = 'Sea Salt'), 0.025),
(3, (SELECT id FROM ingredients WHERE name = 'Black Pepper'), 0.04),
(3, (SELECT id FROM ingredients WHERE name = 'White Pepper'), 0.03),
(3, (SELECT id FROM ingredients WHERE name = 'Garlic Powder'), 0.035),
(3, (SELECT id FROM ingredients WHERE name = 'Plain Flour'), 0.3),
(3, (SELECT id FROM ingredients WHERE name = 'Macaroni'), 1.8),

-- Seasoning for Chicken Katsu (recipe_id: 4)
(4, (SELECT id FROM ingredients WHERE name = 'Sugar'), 0.1),
(4, (SELECT id FROM ingredients WHERE name = 'Sea Salt'), 0.1),
(4, (SELECT id FROM ingredients WHERE name = 'Black Pepper'), 0.05),

-- Crispy Lemon Chicken Katsu (recipe_id: 5)
(5, (SELECT id FROM ingredients WHERE name = 'Tapioca Flour'), 0.5),
(5, (SELECT id FROM ingredients WHERE name = 'Lemon'), 2),

-- Lemon Sauce (recipe_id: 6)
(6, (SELECT id FROM ingredients WHERE name = 'Sugar'), 0.1),
(6, (SELECT id FROM ingredients WHERE name = 'Lime Juice'), 0.5),
(6, (SELECT id FROM ingredients WHERE name = 'Tapioca Flour'), 0.045),
(6, (SELECT id FROM ingredients WHERE name = 'Lemon'), 4),

-- Sweet & Sour Dory (recipe_id: 7)
(7, (SELECT id FROM ingredients WHERE name = 'Dory Fillet'), 12),
(7, (SELECT id FROM ingredients WHERE name = 'Fresh Ginger'), 0.4),
(7, (SELECT id FROM ingredients WHERE name = 'Garlic'), 0.5),
(7, (SELECT id FROM ingredients WHERE name = 'Onions'), 0.5),
(7, (SELECT id FROM ingredients WHERE name = 'Oyster Sauce'), 0.18),
(7, (SELECT id FROM ingredients WHERE name = 'Sesame Oil'), 0.18),
(7, (SELECT id FROM ingredients WHERE name = 'Sugar'), 0.12),
(7, (SELECT id FROM ingredients WHERE name = 'White Pepper'), 0.03),
(7, (SELECT id FROM ingredients WHERE name = 'Chicken Seasoning'), 0.06),

-- Sweet & Sour Sauce (recipe_id: 8)
(8, (SELECT id FROM ingredients WHERE name = 'Dolmio Tomato Pasta Sauce'), 0.49),
(8, (SELECT id FROM ingredients WHERE name = 'Oyster Sauce'), 0.26),
(8, (SELECT id FROM ingredients WHERE name = 'Vinegar'), 0.03),
(8, (SELECT id FROM ingredients WHERE name = 'Sugar'), 0.015),
(8, (SELECT id FROM ingredients WHERE name = 'Onions'), 0.1),
(8, (SELECT id FROM ingredients WHERE name = 'Garlic'), 0.05),
(8, (SELECT id FROM ingredients WHERE name = 'Cherry Tomatoes'), 0.2),
(8, (SELECT id FROM ingredients WHERE name = 'Green Bell Pepper'), 1),
(8, (SELECT id FROM ingredients WHERE name = 'Yellow Bell Pepper'), 1),
(8, (SELECT id FROM ingredients WHERE name = 'Cucumber'), 1),
(8, (SELECT id FROM ingredients WHERE name = 'Canned Pineapple'), 1),

-- Jasmine Rice (recipe_id: 9)
(9, (SELECT id FROM ingredients WHERE name = 'Unsalted Butter'), 0.5),
(9, (SELECT id FROM ingredients WHERE name = 'Jasmine Rice'), 3),
(9, (SELECT id FROM ingredients WHERE name = 'Sea Salt'), 0.005),
(9, (SELECT id FROM ingredients WHERE name = 'Cooking Oil'), 0.015);

-- Insert recipe steps
INSERT INTO public.recipe_steps (recipe_id, step_number, instruction) VALUES
-- Tomato Pasta steps
(1, 1, 'Stir fry onion until fragrant, then add garlic and cook for another 5 minutes'),
(1, 2, 'Pour in tomato sauce and add two bottles of water using the Dolmio bottle as gauge'),
(1, 3, 'Add seasoning and minced cherry tomatoes, cook until boiling'),
(1, 4, 'Cook 4 packs of pasta in boiling water for 10 minutes with a dash of salt and 1 TBSP cooking oil'),
(1, 5, 'Drain boiling water and blanch pasta in ice water for 5 minutes or until ice melts'),
(1, 6, 'Drain cold water, put pasta in warmer and mix well with 20ml olive oil'),

-- Carbonara Pasta steps
(2, 1, 'Heat cooking oil in pot, add turkey and onion, fry until fragrant'),
(2, 2, 'Add mushrooms and continue cooking'),
(2, 3, 'Pour in milk and cream, add all seasonings'),
(2, 4, 'Cook until boiled, then simmer on low heat for 10 minutes'),
(2, 5, 'Add potato starch mixed with water until sauce thickens slightly'),
(2, 6, 'Cook 4 packs of pasta in boiling water for 11 minutes with salt and cooking oil'),
(2, 7, 'Drain and blanch pasta in ice water until ice melts, then mix with olive oil'),

-- Mac & Cheese steps
(3, 1, 'Cook macaroni for 8 minutes in boiling water, drain and soak in ice water until ice melts'),
(3, 2, 'Melt butter and cream cheese, boil 500ml water'),
(3, 3, 'Add black pepper, white pepper, salt, garlic powder to melted mixture'),
(3, 4, 'Add evaporated milk and flour, cook on low heat'),
(3, 5, 'Place 90g cooked macaroni in aluminum tray'),
(3, 6, 'Layer with mozzarella, cheddar, and parmesan cheese, add sauce'),
(3, 7, 'Bake at 175°C for 11 minutes'),

-- Seasoning for Chicken Katsu steps
(4, 1, 'Mix sugar, salt, and pepper in ratio 1:1:0.5'),

-- Crispy Lemon Chicken Katsu steps
(5, 1, 'Coat marinated chicken katsu fillet with tapioca flour'),
(5, 2, 'Deep fry at 165°C for 4.5 minutes or until well fried'),
(5, 3, 'Place sliced lemon on top when serving or packing bento'),

-- Lemon Sauce steps
(6, 1, 'Grate lemon skin and squeeze juice from lemons'),
(6, 2, 'Cook all ingredients on low heat'),
(6, 3, 'Add tapioca flour until mixture reaches sauce texture'),

-- Sweet & Sour Dory steps
(7, 1, 'Mix all ingredients together'),
(7, 2, 'Marinate overnight in chiller'),
(7, 3, 'Cook in combi oven at 110°C with 100% moisture for 15 minutes'),

-- Sweet & Sour Sauce steps
(8, 1, 'Dice onion and garlic'),
(8, 2, 'Fry onion and garlic until fragrant'),
(8, 3, 'Add pineapple and continue cooking until fragrant'),
(8, 4, 'Add sauce and remaining ingredients'),
(8, 5, 'Cook until boiling'),

-- Jasmine Rice steps
(9, 1, 'Rinse rice once'),
(9, 2, 'Add 24 bowls of water, salt, and cooking oil'),
(9, 3, 'Cook in combi oven at 110°C for 35 minutes with 100% moisture');