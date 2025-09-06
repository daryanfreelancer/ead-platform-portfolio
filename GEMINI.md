Este arquivo fornece orientações ao Claude Code ao trabalhar com o código deste repositório.

## Visão Geral do Projeto

EduPlatform EAD Platform é uma plataforma completa de ensino a distância (EAD) construída com Next.js 15 e Supabase para o Instituto EduPlatform. A plataforma oferece acesso baseado em funções para estudantes, professores e administradores com operações CRUD completas, gestão de cursos, consulta de certificados e acompanhamento de progresso.

### Sobre o Instituto EduPlatform

O EduPlatform é um instituto educacional que oferece ampla variedade de cursos a distância:

**Categorias de Cursos:**
- **Capacitação**: Cursos de desenvolvimento profissional
- **Tecnólogo**: Cursos tecnológicos de 2-3 anos
- **Bacharel**: Cursos de graduação de 4-5 anos
- **Licenciatura**: Cursos para profissionais da educação
- **Técnico por Competência**: Reconhecimento de competências profissionais
- **Técnico**: Educação técnica de nível médio
- **Mestrado**: Programas de pós-graduação stricto sensu
- **Doutorado**: Programas de doutorado
- **Pós-Doutorado**: Programas de pesquisa avançada

**Polos Educacionais:**
- **EduPlatform**: Cursos próprios do instituto
- **SIE**: Sistema Integrado de Ensino
- **Escola Avançada**: Parceria com Escola Avançada
- **UniUnica**: Universidade UniUnica
- **UniFil**: Centro Universitário Filadélfia
- **Faculdade Guerra**: Faculdade Guerra
- **UNAR**: Centro Universitário de Araras
- **CEPET**: Centro de Educação Profissional e Tecnológica
- **Ember**: Ember Educação

**Contato:**
- Telefone: (61) 3299-8180
- Email: atendimento@eduplatform.com.br
- Instagram: @eduplatformcursos.oficial
- Domínio: www.eduplatform.com.br

## Comandos SQL para Injeção Manual

Para comandos SQL que precisam ser executados diretamente no SQL Editor do Supabase (por exemplo, para verificar a estrutura do banco de dados ou políticas de RLS), eles serão fornecidos no arquivo `sql_injections.sql` na raiz do projeto. Este arquivo será atualizado conforme novas injeções SQL forem necessárias.

## Stack Tecnológico

- **Frontend**: Next.js 15.3.4 (App Router), React 19.0.0
- **Estilização**: Tailwind CSS v4, clsx + tailwind-merge
- **Backend**: Supabase (Auth + Database + Storage)
- **PDF Viewer**: PDF.js v4.7.76 (implementação nativa iframe)
- **Formulários**: react-hook-form + validação Zod
- **Ícones**: lucide-react
- **Localização**: pt-BR (Português Brasileiro)

## Comandos de Desenvolvimento

```bash
# Iniciar servidor de desenvolvimento
npm run dev

# Build para produção
npm run build

# Executar lint (ESLint com Next.js core-web-vitals)
npm run lint
```

## Variáveis de Ambiente

Variáveis obrigatórias (criar `.env.local`):
```bash
# Configuração Supabase
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key

# Configuração Mercado Pago (Sistema de Pagamentos)
MERCADOPAGO_ACCESS_TOKEN=your_mercadopago_access_token
NEXT_PUBLIC_MERCADOPAGO_PUBLIC_KEY=your_mercadopago_public_key
NEXT_PUBLIC_URL=https://yourdomain.com
MERCADOPAGO_WEBHOOK_SECRET=your_webhook_secret

# Configuração API SIE (Opcional - Integração de Cursos Externos)
SIE_API_TOKEN=your_sie_api_token
SIE_BASE_URL=https://www.iped.com.br
SIE_SYNC_ENABLED=true # Controla se integração SIE está ativa

# Configuração de Manutenção
NEXT_PUBLIC_MAINTENANCE_MODE=false
NEXT_PUBLIC_MAINTENANCE_END_DATE=2025-07-19
```

## Arquitetura & Padrões de Código

### Estrutura de Diretórios
- `src/app/` - Páginas e layouts do Next.js App Router
  - `(auth)/` - Páginas de autenticação (entrar, cadastrar, esqueci-senha)
  - `(dashboard)/` - Dashboards baseados em função (aluno, professor, administrador)
  - `api/` - Rotas de API
