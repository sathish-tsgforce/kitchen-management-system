-- Insert recipes batch 3, recipe ingredients and recipe steps

-- Insert recipes
INSERT INTO public.recipes (menu_item_id, standard_serving_pax, accessibility_notes) VALUES
(20, 50, 'Contains various spices and curry powder'),
(21, 40, 'Contains fish, fermented black beans'),
(22, 70, 'Contains fish, sesame oil'),
(23, 50, 'Spicy tamarind paste - contains chili'),
(24, 50, 'Contains pineapple, cucumber, spices'),
(25, 5, 'Contains nuts, dairy from milk, saffron'),
(26, 25, 'Contains lemon, various herbs and spices'),
(27, 70, 'Contains dairy from butter'),
(28, 50, 'Mixed vegetables with olive oil'),
(29, 70, 'Contains chicken, various seasonings'),
(30, 35, 'Contains chicken broth, ginger, garlic'),
(31, 35, 'Spicy chili paste - very hot'),
(32, 70, 'Contains sesame oil, five spice powder'),
(33, 50, 'Contains mushrooms, taro, soy sauce'),
(34, 50, 'Contains peanuts, prawn paste - very spicy'),
(35, 40, 'Contains curry block, honey'),
(36, 70, 'Contains coconut cream, curry spices'),
(37, 1, 'Contains eggs, gluten from breadcrumbs'),
(38, 50, 'Contains fermented prawn paste'),
(39, 70, 'Contains fish, lemon pepper seasoning'),
(40, 50, 'Contains turmeric, coconut milk'),
(41, 50, 'Contains coconut milk, various spices'),
(42, 50, 'Contains ginger, scallion'),
(43, 50, 'Ginger scallion dipping sauce'),
(44, 10, 'Contains tempeh, vegetarian oyster sauce'),
(45, 40, 'Contains kecap manis, candlenuts'),
(46, 1, 'Contains tempeh, tamarind, palm sugar'),
(47, 1, 'Contains honey, soy sauce, sesame oil');

-- Insert recipe ingredients
INSERT INTO public.recipe_ingredients (recipe_id, ingredient_id, quantity_for_recipe) VALUES
-- Curry Chicken Sauce (recipe_id: 20)
(20, (SELECT id FROM ingredients WHERE name = 'Baba Meat Curry Powder'), 0.375),
(20, (SELECT id FROM ingredients WHERE name = 'Coriander Powder'), 0.03),
(20, (SELECT id FROM ingredients WHERE name = 'Turmeric Powder'), 0.01),
(20, (SELECT id FROM ingredients WHERE name = 'Rendang Paste'), 0.6),
(20, (SELECT id FROM ingredients WHERE name = 'Onions'), 2),
(20, (SELECT id FROM ingredients WHERE name = 'Garlic'), 0.6),
(20, (SELECT id FROM ingredients WHERE name = 'Lemongrass'), 0.3),
(20, (SELECT id FROM ingredients WHERE name = 'Galangal'), 0.2),
(20, (SELECT id FROM ingredients WHERE name = 'Cooking Oil'), 1.2),
(20, (SELECT id FROM ingredients WHERE name = 'Light Soy Sauce'), 0.45),
(20, (SELECT id FROM ingredients WHERE name = 'Brown Sugar'), 0.2),
(20, (SELECT id FROM ingredients WHERE name = 'Sea Salt'), 0.02),
(20, (SELECT id FROM ingredients WHERE name = 'Ajinomoto'), 0.015),
(20, (SELECT id FROM ingredients WHERE name = 'Curry Leaves'), 0.016),
(20, (SELECT id FROM ingredients WHERE name = 'Lime Leaves'), 0.015),

-- Black Bean Fish (recipe_id: 21)
(21, (SELECT id FROM ingredients WHERE name = 'Dory Fillet'), 6),
(21, (SELECT id FROM ingredients WHERE name = 'Fresh Ginger'), 0.2),
(21, (SELECT id FROM ingredients WHERE name = 'Garlic'), 0.25),
(21, (SELECT id FROM ingredients WHERE name = 'Onions'), 0.25),
(21, (SELECT id FROM ingredients WHERE name = 'Fermented Black Beans'), 0.1),
(21, (SELECT id FROM ingredients WHERE name = 'Sesame Oil'), 0.215),
(21, (SELECT id FROM ingredients WHERE name = 'Fermented Black Bean Sauce'), 0.25),
(21, (SELECT id FROM ingredients WHERE name = 'Sugar'), 0.06),
(21, (SELECT id FROM ingredients WHERE name = 'White Pepper'), 0.015),

