-- =====================================================
-- MIGRAÇÃO PRODUÇÃO: Sistema de Proteção de Dados Órfãos
-- =====================================================
-- Valores aceitos para role: admin, teacher, student

-- 1. Criar função para obter ou criar usuário de sistema
CREATE OR REPLACE FUNCTION get_system_user_id()
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
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
        
        -- Criar com role 'admin' (confirmado que existe)
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
            'admin',  -- Valor confirmado existente no banco
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

-- 4. Criar política RLS para proteger usuário de sistema
DO $$ 
BEGIN
    -- Tentar dropar política existente
    EXECUTE 'DROP POLICY IF EXISTS "Protect system user from deletion" ON public.profiles';
EXCEPTION
    WHEN undefined_object THEN
        NULL; -- Política não existe, continuar
END $$;

CREATE POLICY "Protect system user from deletion" ON public.profiles
    FOR DELETE
    USING (
        id != '00000000-0000-0000-0000-000000000000'::UUID
    );

-- 5. Criar índices para performance
CREATE INDEX IF NOT EXISTS idx_courses_teacher_id ON public.courses(teacher_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON public.audit_logs(action);
CREATE INDEX IF NOT EXISTS idx_audit_logs_entity_type ON public.audit_logs(entity_type);

-- 6. Função helper para verificar usuário de sistema
CREATE OR REPLACE FUNCTION is_system_user(user_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
STABLE
AS $$
BEGIN
    RETURN user_id = '00000000-0000-0000-0000-000000000000'::UUID;
END;
$$;

-- 7. Garantir criação do usuário de sistema
SELECT get_system_user_id();

-- 8. Adicionar comentários de documentação
COMMENT ON FUNCTION get_system_user_id() IS 'Retorna o ID do usuário de sistema, criando-o se necessário';
COMMENT ON FUNCTION transfer_orphaned_courses_before_delete() IS 'Transfere cursos órfãos para o usuário de sistema ao deletar um usuário';
COMMENT ON FUNCTION is_system_user(user_id UUID) IS 'Verifica se um UUID pertence ao usuário de sistema';

-- 9. Verificação final
DO $$
DECLARE
    sys_user RECORD;
    total_courses INTEGER;
BEGIN
    -- Verificar usuário criado
    SELECT * INTO sys_user
    FROM profiles 
    WHERE id = '00000000-0000-0000-0000-000000000000';
    
    IF sys_user.id IS NOT NULL THEN
        RAISE NOTICE '✅ Usuário de sistema criado com sucesso!';
        RAISE NOTICE '   ID: %', sys_user.id;
        RAISE NOTICE '   Email: %', sys_user.email;
        RAISE NOTICE '   Nome: %', sys_user.full_name;
        RAISE NOTICE '   Role: %', sys_user.role;
        
        -- Contar cursos já herdados (se houver)
        SELECT COUNT(*) INTO total_courses
        FROM courses
        WHERE teacher_id = sys_user.id;
        
        IF total_courses > 0 THEN
            RAISE NOTICE '   Cursos herdados: %', total_courses;
        END IF;
    ELSE
        RAISE EXCEPTION '❌ Erro ao criar usuário de sistema';
    END IF;
END $$;

-- 10. Teste de proteção (descomente para testar - deve falhar!)
-- DELETE FROM profiles WHERE id = '00000000-0000-0000-0000-000000000000';