- `src/components/` - Componentes reutilizáveis
  - `ui/` - Componentes de UI base (Button, Card, Input, etc.)
  - `forms/` - Componentes de formulário com validação
- `src/lib/` - Utilitários e configurações
  - `supabase/` - Configurações do cliente Supabase

### Padrões Essenciais

1. **Integração Supabase**
   - Componentes de servidor: Use `createClient` de `src/lib/supabase/server.js`
   - Componentes de cliente: Use `supabase` de `src/lib/supabase/client.js`
   - Estado de autenticação: Gerenciado pelo componente `AuthHandler`

2. **Estilização**
   - Use classes do Tailwind CSS
   - Combine classes com utilitário `cn()` de `src/lib/utils.js`
   - Cor primária: blue-600

3. **Formulários**
   - Use esquemas Zod para validação
   - Gerencie erros com mensagens amigáveis em português
   - Mostre estados de carregamento durante submissão

4. **Fluxo de Autenticação**
   - Middleware intercepta tokens de recuperação para reset de senha
   - Redirecionamentos baseados em função após login
   - Mudanças de estado de autenticação gerenciadas globalmente por AuthHandler

5. **Busca de Dados**
   - Componentes de servidor buscam dados diretamente no componente
   - Use queries Supabase com tratamento adequado de erros
   - Verifique funções de usuário via tabela profiles

### Convenções de Código

- Use componentes funcionais com hooks
- Mantenha componentes focados e de propósito único
- Gerencie estados de carregamento e erro explicitamente
- Use português para texto voltado ao usuário
- Formate datas com `formatInTimeZone` para pt-BR
- Formate CPF com utilitário `formatCPF`
- Aliases de caminho: Use `@/` para imports de `src/`

## Sistema de Gestão de Cursos

### Categorias de Cursos e Polos Educacionais

A plataforma suporta categorização abrangente de cursos e parcerias multi-institucionais:

**Implementação de Categorias:**
```javascript
// lib/constants/course-categories.js
export const COURSE_CATEGORIES = {
  capacitacao: { label: 'Capacitação', duration: '40-180 horas' },
  tecnologo: { label: 'Tecnólogo', duration: '2-3 anos' },
  bacharel: { label: 'Bacharel', duration: '4-5 anos' },
  licenciatura: { label: 'Licenciatura', duration: '4 anos' },
  tecnico_competencia: { label: 'Técnico por Competência', duration: 'Variável' },
  tecnico: { label: 'Técnico', duration: '1-2 anos' },
  mestrado: { label: 'Mestrado', duration: '2 anos' },
  doutorado: { label: 'Doutorado', duration: '4 anos' },
  pos_doutorado: { label: 'Pós-Doutorado', duration: '1-2 anos' }
}
```

### Sistema de Preços

Cursos suportam modelos de preços flexíveis:
- **Cursos gratuitos**: Inscrição direta sem pagamento
- **Cursos pagos**: Integração com gateway de pagamento
- **Configuração de preços**: Definir durante criação do curso
- **Suporte a moeda**: BRL por padrão

## Operações CRUD Completas

A plataforma implementa cobertura CRUD 100% com operações DELETE abrangentes:

### Operações de Exclusão
- **Exclusão de usuário**: Valida proteção do último admin, cascata para inscrições
- **Exclusão de curso**: Lida com limpeza de arquivos, cascata para aulas e inscrições
- **Exclusão de inscrição**: Suporte a operações em lote para administradores
- **Limpeza de armazenamento**: Detecção automática de arquivos órfãos e remoção
- **Log de auditoria**: Trilha de auditoria completa para todas as operações sensíveis

### Recursos de Segurança
- **Proteção do último admin**: Impede exclusão do último administrador
- **Exclusões em cascata**: Lida adequadamente com limpeza de dados relacionados
- **Limpeza de arquivos**: Remove arquivos órfãos do Supabase Storage
- **Log de auditoria**: Rastreia todas as operações de exclusão com detalhes do usuário

## Integração API SIE

### Estratégia de Integração
A plataforma implementa uma abordagem híbrida combinando cursos locais EduPlatform com cursos externos SIE:

**Variáveis de Ambiente:**
```bash
# Configuração API SIE (server-side only)
SIE_API_TOKEN=your_token_sie_here
SIE_BASE_URL=https://www.iped.com.br
SIE_SYNC_ENABLED=true
```