-- Assam Fish (recipe_id: 22)
(22, (SELECT id FROM ingredients WHERE name = 'Dory Fillet'), 12),
(22, (SELECT id FROM ingredients WHERE name = 'Fresh Ginger'), 0.4),
(22, (SELECT id FROM ingredients WHERE name = 'Garlic'), 0.5),
(22, (SELECT id FROM ingredients WHERE name = 'Onions'), 0.5),
(22, (SELECT id FROM ingredients WHERE name = 'Oyster Sauce'), 0.18),
(22, (SELECT id FROM ingredients WHERE name = 'Sesame Oil'), 0.18),
(22, (SELECT id FROM ingredients WHERE name = 'Sugar'), 0.12),
(22, (SELECT id FROM ingredients WHERE name = 'White Pepper'), 0.03),
(22, (SELECT id FROM ingredients WHERE name = 'Chicken Seasoning'), 0.06),

-- Assam Paste (recipe_id: 23)
(23, (SELECT id FROM ingredients WHERE name = 'Singlong Sambal Chilli'), 0.23),
(23, (SELECT id FROM ingredients WHERE name = 'Assam Java'), 0.35),
(23, (SELECT id FROM ingredients WHERE name = 'Sugar'), 0.075),
(23, (SELECT id FROM ingredients WHERE name = 'Chicken Seasoning'), 0.01),

-- Achar Nanas Timun (recipe_id: 24)
(24, (SELECT id FROM ingredients WHERE name = 'Canned Pineapple'), 8),
(24, (SELECT id FROM ingredients WHERE name = 'Japanese Cucumber'), 8),
(24, (SELECT id FROM ingredients WHERE name = 'Fresh Long Chili'), 0.1),
(24, (SELECT id FROM ingredients WHERE name = 'Sugar'), 0.12),
(24, (SELECT id FROM ingredients WHERE name = 'Sea Salt'), 0.04),
(24, (SELECT id FROM ingredients WHERE name = 'Cinnamon Stick'), 0.04),
(24, (SELECT id FROM ingredients WHERE name = 'Cloves'), 0.008),

-- Nasi Minak (recipe_id: 25)
(25, (SELECT id FROM ingredients WHERE name = 'Ghee'), 0.045),
(25, (SELECT id FROM ingredients WHERE name = 'Cloves'), 0.002),
(25, (SELECT id FROM ingredients WHERE name = 'Cardamom'), 0.004),
(25, (SELECT id FROM ingredients WHERE name = 'Cinnamon Stick'), 0.025),
(25, (SELECT id FROM ingredients WHERE name = 'Onions'), 0.2),
(25, (SELECT id FROM ingredients WHERE name = 'Garlic'), 0.02),
(25, (SELECT id FROM ingredients WHERE name = 'Basmati Rice'), 0.45),
(25, (SELECT id FROM ingredients WHERE name = 'Chicken Broth'), 0.7),
(25, (SELECT id FROM ingredients WHERE name = 'Evaporated Milk'), 0.2),
(25, (SELECT id FROM ingredients WHERE name = 'Saffron Threads'), 0.001),
(25, (SELECT id FROM ingredients WHERE name = 'Sea Salt'), 0.005),
(25, (SELECT id FROM ingredients WHERE name = 'Shallots'), 0.1),
(25, (SELECT id FROM ingredients WHERE name = 'Golden Raisins'), 0.05),
(25, (SELECT id FROM ingredients WHERE name = 'Raw Cashews'), 0.05),
(25, (SELECT id FROM ingredients WHERE name = 'Coriander Leaves'), 0.02),

-- Grilled Lemon Thyme Chicken (recipe_id: 26)
(26, (SELECT id FROM ingredients WHERE name = 'Chicken Leg With Bone'), 8),
(26, (SELECT id FROM ingredients WHERE name = 'Olive Oil'), 0.18),
(26, (SELECT id FROM ingredients WHERE name = 'Unsalted Butter'), 0.25),
(26, (SELECT id FROM ingredients WHERE name = 'Lemon Pepper Seasoning'), 0.03),
(26, (SELECT id FROM ingredients WHERE name = 'Oregano'), 0.015),
(26, (SELECT id FROM ingredients WHERE name = 'Thyme'), 0.03),
(26, (SELECT id FROM ingredients WHERE name = 'Onion Powder'), 0.03),
(26, (SELECT id FROM ingredients WHERE name = 'Garlic Powder'), 0.03),
(26, (SELECT id FROM ingredients WHERE name = 'Black Pepper'), 0.0075),
(26, (SELECT id FROM ingredients WHERE name = 'Sea Salt'), 0.015),
(26, (SELECT id FROM ingredients WHERE name = 'Sugar'), 0.03),
(26, (SELECT id FROM ingredients WHERE name = 'Lemon'), 1),
(26, (SELECT id FROM ingredients WHERE name = 'Chicken Seasoning'), 0.0075),

-- Butter Rice (recipe_id: 27)
(27, (SELECT id FROM ingredients WHERE name = 'Unsalted Butter'), 1.25),
(27, (SELECT id FROM ingredients WHERE name = 'Jasmine Rice'), 6),
(27, (SELECT id FROM ingredients WHERE name = 'Sea Salt'), 0.005),
(27, (SELECT id FROM ingredients WHERE name = 'Cooking Oil'), 0.015),

