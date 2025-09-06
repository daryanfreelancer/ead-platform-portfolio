-- =====================================================
-- MIGRAÇÃO ULTRA SEGURA: Criar Usuário de Sistema
-- =====================================================
-- Versão que funciona independente dos valores de role

-- 1. Criar função para obter ou criar usuário de sistema
CREATE OR REPLACE FUNCTION get_system_user_id()
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    system_user_id UUID;
    system_user_email TEXT := 'system@iapeg.internal';
    admin_role TEXT;
BEGIN
    -- Buscar usuário de sistema existente no profiles
    SELECT id INTO system_user_id
    FROM public.profiles
    WHERE email = system_user_email;
    
    -- Se não existir, criar
    IF system_user_id IS NULL THEN
        -- Gerar UUID fixo para o usuário de sistema
        system_user_id := '00000000-0000-0000-0000-000000000000'::UUID;
        
        -- Descobrir qual é o valor correto para admin olhando usuários existentes
        SELECT DISTINCT role INTO admin_role
        FROM profiles
        WHERE email LIKE '%@%' -- Email válido
        AND (
            lower(role) LIKE '%admin%' OR 
            role = 'admin' OR 
            role = 'administrator' OR
            role = 'administrador'
        )
        LIMIT 1;
        
        -- Se não encontrar nenhum admin, tentar valores comuns
        IF admin_role IS NULL THEN
            -- Tentar inserir com diferentes valores até um funcionar
            BEGIN
                -- Tentar com 'admin'
                INSERT INTO public.profiles (
                    id, email, full_name, cpf, role, created_at, updated_at
                ) VALUES (
                    system_user_id, system_user_email, 'Sistema IAPEG', 
                    '00000000000', 'admin', NOW(), NOW()
                );
                admin_role := 'admin';
            EXCEPTION 
                WHEN check_violation THEN
                    -- Se 'admin' falhou, tentar 'teacher' que é universal
                    BEGIN
                        INSERT INTO public.profiles (
                            id, email, full_name, cpf, role, created_at, updated_at
                        ) VALUES (
                            system_user_id, system_user_email, 'Sistema IAPEG', 
                            '00000000000', 'teacher', NOW(), NOW()
                        );
                        admin_role := 'teacher';
                    EXCEPTION
                        WHEN check_violation THEN
                            -- Se 'teacher' falhou, tentar 'student'
                            INSERT INTO public.profiles (
                                id, email, full_name, cpf, role, created_at, updated_at
                            ) VALUES (
                                system_user_id, system_user_email, 'Sistema IAPEG', 
                                '00000000000', 'student', NOW(), NOW()
                            );
                            admin_role := 'student';
                    END;
            END;
        ELSE
            -- Usar o role encontrado
            INSERT INTO public.profiles (
                id, email, full_name, cpf, role, created_at, updated_at
            ) VALUES (
                system_user_id, system_user_email, 'Sistema IAPEG', 
                '00000000000', admin_role, NOW(), NOW()
            ) ON CONFLICT (id) DO NOTHING;
        END IF;
    END IF;
    
    RETURN system_user_id;
END;
$$;

-- 2. Criar tabela audit_logs se não existir (estrutura compatível)
CREATE TABLE IF NOT EXISTS public.audit_logs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    admin_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    entity_type TEXT NOT NULL,
    entity_id UUID NOT NULL,
    action TEXT NOT NULL,
    previous_state BOOLEAN,
    new_state BOOLEAN,
    reason TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Criar trigger para transferir cursos órfãos
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
    
    -- Registrar a transferência no audit_logs
    IF courses_count > 0 THEN
        INSERT INTO public.audit_logs (
            admin_id,
            entity_type,
            entity_id,
            action,
            reason,
            created_at
        ) VALUES (
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

-- 4. Criar trigger no profiles
DROP TRIGGER IF EXISTS transfer_orphaned_courses_trigger ON public.profiles;
CREATE TRIGGER transfer_orphaned_courses_trigger
    BEFORE DELETE ON public.profiles
    FOR EACH ROW
    EXECUTE FUNCTION transfer_orphaned_courses_before_delete();

-- 5. Criar política RLS
DO $$ 
BEGIN
    EXECUTE 'DROP POLICY IF EXISTS "Protect system user from deletion" ON public.profiles';
EXCEPTION
    WHEN undefined_object THEN NULL;
END $$;

CREATE POLICY "Protect system user from deletion" ON public.profiles
    FOR DELETE
    USING (id != '00000000-0000-0000-0000-000000000000'::UUID);

-- 6. Criar índices
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

-- 8. Criar usuário de sistema
SELECT get_system_user_id();

-- 9. Verificação
SELECT 
    'MIGRAÇÃO CONCLUÍDA!' as status,
    id,
    email,
    full_name,
    role
FROM profiles 
WHERE id = '00000000-0000-0000-0000-000000000000';