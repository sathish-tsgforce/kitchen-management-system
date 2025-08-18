-- Insert recipes batch 2, recipe ingredients and recipe steps

-- Insert recipes
INSERT INTO public.recipes (menu_item_id, standard_serving_pax, accessibility_notes) VALUES
(10, 30, 'Contains dairy from yogurt and cream, nuts from cashews'),
(11, 2, 'Contains mustard seeds - check for allergies'),
(12, 6, 'Contains gluten-free basmati rice with spices'),
(13, 70, 'Contains soy from teriyaki sauce, sesame seeds'),
(14, 70, 'Contains fish sauce, sesame oil'),
(15, 70, 'Sweet and spicy sauce - contains chili'),
(16, 35, 'Contains coconut - check for tree nut allergies'),
(17, 70, 'Contains eggs, gluten from coating'),
(18, 70, 'Spicy chili paste - very hot'),
(19, 70, 'Contains coconut cream, various spices');

-- Insert recipe ingredients
INSERT INTO public.recipe_ingredients (recipe_id, ingredient_id, quantity_for_recipe) VALUES
-- Butter Chicken (recipe_id: 10)
(10, (SELECT id FROM ingredients WHERE name = 'Boneless Chicken Leg'), 5),
(10, (SELECT id FROM ingredients WHERE name = 'Lime Juice'), 0.12),
(10, (SELECT id FROM ingredients WHERE name = 'Sea Salt'), 0.01),
(10, (SELECT id FROM ingredients WHERE name = 'Greek Yogurt'), 1),
(10, (SELECT id FROM ingredients WHERE name = 'Ginger Garlic Paste'), 0.12),
(10, (SELECT id FROM ingredients WHERE name = 'Butter Chicken Seasoning'), 0.15),
(10, (SELECT id FROM ingredients WHERE name = 'Cooking Oil'), 0.06),
(10, (SELECT id FROM ingredients WHERE name = 'Ghee'), 0.2),
(10, (SELECT id FROM ingredients WHERE name = 'Cinnamon Stick'), 0.02),
(10, (SELECT id FROM ingredients WHERE name = 'Cardamom'), 0.015),
(10, (SELECT id FROM ingredients WHERE name = 'Cloves'), 0.01),
(10, (SELECT id FROM ingredients WHERE name = 'Onions'), 0.8),
(10, (SELECT id FROM ingredients WHERE name = 'Tomato Paste'), 0.4),
(10, (SELECT id FROM ingredients WHERE name = 'Raw Cashews'), 0.24),
(10, (SELECT id FROM ingredients WHERE name = 'Heavy Cream'), 0.5),
(10, (SELECT id FROM ingredients WHERE name = 'Garam Masala'), 0.01),
(10, (SELECT id FROM ingredients WHERE name = 'Sugar'), 0.0025),
(10, (SELECT id FROM ingredients WHERE name = 'Coriander Powder'), 0.0025),
(10, (SELECT id FROM ingredients WHERE name = 'Cumin Powder'), 0.0025),
(10, (SELECT id FROM ingredients WHERE name = 'Coriander Leaves'), 0.06),

-- Spiced Cauliflower with Carrots (recipe_id: 11)
(11, (SELECT id FROM ingredients WHERE name = 'Broccoli'), 0.05),
(11, (SELECT id FROM ingredients WHERE name = 'Green Beans'), 0.05),
(11, (SELECT id FROM ingredients WHERE name = 'Carrots'), 0.05),
(11, (SELECT id FROM ingredients WHERE name = 'Cabbage'), 0.05),
(11, (SELECT id FROM ingredients WHERE name = 'Ghee'), 0.01),
(11, (SELECT id FROM ingredients WHERE name = 'Mustard Seeds'), 0.0025),
(11, (SELECT id FROM ingredients WHERE name = 'Cumin Seeds'), 0.0025),
(11, (SELECT id FROM ingredients WHERE name = 'Curry Leaves'), 0.005),
(11, (SELECT id FROM ingredients WHERE name = 'Grated Coconut'), 0.015),
(11, (SELECT id FROM ingredients WHERE name = 'Sea Salt'), 0.0025),

-- Spiced Basmati Rice (recipe_id: 12)
(12, (SELECT id FROM ingredients WHERE name = 'Basmati Rice'), 0.4),
(12, (SELECT id FROM ingredients WHERE name = 'Cumin Seeds'), 0.015),
(12, (SELECT id FROM ingredients WHERE name = 'Bay Leaf'), 0.001),
(12, (SELECT id FROM ingredients WHERE name = 'Cinnamon Stick'), 0.005),
(12, (SELECT id FROM ingredients WHERE name = 'Cloves'), 0.002),
(12, (SELECT id FROM ingredients WHERE name = 'Cardamom'), 0.001),
(12, (SELECT id FROM ingredients WHERE name = 'Star Anise'), 0.001),
(12, (SELECT id FROM ingredients WHERE name = 'Coriander Leaves'), 0.06),
(12, (SELECT id FROM ingredients WHERE name = 'Sea Salt'), 0.0025),
(12, (SELECT id FROM ingredients WHERE name = 'Ghee'), 0.045),
(12, (SELECT id FROM ingredients WHERE name = 'Lime Juice'), 0.015),