-- Baby Carrots and Asparagus (recipe_id: 28)
(28, (SELECT id FROM ingredients WHERE name = 'Olive Oil'), 0.75),
(28, (SELECT id FROM ingredients WHERE name = 'Sea Salt'), 0.045),
(28, (SELECT id FROM ingredients WHERE name = 'Sugar'), 0.045),
(28, (SELECT id FROM ingredients WHERE name = 'Mixed Herbs'), 0.09),
(28, (SELECT id FROM ingredients WHERE name = 'Black Pepper'), 0.0225),
(28, (SELECT id FROM ingredients WHERE name = 'Baby Carrots'), 1.5),
(28, (SELECT id FROM ingredients WHERE name = 'Asparagus'), 1.8),
(28, (SELECT id FROM ingredients WHERE name = 'Red Bell Pepper'), 6),
(28, (SELECT id FROM ingredients WHERE name = 'Yellow Bell Pepper'), 6),
(28, (SELECT id FROM ingredients WHERE name = 'Zucchini'), 3),

-- Steamed Chicken (recipe_id: 29)
(29, (SELECT id FROM ingredients WHERE name = 'Boneless Chicken Leg'), 12),
(29, (SELECT id FROM ingredients WHERE name = 'Chicken Seasoning'), 0.06),
(29, (SELECT id FROM ingredients WHERE name = 'White Pepper'), 0.06),
(29, (SELECT id FROM ingredients WHERE name = 'Oyster Sauce'), 0.06),
(29, (SELECT id FROM ingredients WHERE name = 'Coriander Leaves'), 0.1),
(29, (SELECT id FROM ingredients WHERE name = 'Cherry Tomatoes'), 1),
(29, (SELECT id FROM ingredients WHERE name = 'Cucumber'), 1.25),
(29, (SELECT id FROM ingredients WHERE name = 'Tapioca Flour'), 0.045),

-- Chicken Rice (recipe_id: 30)
(30, (SELECT id FROM ingredients WHERE name = 'Jasmine Rice'), 2),
(30, (SELECT id FROM ingredients WHERE name = 'Chicken Broth'), 2),
(30, (SELECT id FROM ingredients WHERE name = 'Sea Salt'), 0.025),
(30, (SELECT id FROM ingredients WHERE name = 'Cooking Oil'), 0.15),
(30, (SELECT id FROM ingredients WHERE name = 'Fresh Ginger'), 0.15),
(30, (SELECT id FROM ingredients WHERE name = 'Garlic'), 0.1),
(30, (SELECT id FROM ingredients WHERE name = 'Shallots'), 0.1),
(30, (SELECT id FROM ingredients WHERE name = 'Green Onion'), 0.05),

-- Chicken Rice Chilli Paste (recipe_id: 31)
(31, (SELECT id FROM ingredients WHERE name = 'Singlong Chicken Rice Chilli'), 0.46),
(31, (SELECT id FROM ingredients WHERE name = 'Sugar'), 0.092),
(31, (SELECT id FROM ingredients WHERE name = 'Garlic'), 0.075),
(31, (SELECT id FROM ingredients WHERE name = 'Chicken Seasoning'), 0.07),
(31, (SELECT id FROM ingredients WHERE name = 'Ajinomoto'), 0.004),
(31, (SELECT id FROM ingredients WHERE name = 'Knorr Lime Powder'), 0.019),

-- 5 Spices Chicken (recipe_id: 32)
(32, (SELECT id FROM ingredients WHERE name = 'Boneless Chicken Leg'), 12),
(32, (SELECT id FROM ingredients WHERE name = 'Garlic'), 0.47),
(32, (SELECT id FROM ingredients WHERE name = 'Five Spice Powder'), 0.06),
(32, (SELECT id FROM ingredients WHERE name = 'Sesame Oil'), 0.06),
(32, (SELECT id FROM ingredients WHERE name = 'Oyster Sauce'), 0.345),
(32, (SELECT id FROM ingredients WHERE name = 'Sugar'), 0.345),
(32, (SELECT id FROM ingredients WHERE name = 'Roasted White Sesame Seeds'), 0.05),

-- Yam Rice (recipe_id: 33)
(33, (SELECT id FROM ingredients WHERE name = 'Jasmine Rice'), 5),
(33, (SELECT id FROM ingredients WHERE name = 'Cooking Oil'), 0.5625),
(33, (SELECT id FROM ingredients WHERE name = 'Onions'), 2.5),
(33, (SELECT id FROM ingredients WHERE name = 'Garlic'), 0.75),
(33, (SELECT id FROM ingredients WHERE name = 'Dried Shiitake Mushrooms'), 0.125),
(33, (SELECT id FROM ingredients WHERE name = 'Taro'), 3.759),
(33, (SELECT id FROM ingredients WHERE name = 'Sea Salt'), 0.0625),
(33, (SELECT id FROM ingredients WHERE name = 'White Pepper'), 0.01),
(33, (SELECT id FROM ingredients WHERE name = 'Oyster Sauce'), 0.1875),
(33, (SELECT id FROM ingredients WHERE name = 'Dark Soy Sauce'), 0.1875),
(33, (SELECT id FROM ingredients WHERE name = 'Light Soy Sauce'), 0.1875),
(33, (SELECT id FROM ingredients WHERE name = 'Sugar'), 0.0625),
(33, (SELECT id FROM ingredients WHERE name = 'Green Onion'), 0.1),
(33, (SELECT id FROM ingredients WHERE name = 'Coriander Leaves'), 0.05),
(33, (SELECT id FROM ingredients WHERE name = 'Fried Shallots'), 0.1),

