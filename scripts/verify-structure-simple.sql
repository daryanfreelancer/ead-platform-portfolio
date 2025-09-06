-- =====================================================
-- VERIFICAÇÃO SIMPLIFICADA: Estrutura das Tabelas
-- =====================================================

-- 1. Estrutura da tabela COURSES
SELECT 
    column_name as "Coluna",
    data_type as "Tipo",
    is_nullable as "Permite NULL"
FROM information_schema.columns 
WHERE table_schema = 'public' 
  AND table_name = 'courses'
  AND column_name IN ('id', 'teacher_id', 'instructor_id', 'created_by', 'updated_at')
ORDER BY ordinal_position;

-- 2. Estrutura da tabela LESSONS
SELECT 
    column_name as "Coluna",
    data_type as "Tipo",
    is_nullable as "Permite NULL"
FROM information_schema.columns 
WHERE table_schema = 'public' 
  AND table_name = 'lessons'
  AND column_name IN ('id', 'course_id', 'created_by', 'updated_at')
ORDER BY ordinal_position;

-- 3. Estrutura da tabela MODULES
SELECT 
    column_name as "Coluna",
    data_type as "Tipo",
    is_nullable as "Permite NULL"
FROM information_schema.columns 
WHERE table_schema = 'public' 
  AND table_name = 'modules'
  AND column_name IN ('id', 'course_id', 'created_by', 'updated_at')
ORDER BY ordinal_position;

-- 4. Verificar dados órfãos em COURSES
SELECT 
    'Cursos órfãos (sem professor válido)' as "Verificação",
    COUNT(*) as "Quantidade"
FROM courses c
WHERE NOT EXISTS (
    SELECT 1 FROM profiles p WHERE p.id = c.teacher_id
);

-- 5. Verificar dados órfãos em LESSONS
SELECT 
    'Aulas órfãs (sem criador válido)' as "Verificação",
    COUNT(*) as "Quantidade"
FROM lessons l
WHERE created_by IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM profiles p WHERE p.id = l.created_by
);

-- 6. Verificar dados órfãos em MODULES
SELECT 
    'Módulos órfãos (sem criador válido)' as "Verificação",
    COUNT(*) as "Quantidade"
FROM modules m
WHERE created_by IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM profiles p WHERE p.id = m.created_by
);

-- 7. Verificar se usuário de sistema já existe
SELECT 
    'Usuário de Sistema' as "Verificação",
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM profiles 
            WHERE id = '00000000-0000-0000-0000-000000000000'
               OR email = 'system@iapeg.internal'
        ) THEN 'JÁ EXISTE'
        ELSE 'NÃO EXISTE'
    END as "Status";

-- 8. Estatísticas das tabelas
SELECT 
    'Profiles' as "Tabela",
    COUNT(*) as "Total de Registros"
FROM profiles
UNION ALL
SELECT 
    'Courses' as "Tabela",
    COUNT(*) as "Total de Registros"
FROM courses
UNION ALL
SELECT 
    'Lessons' as "Tabela",
    COUNT(*) as "Total de Registros"
FROM lessons
UNION ALL
SELECT 
    'Modules' as "Tabela",
    COUNT(*) as "Total de Registros"
FROM modules
UNION ALL
SELECT 
    'Enrollments' as "Tabela",
    COUNT(*) as "Total de Registros"
FROM enrollments
ORDER BY "Tabela";

-- 9. Listar triggers existentes em profiles
SELECT 
    trigger_name as "Trigger",
    event_manipulation as "Evento",
    action_timing as "Timing"
FROM information_schema.triggers
WHERE event_object_schema = 'public'
  AND event_object_table = 'profiles';

-- 10. Verificar se tabela audit_logs existe
SELECT 
    'Tabela audit_logs' as "Verificação",
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM information_schema.tables 
            WHERE table_schema = 'public' 
              AND table_name = 'audit_logs'
        ) THEN 'EXISTE'
        ELSE 'NÃO EXISTE - CRIAR ANTES DA MIGRAÇÃO'
    END as "Status";