# Especificações de Segurança e Performance - EduPlatform EAD

Este documento detalha as medidas de segurança e as otimizações de performance implementadas na plataforma EduPlatform EAD.

## 1. Segurança

A segurança da plataforma é garantida através de uma abordagem em camadas, desde o banco de dados até a aplicação.

### 1.1. Segurança no Banco de Dados (Supabase)

-   **Row Level Security (RLS):**
    -   **Ativação Global:** RLS está habilitada em **todas** as tabelas do banco de dados para garantir que nenhum dado seja acessível sem uma política explícita.
    -   **Políticas Baseadas em Papel:** As políticas são definidas para os papéis `admin`, `teacher`, e `student`, restringindo o acesso aos dados estritamente necessários para cada função.
    -   **Acesso Público Controlado:** Apenas dados designados como públicos (e.g., consulta de certificados, listagem de cursos) são acessíveis por usuários não autenticados.

-   **Segurança de Funções (`SECURITY DEFINER`):
    -   **Funções Administrativas:** Funções que executam operações sensíveis (e.g., `toggle_module_activation`, `reorder_modules`) são criadas com `SECURITY DEFINER`, permitindo que executem com privilégios elevados de forma segura.
    -   **`search_path` Restrito:** Todas as funções `SECURITY DEFINER` têm o `search_path` explicitamente configurado como `public, auth` para mitigar riscos de sequestro de privilégios (privilege escalation).

-   **Políticas de Acesso ao Storage:**
    -   **Avatars:** Usuários só podem fazer upload, atualizar ou deletar seus próprios avatares. A visualização é pública.
    -   **Materiais de Curso:** Apenas professores e administradores podem gerenciar os materiais dos cursos.

### 1.2. Segurança da Aplicação e API

-   **Gerenciamento de Chaves e Segredos:**
    -   Todas as chaves de API (Supabase, Mercado Pago, SIE) são armazenadas como variáveis de ambiente no servidor e nunca são expostas no lado do cliente.

-   **Validação de Webhook:**
    -   O webhook do Mercado Pago é validado usando um segredo (`MERCADOPAGO_WEBHOOK_SECRET`) para garantir que as notificações de pagamento sejam autênticas.

-   **Proteção de Endpoints da API:**
    -   As rotas da API do Next.js que executam operações sensíveis verificam a autenticação e a autorização do usuário antes de prosseguir.

-   **Controle de Acesso a Funcionalidades:**
    -   **Proteção do Último Admin:** O sistema impede a exclusão do último usuário com o papel de `admin`.
    -   **Controle da API SIE:** A integração com a API SIE pode ser habilitada ou desabilitada globalmente por um administrador no painel.

-   **Auditoria:**
    -   Ações administrativas críticas, como ativação/desativação de módulos e exclusão de entidades, são registradas na tabela `audit_logs`.

## 2. Performance

A performance foi otimizada tanto no banco de dados quanto na aplicação para garantir uma experiência de usuário rápida e fluida.

### 2.1. Otimizações no Banco de Dados

-   **Indexação Estratégica:**
    -   **Índices em Chaves Primárias e Estrangeiras:** Todas as chaves primárias e estrangeiras são indexadas por padrão.
    -   **Índices em Colunas de Busca:** Colunas frequentemente usadas em cláusulas `WHERE`, como `profiles.cpf`, `legacy_certificates.cpf`, e `enrollments.completed_at`, possuem índices dedicados.
    -   **Índices Compostos:** Para consultas com múltiplos filtros, foram criados índices compostos, como em `legacy_certificates(cpf, is_active)`.
    -   **Índices Parciais:** Para otimizar consultas específicas, foram usados índices parciais (e.g., em `enrollments` para registros onde `completed_at` não é nulo).

-   **Otimização de Consultas:**
    -   **Análise de Tabelas:** O comando `ANALYZE` é executado após migrações para atualizar as estatísticas das tabelas, ajudando o planejador de consultas do PostgreSQL a escolher os planos de execução mais eficientes.
    -   **Consultas Paralelas:** A aplicação utiliza `Promise.all` para executar múltiplas consultas ao banco de dados de forma concorrente, reduzindo o tempo de carregamento de dados.

### 2.2. Otimizações na Aplicação (Frontend e Backend)

-   **Renderização e Carregamento:**
    -   **Next.js App Router:** A arquitetura do Next.js é usada para renderização no servidor (SSR) e geração de páginas estáticas (SSG), melhorando o tempo de carregamento inicial.
    -   **Lazy Loading:** Componentes e bibliotecas pesadas são carregados de forma assíncrona (lazy loaded) para reduzir o tamanho do bundle inicial.
    -   **Memoização:** `React.memo` é utilizado para evitar re-renderizações desnecessárias de componentes.

-   **Paginação:**
    -   Na consulta de certificados, foi implementada a paginação no estilo "Carregar Mais" para evitar o carregamento de um grande volume de dados de uma só vez.

-   **Cache:**
    -   A integração com a API SIE possui um sistema de cache para armazenar os resultados das consultas e reduzir a latência em requisições futuras.

-   **PDF Viewer Nativo:**
    -   A utilização de uma implementação nativa do PDF.js (sem wrappers React) garante performance máxima e compatibilidade com as versões mais recentes do React e Next.js.