-- Teriyaki Chicken (recipe_id: 13)
(13, (SELECT id FROM ingredients WHERE name = 'Boneless Chicken Leg'), 12),
(13, (SELECT id FROM ingredients WHERE name = 'Teriyaki Sauce'), 0.735),
(13, (SELECT id FROM ingredients WHERE name = 'Cooking Oil'), 0.735),
(13, (SELECT id FROM ingredients WHERE name = 'Roasted White Sesame Seeds'), 0.05),

-- Sweet Thai Chill Roast Chicken (recipe_id: 14)
(14, (SELECT id FROM ingredients WHERE name = 'Boneless Chicken Leg'), 12),
(14, (SELECT id FROM ingredients WHERE name = 'Fresh Ginger'), 0.4),
(14, (SELECT id FROM ingredients WHERE name = 'Garlic'), 0.5),
(14, (SELECT id FROM ingredients WHERE name = 'Onions'), 0.5),
(14, (SELECT id FROM ingredients WHERE name = 'Oyster Sauce'), 0.18),
(14, (SELECT id FROM ingredients WHERE name = 'Sesame Oil'), 0.18),
(14, (SELECT id FROM ingredients WHERE name = 'Thai Fish Sauce'), 0.18),
(14, (SELECT id FROM ingredients WHERE name = 'Sugar'), 0.12),
(14, (SELECT id FROM ingredients WHERE name = 'White Pepper'), 0.03),
(14, (SELECT id FROM ingredients WHERE name = 'Chicken Seasoning'), 0.06),

-- Sweet Thai Chilli Sauce (recipe_id: 15)
(15, (SELECT id FROM ingredients WHERE name = 'Sweet Thai Chilli Sauce'), 0.98),
(15, (SELECT id FROM ingredients WHERE name = 'Onions'), 0.2),
(15, (SELECT id FROM ingredients WHERE name = 'Tapioca Flour'), 0.045),

-- Nasi Lemak (recipe_id: 16)
(16, (SELECT id FROM ingredients WHERE name = 'Jasmine Rice'), 2),
(16, (SELECT id FROM ingredients WHERE name = 'Coconut Cream'), 1),
(16, (SELECT id FROM ingredients WHERE name = 'Lemongrass'), 0.1),
(16, (SELECT id FROM ingredients WHERE name = 'Pandan Leaves'), 0.05),
(16, (SELECT id FROM ingredients WHERE name = 'Fresh Ginger'), 0.05),
(16, (SELECT id FROM ingredients WHERE name = 'Sea Salt'), 0.01),

-- Kentucky Chicken Drumlets (recipe_id: 17)
(17, (SELECT id FROM ingredients WHERE name = 'Frozen Chicken Drumlets'), 12),
(17, (SELECT id FROM ingredients WHERE name = 'Kentucky Chicken Seasoning'), 0.74),
(17, (SELECT id FROM ingredients WHERE name = 'Eggs'), 8),

-- Nasi Lemak Chilli Paste (recipe_id: 18)
(18, (SELECT id FROM ingredients WHERE name = 'Singlong Sambal Chilli'), 2.5),
(18, (SELECT id FROM ingredients WHERE name = 'Onions'), 1.8),
(18, (SELECT id FROM ingredients WHERE name = 'Garlic'), 0.4),
(18, (SELECT id FROM ingredients WHERE name = 'Cooking Oil'), 1),
(18, (SELECT id FROM ingredients WHERE name = 'Gula Melaka'), 0.4),
(18, (SELECT id FROM ingredients WHERE name = 'Sea Salt'), 0.035),
(18, (SELECT id FROM ingredients WHERE name = 'Lime Leaves'), 0.01),
(18, (SELECT id FROM ingredients WHERE name = 'Assam Java'), 0.3),

-- Curry Chicken (recipe_id: 19)
(19, (SELECT id FROM ingredients WHERE name = 'Boneless Chicken Leg'), 12),
(19, (SELECT id FROM ingredients WHERE name = 'Chicken Seasoning'), 0.035),
(19, (SELECT id FROM ingredients WHERE name = 'Sea Salt'), 0.032),
(19, (SELECT id FROM ingredients WHERE name = 'Sugar'), 0.1),
(19, (SELECT id FROM ingredients WHERE name = 'Ajinomoto'), 0.006),
(19, (SELECT id FROM ingredients WHERE name = 'Garlic'), 0.05),
(19, (SELECT id FROM ingredients WHERE name = 'Onions'), 0.12),
(19, (SELECT id FROM ingredients WHERE name = 'Lemongrass'), 0.1),
(19, (SELECT id FROM ingredients WHERE name = 'Galangal'), 0.05),
(19, (SELECT id FROM ingredients WHERE name = 'Turmeric Powder'), 0.01),
(19, (SELECT id FROM ingredients WHERE name = 'Coriander Powder'), 0.012),
(19, (SELECT id FROM ingredients WHERE name = 'Cumin Powder'), 0.005),
(19, (SELECT id FROM ingredients WHERE name = 'Baba Curry Powder'), 0.008),
(19, (SELECT id FROM ingredients WHERE name = 'Coconut Cream'), 0.5);

