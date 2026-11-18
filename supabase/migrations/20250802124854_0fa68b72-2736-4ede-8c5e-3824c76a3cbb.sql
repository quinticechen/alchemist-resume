-- Enhance translations table with metadata and versioning
ALTER TABLE public.translations 
ADD COLUMN IF NOT EXISTS namespace text DEFAULT 'common',
ADD COLUMN IF NOT EXISTS context text,
ADD COLUMN IF NOT EXISTS status text DEFAULT 'active' CHECK (status IN ('draft', 'pending', 'active', 'deprecated')),
ADD COLUMN IF NOT EXISTS version integer DEFAULT 1,
ADD COLUMN IF NOT EXISTS created_by uuid REFERENCES auth.users(id),
ADD COLUMN IF NOT EXISTS approved_by uuid REFERENCES auth.users(id),
ADD COLUMN IF NOT EXISTS approved_at timestamp with time zone;

-- Create language metadata table
CREATE TABLE IF NOT EXISTS public.language_metadata (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  language_code text UNIQUE NOT NULL,
  language_name_native text NOT NULL,
  language_name_english text NOT NULL,
  direction text DEFAULT 'ltr' CHECK (direction IN ('ltr', 'rtl')),
  is_active boolean DEFAULT true,
  sort_order integer DEFAULT 0,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Insert language metadata
INSERT INTO public.language_metadata (language_code, language_name_native, language_name_english, direction, sort_order) VALUES
('en', 'English', 'English', 'ltr', 1),
('zh-CN', '简体中文', 'Simplified Chinese', 'ltr', 2),
('zh-TW', '繁體中文', 'Traditional Chinese', 'ltr', 3),
('ja', '日本語', 'Japanese', 'ltr', 4)
ON CONFLICT (language_code) DO NOTHING;

-- Create user language preferences table
CREATE TABLE IF NOT EXISTS public.user_language_preferences (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  preferred_language text NOT NULL,
  fallback_language text DEFAULT 'en',
  auto_detect boolean DEFAULT true,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  UNIQUE(user_id)
);

-- Enable RLS on new tables
ALTER TABLE public.language_metadata ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_language_preferences ENABLE ROW LEVEL SECURITY;

-- RLS policies for language_metadata (public read)
CREATE POLICY "Language metadata is publicly readable"
ON public.language_metadata FOR SELECT
TO public
USING (is_active = true);

-- RLS policies for user_language_preferences
CREATE POLICY "Users can manage their own language preferences"
ON public.user_language_preferences FOR ALL
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_translations_namespace_lang ON public.translations(namespace, language_code);
CREATE INDEX IF NOT EXISTS idx_translations_key_lang ON public.translations(key, language_code);
CREATE INDEX IF NOT EXISTS idx_user_lang_prefs_user_id ON public.user_language_preferences(user_id);

-- Update trigger for updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_language_metadata_updated_at BEFORE UPDATE ON public.language_metadata FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
CREATE TRIGGER update_user_language_preferences_updated_at BEFORE UPDATE ON public.user_language_preferences FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();