-- Verificar extensões de criptografia disponíveis
SELECT 
    extname as extension_name,
    extversion as version,
    CASE WHEN extname IS NOT NULL THEN 'INSTALADA' ELSE 'NÃO INSTALADA' END as status
FROM pg_extension 
WHERE extname IN ('pgcrypto', 'crypt')
UNION ALL
SELECT 
    'pgcrypto' as extension_name,
    NULL as version,
    'DISPONÍVEL PARA INSTALAR' as status
WHERE NOT EXISTS (
    SELECT 1 FROM pg_extension WHERE extname = 'pgcrypto'
) AND EXISTS (
    SELECT 1 FROM pg_available_extensions WHERE name = 'pgcrypto'
);

-- Verificar se as funções estão disponíveis
SELECT 
    'gen_salt' as function_name,
    CASE WHEN COUNT(*) > 0 THEN 'DISPONÍVEL' ELSE 'NÃO DISPONÍVEL' END as status
FROM pg_proc 
WHERE proname = 'gen_salt'
UNION ALL
SELECT 
    'crypt' as function_name,
    CASE WHEN COUNT(*) > 0 THEN 'DISPONÍVEL' ELSE 'NÃO DISPONÍVEL' END as status
FROM pg_proc 
WHERE proname = 'crypt';