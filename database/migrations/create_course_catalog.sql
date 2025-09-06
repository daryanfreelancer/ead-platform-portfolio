-- Migration: Create course_catalog table for categorized course listings
-- Purpose: Simple catalog for marketing/showcase courses (not functional EAD courses)
-- Date: 2025-01-09

-- Create course_catalog table
CREATE TABLE IF NOT EXISTS course_catalog (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nome_curso TEXT NOT NULL,
    categoria TEXT NOT NULL,
    subcategoria TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add constraints for valid categories (based on existing course categories)
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.constraint_column_usage 
        WHERE constraint_name = 'course_catalog_categoria_check'
    ) THEN
        ALTER TABLE course_catalog 
        ADD CONSTRAINT course_catalog_categoria_check 
        CHECK (categoria IN (
            'capacitacao',
            'tecnologo', 
            'bacharel',
            'licenciatura',
            'tecnico_competencia',
            'tecnico',
            'mestrado',
            'doutorado',
            'pos_doutorado'
        ));
    END IF;
END $$;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_course_catalog_categoria ON course_catalog(categoria);
CREATE INDEX IF NOT EXISTS idx_course_catalog_subcategoria ON course_catalog(subcategoria);
CREATE INDEX IF NOT EXISTS idx_course_catalog_active ON course_catalog(is_active);
CREATE INDEX IF NOT EXISTS idx_course_catalog_nome ON course_catalog(nome_curso);

-- Create trigger for updated_at
CREATE OR REPLACE FUNCTION update_course_catalog_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS course_catalog_updated_at ON course_catalog;
CREATE TRIGGER course_catalog_updated_at
    BEFORE UPDATE ON course_catalog
    FOR EACH ROW
    EXECUTE FUNCTION update_course_catalog_updated_at();

-- RLS (Row Level Security) policies
ALTER TABLE course_catalog ENABLE ROW LEVEL SECURITY;

-- Policy: Anyone can view active courses (for public display)
DROP POLICY IF EXISTS "Public can view active course catalog" ON course_catalog;
CREATE POLICY "Public can view active course catalog" ON course_catalog
    FOR SELECT USING (is_active = true);

-- Policy: Only admins can manage course catalog
DROP POLICY IF EXISTS "Admins can manage course catalog" ON course_catalog;
CREATE POLICY "Admins can manage course catalog" ON course_catalog
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE profiles.id = auth.uid() 
            AND profiles.role = 'admin'
        )
    );

-- Add WhatsApp configuration to system_settings if not exists
INSERT INTO system_settings (key, value, description, category) 
VALUES (
    'whatsapp_number',
    '"5561999999999"'::jsonb,
    'Número do WhatsApp para botão "Mais Informações" dos cursos',
    'contact'
) ON CONFLICT (key) DO NOTHING;

-- Add WhatsApp message template to system_settings
INSERT INTO system_settings (key, value, description, category) 
VALUES (
    'whatsapp_message_template',
    '"Olá! Gostaria de mais informações sobre o curso: {CURSO_NOME}"'::jsonb,
    'Template da mensagem WhatsApp. Use {CURSO_NOME} como variável',
    'contact'
) ON CONFLICT (key) DO NOTHING;

-- Insert sample data for testing (optional - remove in production)
INSERT INTO course_catalog (nome_curso, categoria, subcategoria) VALUES
('Pedagogia', 'licenciatura', 'Educação Infantil'),
('Administração', 'bacharel', 'Gestão Empresarial'), 
('Marketing Digital', 'capacitacao', 'Marketing Online'),
('Enfermagem', 'tecnologo', 'Saúde'),
('Análise e Desenvolvimento de Sistemas', 'tecnologo', 'Tecnologia da Informação')
ON CONFLICT DO NOTHING;

-- Grant necessary permissions
GRANT SELECT ON course_catalog TO anon;
GRANT ALL ON course_catalog TO authenticated;
GRANT ALL ON course_catalog TO service_role;