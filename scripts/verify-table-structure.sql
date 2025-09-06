-- =====================================================
-- SCRIPT DE VERIFICAÇÃO: Estrutura das Tabelas
-- =====================================================
-- Este script verifica a estrutura atual das tabelas no banco
-- para garantir compatibilidade com a migração de dados órfãos

-- 1. Verificar estrutura da tabela COURSES
SELECT 
    '=== TABELA COURSES ===' as info;

SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_schema = 'public' 
  AND table_name = 'courses'
  AND column_name IN ('id', 'teacher_id', 'instructor_id', 'created_by', 'updated_at')
ORDER BY ordinal_position;

-- 2. Verificar estrutura da tabela LESSONS
SELECT 
    '=== TABELA LESSONS ===' as info;

SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_schema = 'public' 
  AND table_name = 'lessons'
  AND column_name IN ('id', 'course_id', 'created_by', 'teacher_id', 'instructor_id', 'updated_at')
ORDER BY ordinal_position;

-- 3. Verificar estrutura da tabela MODULES
SELECT 
    '=== TABELA MODULES ===' as info;

SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_schema = 'public' 
  AND table_name = 'modules'
  AND column_name IN ('id', 'course_id', 'created_by', 'teacher_id', 'instructor_id', 'updated_at')
ORDER BY ordinal_position;

-- 4. Verificar estrutura da tabela PROFILES
SELECT 
    '=== TABELA PROFILES ===' as info;

SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_schema = 'public' 
  AND table_name = 'profiles'
  AND column_name IN ('id', 'email', 'full_name', 'cpf', 'role')
ORDER BY ordinal_position;

-- 5. Verificar estrutura da tabela AUDIT_LOGS
SELECT 
    '=== TABELA AUDIT_LOGS ===' as info;

SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_schema = 'public' 
  AND table_name = 'audit_logs'
ORDER BY ordinal_position;

-- 6. Verificar TODAS as foreign keys relacionadas a usuários
SELECT 
    '=== FOREIGN KEYS RELACIONADAS ===' as info;

SELECT 
    tc.table_name,
    kcu.column_name,
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name,
    rc.delete_rule
FROM information_schema.table_constraints AS tc 
JOIN information_schema.key_column_usage AS kcu
    ON tc.constraint_name = kcu.constraint_name
    AND tc.table_schema = kcu.table_schema
JOIN information_schema.constraint_column_usage AS ccu
    ON ccu.constraint_name = tc.constraint_name
    AND ccu.table_schema = tc.table_schema
JOIN information_schema.referential_constraints AS rc
    ON rc.constraint_name = tc.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY' 
    AND tc.table_schema = 'public'
    AND ccu.table_name = 'profiles'
ORDER BY tc.table_name, kcu.column_name;

-- 7. Verificar se existem triggers na tabela profiles
SELECT 
    '=== TRIGGERS NA TABELA PROFILES ===' as info;

SELECT 
    trigger_name,
    event_manipulation,
    event_object_table,
    action_timing,
    action_statement
FROM information_schema.triggers
WHERE event_object_schema = 'public'
  AND event_object_table = 'profiles';

-- 8. Verificar índices existentes
SELECT 
    '=== ÍNDICES RELACIONADOS ===' as info;

SELECT 
    tablename,
    indexname,
    indexdef
FROM pg_indexes
WHERE schemaname = 'public'
  AND (
    tablename IN ('courses', 'lessons', 'modules', 'profiles')
    AND (
        indexdef LIKE '%teacher_id%' 
        OR indexdef LIKE '%created_by%'
        OR indexdef LIKE '%instructor_id%'
    )
  );

-- 9. Verificar políticas RLS em profiles
SELECT 
    '=== POLÍTICAS RLS NA TABELA PROFILES ===' as info;

SELECT 
    polname as policy_name,
    CASE polcmd
        WHEN 'r' THEN 'SELECT'
        WHEN 'a' THEN 'INSERT'
        WHEN 'w' THEN 'UPDATE'
        WHEN 'd' THEN 'DELETE'
        WHEN '*' THEN 'ALL'
    END as command,
    pg_get_expr(polqual, polrelid) as using_clause,
    pg_get_expr(polwithcheck, polrelid) as with_check_clause
FROM pg_policy
WHERE polrelid = 'public.profiles'::regclass;

-- 10. Verificar valores de ENUM para user_role
SELECT 
    '=== VALORES DO ENUM USER_ROLE ===' as info;

SELECT 
    e.enumlabel as role_value,
    e.enumsortorder as sort_order
FROM pg_type t 
JOIN pg_enum e ON t.oid = e.enumtypid  
WHERE t.typname = 'user_role'
ORDER BY e.enumsortorder;

-- 11. Contar registros órfãos potenciais
SELECT 
    '=== ANÁLISE DE DADOS ÓRFÃOS POTENCIAIS ===' as info;

-- Cursos sem professor válido
SELECT 
    'Cursos sem professor válido' as tipo,
    COUNT(*) as quantidade
FROM courses c
LEFT JOIN profiles p ON c.teacher_id = p.id
WHERE p.id IS NULL;

-- Aulas sem criador válido
SELECT 
    'Aulas sem criador válido' as tipo,
    COUNT(*) as quantidade
FROM lessons l
LEFT JOIN profiles p ON l.created_by = p.id
WHERE p.id IS NULL;

-- Módulos sem criador válido
SELECT 
    'Módulos sem criador válido' as tipo,
    COUNT(*) as quantidade
FROM modules m
LEFT JOIN profiles p ON m.created_by = p.id
WHERE p.id IS NULL;

-- 12. Verificar se o usuário de sistema já existe
SELECT 
    '=== VERIFICAR USUÁRIO DE SISTEMA ===' as info;

SELECT 
    id,
    email,
    full_name,
    role,
    created_at
FROM profiles 
WHERE id = '00000000-0000-0000-0000-000000000000'
   OR email = 'system@iapeg.internal';

-- 13. Estatísticas gerais
SELECT 
    '=== ESTATÍSTICAS GERAIS ===' as info;

SELECT 
    'Total de Usuários' as metrica,
    COUNT(*) as valor
FROM profiles
UNION ALL
SELECT 
    'Total de Cursos' as metrica,
    COUNT(*) as valor
FROM courses
UNION ALL
SELECT 
    'Total de Aulas' as metrica,
    COUNT(*) as valor
FROM lessons
UNION ALL
SELECT 
    'Total de Módulos' as metrica,
    COUNT(*) as valor
FROM modules
UNION ALL
SELECT 
    'Total de Matrículas' as metrica,
    COUNT(*) as valor
FROM enrollments;