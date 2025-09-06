-- Verificar configuração atual do Supabase
SELECT 
    'instance_id' as config,
    COALESCE(
        (SELECT instance_id::text FROM auth.users LIMIT 1),
        '00000000-0000-0000-0000-000000000000'
    ) as value
UNION ALL
SELECT 
    'total_auth_users' as config,
    COUNT(*)::text as value
FROM auth.users
UNION ALL
SELECT 
    'sample_auth_user_structure' as config,
    CASE 
        WHEN COUNT(*) > 0 THEN 'Usuários existem'
        ELSE 'Nenhum usuário no auth.users'
    END as value
FROM auth.users
UNION ALL
SELECT 
    'auth_role_samples' as config,
    string_agg(DISTINCT COALESCE(role, 'NULL'), ', ') as value
FROM auth.users;