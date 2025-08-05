-- Insert initial ingredients for kitchen management system

INSERT INTO public.ingredients (name, quantity, unit, threshold_quantity, price, category, storage_type, location_id) VALUES
-- Proteins
('Boneless Chicken Leg', 0, 'kg', 5, 0, 'Meat', 'Refrigerated', 1),
('Tempeh', 0, 'pcs', 10, 0, 'Other', 'Refrigerated', 1),

-- Vegetables & Aromatics
('Fresh Ginger', 0, 'kg', 1, 0, 'Vegetables', 'Refrigerated', 1),
('Scallion', 0, 'bunch', 5, 0, 'Vegetables', 'Refrigerated', 1),
('Shallots', 0, 'kg', 1, 0, 'Vegetables', 'Standard', 1),
('Garlic', 0, 'kg', 1, 0, 'Vegetables', 'Standard', 1),
('Galangal', 0, 'kg', 0.5, 0, 'Herbs', 'Refrigerated', 1),
('Lemongrass', 0, 'bunch', 2, 0, 'Herbs', 'Refrigerated', 1),
('Candlenuts', 0, 'kg', 0.5, 0, 'Other', 'Standard', 1),

-- Spices & Seasonings
('Sand Ginger Powder', 0, 'kg', 0.5, 0, 'Spices', 'Dry', 1),
('Sea Salt', 0, 'kg', 1, 0, 'Spices', 'Dry', 1),
('White Pepper', 0, 'kg', 0.5, 0, 'Spices', 'Dry', 1),
('Black Pepper', 0, 'kg', 0.5, 0, 'Spices', 'Dry', 1),
('Sugar', 0, 'kg', 2, 0, 'Sweeteners', 'Dry', 1),
('Palm Sugar', 0, 'kg', 1, 0, 'Sweeteners', 'Dry', 1),
('Brown Sugar', 0, 'kg', 1, 0, 'Sweeteners', 'Dry', 1),
('Turmeric Powder', 0, 'kg', 0.5, 0, 'Spices', 'Dry', 1),
('Five Spice Powder', 0, 'kg', 0.5, 0, 'Spices', 'Dry', 1),

-- Sauces & Liquids
('Chicken Stock', 0, 'l', 2, 0, 'Other', 'Refrigerated', 1),
('Vegetable Oil', 0, 'l', 5, 0, 'Oils', 'Standard', 1),
('Sesame Oil', 0, 'l', 1, 0, 'Oils', 'Standard', 1),
('Light Soy Sauce', 0, 'l', 2, 0, 'Other', 'Standard', 1),
('Dark Soy Sauce', 0, 'l', 1, 0, 'Other', 'Standard', 1),
('Vegetarian Oyster Sauce', 0, 'l', 1, 0, 'Other', 'Standard', 1),
('Kecap Manis', 0, 'l', 2, 0, 'Other', 'Standard', 1),
('Lime Juice', 0, 'l', 1, 0, 'Other', 'Refrigerated', 1),
('Tamarind Water', 0, 'l', 1, 0, 'Other', 'Standard', 1),
('Honey', 0, 'kg', 1, 0, 'Sweeteners', 'Standard', 1),

-- Herbs & Leaves
('Lime Leaves', 0, 'bunch', 2, 0, 'Herbs', 'Refrigerated', 1),

-- Condiments
('Sambal', 0, 'kg', 1, 0, 'Spices', 'Standard', 1),
('Fried Shallots', 0, 'kg', 0.5, 0, 'Other', 'Standard', 1);