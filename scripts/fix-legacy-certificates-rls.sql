-- Fix RLS policies for legacy_certificates table to enable public certificate search
-- Execute este SQL no Supabase SQL Editor

-- 1. Verificar políticas existentes
SELECT policyname, cmd, qual, roles 
FROM pg_policies 
WHERE tablename = 'legacy_certificates';

-- 2. Habilitar RLS se não estiver habilitado
ALTER TABLE legacy_certificates ENABLE ROW LEVEL SECURITY;

-- 3. Remover políticas antigas se existirem
DROP POLICY IF EXISTS "Enable read access for all users" ON legacy_certificates;
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON legacy_certificates;
DROP POLICY IF EXISTS "Users can insert their own certificates" ON legacy_certificates;
DROP POLICY IF EXISTS "Users can view their own certificates" ON legacy_certificates;

-- 4. Política para consulta pública de certificados (consulta-certificados page)
CREATE POLICY "Enable public certificate search" ON legacy_certificates
FOR SELECT
USING (true); -- Permite consulta pública de todos os certificados

-- 5. Política para inserção de certificados (apenas usuários autenticados)
CREATE POLICY "Enable certificate insertion for authenticated users" ON legacy_certificates
FOR INSERT
WITH CHECK (
  auth.uid() IS NOT NULL AND (
    -- Usuário pode inserir certificado do próprio enrollment
    student_id = auth.uid()
    OR
    -- Ou admin pode inserir qualquer certificado
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() 
      AND role = 'admin'
    )
  )
);

-- 6. Política para atualização de certificados (apenas admin)
CREATE POLICY "Enable certificate updates for admin" ON legacy_certificates
FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = auth.uid() 
    AND role = 'admin'
  )
);

-- 7. Política para exclusão de certificados (apenas admin)
CREATE POLICY "Enable certificate deletion for admin" ON legacy_certificates
FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = auth.uid() 
    AND role = 'admin'
  )
);

-- 8. Verificar políticas após criação
SELECT policyname, cmd, qual, roles 
FROM pg_policies 
WHERE tablename = 'legacy_certificates'
ORDER BY policyname;

-- 9. Testar consulta pública (deve funcionar)
SELECT COUNT(*) as total_certificates FROM legacy_certificates;

-- 10. Verificar se RLS está ativo
SELECT tablename, rowsecurity FROM pg_tables WHERE tablename = 'legacy_certificates';