### Recursos de Controle API SIE
- **Alternância Global**: Admin pode pausar/retomar integração API SIE do painel principal
- **Importação de Cursos**: Professores podem importar catálogo de cursos SIE ao criar cursos
- **Controle de Visibilidade**: Quando SIE está pausado, todos os cursos SIE ficam ocultos dos estudantes
- **Controle de Compra**: Compras de cursos SIE são bloqueadas quando API está pausada
- **Limitação conhecida**: API SIE retorna máximo 100 cursos por requisição

**Recursos Principais:**
- **Criação de usuário SIE sob demanda**: Contas SIE criadas apenas ao se inscrever no primeiro curso SIE
- **Catálogo de cursos híbrido**: Integração perfeita de cursos locais e externos
- **Sistema de cache**: Performance otimizada com cache inteligente
- **Tratamento de fallback**: Degradação graciosa quando API SIE não está disponível

## Sistema de Certificados

### Consulta Unificada de Certificados
- **Acesso público**: Não requer autenticação para consulta de certificados
- **Busca unificada**: Pesquisa certificados atuais e legados por CPF
- **Gerenciamento de certificados legados**: Painel admin para dados históricos de certificados
- **Downloads de PDF**: Suporte para arquivos PDF de certificados quando disponíveis

## Status de Implementação Atual

### 🎉 PLATAFORMA PRONTA PARA PRODUÇÃO (100% MVP Completo)

A Plataforma EAD EduPlatform está agora **completamente implantada e operacional** com todos os recursos principais implementados:

#### ✅ Recursos do Sistema Principal
- **Sistema de autenticação** com confirmação por email (estudantes, professores, administradores)
- **Dashboards baseados em função** para cada tipo de usuário com funcionalidade abrangente
- **Operações CRUD completas** incluindo funcionalidade DELETE segura com trilhas de auditoria
- **Criação e gerenciamento de cursos** com categorias, polos e preços
- **Sistema de aulas multi-formato** (uploads de vídeo, URLs YouTube/Vimeo, PDFs, texto/Markdown)
- **Inscrição e acompanhamento de progresso** com conclusão no nível da aula
- **Sistema de pagamentos** (integração Mercado Pago com PIX, cartão de crédito, boleto)
- **Sistema de certificados** com consulta pública (atuais + legados)

#### ✅ Recursos Avançados
- **Integração API SIE** com segurança server-side e controle de alternância admin
- **Sistema de polos educacionais** (9 instituições parceiras com suporte a logo)
- **Categorização de cursos** (9 categorias de capacitação a pós-doutorado)
- **Criação de usuário admin** (professores e estudantes via confirmação por email)
- **Gerenciamento de armazenamento** com limpeza automática e organização de arquivos
- **Modo de manutenção** para deploys controlados
- **Log de auditoria** para todas as operações sensíveis

#### ✅ Recursos de Deploy de Produção
- **Domínio configurado**: www.eduplatform.com.br
- **Migrações de banco de dados**: Todas as tabelas, índices e políticas RLS aplicadas
- **Variáveis de ambiente**: Credenciais de produção configuradas no Vercel
- **Tratamento de erros**: Gerenciamento de erros abrangente e feedback do usuário
- **Segurança**: Segurança row-level, proteção de API, validação de webhook

### Sistema de Manutenção

A plataforma possui um sistema de manutenção flexível controlado por variáveis de ambiente:

**Configuração de Manutenção:**
```bash
# Ativar modo de manutenção
NEXT_PUBLIC_MAINTENANCE_MODE=true
NEXT_PUBLIC_MAINTENANCE_END_DATE=2025-07-19
```

**Funcionalidades Afetadas:**
- Cadastro de novos estudantes (`/cadastrar`)
- Consulta pública de certificados (`/consulta-certificados`)
- Banner de manutenção na página inicial

**Controle Dinâmico:**
- Expiração automática baseada na data configurada
- Mensagens personalizadas por funcionalidade
- Controle granular de recursos específicos

### Arquitetura de Produção

**Frontend**: Next.js 15 com App Router, React 19, Tailwind CSS v4  
**Backend**: Supabase (PostgreSQL + Auth + Storage)  
**Pagamentos**: Mercado Pago com PIX, cartões de crédito e boleto bancário  
**Armazenamento de Arquivos**: Sistema de bucket unificado com limite de 2GB e limpeza automática  
**Segurança**: Segurança row-level, proteção de API server-side, validação de webhook  
**Domínio**: www.eduplatform.com.br com DNS Cloudflare + hospedagem Vercel