-- Chinese Rojak (recipe_id: 34)
(34, (SELECT id FROM ingredients WHERE name = 'Sugar'), 1.3125),
(34, (SELECT id FROM ingredients WHERE name = 'Sea Salt'), 0.0625),
(34, (SELECT id FROM ingredients WHERE name = 'Dried Chili Paste'), 0.375),
(34, (SELECT id FROM ingredients WHERE name = 'Black Prawn Paste'), 0.375),
(34, (SELECT id FROM ingredients WHERE name = 'Cucumber'), 2.125),
(34, (SELECT id FROM ingredients WHERE name = 'Bean Sprouts'), 1.44),
(34, (SELECT id FROM ingredients WHERE name = 'Chinese Turnip'), 2.125),
(34, (SELECT id FROM ingredients WHERE name = 'Pineapple'), 2.125),
(34, (SELECT id FROM ingredients WHERE name = 'Kangkong'), 1.44),
(34, (SELECT id FROM ingredients WHERE name = 'Lime Juice'), 0.1875),
(34, (SELECT id FROM ingredients WHERE name = 'Tamarind Water'), 0.75),
(34, (SELECT id FROM ingredients WHERE name = 'Fried Bean Curd'), 62.5),

-- Jap Curry Sauce (recipe_id: 35)
(35, (SELECT id FROM ingredients WHERE name = 'Cooking Oil'), 0.1125),
(35, (SELECT id FROM ingredients WHERE name = 'Chicken Broth'), 5),
(35, (SELECT id FROM ingredients WHERE name = 'Honey'), 0.075),
(35, (SELECT id FROM ingredients WHERE name = 'Light Soy Sauce'), 0.075),
(35, (SELECT id FROM ingredients WHERE name = 'Ketchup'), 0.075),
(35, (SELECT id FROM ingredients WHERE name = 'Japanese Curry Block'), 1),
(35, (SELECT id FROM ingredients WHERE name = 'Onions'), 2),
(35, (SELECT id FROM ingredients WHERE name = 'Carrots'), 1),
(35, (SELECT id FROM ingredients WHERE name = 'Potatoes'), 2),
(35, (SELECT id FROM ingredients WHERE name = 'Fresh Ginger'), 0.025),
(35, (SELECT id FROM ingredients WHERE name = 'Garlic'), 0.1),
(35, (SELECT id FROM ingredients WHERE name = 'Apple'), 0.625),

-- Jap Curry Chicken (recipe_id: 36)
(36, (SELECT id FROM ingredients WHERE name = 'Boneless Chicken Leg'), 12),
(36, (SELECT id FROM ingredients WHERE name = 'Chicken Seasoning'), 0.035),
(36, (SELECT id FROM ingredients WHERE name = 'Sea Salt'), 0.032),
(36, (SELECT id FROM ingredients WHERE name = 'Sugar'), 0.1),
(36, (SELECT id FROM ingredients WHERE name = 'Ajinomoto'), 0.006),
(36, (SELECT id FROM ingredients WHERE name = 'Garlic'), 0.05),
(36, (SELECT id FROM ingredients WHERE name = 'Onions'), 0.12),
(36, (SELECT id FROM ingredients WHERE name = 'Lemongrass'), 0.1),
(36, (SELECT id FROM ingredients WHERE name = 'Galangal'), 0.05),
(36, (SELECT id FROM ingredients WHERE name = 'Turmeric Powder'), 0.01),
(36, (SELECT id FROM ingredients WHERE name = 'Coriander Powder'), 0.012),
(36, (SELECT id FROM ingredients WHERE name = 'Cumin Powder'), 0.005),
(36, (SELECT id FROM ingredients WHERE name = 'Baba Curry Powder'), 0.008),
(36, (SELECT id FROM ingredients WHERE name = 'Coconut Cream'), 0.5),

-- Hainanese Chicken Cutlet (recipe_id: 37)
(37, (SELECT id FROM ingredients WHERE name = 'Tapioca Flour'), 0.5),
(37, (SELECT id FROM ingredients WHERE name = 'Eggs'), 12),
(37, (SELECT id FROM ingredients WHERE name = 'Bread Crumbs'), 0.5),

-- Prawn Paste Chicken Drumlets (recipe_id: 38)
(38, (SELECT id FROM ingredients WHERE name = 'Frozen Chicken Drumlets'), 12),
(38, (SELECT id FROM ingredients WHERE name = 'Fermented Prawn Paste'), 0.4),
(38, (SELECT id FROM ingredients WHERE name = 'Sugar'), 0.12),
(38, (SELECT id FROM ingredients WHERE name = 'White Pepper'), 0.17),
(38, (SELECT id FROM ingredients WHERE name = 'Fresh Ginger'), 0.1),

