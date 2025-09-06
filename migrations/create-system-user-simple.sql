-- =====================================================
-- MIGRAÇÃO SIMPLIFICADA: Sistema de Proteção de Dados Órfãos
-- =====================================================
-- Versão que funciona sem funções especiais de criptografia

-- 1. Criar função para obter ou criar usuário de sistema
CREATE OR REPLACE FUNCTION get_system_user_id()
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    system_user_id UUID;
    system_user_email TEXT := 'system@iapeg.internal';
    random_password TEXT;
BEGIN
    -- Buscar usuário de sistema existente
    SELECT id INTO system_user_id
    FROM public.profiles
    WHERE email = system_user_email;
    
    -- Se não existir, criar
    IF system_user_id IS NULL THEN
        system_user_id := '00000000-0000-0000-0000-000000000000'::UUID;
        
        -- Gerar uma senha aleatória complexa
        random_password := 'NEVER_LOGIN_' || md5(random()::text || clock_timestamp()::text)::text || '_SYSTEM';
        
        -- Criar o usuário no auth.users (sem criptografia, Supabase cuidará disso)
        INSERT INTO auth.users (
            id,
            email,
            encrypted_password,
            email_confirmed_at,
            created_at,
            updated_at,
            raw_app_meta_data,
            raw_user_meta_data,
            is_super_admin,
            role,
            instance_id
        ) 
        SELECT
            system_user_id,
            system_user_email,
            -- Usar hash MD5 duplo como senha (não seguro, mas não importa pois nunca será usado)
            '$2a$10$' || substr(md5(random_password), 1, 22) || substr(md5(random_password || 'salt'), 1, 31),
            NOW(),
            NOW(),
            NOW(),
            '{"provider":"email","providers":["email"]}'::jsonb,
            '{"is_system_user":true}'::jsonb,
            false,
            'authenticated',
            '00000000-0000-0000-0000-000000000000'
        WHERE NOT EXISTS (
            SELECT 1 FROM auth.users WHERE id = system_user_id
        );
        
        -- Criar no profiles
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
            'admin',
            NOW(),
            NOW()
        ) ON CONFLICT (id) DO NOTHING;
    END IF;
    
    RETURN system_user_id;
END;
$$;

-- 2. Alternativa: Se auth.users falhar, criar apenas no profiles sem FK
CREATE OR REPLACE FUNCTION create_system_user_profiles_only()
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    system_user_id UUID := '00000000-0000-0000-0000-000000000000'::UUID;
BEGIN
    -- Tentar inserir ignorando erro de FK
    BEGIN
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
            'system@iapeg.internal',
            'Sistema IAPEG',
            '00000000000',
            'admin',
            NOW(),
            NOW()
        ) ON CONFLICT (id) DO NOTHING;
    EXCEPTION
        WHEN foreign_key_violation THEN
            -- Se falhar por FK, retornar NULL para tentar outro método
            RETURN NULL;
    END;
    
    RETURN system_user_id;
END;
$$;

-- 3. Tentar criar o usuário de sistema
DO $$
DECLARE
    sys_id UUID;
BEGIN
    -- Primeiro tentar o método completo
    sys_id := get_system_user_id();
    
    -- Se falhou, tentar só profiles
    IF sys_id IS NULL THEN
        sys_id := create_system_user_profiles_only();
    END IF;
    
    IF sys_id IS NOT NULL THEN
        RAISE NOTICE 'Usuário de sistema criado: %', sys_id;
    ELSE
        RAISE NOTICE 'Aviso: Usuário de sistema não pôde ser criado automaticamente';
    END IF;
END $$;

-- 4. Criar trigger para transferir cursos órfãos
CREATE OR REPLACE FUNCTION transfer_orphaned_courses_before_delete()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    system_user_id UUID := '00000000-0000-0000-0000-000000000000'::UUID;
    courses_count INTEGER;
BEGIN
    -- Verificar se o usuário sistema existe
    IF NOT EXISTS (SELECT 1 FROM profiles WHERE id = system_user_id) THEN
        -- Se não existe, não fazer nada (deixar deletar normalmente)
        RETURN OLD;
    END IF;
    
    -- Não permitir deletar o usuário de sistema
    IF OLD.id = system_user_id THEN
        RAISE EXCEPTION 'Não é possível deletar o usuário de sistema';
    END IF;
    
    -- Contar cursos que serão transferidos
    SELECT COUNT(*) INTO courses_count
    FROM public.courses 
    WHERE teacher_id = OLD.id;
    
    -- Transferir cursos para o usuário de sistema
    IF courses_count > 0 THEN
        UPDATE public.courses 
        SET teacher_id = system_user_id,
            updated_at = NOW()
        WHERE teacher_id = OLD.id;
        
        -- Registrar no audit_logs
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
            format('Transferidos %s curso(s) do usuário %s para o sistema', 
                   courses_count, OLD.email),
            NOW()
        );
    END IF;
    
    RETURN OLD;
END;
$$;

-- 5. Criar trigger
DROP TRIGGER IF EXISTS transfer_orphaned_courses_trigger ON public.profiles;
CREATE TRIGGER transfer_orphaned_courses_trigger
    BEFORE DELETE ON public.profiles
    FOR EACH ROW
    EXECUTE FUNCTION transfer_orphaned_courses_before_delete();

-- 6. Criar política RLS
DO $$ 
BEGIN
    EXECUTE 'DROP POLICY IF EXISTS "Protect system user from deletion" ON public.profiles';
EXCEPTION WHEN undefined_object THEN NULL;
END $$;

CREATE POLICY "Protect system user from deletion" ON public.profiles
    FOR DELETE
    USING (id != '00000000-0000-0000-0000-000000000000'::UUID);

-- 7. Criar índices
CREATE INDEX IF NOT EXISTS idx_courses_teacher_id ON public.courses(teacher_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON public.audit_logs(action);

-- 8. Verificação final
SELECT 
    p.id,
    p.email,
    p.full_name,
    p.role,
    CASE 
        WHEN p.id = '00000000-0000-0000-0000-000000000000' THEN '✅ SISTEMA'
        ELSE '❌ ERRO'
    END as status,
    CASE
        WHEN u.id IS NOT NULL THEN 'Com auth.users'
        ELSE 'Apenas profiles'
    END as tipo
FROM profiles p
LEFT JOIN auth.users u ON u.id = p.id
WHERE p.email = 'system@iapeg.internal';

-- 9. Se não existir, instrução manual
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM profiles WHERE id = '00000000-0000-0000-0000-000000000000') THEN
        RAISE NOTICE '';
        RAISE NOTICE '⚠️  ATENÇÃO: Usuário de sistema não foi criado automaticamente!';
        RAISE NOTICE '';
        RAISE NOTICE 'Execute manualmente no Supabase:';
        RAISE NOTICE '1. Vá em Authentication → Users';
        RAISE NOTICE '2. Clique em "Add user"';
        RAISE NOTICE '3. Use:';
        RAISE NOTICE '   - Email: system@iapeg.internal';
        RAISE NOTICE '   - Password: SystemUser2024Never!Login#';
        RAISE NOTICE '4. Depois execute este SQL:';
        RAISE NOTICE '';
        RAISE NOTICE 'UPDATE profiles SET id = ''00000000-0000-0000-0000-000000000000'' WHERE email = ''system@iapeg.internal'';';
        RAISE NOTICE '';
    END IF;
END $$;