-- Verificar constraint de role na tabela profiles
SELECT 
    conname as constraint_name,
    pg_get_constraintdef(oid) as constraint_definition
FROM pg_constraint
WHERE conrelid = 'public.profiles'::regclass
  AND conname LIKE '%role%';

-- Verificar se é um ENUM
SELECT 
    e.enumlabel as role_value
FROM pg_type t 
JOIN pg_enum e ON t.oid = e.enumtypid  
WHERE t.typname = 'user_role'
ORDER BY e.enumsortorder;

-- Verificar tipo da coluna role
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_schema = 'public' 
  AND table_name = 'profiles'
  AND column_name = 'role';

-- Verificar alguns exemplos de roles existentes
SELECT DISTINCT role, COUNT(*) as total
FROM profiles
GROUP BY role
ORDER BY role;