## Sistema de Pagamentos - CONCLUÍDO 🎉

### ✅ MVP 100% Completo

O sistema de pagamentos foi **completamente implementado** e a plataforma está **pronta para produção**:

**Fluxo de Pagamento:**
1. **Seleção de Curso**: Estudante seleciona curso
2. **Detecção de Preço**: Sistema verifica se curso é gratuito ou pago
3. **Curso Gratuito**: Inscrição direta via API
4. **Curso Pago**: Redirecionamento para checkout Mercado Pago
5. **Processamento de Pagamento**: Mercado Pago processa pagamento
6. **Notificação Webhook**: Sistema recebe status de pagamento
7. **Criação de Inscrição**: Inscrição automática na aprovação
8. **Acesso ao Curso**: Estudante obtém acesso imediato

**Recursos de Segurança:**
- **Chaves de API server-side**: Tokens Mercado Pago nunca expostos ao cliente
- **Validação de webhook**: Verificação de webhook assinado
- **Políticas RLS**: Segurança row-level para todas as tabelas de pagamento
- **Verificação de compra**: Verificação dupla antes do acesso ao curso

## Sistema PDF Player - Implementação Nativa

### Integração PDF.js Nativa (v4.7.76)
A plataforma usa uma implementação nativa PDF.js em vez de bibliotecas React para garantir máxima compatibilidade com React 19 e Next.js 15.

**Recursos Principais:**
- **Zero dependências externas** - Sem pacotes react-pdf ou pdfjs-dist
- **Visualizador completo** com zoom, navegação, rotação, download
- **Acompanhamento de progresso** - Progresso de leitura por aula com capacidade de retomar
- **Compatibilidade cross-browser** - Funciona em todos os navegadores modernos
- **Responsivo móvel** - Controles e gestos amigáveis ao toque

**Padrão de Uso:**
```javascript
// src/components/learning/pdf-player-native.js
// Corrigir problema CORS usando URL relativa para requests same-origin
const relativePdfUrl = `/api/pdf-proxy?url=${encodeURIComponent(data.publicUrl)}`
const viewerUrl = `/pdfjs/web/viewer.html?file=${encodeURIComponent(relativePdfUrl)}`
```

**API Proxy PDF:**
- Criado `/api/pdf-proxy` para servir PDFs com cabeçalhos CORS apropriados
- Valida URLs do armazenamento Supabase
- Retorna PDF com cabeçalhos de cache para performance

## Instruções de Deploy

### Antes do Próximo Git Push:
1. **Executar migrações de banco de dados** no Editor SQL Supabase
2. **Verificar variáveis de ambiente** no dashboard Vercel
3. **Verificação de propagação DNS**: Garantir que www.eduplatform.com.br aponte para Vercel

### Após Deploy:
1. **Testar fluxos críticos**:
   - Registro de usuário com confirmação por email
   - Criação de curso e gerenciamento de aulas
   - Processamento de pagamento com Mercado Pago
   - Integração API SIE (deve iniciar desabilitada)

2. **Configuração admin**:
   - Ativar API SIE se necessário
   - Importar catálogos de cursos iniciais
   - Configurar polos educacionais via ferramenta de diagnóstico
   - Testar fluxos de criação de usuário
   - Executar SQL de otimização de performance em `certificate-performance-indexes.sql`

### Considerações de Produção Conhecidas:
- **Entrega de email**: Supabase gerencia emails de autenticação
- **Uploads de arquivos**: Limite de bucket de 2GB com limpeza automática
- **Webhooks de pagamento**: Configurados para domínio de produção
- **Modo de manutenção**: Pode ser ativado via variáveis de ambiente
- **Supabase Pro**: Configurar proteção de senhas vazadas e OTP expiry em Auth → Providers → Email

## Fluxo de Desenvolvimento

### Comandos de Build e Deploy
```bash
npm run build    # Sempre executar antes do deploy
npm run lint     # Verificar qualidade do código
git commit       # Claude criará mensagens de commit detalhadas
```

### Padrão de Componente de Servidor
```javascript
// Sempre aguardar createClient() em componentes de servidor
const supabase = await createClient()
const { data: { user } } = await supabase.auth.getUser()
```

