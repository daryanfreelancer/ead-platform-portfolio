# Criação Manual do Usuário de Sistema

## Opção 1: Via Supabase Dashboard (Mais Fácil)

1. Acesse: https://supabase.com/dashboard/project/ftdfjexohzhxsmgqsykn/auth/users

2. Clique em **"Add user"** → **"Create new user"**

3. Preencha:
   - **Email**: `system@eduplatform.internal`
   - **Password**: `SystemUser2024Never!Login#`
   - **Auto Confirm User**: ✅ Marcado

4. Clique em **"Create user"**

5. Copie o ID do usuário criado

6. Execute este SQL no Editor SQL:

```sql
-- Atualizar o ID do usuário sistema para o ID fixo
UPDATE auth.users 
SET id = '00000000-0000-0000-0000-000000000000'
WHERE email = 'system@eduplatform.internal';

-- Atualizar/criar o profile
INSERT INTO profiles (
    id,
    email,
    full_name,
    cpf,
    role,
    created_at,
    updated_at
) VALUES (
    '00000000-0000-0000-0000-000000000000',
    'system@eduplatform.internal',
    'Sistema EduPlatform',
    '00000000000',
    'admin',
    NOW(),
    NOW()
) ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    full_name = EXCLUDED.full_name,
    role = EXCLUDED.role;
```

## Opção 2: Via SQL Direto (Se tiver permissões)

```sql
-- Habilitar extensão se necessário
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Inserir diretamente no auth.users
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
    role
) VALUES (
    '00000000-0000-0000-0000-000000000000',
    'system@eduplatform.internal',
    crypt('SystemUser2024Never!Login#', gen_salt('bf')),
    NOW(),
    NOW(),
    NOW(),
    '{"provider":"email","providers":["email"]}'::jsonb,
    '{"is_system_user":true}'::jsonb,
    false,
    'authenticated'
) ON CONFLICT (id) DO NOTHING;

-- Criar profile correspondente
INSERT INTO profiles (
    id,
    email,
    full_name,
    cpf,
    role,
    created_at,
    updated_at
) VALUES (
    '00000000-0000-0000-0000-000000000000',
    'system@eduplatform.internal',
    'Sistema EduPlatform',
    '00000000000',
    'admin',
    NOW(),
    NOW()
) ON CONFLICT (id) DO NOTHING;
```

## Após criar o usuário, execute:

```sql
-- Aplicar o restante da migração
migrations/create-system-user-simple.sql
```

Isso criará os triggers e proteções necessárias.