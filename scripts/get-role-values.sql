-- Descobrir valores aceitos para role

-- 1. Verificar tipo da coluna
SELECT 
    column_name,
    data_type,
    udt_name
FROM information_schema.columns 
WHERE table_schema = 'public' 
  AND table_name = 'profiles'
  AND column_name = 'role';

-- 2. Se for ENUM, listar valores
SELECT enumlabel as valid_role_values
FROM pg_enum e
JOIN pg_type t ON e.enumtypid = t.oid
WHERE t.typname IN (
    SELECT udt_name
    FROM information_schema.columns
    WHERE table_schema = 'public' 
      AND table_name = 'profiles'
      AND column_name = 'role'
)
ORDER BY enumsortorder;

-- 3. Se for CHECK constraint, mostrar definição
SELECT 
    conname as constraint_name,
    pg_get_constraintdef(oid) as constraint_definition
FROM pg_constraint
WHERE conrelid = 'public.profiles'::regclass
  AND contype = 'c'
  AND pg_get_constraintdef(oid) LIKE '%role%';

-- 4. Valores únicos existentes no banco
SELECT DISTINCT 
    role as existing_roles,
    COUNT(*) as count
FROM profiles
WHERE role IS NOT NULL
GROUP BY role
ORDER BY role;