### Padrão de Tratamento de Erros
```javascript
// Sempre validar existência e tipos de dados
const safeUsers = Array.isArray(users) ? users : []
const validUser = user && typeof user === 'object' ? user : null
```

## Status Atual - Janeiro 2025

### ✅ Otimizações Recentes Concluídas
- **Responsividade móvel**: 100% completa com tabelas responsivas, alvos de toque e design mobile-first
- **Otimização de performance**: React.memo, lazy loading e otimização de tamanho de bundle implementadas
- **Melhorias de UX**: Feedback visual aprimorado, estados de carregamento e transições suaves
- **Performance de consulta de certificados**: Índices de banco de dados otimizados e paginação implementada
- **Correções de segurança**: RLS habilitado em todas as tabelas, SECURITY DEFINER e search_path configurados
- **Status de build**: Pronto para produção com builds bem-sucedidos

### ✅ Otimizações de Performance para Certificados
Sistema de consulta de certificados otimizado para grandes volumes de dados:

**Melhorias Implementadas:**
- **Índices de banco de dados**: Criados índices em `profiles.cpf` e tabelas de certificados
- **Paginação com "Carregar Mais"**: Limite de 20 certificados por página
- **Queries paralelas**: Uso de Promise.all() para executar 3 queries simultaneamente
- **Ordenação otimizada**: Certificados ordenados por data de conclusão (mais recentes primeiro)

### ✅ Sistema de Certificados Históricos
Implementação completa de importação e gerenciamento de certificados legados:

**Recursos Adicionados:**
- **Nova tabela certificados_antigos**: Estrutura simplificada para certificados históricos
- **Importação em lote**: Suporte a Excel com conversão de datas e formato brasileiro (DD/MM/YYYY)
- **Gerenciamento unificado**: Interface única para visualizar e gerenciar todos os tipos de certificados
- **Limpeza automática de formulários**: Após importação bem-sucedida

### ✅ Correções de Interface SIE
Problemas resolvidos na integração com catálogo de cursos SIE:

**Correções Aplicadas:**
- **Thumbnails únicos**: Exibição de imagens reais dos cursos ao invés de placeholders idênticos
- **Mapeamento de campos**: Corrigido de português para inglês (title, description, category)
- **Importação em lote**: Adicionada funcionalidade para importar múltiplos cursos SIE
- **Limitações conhecidas**: API SIE retorna máximo 100 cursos, pesquisa é client-side

## Problemas Conhecidos Atuais

### 🔍 Problema de Upload de Criação de Curso
**Problema**: Progresso de upload preso em 0% na página de criação de curso do professor
**Status**: Parcialmente corrigido - Adicionados logs de debug e simulação de progresso aprimorada
**Sintomas**: 
- Barra de progresso fica em 0% durante upload
- Upload realmente completa com sucesso em segundo plano
- Progresso pula para 100% no final

**Correções Aplicadas:**
- ✅ Removida verificação de bucket desnecessária
- ✅ Progresso inicia em 5% para feedback imediato
- ✅ Adicionados logs de console detalhados para depuração
- ✅ Algoritmo de simulação de progresso aprimorado
- ✅ Tempo de exibição de conclusão estendido para 3 segundos

**Prioridade**: Média - Upload funciona mas UX precisa de melhoria

### 🔍 Limitações da API SIE
**Problema**: Catálogo SIE limitado a 100 cursos
**Causa**: API externa (iped.com.br) tem limite não documentado de 100 registros por requisição
**Impacto**: 
- Apenas primeiros 100 cursos são exibidos no catálogo
- Categorias extraídas apenas desses 100 cursos
- Pesquisa limitada aos cursos já carregados (client-side)

**Soluções Consideradas:**
- Implementar paginação server-side (risco de rate limiting)
- Cache agressivo de dados
- Solicitar documentação de paginação ao provedor SIE

### 🔍 Polos Educacionais Não Aparecem
**Problema**: Dropdown de polos mostra apenas "sem polo específico"
**Causa**: Polos não foram criados ou estão inativos no banco de dados
**Solução**: 
- Executar migração de criação dos 9 polos educacionais
- Usar ferramenta de diagnóstico em `/administrador/polos`
- Executar script SQL em `/scripts/fix-educational-hubs.sql`