-- Lemon Pepper Dory (recipe_id: 39)
(39, (SELECT id FROM ingredients WHERE name = 'Dory Fillet'), 12),
(39, (SELECT id FROM ingredients WHERE name = 'Olive Oil'), 0.18),
(39, (SELECT id FROM ingredients WHERE name = 'Unsalted Butter'), 0.25),
(39, (SELECT id FROM ingredients WHERE name = 'Lemon Pepper Seasoning'), 0.03),
(39, (SELECT id FROM ingredients WHERE name = 'Oregano'), 0.015),
(39, (SELECT id FROM ingredients WHERE name = 'Thyme'), 0.03),
(39, (SELECT id FROM ingredients WHERE name = 'Onion Powder'), 0.03),
(39, (SELECT id FROM ingredients WHERE name = 'Garlic Powder'), 0.03),
(39, (SELECT id FROM ingredients WHERE name = 'Black Pepper'), 0.0075),
(39, (SELECT id FROM ingredients WHERE name = 'Sea Salt'), 0.015),
(39, (SELECT id FROM ingredients WHERE name = 'Sugar'), 0.03),
(39, (SELECT id FROM ingredients WHERE name = 'Lemon'), 5),

-- Turmeric Rice (recipe_id: 40)
(40, (SELECT id FROM ingredients WHERE name = 'Jasmine Rice'), 4.8),
(40, (SELECT id FROM ingredients WHERE name = 'Turmeric Powder'), 0.18),
(40, (SELECT id FROM ingredients WHERE name = 'Coconut Milk'), 3),
(40, (SELECT id FROM ingredients WHERE name = 'Sea Salt'), 0.015),
(40, (SELECT id FROM ingredients WHERE name = 'Chicken Seasoning'), 0.015),
(40, (SELECT id FROM ingredients WHERE name = 'Pandan Leaves'), 0.5),
(40, (SELECT id FROM ingredients WHERE name = 'Fried Shallots'), 0.1),

-- Chicken Rendang (recipe_id: 41)
(41, (SELECT id FROM ingredients WHERE name = 'Boneless Chicken Leg'), 10),
(41, (SELECT id FROM ingredients WHERE name = 'Cooking Oil'), 1.0425),
(41, (SELECT id FROM ingredients WHERE name = 'Cinnamon Stick'), 0.0625),
(41, (SELECT id FROM ingredients WHERE name = 'Cloves'), 0.01875),
(41, (SELECT id FROM ingredients WHERE name = 'Star Anise'), 0.01875),
(41, (SELECT id FROM ingredients WHERE name = 'Cardamom'), 0.01875),
(41, (SELECT id FROM ingredients WHERE name = 'Lemongrass'), 0.625),
(41, (SELECT id FROM ingredients WHERE name = 'Coconut Milk'), 3.125),
(41, (SELECT id FROM ingredients WHERE name = 'Lime Leaves'), 0.062),
(41, (SELECT id FROM ingredients WHERE name = 'Toasted Grated Coconut'), 0.9375),
(41, (SELECT id FROM ingredients WHERE name = 'Sugar'), 0.1875),
(41, (SELECT id FROM ingredients WHERE name = 'Sea Salt'), 0.02),
(41, (SELECT id FROM ingredients WHERE name = 'Shallots'), 1.5),
(41, (SELECT id FROM ingredients WHERE name = 'Galangal'), 0.3125),
(41, (SELECT id FROM ingredients WHERE name = 'Garlic'), 1),
(41, (SELECT id FROM ingredients WHERE name = 'Fresh Ginger'), 0.3125),
(41, (SELECT id FROM ingredients WHERE name = 'Dried Chilies'), 0.125),

-- Sand Ginger Chicken (recipe_id: 42)
(42, (SELECT id FROM ingredients WHERE name = 'Boneless Chicken Leg'), 10),
(42, (SELECT id FROM ingredients WHERE name = 'Fresh Ginger'), 0.5),
(42, (SELECT id FROM ingredients WHERE name = 'Scallion'), 0.25),
(42, (SELECT id FROM ingredients WHERE name = 'Sand Ginger Powder'), 0.125),
(42, (SELECT id FROM ingredients WHERE name = 'Chicken Broth'), 0.09),
(42, (SELECT id FROM ingredients WHERE name = 'Black Pepper'), 0.01),
(42, (SELECT id FROM ingredients WHERE name = 'Sea Salt'), 0.01),

-- Sand Ginger Chicken Dipping Sauce (recipe_id: 43)
(43, (SELECT id FROM ingredients WHERE name = 'Fresh Ginger'), 0.1875),
(43, (SELECT id FROM ingredients WHERE name = 'Scallion'), 0.375),
(43, (SELECT id FROM ingredients WHERE name = 'Vegetable Oil'), 0.375),
(43, (SELECT id FROM ingredients WHERE name = 'Sea Salt'), 0.01),
(43, (SELECT id FROM ingredients WHERE name = 'Light Soy Sauce'), 0.05),

