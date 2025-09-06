-- =====================================================
-- DESCOBRIR ESTRUTURA REAL DAS TABELAS
-- =====================================================

-- 1. TODAS as colunas da tabela COURSES
SELECT 
    'COURSES' as tabela,
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_schema = 'public' 
  AND table_name = 'courses'
ORDER BY ordinal_position;

-- 2. TODAS as colunas da tabela LESSONS
SELECT 
    'LESSONS' as tabela,
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_schema = 'public' 
  AND table_name = 'lessons'
ORDER BY ordinal_position;

-- 3. TODAS as colunas da tabela MODULES
SELECT 
    'MODULES' as tabela,
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_schema = 'public' 
  AND table_name = 'modules'
ORDER BY ordinal_position;

-- 4. TODAS as colunas da tabela PROFILES
SELECT 
    'PROFILES' as tabela,
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_schema = 'public' 
  AND table_name = 'profiles'
ORDER BY ordinal_position;

-- 5. Verificar se tabela AUDIT_LOGS existe e sua estrutura
SELECT 
    'AUDIT_LOGS' as tabela,
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_schema = 'public' 
  AND table_name = 'audit_logs'
ORDER BY ordinal_position;