-- =====================================================
-- MIGRAÇÃO FINAL: Criar Usuário de Sistema
-- =====================================================
-- Versão ajustada para estrutura real do banco

-- 1. Criar função para obter ou criar usuário de sistema
CREATE OR REPLACE FUNCTION get_system_user_id()
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    system_user_id UUID;
    system_user_email TEXT := 'system@iapeg.internal';
    default_role TEXT;
BEGIN
    -- Buscar usuário de sistema existente no profiles
    SELECT id INTO system_user_id
    FROM public.profiles
    WHERE email = system_user_email;
    
    -- Se não existir, criar
    IF system_user_id IS NULL THEN
        -- Gerar UUID fixo para o usuário de sistema
        system_user_id := '00000000-0000-0000-0000-000000000000'::UUID;
        
        -- Detectar qual role usar (pegar o primeiro admin existente como referência)
        SELECT role INTO default_role
        FROM profiles
        WHERE role IN ('admin', 'administrator', 'administrador')
        LIMIT 1;
        
        -- Se não encontrar nenhum admin, usar 'admin' como padrão
        IF default_role IS NULL THEN
            default_role := 'admin';
        END IF;
        
        -- Criar profile para o usuário de sistema
        INSERT INTO public.profiles (
            id,
            email,
            full_name,
            cpf,
            role,
            created_at,
            updated_at
        ) VALUES (
            system_user_id,
            system_user_email,
            'Sistema IAPEG',
            '00000000000',
            default_role,
            NOW(),
            NOW()
        ) ON CONFLICT (id) DO NOTHING;
    END IF;
    
    RETURN system_user_id;
END;
$$;

-- 2. Criar trigger para transferir cursos órfãos
CREATE OR REPLACE FUNCTION transfer_orphaned_courses_before_delete()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    system_user_id UUID;
    courses_count INTEGER;
BEGIN
    -- Obter ID do usuário de sistema
    system_user_id := get_system_user_id();
    
    -- Não permitir deletar o próprio usuário de sistema
    IF OLD.id = system_user_id THEN
        RAISE EXCEPTION 'Não é possível deletar o usuário de sistema';
    END IF;
    
    -- Contar cursos que serão transferidos
    SELECT COUNT(*) INTO courses_count
    FROM public.courses 
    WHERE teacher_id = OLD.id;
    
    -- Transferir cursos criados para o usuário de sistema
    UPDATE public.courses 
    SET teacher_id = system_user_id,
        updated_at = NOW()
    WHERE teacher_id = OLD.id;
    
    -- Registrar a transferência no audit_logs usando estrutura existente
    IF courses_count > 0 THEN
        INSERT INTO public.audit_logs (
            id,
            admin_id,
            entity_type,
            entity_id,
            action,
            reason,
            created_at
        ) VALUES (
            gen_random_uuid(),
            system_user_id,
            'user_deletion',
            OLD.id,
            'transfer_orphaned_courses',
            format('Transferidos %s cursos do usuário %s (%s) para o sistema', 
                   courses_count, OLD.full_name, OLD.email),
            NOW()
        );
    END IF;
    
    RETURN OLD;
END;
$$;

-- 3. Criar trigger no profiles (antes de deletar)
DROP TRIGGER IF EXISTS transfer_orphaned_courses_trigger ON public.profiles;
CREATE TRIGGER transfer_orphaned_courses_trigger
    BEFORE DELETE ON public.profiles
    FOR EACH ROW
    EXECUTE FUNCTION transfer_orphaned_courses_before_delete();

-- 4. Criar política RLS para proteger usuário de sistema
-- Primeiro verificar se a política já existe
DO $$ 
BEGIN
    -- Tentar dropar a política se existir
    EXECUTE 'DROP POLICY IF EXISTS "Protect system user from deletion" ON public.profiles';
EXCEPTION
    WHEN undefined_object THEN
        NULL; -- Política não existe, continuar
END $$;

-- Criar a nova política
CREATE POLICY "Protect system user from deletion" ON public.profiles
    FOR DELETE
    USING (
        id != '00000000-0000-0000-0000-000000000000'::UUID
    );

-- 5. Criar índices para melhorar performance
CREATE INDEX IF NOT EXISTS idx_courses_teacher_id ON public.courses(teacher_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON public.audit_logs(action);
CREATE INDEX IF NOT EXISTS idx_audit_logs_entity_type ON public.audit_logs(entity_type);

-- 6. Criar função helper para verificar se é usuário de sistema
CREATE OR REPLACE FUNCTION is_system_user(user_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
STABLE
AS $$
BEGIN
    RETURN user_id = '00000000-0000-0000-0000-000000000000'::UUID;
END;
$$;

-- 7. Garantir que o usuário de sistema seja criado
SELECT get_system_user_id();

-- 8. Adicionar comentários
COMMENT ON FUNCTION get_system_user_id() IS 'Retorna o ID do usuário de sistema, criando-o se não existir';
COMMENT ON FUNCTION transfer_orphaned_courses_before_delete() IS 'Transfere cursos órfãos para o usuário de sistema antes de deletar um usuário';
COMMENT ON FUNCTION is_system_user(user_id UUID) IS 'Verifica se um ID pertence ao usuário de sistema';

-- 9. Verificação final - mostra o usuário de sistema criado
SELECT 
    'USUÁRIO DE SISTEMA CRIADO COM SUCESSO!' as status,
    id,
    email,
    full_name,
    role
FROM profiles 
WHERE id = '00000000-0000-0000-0000-000000000000';

-- 10. Teste de proteção - Esta query deve falhar!
-- DESCOMENTE para testar (vai dar erro proposital)
-- DELETE FROM profiles WHERE id = '00000000-0000-0000-0000-000000000000';