-- =====================================================
-- SCRIPT DE TESTE: Sistema de Proteção de Dados Órfãos
-- =====================================================

-- 1. Verificar se o usuário de sistema existe
SELECT 
    id,
    email,
    full_name,
    role,
    cpf
FROM profiles 
WHERE id = '00000000-0000-0000-0000-000000000000'
   OR email = 'system@iapeg.internal';

-- 2. Criar um usuário de teste
INSERT INTO profiles (
    id,
    email,
    full_name,
    cpf,
    role
) VALUES (
    gen_random_uuid(),
    'teste.delete@exemplo.com',
    'Usuário Teste Delete',
    '12345678900',
    'teacher'
) RETURNING id;

-- 3. Criar um curso de teste para o usuário
-- (Substitua o UUID pelo ID retornado na query anterior)
INSERT INTO courses (
    title,
    description,
    teacher_id,
    price,
    is_free,
    category,
    level,
    status
) VALUES (
    'Curso Teste Órfão',
    'Este curso será herdado pelo sistema',
    '[ID_DO_USUARIO_TESTE]', -- Substitua pelo ID retornado
    0,
    true,
    'capacitacao',
    'beginner',
    'published'
) RETURNING id, title, teacher_id;

-- 4. Verificar cursos do usuário antes da exclusão
SELECT 
    c.id,
    c.title,
    c.teacher_id,
    p.full_name as instructor_name
FROM courses c
JOIN profiles p ON c.teacher_id = p.id
WHERE p.email = 'teste.delete@exemplo.com';

-- 5. Deletar o usuário de teste
DELETE FROM profiles 
WHERE email = 'teste.delete@exemplo.com';

-- 6. Verificar se o curso foi transferido para o sistema
SELECT 
    c.id,
    c.title,
    c.teacher_id,
    p.full_name as instructor_name,
    p.email as instructor_email
FROM courses c
JOIN profiles p ON c.teacher_id = p.id
WHERE c.title = 'Curso Teste Órfão';

-- 7. Verificar log de auditoria
SELECT 
    user_id,
    action,
    resource_type,
    details
FROM audit_logs
WHERE action = 'transfer_orphaned_data'
ORDER BY created_at DESC
LIMIT 5;

-- 8. Tentar deletar o usuário de sistema (deve falhar)
-- ATENÇÃO: Esta query deve retornar erro!
DELETE FROM profiles 
WHERE id = '00000000-0000-0000-0000-000000000000';

-- 9. Limpar dados de teste
DELETE FROM courses WHERE title = 'Curso Teste Órfão';

-- 10. Verificar estatísticas finais
SELECT 
    'Total Cursos' as metric,
    COUNT(*) as value
FROM courses
WHERE teacher_id = '00000000-0000-0000-0000-000000000000'
UNION ALL
SELECT 
    'Total Transferências' as metric,
    COUNT(*) as value
FROM audit_logs
WHERE action = 'transfer_orphaned_data';