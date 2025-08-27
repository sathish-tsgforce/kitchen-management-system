-- Update ingredient units: remove bunch quantities and convert kg to grams (except flour and rice)

-- Update bunch quantities to grams
UPDATE public.ingredients SET unit = 'g', quantity = 0, threshold_quantity = 100 WHERE name = 'Scallion';
UPDATE public.ingredients SET unit = 'g', quantity = 0, threshold_quantity = 50 WHERE name = 'Lemongrass';
UPDATE public.ingredients SET unit = 'g', quantity = 0, threshold_quantity = 100 WHERE name = 'Pandan Leaves';
UPDATE public.ingredients SET unit = 'g', quantity = 0, threshold_quantity = 50 WHERE name = 'Curry Leaves';
UPDATE public.ingredients SET unit = 'g', quantity = 0, threshold_quantity = 100 WHERE name = 'Coriander Leaves';
UPDATE public.ingredients SET unit = 'g', quantity = 0, threshold_quantity = 100 WHERE name = 'Green Onion';
UPDATE public.ingredients SET unit = 'g', quantity = 0, threshold_quantity = 50 WHERE name = 'Lime Leaves';

-- Convert kg to grams for all ingredients except flour and rice
UPDATE public.ingredients SET unit = 'g', quantity = 0, threshold_quantity = threshold_quantity * 1000 
WHERE unit = 'kg' AND name NOT LIKE '%Flour%' AND name NOT LIKE '%Rice%';

-- Update specific spice and seasoning quantities that were already in grams but had incorrect threshold values
UPDATE public.ingredients SET threshold_quantity = 1000 WHERE name = 'Sea Salt';
UPDATE public.ingredients SET threshold_quantity = 2000 WHERE name = 'Fine Sea Salt';
UPDATE public.ingredients SET threshold_quantity = 500 WHERE name = 'White Pepper';
UPDATE public.ingredients SET threshold_quantity = 500 WHERE name = 'Black Pepper';
UPDATE public.ingredients SET threshold_quantity = 500 WHERE name = 'Turmeric Powder';
UPDATE public.ingredients SET threshold_quantity = 500 WHERE name = 'Five Spice Powder';
UPDATE public.ingredients SET threshold_quantity = 500 WHERE name = 'Italian Seasoning';
UPDATE public.ingredients SET threshold_quantity = 2000 WHERE name = 'Chicken Seasoning';
UPDATE public.ingredients SET threshold_quantity = 1000 WHERE name = 'Kentucky Chicken Seasoning';
UPDATE public.ingredients SET threshold_quantity = 500 WHERE name = 'Lemon Pepper Seasoning';
UPDATE public.ingredients SET threshold_quantity = 500 WHERE name = 'Mustard Seeds';
UPDATE public.ingredients SET threshold_quantity = 500 WHERE name = 'Cumin Seeds';
UPDATE public.ingredients SET threshold_quantity = 500 WHERE name = 'Cardamom';
UPDATE public.ingredients SET threshold_quantity = 500 WHERE name = 'Cloves';
UPDATE public.ingredients SET threshold_quantity = 500 WHERE name = 'Star Anise';
UPDATE public.ingredients SET threshold_quantity = 500 WHERE name = 'Bay Leaf';
UPDATE public.ingredients SET threshold_quantity = 200 WHERE name = 'Bay Leaves';
UPDATE public.ingredients SET threshold_quantity = 1000 WHERE name = 'Baba Curry Powder';
UPDATE public.ingredients SET threshold_quantity = 1000 WHERE name = 'Baba Meat Curry Powder';
UPDATE public.ingredients SET threshold_quantity = 1000 WHERE name = 'Coriander Powder';
UPDATE public.ingredients SET threshold_quantity = 500 WHERE name = 'Cumin Powder';
UPDATE public.ingredients SET threshold_quantity = 500 WHERE name = 'Garam Masala';
UPDATE public.ingredients SET threshold_quantity = 1000 WHERE name = 'Ajinomoto';
UPDATE public.ingredients SET threshold_quantity = 1000 WHERE name = 'Garlic Powder';
UPDATE public.ingredients SET threshold_quantity = 1000 WHERE name = 'Onion Powder';
UPDATE public.ingredients SET threshold_quantity = 3000 WHERE name = 'Singlong Sambal Chilli';
UPDATE public.ingredients SET threshold_quantity = 1000 WHERE name = 'Sambal';
UPDATE public.ingredients SET threshold_quantity = 100 WHERE name = 'Saffron Threads';
UPDATE public.ingredients SET threshold_quantity = 50 WHERE name = 'Generous Pinch Saffron';
UPDATE public.ingredients SET threshold_quantity = 1000 WHERE name = 'Dried Chilies';
UPDATE public.ingredients SET threshold_quantity = 1000 WHERE name = 'Dried Chili Paste';
UPDATE public.ingredients SET threshold_quantity = 1000 WHERE name = 'Butter Chicken Seasoning';
UPDATE public.ingredients SET threshold_quantity = 500 WHERE name = 'Knorr Lime Powder';
UPDATE public.ingredients SET threshold_quantity = 1000 WHERE name = 'Chicken Stock Powder';
UPDATE public.ingredients SET threshold_quantity = 1000 WHERE name = 'Hao Chi Seasoning';
UPDATE public.ingredients SET threshold_quantity = 1000 WHERE name = 'Whole Spice Mix';