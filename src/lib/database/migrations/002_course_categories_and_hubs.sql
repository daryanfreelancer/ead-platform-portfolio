-- Migration: Add course categories and educational hubs
-- Date: 2025-01-11
-- Description: Implements course categorization and multi-institutional support

-- Create educational_hubs table
CREATE TABLE IF NOT EXISTS educational_hubs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  logo_url TEXT,
  description TEXT,
  website_url TEXT,
  api_config JSONB DEFAULT '{}',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert initial educational hubs
INSERT INTO educational_hubs (name, description) VALUES 
  ('IAPEG', 'Cursos próprios do Instituto IAPEG'),
  ('SIE', 'Sistema Integrado de Ensino'),
  ('Escola Avançada', 'Parceria com Escola Avançada'),
  ('UniUnica', 'Universidade UniUnica'),
  ('UniFil', 'Centro Universitário Filadélfia'),
  ('Faculdade Guerra', 'Faculdade Guerra'),
  ('UNAR', 'Centro Universitário de Araras'),
  ('CEPET', 'Centro de Educação Profissional e Tecnológica'),
  ('Ember', 'Ember Educação')
ON CONFLICT (name) DO NOTHING;

-- Add new columns to courses table
ALTER TABLE courses 
ADD COLUMN IF NOT EXISTS category TEXT CHECK (category IN (
  'capacitacao', 
  'tecnologo', 
  'bacharel', 
  'licenciatura', 
  'tecnico_competencia', 
  'tecnico', 
  'mestrado', 
  'doutorado', 
  'pos_doutorado'
)),
ADD COLUMN IF NOT EXISTS educational_hub_id UUID REFERENCES educational_hubs(id),
ADD COLUMN IF NOT EXISTS price DECIMAL(10,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS is_free BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS currency TEXT DEFAULT 'BRL',
ADD COLUMN IF NOT EXISTS promotional_price DECIMAL(10,2),
ADD COLUMN IF NOT EXISTS promotion_expires_at TIMESTAMP WITH TIME ZONE;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_courses_category ON courses(category);
CREATE INDEX IF NOT EXISTS idx_courses_educational_hub_id ON courses(educational_hub_id);
CREATE INDEX IF NOT EXISTS idx_courses_is_free ON courses(is_free);
CREATE INDEX IF NOT EXISTS idx_educational_hubs_is_active ON educational_hubs(is_active);

-- Create RLS policies for educational_hubs
ALTER TABLE educational_hubs ENABLE ROW LEVEL SECURITY;

-- Anyone can view active hubs
CREATE POLICY "Anyone can view active educational hubs" ON educational_hubs
  FOR SELECT
  USING (is_active = true);

-- Only admins can manage educational hubs
CREATE POLICY "Admins can manage educational hubs" ON educational_hubs
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role = 'admin'
    )
  );

-- Update RLS for courses to include pricing
CREATE POLICY IF NOT EXISTS "Public can view published courses with pricing" ON courses
  FOR SELECT
  USING (status = 'published');

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for educational_hubs
CREATE TRIGGER update_educational_hubs_updated_at
  BEFORE UPDATE ON educational_hubs
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Update existing courses to have default category (capacitacao) if NULL
UPDATE courses 
SET category = 'capacitacao' 
WHERE category IS NULL;

-- Make category NOT NULL after setting defaults
ALTER TABLE courses 
ALTER COLUMN category SET NOT NULL;

-- Create or ensure sie_api_config table exists
CREATE TABLE IF NOT EXISTS sie_api_config (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  api_token TEXT NOT NULL,
  base_url TEXT DEFAULT 'https://www.iped.com.br',
  api_version TEXT DEFAULT '1.0',
  sync_enabled BOOLEAN DEFAULT true,
  last_sync TIMESTAMP WITH TIME ZONE,
  rate_limit_per_minute INTEGER DEFAULT 60,
  timeout_seconds INTEGER DEFAULT 30,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert default SIE API configuration if not exists
INSERT INTO sie_api_config (api_token, base_url, api_version, sync_enabled, rate_limit_per_minute, timeout_seconds)
SELECT '', 'https://www.iped.com.br', '1.0', true, 60, 30
WHERE NOT EXISTS (SELECT 1 FROM sie_api_config);

-- RLS policies for sie_api_config
ALTER TABLE sie_api_config ENABLE ROW LEVEL SECURITY;

-- Only admins can view and manage SIE API config
CREATE POLICY "Only admins can manage SIE API config" ON sie_api_config
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role = 'admin'
    )
  );