-- Insert recipe steps
INSERT INTO public.recipe_steps (recipe_id, step_number, instruction) VALUES
-- Butter Chicken steps
(10, 1, 'Marinate chicken with lime juice and salt, toss and let rest for 30 minutes'),
(10, 2, 'Add yogurt, ginger garlic paste, butter chicken seasoning and oil, marinate overnight in chiller'),
(10, 3, 'Heat ghee in pan, add whole spices (cinnamon, cloves, cardamom) until they sizzle'),
(10, 4, 'Add onions and sauté until lightly golden brown, about 20 minutes'),
(10, 5, 'Add ginger garlic paste, fry on low heat for 1-2 minutes'),
(10, 6, 'Add tomato paste and cashews, mix well and cook until thick, 15-20 minutes'),
(10, 7, 'Blend mixture until smooth'),
(10, 8, 'Grill chicken at 165°C for 23 minutes with 50% moisture'),
(10, 9, 'Pour sauce back to pot, add hot water, simmer for 10 minutes'),
(10, 10, 'Add grilled chicken, simmer 5-7 minutes'),
(10, 11, 'Season with salt, sugar, garam masala, coriander and cumin powder'),
(10, 12, 'Off heat, stir in heavy cream and garnish with coriander'),

-- Spiced Cauliflower with Carrots steps
(11, 1, 'Blanch the vegetables of choice'),
(11, 2, 'Heat ghee, add mustard and cumin seeds until they splutter'),
(11, 3, 'Add curry leaves'),
(11, 4, 'Combine ghee spice mixture with blanched vegetables, mix well'),
(11, 5, 'Season with salt'),
(11, 6, 'Before serving, toss in grated coconut'),

-- Spiced Basmati Rice steps
(12, 1, 'Rinse basmati rice once and soak for 10 minutes'),
(12, 2, 'Heat ghee in pot, add whole spices and cook for 30 seconds'),
(12, 3, 'Add cumin seeds and let them splutter'),
(12, 4, 'Add rice and mix with ghee spice mixture'),
(12, 5, 'Add coriander leaves'),
(12, 6, 'Add 2.5 bowls hot water and salt, mix well'),
(12, 7, 'Cover and cook rice through'),
(12, 8, 'Once cooked, pour lime juice on rice and mix, serve hot'),

-- Teriyaki Chicken steps
(13, 1, 'Mix chicken with teriyaki sauce and cooking oil'),
(13, 2, 'Marinate overnight in chiller'),
(13, 3, 'Cook as desired'),
(13, 4, 'Garnish with roasted white sesame seeds before serving'),

-- Sweet Thai Chill Roast Chicken steps
(14, 1, 'Mix chicken with all ingredients'),
(14, 2, 'Marinate overnight in chiller'),
(14, 3, 'Cook as desired'),

-- Sweet Thai Chilli Sauce steps
(15, 1, 'Fry sliced onion until fragrant'),
(15, 2, 'Add sweet Thai chilli sauce and cook until warm'),
(15, 3, 'Add tapioca flour and mix until desired texture'),

-- Nasi Lemak steps
(16, 1, 'Pound lemongrass, ginger and pandan leaves'),
(16, 2, 'Mix coconut cream and water, set aside'),
(16, 3, 'Rinse jasmine rice once'),
(16, 4, 'Soak rice in water for 1 hour before cooking in combi oven'),
(16, 5, 'Stir cooked rice and soak in coconut cream mixture for 1 hour'),
(16, 6, 'Cook rice again in combi oven'),

-- Kentucky Chicken Drumlets steps
(17, 1, 'Whisk eggs'),
(17, 2, 'Coat chicken with egg mixture'),
(17, 3, 'Coat with chicken seasoning'),
(17, 4, 'Fry at 175°C until golden brown, approximately 6 minutes'),

-- Nasi Lemak Chilli Paste steps
(18, 1, 'Fry onion until fragrant, then add garlic for another 5 minutes'),
(18, 2, 'Add remaining ingredients and cook until boiling on medium heat'),
(18, 3, 'For reconstitution: use 1/2 portion of recipe and fry on low heat'),
(18, 4, 'Add 650g minced onion, 80g minced garlic, 200ml cooking oil, 850ml water'),

-- Curry Chicken steps
(19, 1, 'Cut chicken into cubes'),
(19, 2, 'Mix all ingredients together'),
(19, 3, 'Marinate overnight in chiller');