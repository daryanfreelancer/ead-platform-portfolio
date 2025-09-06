-- Debug RLS políticas para enrollments table

-- Verificar se RLS está habilitado na tabela enrollments
SELECT 
  schemaname, 
  tablename, 
  rowsecurity
FROM pg_tables 
WHERE tablename = 'enrollments';

-- Listar todas as políticas RLS para enrollments
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies 
WHERE tablename = 'enrollments';

-- Verificar estrutura da tabela enrollments
\d enrollments;

-- Teste simples de SELECT na tabela enrollments (deve retornar dados se políticas estão OK)
SELECT COUNT(*) FROM enrollments;