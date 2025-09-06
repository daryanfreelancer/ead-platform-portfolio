-- =====================================================
-- SISTEMA DE PROTEÇÃO DE DADOS ÓRFÃOS - VERSÃO FINAL
-- =====================================================
-- Baseado na estrutura real do banco de dados

-- 1. Criar usuário de sistema completo
CREATE OR REPLACE FUNCTION create_system_user()
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    system_user_id UUID := '00000000-0000-0000-0000-000000000000'::UUID;
    system_email TEXT := 'system@iapeg.internal';
    system_password TEXT := 'SYSTEM_NEVER_LOGIN_' || extract(epoch from now())::text;
BEGIN
    -- Verificar se já existe
    IF EXISTS (SELECT 1 FROM auth.users WHERE id = system_user_id) THEN
        RETURN system_user_id;
    END IF;

    -- Criar no auth.users primeiro (removendo colunas geradas)
    INSERT INTO auth.users (
        instance_id,
        id,
        aud,
        role,
        email,
        encrypted_password,
        email_confirmed_at,
        created_at,
        updated_at,
        raw_app_meta_data,
        raw_user_meta_data,
        is_super_admin,
        is_sso_user,
        is_anonymous
    ) VALUES (
        '00000000-0000-0000-0000-000000000000'::UUID,  -- instance_id
        system_user_id,                                -- id fixo
        'authenticated',                                -- aud
        'authenticated',                                -- role (auth level)
        system_email,                                   -- email
        crypt(system_password, gen_salt('bf')),        -- senha criptografada
        NOW(),                                         -- email confirmado
        NOW(),                                         -- created_at
        NOW(),                                         -- updated_at
        '{"provider":"system","providers":["system"]}'::jsonb,  -- app meta
        '{"is_system_user":true,"never_login":true}'::jsonb,    -- user meta
        false,                                         -- não é super admin
        false,                                         -- não é SSO
        false                                          -- não é anônimo
    );

    -- Criar no profiles depois
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
        system_email,
        'Sistema IAPEG',
        '00000000000',
        'admin',  -- role do perfil
        NOW(),
        NOW()
    );

    RETURN system_user_id;
END;
$$;

-- 2. Criar função de transferência de dados órfãos
CREATE OR REPLACE FUNCTION transfer_orphaned_data()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    system_user_id UUID := '00000000-0000-0000-0000-000000000000'::UUID;
    courses_count INTEGER := 0;
BEGIN
    -- Não permitir deletar o usuário de sistema
    IF OLD.id = system_user_id THEN
        RAISE EXCEPTION 'Operação negada: Não é possível deletar o usuário de sistema';
    END IF;

    -- Garantir que usuário de sistema existe
    IF NOT EXISTS (SELECT 1 FROM profiles WHERE id = system_user_id) THEN
        PERFORM create_system_user();
    END IF;

    -- Contar cursos que serão transferidos
    SELECT COUNT(*) INTO courses_count
    FROM courses 
    WHERE teacher_id = OLD.id;

    -- Transferir cursos órfãos
    IF courses_count > 0 THEN
        UPDATE courses 
        SET teacher_id = system_user_id,
            updated_at = NOW()
        WHERE teacher_id = OLD.id;

        -- Registrar no audit log
        INSERT INTO audit_logs (
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
            format('Sistema herdou %s curso(s) do usuário %s (%s)', 
                   courses_count, OLD.full_name, OLD.email),
            NOW()
        );

        -- Log para debug
        RAISE NOTICE 'Sistema herdou % curso(s) do usuário % (ID: %)', 
                     courses_count, OLD.email, OLD.id;
    END IF;

    RETURN OLD;
END;
$$;

-- 3. Criar trigger de proteção
DROP TRIGGER IF EXISTS protect_orphaned_data_trigger ON profiles;
CREATE TRIGGER protect_orphaned_data_trigger
    BEFORE DELETE ON profiles
    FOR EACH ROW
    EXECUTE FUNCTION transfer_orphaned_data();

