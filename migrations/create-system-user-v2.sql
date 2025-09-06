-- =====================================================
-- MIGRAÇÃO V2: Criar Usuário de Sistema (Versão Simplificada)
-- =====================================================
-- Versão que foca apenas em proteger cursos órfãos

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
            'administrador',
            NOW(),
            NOW()
        ) ON CONFLICT (id) DO NOTHING;
    END IF;
    
    RETURN system_user_id;
END;
$$;

-- 2. Criar tabela audit_logs se não existir
CREATE TABLE IF NOT EXISTS public.audit_logs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    action VARCHAR(100) NOT NULL,
    resource_type VARCHAR(50),
    resource_id TEXT,
    details JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Criar trigger para transferir APENAS cursos órfãos
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
    
    -- Registrar a transferência no log de auditoria (se houver cursos)
    IF courses_count > 0 THEN
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
                'transferred_courses', courses_count
            ),
            NOW()
        );
    END IF;
    
    RETURN OLD;
END;
$$;

-- 4. Criar trigger no profiles (antes de deletar)
DROP TRIGGER IF EXISTS transfer_orphaned_courses_trigger ON public.profiles;
CREATE TRIGGER transfer_orphaned_courses_trigger
    BEFORE DELETE ON public.profiles
    FOR EACH ROW
    EXECUTE FUNCTION transfer_orphaned_courses_before_delete();

-- 5. Criar política RLS para proteger usuário de sistema
DROP POLICY IF EXISTS "Protect system user from deletion" ON public.profiles;
CREATE POLICY "Protect system user from deletion" ON public.profiles
    FOR DELETE
    USING (
        id != '00000000-0000-0000-0000-000000000000'::UUID
    );

-- 6. Criar índice para melhorar performance
CREATE INDEX IF NOT EXISTS idx_courses_teacher_id ON public.courses(teacher_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON public.audit_logs(action);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON public.audit_logs(created_at DESC);

-- 7. Criar função helper para verificar se é usuário de sistema
CREATE OR REPLACE FUNCTION is_system_user(user_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
STABLE
AS $$
BEGIN
    RETURN user_id = '00000000-0000-0000-0000-000000000000'::UUID;
END;
$$;

-- 8. Garantir que o usuário de sistema seja criado
SELECT get_system_user_id();

-- 9. Adicionar comentários explicativos
COMMENT ON FUNCTION get_system_user_id() IS 'Retorna o ID do usuário de sistema, criando-o se não existir';
COMMENT ON FUNCTION transfer_orphaned_courses_before_delete() IS 'Transfere cursos órfãos para o usuário de sistema antes de deletar um usuário';
COMMENT ON FUNCTION is_system_user(user_id UUID) IS 'Verifica se um ID pertence ao usuário de sistema';
COMMENT ON TABLE audit_logs IS 'Tabela de auditoria para rastrear ações importantes do sistema';

-- 10. Verificação final
SELECT 
    'Sistema de proteção de dados órfãos configurado!' as status,
    id,
    email,
    full_name
FROM profiles 
WHERE id = '00000000-0000-0000-0000-000000000000';