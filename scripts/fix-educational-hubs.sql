-- Script to check and fix educational hubs visibility issue
-- This script ensures all educational hubs are active and visible

-- First, let's check if the educational_hubs table exists and has data
SELECT COUNT(*) as total_hubs, 
       COUNT(CASE WHEN is_active = true THEN 1 END) as active_hubs,
       COUNT(CASE WHEN is_active = false THEN 1 END) as inactive_hubs
FROM educational_hubs;

-- List all educational hubs with their status
SELECT id, name, is_active, created_at, updated_at
FROM educational_hubs
ORDER BY name;

-- If the hubs exist but are inactive, activate them
UPDATE educational_hubs
SET is_active = true,
    updated_at = NOW()
WHERE is_active = false OR is_active IS NULL;

-- If the hubs don't exist at all, insert them
-- This will only insert if they don't already exist (ON CONFLICT DO NOTHING)
INSERT INTO educational_hubs (name, description, is_active) VALUES 
  ('IAPEG', 'Cursos próprios do Instituto IAPEG', true),
  ('SIE', 'Sistema Integrado de Ensino', true),
  ('Escola Avançada', 'Parceria com Escola Avançada', true),
  ('UniUnica', 'Universidade UniUnica', true),
  ('UniFil', 'Centro Universitário Filadélfia', true),
  ('Faculdade Guerra', 'Faculdade Guerra', true),
  ('UNAR', 'Centro Universitário de Araras', true),
  ('CEPET', 'Centro de Educação Profissional e Tecnológica', true),
  ('Ember', 'Ember Educação', true)
ON CONFLICT (name) DO UPDATE
SET is_active = true,
    updated_at = NOW()
WHERE educational_hubs.is_active = false OR educational_hubs.is_active IS NULL;

-- Final check: list all hubs after the fix
SELECT id, name, is_active, description
FROM educational_hubs
ORDER BY name;

-- Check the RLS policies
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual
FROM pg_policies
WHERE tablename = 'educational_hubs';