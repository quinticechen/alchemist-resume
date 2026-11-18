-- Add Spanish and Korean to language_metadata table
INSERT INTO language_metadata (language_code, language_name_native, language_name_english, direction, is_active, sort_order)
VALUES 
  ('es', 'Español', 'Spanish', 'ltr', true, 5),
  ('ko', '한국어', 'Korean', 'ltr', true, 6)
ON CONFLICT (language_code) 
DO UPDATE SET 
  language_name_native = EXCLUDED.language_name_native,
  language_name_english = EXCLUDED.language_name_english,
  is_active = EXCLUDED.is_active,
  sort_order = EXCLUDED.sort_order;