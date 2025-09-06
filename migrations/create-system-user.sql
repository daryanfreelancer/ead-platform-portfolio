-- =====================================================
-- MIGRAÇÃO: Criar Usuário de Sistema para Dados Órfãos
-- =====================================================
-- Este script cria um usuário de sistema especial que herda dados órfãos
-- quando um usuário é deletado, prevenindo perda de dados importantes

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
    -- Buscar usuário de sistema existente no profiles
    SELECT id INTO system_user_id
    FROM public.profiles
    WHERE email = system_user_email;
    
    -- Se não existir, criar
    IF system_user_id IS NULL THEN
        -- Gerar UUID fixo para o usuário de sistema
        system_user_id := '00000000-0000-0000-0000-000000000000'::UUID;
        
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
            'administrador', -- Usar role existente temporariamente
            NOW(),
            NOW()
        ) ON CONFLICT (id) DO NOTHING;
    END IF;
    
    RETURN system_user_id;
END;
$$;

-- 2. Criar trigger para transferir dados órfãos antes de deletar usuário
CREATE OR REPLACE FUNCTION transfer_orphaned_data_before_delete()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    system_user_id UUID;
BEGIN
    -- Obter ID do usuário de sistema
    system_user_id := get_system_user_id();
    
    -- Não permitir deletar o próprio usuário de sistema
    IF OLD.id = system_user_id THEN
        RAISE EXCEPTION 'Não é possível deletar o usuário de sistema';
    END IF;
    
    -- Transferir cursos criados para o usuário de sistema
    UPDATE public.courses 
    SET teacher_id = system_user_id,
        updated_at = NOW()
    WHERE teacher_id = OLD.id;
    
    -- Transferir aulas criadas para o usuário de sistema
    UPDATE public.lessons 
    SET created_by = system_user_id,
        updated_at = NOW()
    WHERE created_by = OLD.id;
    
    -- Transferir módulos criados para o usuário de sistema
    UPDATE public.modules 
    SET created_by = system_user_id,
        updated_at = NOW()
    WHERE created_by = OLD.id;
    
    -- Registrar a transferência no log de auditoria
    INSERT INTO public.audit_logs (
        user_id,
        action,
        resource_type,
        resource_id,
        details,
        created_at
    ) VALUES (
        system_user_id,
        'transfer_orphaned_data',
        'user',
        OLD.id,
        jsonb_build_object(
            'deleted_user_email', OLD.email,
            'deleted_user_name', OLD.full_name,
            'transfer_date', NOW(),
            'transferred_courses', (SELECT COUNT(*) FROM public.courses WHERE teacher_id = OLD.id),
            'transferred_lessons', (SELECT COUNT(*) FROM public.lessons WHERE created_by = OLD.id),
            'transferred_modules', (SELECT COUNT(*) FROM public.modules WHERE created_by = OLD.id)
        ),
        NOW()
    );
    
    RETURN OLD;
END;
$$;

-- 3. Criar trigger no profiles (antes de deletar)
DROP TRIGGER IF EXISTS transfer_orphaned_data_trigger ON public.profiles;
CREATE TRIGGER transfer_orphaned_data_trigger
    BEFORE DELETE ON public.profiles
    FOR EACH ROW
    EXECUTE FUNCTION transfer_orphaned_data_before_delete();

-- 4. Criar política RLS para proteger usuário de sistema
DROP POLICY IF EXISTS "Protect system user from deletion" ON public.profiles;
CREATE POLICY "Protect system user from deletion" ON public.profiles
    FOR DELETE
    USING (
        id != '00000000-0000-0000-0000-000000000000'::UUID
    );

-- 5. Criar índices para melhorar performance
CREATE INDEX IF NOT EXISTS idx_courses_teacher_id ON public.courses(teacher_id);
CREATE INDEX IF NOT EXISTS idx_lessons_created_by ON public.lessons(created_by);
CREATE INDEX IF NOT EXISTS idx_modules_created_by ON public.modules(created_by);

-- 6. Criar função para verificar se é usuário de sistema
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

-- 8. Adicionar comentários explicativos
COMMENT ON FUNCTION get_system_user_id() IS 'Retorna o ID do usuário de sistema, criando-o se não existir';
COMMENT ON FUNCTION transfer_orphaned_data_before_delete() IS 'Transfere dados órfãos para o usuário de sistema antes de deletar um usuário';
COMMENT ON FUNCTION is_system_user(user_id UUID) IS 'Verifica se um ID pertence ao usuário de sistema';