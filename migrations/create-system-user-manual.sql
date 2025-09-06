-- =====================================================
-- ALTERNATIVA: Criar Usuário Sistema sem auth.users
-- =====================================================
-- Use esta se a versão com auth.users falhar

-- 1. Primeiro, desabilitar temporariamente a foreign key
ALTER TABLE public.profiles 
DROP CONSTRAINT IF EXISTS profiles_id_fkey;

-- 2. Criar o usuário de sistema no profiles
INSERT INTO public.profiles (
    id,
    email,
    full_name,
    cpf,
    role,
    created_at,
    updated_at
) VALUES (
    '00000000-0000-0000-0000-000000000000'::UUID,
    'system@iapeg.internal',
    'Sistema IAPEG',
    '00000000000',
    'admin',
    NOW(),
    NOW()
) ON CONFLICT (id) DO NOTHING;

-- 3. Recriar a foreign key com ON DELETE CASCADE
ALTER TABLE public.profiles
ADD CONSTRAINT profiles_id_fkey 
FOREIGN KEY (id) 
REFERENCES auth.users(id) 
ON DELETE CASCADE
DEFERRABLE INITIALLY DEFERRED;

-- 4. Criar as funções e triggers
CREATE OR REPLACE FUNCTION transfer_orphaned_courses_before_delete()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    system_user_id UUID := '00000000-0000-0000-0000-000000000000'::UUID;
    courses_count INTEGER;
BEGIN
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
    
    -- Registrar no audit_logs
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
CREATE POLICY "Protect system user from deletion" ON public.profiles
    FOR DELETE
    USING (id != '00000000-0000-0000-0000-000000000000'::UUID);

-- 7. Verificação
SELECT 
    id,
    email,
    full_name,
    role,
    '✅ USUÁRIO SISTEMA CRIADO' as status
FROM profiles 
WHERE id = '00000000-0000-0000-0000-000000000000';