-- Fried Oyster Tempeh (recipe_id: 44)
(44, (SELECT id FROM ingredients WHERE name = 'Tempeh'), 5),
(44, (SELECT id FROM ingredients WHERE name = 'Sea Salt'), 0.005),
(44, (SELECT id FROM ingredients WHERE name = 'Sugar'), 0.005),
(44, (SELECT id FROM ingredients WHERE name = 'Black Pepper'), 0.005),
(44, (SELECT id FROM ingredients WHERE name = 'Turmeric Powder'), 0.005),
(44, (SELECT id FROM ingredients WHERE name = 'Vegetarian Oyster Sauce'), 0.005),
(44, (SELECT id FROM ingredients WHERE name = 'Tapioca Flour'), 0.1),

-- Kecap Manis Glazed Chicken (recipe_id: 45)
(45, (SELECT id FROM ingredients WHERE name = 'Boneless Chicken Leg'), 6),
(45, (SELECT id FROM ingredients WHERE name = 'Sea Salt'), 0.08),
(45, (SELECT id FROM ingredients WHERE name = 'Lime Juice'), 0.24),
(45, (SELECT id FROM ingredients WHERE name = 'Cooking Oil'), 0.068),
(45, (SELECT id FROM ingredients WHERE name = 'Candlenuts'), 0.04),
(45, (SELECT id FROM ingredients WHERE name = 'Shallots'), 0.32),
(45, (SELECT id FROM ingredients WHERE name = 'Garlic'), 0.08),
(45, (SELECT id FROM ingredients WHERE name = 'Sugar'), 0.04),
(45, (SELECT id FROM ingredients WHERE name = 'White Pepper'), 0.02),
(45, (SELECT id FROM ingredients WHERE name = 'Lime Leaves'), 0.006),
(45, (SELECT id FROM ingredients WHERE name = 'Kecap Manis'), 1.4),
(45, (SELECT id FROM ingredients WHERE name = 'Fried Shallots'), 0.05),

-- Baked Tamarind Glazed Tempeh (recipe_id: 46)
(46, (SELECT id FROM ingredients WHERE name = 'Tempeh'), 1),
(46, (SELECT id FROM ingredients WHERE name = 'Vegetable Oil'), 0.075),
(46, (SELECT id FROM ingredients WHERE name = 'Shallots'), 0.05),
(46, (SELECT id FROM ingredients WHERE name = 'Garlic'), 0.02),
(46, (SELECT id FROM ingredients WHERE name = 'Galangal'), 0.015),
(46, (SELECT id FROM ingredients WHERE name = 'Lime Leaves'), 0.002),
(46, (SELECT id FROM ingredients WHERE name = 'Lemongrass'), 0.01),
(46, (SELECT id FROM ingredients WHERE name = 'Sambal'), 0.01),
(46, (SELECT id FROM ingredients WHERE name = 'Tamarind Water'), 0.06),
(46, (SELECT id FROM ingredients WHERE name = 'Palm Sugar'), 0.045),
(46, (SELECT id FROM ingredients WHERE name = 'Sea Salt'), 0.00025),

-- Grilled Honey Chicken Drumlets (recipe_id: 47)
(47, (SELECT id FROM ingredients WHERE name = 'Frozen Chicken Drumlets'), 1),
(47, (SELECT id FROM ingredients WHERE name = 'Honey'), 0.03),
(47, (SELECT id FROM ingredients WHERE name = 'Dark Soy Sauce'), 0.03),
(47, (SELECT id FROM ingredients WHERE name = 'White Pepper'), 0.005),
(47, (SELECT id FROM ingredients WHERE name = 'Five Spice Powder'), 0.0025),
(47, (SELECT id FROM ingredients WHERE name = 'Sea Salt'), 0.005),
(47, (SELECT id FROM ingredients WHERE name = 'Sesame Oil'), 0.01);

-- Insert recipe steps
INSERT INTO public.recipe_steps (recipe_id, step_number, instruction) VALUES
-- Curry Chicken Sauce steps
(20, 1, 'Mix Baba meat curry powder, coriander powder and turmeric powder with 450ml water, set paste aside'),
(20, 2, 'Cook onions under medium heat to remove moisture for 20-25 minutes'),
(20, 3, 'Add cooking oil, garlic, lemongrass, galangal and cook for 30-35 minutes with constant stirring'),
(20, 4, 'Pour in curry powder mixture and rendang paste, stir well and cook 25-30 minutes'),
(20, 5, 'Add soy sauce, sugar, salt, ajinomoto, curry and kaffir leaves, cook 20-25 minutes'),
(20, 6, 'Let paste cool before storing in chiller or freezer'),
(20, 7, 'For reconstitution: mix 1kg paste with 900ml water, 375g evaporated milk, 600ml coconut milk'),

