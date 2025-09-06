# Configuração de Variáveis de Ambiente

## Resumo dos Problemas Encontrados

### Erro de Matrícula em Curso Pago
- **Erro 406**: Políticas RLS restritivas na tabela `enrollments`
- **Erro 500**: Variáveis de ambiente do Mercado Pago não configuradas localmente

### Soluções Implementadas

1. **Verificação de Configuração**: API agora retorna erro amigável quando Mercado Pago não está configurado
2. **API de Debug**: Criada `/api/debug/enrollment-check` para diagnosticar problemas de RLS
3. **Script SQL**: Criado script para corrigir políticas RLS da tabela enrollments

## Variáveis de Ambiente Obrigatórias

### Supabase (Configuradas)
```bash
NEXT_PUBLIC_SUPABASE_URL=https://pmuhuazhetazmkzmozig.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=seu_anon_key_aqui
SUPABASE_SERVICE_ROLE_KEY=seu_service_role_key_aqui
```

### Mercado Pago (Apenas Produção)
⚠️ **IMPORTANTE**: Configuradas no Vercel Dashboard, não no código

```bash
# Sandbox (desenvolvimento)
MERCADOPAGO_ACCESS_TOKEN=TEST-1234567890-123456-abcdef123456789-12345678
NEXT_PUBLIC_MERCADOPAGO_PUBLIC_KEY=TEST-abcdef12-3456-7890-abcd-ef1234567890
NEXT_PUBLIC_URL=https://www.eduplatform.com.br
MERCADOPAGO_WEBHOOK_SECRET=webhook_secret_aqui
```

```bash
# Produção (no Vercel)
MERCADOPAGO_ACCESS_TOKEN=APP-production-token-aqui
NEXT_PUBLIC_MERCADOPAGO_PUBLIC_KEY=APP-production-public-key-aqui
NEXT_PUBLIC_URL=https://www.eduplatform.com.br
MERCADOPAGO_WEBHOOK_SECRET=production_webhook_secret_aqui
```

### API SIE (Opcional)
```bash
SIE_API_TOKEN=seu_token_sie_aqui
SIE_BASE_URL=https://www.iped.com.br
SIE_SYNC_ENABLED=true
```

### Manutenção
```bash
NEXT_PUBLIC_MAINTENANCE_MODE=false
NEXT_PUBLIC_MAINTENANCE_END_DATE=2025-07-19
```

## Comandos para Resolução

### 1. Corrigir RLS da tabela enrollments
```sql
-- Executar no Editor SQL do Supabase
\i /scripts/fix-enrollment-rls.sql
```

### 2. Testar verificação de matrícula
```bash
# POST /api/debug/enrollment-check
{
  "courseId": "uuid-do-curso"
}
```

### 3. Configurar Mercado Pago no Vercel
1. Acessar Vercel Dashboard
2. Ir em Settings → Environment Variables
3. Adicionar as 4 variáveis do Mercado Pago
4. Fazer redeploy da aplicação

## Status Atual

- ✅ **Identificado**: Causas dos erros 406 e 500
- ✅ **Corrigido**: Tratamento de erro quando MP não configurado
- ⏳ **Pendente**: Aplicar correções RLS em produção
- ⏳ **Pendente**: Testar fluxo completo com variáveis configuradas

## Próximos Passos

1. Executar script SQL de correção RLS no Supabase
2. Verificar se variáveis MP estão corretas no Vercel
3. Testar matrícula em curso pago em produção
4. Validar fluxo completo de pagamento