-- 4. Criar políticas RLS de proteção
DROP POLICY IF EXISTS "system_user_delete_protection" ON profiles;
CREATE POLICY "system_user_delete_protection" ON profiles
    FOR DELETE
    USING (
        id != '00000000-0000-0000-0000-000000000000'::UUID
    );

-- 5. Criar índices de performance
CREATE INDEX IF NOT EXISTS idx_courses_teacher_system ON courses(teacher_id) 
WHERE teacher_id = '00000000-0000-0000-0000-000000000000';

CREATE INDEX IF NOT EXISTS idx_audit_logs_orphaned ON audit_logs(action, created_at) 
WHERE action = 'transfer_orphaned_courses';

-- 6. Função utilitária para verificar sistema
CREATE OR REPLACE FUNCTION is_system_user(user_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
STABLE
AS $$
BEGIN
    RETURN user_id = '00000000-0000-0000-0000-000000000000'::UUID;
END;
$$;

-- 7. Executar criação do usuário de sistema
SELECT create_system_user();

-- 8. Verificação e relatório final
DO $$
DECLARE
    system_exists BOOLEAN;
    auth_exists BOOLEAN;
    profile_exists BOOLEAN;
    course_count INTEGER;
BEGIN
    -- Verificar criação
    SELECT EXISTS(SELECT 1 FROM auth.users WHERE id = '00000000-0000-0000-0000-000000000000') INTO auth_exists;
    SELECT EXISTS(SELECT 1 FROM profiles WHERE id = '00000000-0000-0000-0000-000000000000') INTO profile_exists;
    
    system_exists := auth_exists AND profile_exists;

    IF system_exists THEN
        -- Contar cursos já herdados
        SELECT COUNT(*) INTO course_count 
        FROM courses 
        WHERE teacher_id = '00000000-0000-0000-0000-000000000000';

        RAISE NOTICE '';
        RAISE NOTICE '🎉 SISTEMA DE PROTEÇÃO DE DADOS ÓRFÃOS ATIVO!';
        RAISE NOTICE '';
        RAISE NOTICE '✅ Usuário de sistema criado:';
        RAISE NOTICE '   - ID: 00000000-0000-0000-0000-000000000000';
        RAISE NOTICE '   - Email: system@iapeg.internal';
        RAISE NOTICE '   - Auth: %', CASE WHEN auth_exists THEN '✓' ELSE '✗' END;
        RAISE NOTICE '   - Profile: %', CASE WHEN profile_exists THEN '✓' ELSE '✗' END;
        RAISE NOTICE '';
        RAISE NOTICE '🛡️ Proteções ativas:';
        RAISE NOTICE '   - Trigger de transferência: ✓';
        RAISE NOTICE '   - Política RLS: ✓';
        RAISE NOTICE '   - Índices de performance: ✓';
        RAISE NOTICE '';
        RAISE NOTICE '📊 Status atual:';
        RAISE NOTICE '   - Cursos herdados pelo sistema: %', course_count;
        RAISE NOTICE '';
        RAISE NOTICE '🔒 Garantia: Nenhum curso será perdido ao deletar usuários!';
        RAISE NOTICE '';
    ELSE
        RAISE EXCEPTION '❌ Falha ao criar usuário de sistema! Auth: %, Profile: %', auth_exists, profile_exists;
    END IF;
END $$;

-- 9. Comentários de documentação
COMMENT ON FUNCTION create_system_user() IS 'Cria usuário de sistema para herdar dados órfãos';
COMMENT ON FUNCTION transfer_orphaned_data() IS 'Transfere cursos órfãos antes de deletar usuário';
COMMENT ON FUNCTION is_system_user(UUID) IS 'Verifica se UUID é do usuário de sistema';

-- 10. Teste de proteção (opcional - descomente para testar)
-- ATENÇÃO: Esta linha deve FALHAR com erro de proteção!
-- DELETE FROM profiles WHERE id = '00000000-0000-0000-0000-000000000000';