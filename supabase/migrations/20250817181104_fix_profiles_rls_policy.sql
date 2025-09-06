-- Fix RLS Policy for profiles table - Allow 
  admin to create new profiles

  -- Remover política restritiva de INSERT se 
  existir
  DROP POLICY IF EXISTS "Users can only insert
  their own profile" ON profiles;
  DROP POLICY IF EXISTS "Users can insert their
  own profile" ON profiles;
  DROP POLICY IF EXISTS "Enable insert for
  authenticated users only" ON profiles;

  -- Criar nova política de INSERT que permite 
  admin criar perfis
  CREATE POLICY "Allow profile creation" ON
  profiles
  FOR INSERT
  WITH CHECK (
    auth.uid() = id
    OR
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid()
      AND role = 'admin'
    )
  );

  -- Garantir que RLS está habilitado
  ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;