-- Black Bean Fish steps
(21, 1, 'Mix all ingredients together'),
(21, 2, 'Marinate overnight in chiller'),

-- Assam Fish steps
(22, 1, 'Mix all ingredients together'),
(22, 2, 'Marinate overnight in chiller'),
(22, 3, 'Cook in combi oven at 110°C with 100% moisture for 15 minutes'),

-- Assam Paste steps
(23, 1, 'Add 200ml water and mix with assam'),
(23, 2, 'Add remaining ingredients and cook until warm'),

-- Achar Nanas Timun steps
(24, 1, 'Prepare vegetables and fruits - cucumber, pineapple and chilies'),
(24, 2, 'Place pineapple in saucepan with chilies, sugar, salt, cinnamon and cloves'),
(24, 3, 'Cook until sugar dissolves, stirring occasionally'),
(24, 4, 'Let cool then add cucumber slices'),
(24, 5, 'Serve at room temperature or cold on same day'),

-- Nasi Minak steps
(25, 1, 'Heat oil and ghee, add cloves, cardamom, cinnamon until fragrant'),
(25, 2, 'Add onion and cook until soft and lightly colored'),
(25, 3, 'Add garlic until fragrant, then add rice and coat with spices'),
(25, 4, 'Add chicken stock, milk, saffron and salt, cook in combi oven'),
(25, 5, 'Let rice rest for 15 minutes without opening lid'),
(25, 6, 'Fry shallots, raisins and nuts separately until golden'),
(25, 7, 'Fluff rice and garnish with fried ingredients and coriander'),

-- Grilled Lemon Thyme Chicken steps
(26, 1, 'Mix all ingredients well in mixing bowl'),
(26, 2, 'Marinate chicken overnight in chiller'),
(26, 3, 'Grill at 165°C for 23 minutes with 50% moisture'),
(26, 4, 'Collect oil from tray and drizzle on chicken before serving'),

-- Butter Rice steps
(27, 1, 'Melt 5 blocks of butter (250g each)'),
(27, 2, 'Rinse rice once'),
(27, 3, 'Add 35 bowls water, salt and cooking oil'),
(27, 4, 'Cook in combi oven at 110°C for 35 minutes with 100% moisture'),

-- Baby Carrots and Asparagus steps
(28, 1, 'Blanch baby carrots in hot water for 10 minutes'),
(28, 2, 'Mix oil and seasonings in mixing bowl'),
(28, 3, 'Add vegetables and mix well'),
(28, 4, 'Grill in combi oven for 6 minutes at 200°C'),

-- Steamed Chicken steps
(29, 1, 'Mix all ingredients and marinate overnight in chiller'),
(29, 2, 'Grill chicken in combi oven at 115°C with 100% moisture for 20 minutes'),
(29, 3, 'Mix chicken oil with tapioca flour to thicken into sauce'),
(29, 4, 'Drizzle sauce on chicken when serving'),
(29, 5, 'Garnish with coriander, cherry tomatoes and cucumber'),

-- Chicken Rice steps
(30, 1, 'Pan fry oil, ginger, garlic, shallots and onion until fragrant'),
(30, 2, 'Rinse jasmine rice once'),
(30, 3, 'Add all ingredients to rice'),
(30, 4, 'Cook in combi oven for 45 minutes at 115°C with 100% moisture'),

-- Chicken Rice Chilli Paste steps
(31, 1, 'Cook water, sugar, chicken seasoning and garlic on low-medium heat for 2 minutes'),
(31, 2, 'Add chicken rice chilli, mix well and cook until boiling'),
(31, 3, 'Add ajinomoto and lime powder, mix and cook until boiling'),

-- 5 Spices Chicken steps
(32, 1, 'Mix chicken with all ingredients'),
(32, 2, 'Marinate overnight in chiller'),
(32, 3, 'Cook as desired'),
(32, 4, 'Garnish with roasted white sesame seeds before serving'),

-- Yam Rice steps
(33, 1, 'Soak mushrooms in warm water for 30 minutes, cut into strips, reserve liquid'),
(33, 2, 'Peel and cube taro into 1-inch pieces'),
(33, 3, 'Wash and drain rice'),
(33, 4, 'Mix all sauces, sugar and salt together'),
(33, 5, 'Heat oil, sauté onion 3-5 minutes, add garlic and mushrooms'),
(33, 6, 'Add taro and sauce mixture, mix well'),
(33, 7, 'Add mushroom liquid, adjust seasoning'),
(33, 8, 'Add to rice and steam until ready'),
(33, 9, 'Garnish with fried shallots, green onion and coriander'),

-- Chinese Rojak steps
(34, 1, 'Blend ingredients A into paste with wooden spoon'),
(34, 2, 'Add lime juice and tamarind juice, stir'),
(34, 3, 'Add remaining tamarind juice and stir well'),
(34, 4, 'Add vegetables and fruits, stir with wooden spoon'),
(34, 5, 'Add fried bean curd and mix well before serving'),

