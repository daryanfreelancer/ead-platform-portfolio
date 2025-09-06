-- Corrigir políticas RLS para tabela enrollments
-- Resolver erro 406 na verificação de matrículas existentes

-- Verificar status atual do RLS
SELECT 
  schemaname, 
  tablename, 
  rowsecurity as rls_enabled
FROM pg_tables 
WHERE tablename = 'enrollments';

-- Listar políticas existentes
SELECT 
  policyname,
  cmd,
  permissive,
  roles,
  qual,
  with_check
FROM pg_policies 
WHERE tablename = 'enrollments';

-- Remover políticas restritivas existentes
DROP POLICY IF EXISTS "Users can view own enrollments" ON enrollments;
DROP POLICY IF EXISTS "Students can view their enrollments" ON enrollments;
DROP POLICY IF EXISTS "Enable read access for own enrollments" ON enrollments;
DROP POLICY IF EXISTS "Restrict enrollment access" ON enrollments;

-- Criar política permissiva para SELECT (verificação de matrículas)
CREATE POLICY "Allow enrollment verification" ON enrollments
FOR SELECT
USING (
  -- Permitir que usuários vejam suas próprias matrículas
  student_id = auth.uid()
  OR
  -- Permitir que admins vejam todas as matrículas
  EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid()
    AND role = 'admin'
  )
  OR
  -- Permitir que professores vejam matrículas de seus cursos
  EXISTS (
    SELECT 1 FROM courses
    WHERE courses.id = enrollments.course_id
    AND courses.teacher_id = auth.uid()
  )
);

-- Política para INSERT (criação de matrículas)
CREATE POLICY "Allow enrollment creation" ON enrollments
FOR INSERT
WITH CHECK (
  -- Usuários podem se matricular
  student_id = auth.uid()
  OR
  -- Admins podem criar qualquer matrícula
  EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid()
    AND role = 'admin'
  )
);

-- Política para UPDATE (atualização de matrículas)
CREATE POLICY "Allow enrollment updates" ON enrollments
FOR UPDATE
USING (
  -- Estudantes podem atualizar suas próprias matrículas
  student_id = auth.uid()
  OR
  -- Admins podem atualizar qualquer matrícula
  EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid()
    AND role = 'admin'
  )
  OR
  -- Professores podem atualizar matrículas de seus cursos
  EXISTS (
    SELECT 1 FROM courses
    WHERE courses.id = enrollments.course_id
    AND courses.teacher_id = auth.uid()
  )
);

-- Política para DELETE (exclusão de matrículas)
CREATE POLICY "Allow enrollment deletion" ON enrollments
FOR DELETE
USING (
  -- Admins podem deletar qualquer matrícula
  EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid()
    AND role = 'admin'
  )
  OR
  -- Professores podem deletar matrículas de seus cursos
  EXISTS (
    SELECT 1 FROM courses
    WHERE courses.id = enrollments.course_id
    AND courses.teacher_id = auth.uid()
  )
);

-- Garantir que RLS está habilitado
ALTER TABLE enrollments ENABLE ROW LEVEL SECURITY;

-- Verificar se as políticas foram criadas corretamente
SELECT 
  policyname,
  cmd,
  permissive
FROM pg_policies 
WHERE tablename = 'enrollments'
ORDER BY cmd, policyname;