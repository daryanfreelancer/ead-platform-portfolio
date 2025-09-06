-- =====================================================
-- MIGRAÇÃO COMPLETA: Sistema de Proteção de Dados Órfãos
-- =====================================================
-- Cria usuário no auth.users primeiro, depois no profiles

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
BEGIN
    -- Buscar usuário de sistema existente
    SELECT id INTO system_user_id
    FROM public.profiles
    WHERE email = system_user_email;
    
    -- Se não existir, criar
    IF system_user_id IS NULL THEN
        system_user_id := '00000000-0000-0000-0000-000000000000'::UUID;
        
        -- Primeiro, criar o usuário no auth.users (tabela do Supabase Auth)
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
        ) VALUES (
            system_user_id,
            system_user_email,
            -- Senha criptografada impossível de usar para login
            crypt('SYSTEM_USER_NEVER_LOGIN_' || gen_random_uuid()::text, gen_salt('bf')),
            NOW(), -- Email confirmado
            NOW(),
            NOW(),
            '{"provider":"email","providers":["email"]}'::jsonb,
            '{"is_system_user":true}'::jsonb,
            false,
            'authenticated',
            '00000000-0000-0000-0000-000000000000'
        ) ON CONFLICT (id) DO NOTHING;
        
        -- Depois criar no profiles
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
    
    -- Não permitir deletar o usuário de sistema
    IF OLD.id = system_user_id THEN
        RAISE EXCEPTION 'Não é possível deletar o usuário de sistema';
    END IF;
    
    -- Contar cursos que serão transferidos
    SELECT COUNT(*) INTO courses_count
    FROM public.courses 
    WHERE teacher_id = OLD.id;
    
    -- Transferir cursos para o usuário de sistema
    UPDATE public.courses 
    SET teacher_id = system_user_id,
        updated_at = NOW()
    WHERE teacher_id = OLD.id;
    
    -- Registrar no audit_logs se houver transferência
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
            format('Transferidos %s curso(s) do usuário %s (%s) para o sistema', 
                   courses_count, OLD.full_name, OLD.email),
            NOW()
        );
    END IF;
    
    RETURN OLD;
END;
$$;

-- 3. Criar trigger no profiles
DROP TRIGGER IF EXISTS transfer_orphaned_courses_trigger ON public.profiles;
CREATE TRIGGER transfer_orphaned_courses_trigger
    BEFORE DELETE ON public.profiles
    FOR EACH ROW
    EXECUTE FUNCTION transfer_orphaned_courses_before_delete();

-- 4. Criar política RLS para proteger usuário de sistema no profiles
DO $$ 
BEGIN
    EXECUTE 'DROP POLICY IF EXISTS "Protect system user from deletion" ON public.profiles';
EXCEPTION
    WHEN undefined_object THEN NULL;
END $$;

CREATE POLICY "Protect system user from deletion" ON public.profiles
    FOR DELETE
    USING (id != '00000000-0000-0000-0000-000000000000'::UUID);

-- 5. Criar política RLS para proteger usuário de sistema no auth.users
DO $$ 
BEGIN
    EXECUTE 'DROP POLICY IF EXISTS "Protect system user auth" ON auth.users';
EXCEPTION
    WHEN undefined_object THEN NULL;
END $$;

-- Nota: Políticas em auth.users podem requerer permissões especiais
-- Se falhar, ignore pois a proteção no profiles é suficiente

-- 6. Criar índices para performance
CREATE INDEX IF NOT EXISTS idx_courses_teacher_id ON public.courses(teacher_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON public.audit_logs(action);

-- 7. Função helper
CREATE OR REPLACE FUNCTION is_system_user(user_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
STABLE
AS $$
BEGIN
    RETURN user_id = '00000000-0000-0000-0000-000000000000'::UUID;
END;
$$;

-- 8. Executar criação
SELECT get_system_user_id();

-- 9. Verificação final
SELECT 
    p.id,
    p.email,
    p.full_name,
    p.role,
    CASE 
        WHEN u.id IS NOT NULL THEN 'auth.users ✓'
        ELSE 'auth.users ✗'
    END as auth_status,
    CASE 
        WHEN p.id = '00000000-0000-0000-0000-000000000000' THEN '✅ SISTEMA CRIADO'
        ELSE '❌ ERRO'
    END as status
FROM profiles p
LEFT JOIN auth.users u ON u.id = p.id
WHERE p.id = '00000000-0000-0000-0000-000000000000';

-- 10. Contar cursos que podem ser herdados
SELECT 
    COUNT(*) as total_cursos,
    COUNT(DISTINCT teacher_id) as total_professores
FROM courses;