-- Jap Curry Sauce steps
(35, 1, 'Heat oil and sauté onions until caramelized'),
(35, 2, 'Add chicken stock, apple, honey, soy sauce, ketchup, carrots and potatoes'),
(35, 3, 'Cook on medium heat for 15 minutes'),
(35, 4, 'Add cooked chicken and simmer 10 minutes'),
(35, 5, 'Add curry block, stir until thick, 5-10 minutes'),

-- Jap Curry Chicken steps
(36, 1, 'Cut chicken into cubes'),
(36, 2, 'Mix all ingredients together'),
(36, 3, 'Marinate overnight in chiller'),

-- Hainanese Chicken Cutlet steps
(37, 1, 'Use same marination as Chicken Katsu fillet'),
(37, 2, 'Coat with tapioca flour, then egg, then breadcrumbs'),
(37, 3, 'Deep fry at 165°C for 4.5 minutes until well fried'),

-- Prawn Paste Chicken Drumlets steps
(38, 1, 'Add sugar, oyster sauce, water and fermented prawn paste to chicken'),
(38, 2, 'Mix well and marinate overnight'),
(38, 3, 'Bring to room temperature, shake off excess marinade'),
(38, 4, 'Cook in combi oven'),

-- Lemon Pepper Dory steps
(39, 1, 'Mix all ingredients together'),
(39, 2, 'Marinate in chiller overnight'),
(39, 3, 'Cook as desired'),
(39, 4, 'Serve with sliced lemon'),

-- Turmeric Rice steps
(40, 1, 'Wash rice and stir in turmeric powder, set aside 30 minutes'),
(40, 2, 'Rinse rice to wash off turmeric residuals'),
(40, 3, 'Spread rice on steaming tray with pandan leaves'),
(40, 4, 'Add water, coconut milk and seasoning, steam until cooked'),
(40, 5, 'Garnish with fried shallots before serving'),

-- Chicken Rendang steps
(41, 1, 'Blend all spice paste ingredients in food processor'),
(41, 2, 'Heat oil, add spice paste and whole spices, stir-fry until aromatic'),
(41, 3, 'Add chicken and lemongrass, combine with spices'),
(41, 4, 'Add coconut milk and water, simmer until chicken almost cooked'),
(41, 5, 'Add kaffir lime leaves and toasted coconut'),
(41, 6, 'Simmer on low heat for 30 minutes until tender and liquid dried'),
(41, 7, 'Adjust seasoning with sugar and salt'),

-- Sand Ginger Chicken steps
(42, 1, 'Season chicken with salt, pepper and chicken stock'),
(42, 2, 'Rub sand ginger powder evenly on all sides'),
(42, 3, 'Place ginger slices and scallion, top with chicken'),
(42, 4, 'Steam over high heat for 20 minutes'),

-- Sand Ginger Chicken Dipping Sauce steps
(43, 1, 'Place grated ginger and diced scallion in bowl, season with salt'),
(43, 2, 'Heat oil in saucepan over medium heat until smoking'),
(43, 3, 'Pour hot oil over ginger and scallion'),
(43, 4, 'Set aside and let cool'),

-- Fried Oyster Tempeh steps
(44, 1, 'Cut tempeh into cubes'),
(44, 2, 'Mix with salt, sugar, pepper, turmeric and oyster sauce'),
(44, 3, 'Marinate overnight'),
(44, 4, 'Coat with tapioca flour'),
(44, 5, 'Deep fry for 2 minutes until slightly golden brown'),

-- Kecap Manis Glazed Chicken steps
(45, 1, 'Heat oil, fry candlenuts until charred, smash with pestle'),
(45, 2, 'Fry shallots and garlic until golden and fragrant'),
(45, 3, 'Blend candlenuts, shallots, garlic, salt, sugar, pepper and lime leaves'),
(45, 4, 'Add kecap manis and lime juice, blend until smooth'),
(45, 5, 'Divide sauce in half - one for marinade, one for drizzling'),
(45, 6, 'Marinate chicken overnight'),
(45, 7, 'Cook in combi oven'),
(45, 8, 'Drizzle sauce and sprinkle fried shallots before serving'),

-- Baked Tamarind Glazed Tempeh steps
(46, 1, 'Preheat oven to 220°C, line baking sheet with foil'),
(46, 2, 'Toss tempeh with 2 tbsp oil, roast 20 minutes until golden'),
(46, 3, 'Heat remaining oil, cook shallots and garlic until fragrant'),
(46, 4, 'Add galangal, lime leaves, lemongrass and sambal, stir until aromatic'),
(46, 5, 'Add tamarind water, palm sugar, salt and water'),
(46, 6, 'Cook until sugar melts and sticky sauce forms'),
(46, 7, 'Add tempeh and coat well, remove large herbs before serving'),

-- Grilled Honey Chicken Drumlets steps
(47, 1, 'Mix all ingredients together'),
(47, 2, 'Marinate chicken drumlets overnight'),
(47, 3, 'Cook as desired');