# Tarefas Atuais

Esta é uma lista das tarefas em andamento e pendentes para o projeto.

## Problemas em Investigação

### 1. Perda de Sessão (Papel do Usuário)
- **Status:** **RESOLVIDO.** A perda de sessão ao recarregar a página inicial não ocorre mais.

### 2. Botão "Visualizar" na Página de Gerenciamento de Cursos do Admin Redireciona para Login
- **Status:** **RESOLVIDO.**

### 3. Botão "Toggle" (Ativar/Desativar Curso) na Página de Gerenciamento de Cursos do Admin
- **Status:** **RESOLVIDO.**

### 4. Botão "Voltar ao catálogo" na Página do Curso Redireciona para Login
- **Status:** **RESOLVIDO.**

### 5. Usuários (Professores e Alunos) Não Aparecem no Sistema
- **Status:** **RESOLVIDO.**

### 6. Logs de Auditoria Exibem Dados Dinâmicos Exatos
- **Status:** **RESOLVIDO.** Os logs de auditoria estão sendo gravados corretamente no banco de dados.

### 7. Botão "Deletar Curso" na Página de Gerenciamento de Cursos do Admin Não Funciona
- **Status:** **RESOLVIDO.**

### 8. Cursos Inativos Aparecem na Página Inicial
- **Status:** Em análise. **A política de RLS foi corrigida, mas o problema persiste devido a cache.**
- **Próximos Passos:**
  - **Forçar um novo deploy na Vercel** para limpar o cache da CDN.
  - Limpar o cache do navegador novamente e recarregar a página inicial.
  - Confirmar visualmente se os cursos inativos não aparecem mais na página inicial.

## Tarefas Concluídas Recentemente

- **Correção do Botão de Busca de Certificados:** Resolvido pela priorização da data de término da manutenção na lógica de `isFeatureAvailable` em `src/lib/config/maintenance.js`.
- **Adição de Logs de Depuração:** Logs adicionados em `src/hooks/use-auth.js` para investigar o problema de sessão.
- **Correção de RLS na Tabela `profiles`:** Políticas de RLS ajustadas para permitir que usuários autenticados vejam seus próprios perfis.
- **Aplicação de RLS na Tabela `courses`:** Políticas de RLS ajustadas para garantir que apenas usuários autenticados com os papéis corretos possam gerenciar cursos.
- **Correção de RLS para Recursão Infinita em `profiles`:** Função `is_admin()` e política de RLS ajustadas para resolver o erro `500` ao buscar o perfil.
- **Adição de Logs na API de Toggle de Curso:** Logs adicionados em `src/app/api/admin/toggle-course-activation/route.js` para depuração.
- **Adição de Logs no Server Component de Detalhes do Curso:** Logs adicionados em `src/app/(dashboard)/cursos/[id]/page.js` para depuração.
- **Adição da coluna `is_active` à tabela `courses`:** Coluna adicionada para suportar a funcionalidade de toggle.
- **Criação da função RPC `toggle_course_activation`:** Função criada no banco de dados para suportar a funcionalidade de toggle.
- **Criação da função RPC `log_activation_change`:** Função criada no banco de dados para suportar o log de auditoria.
- **Correção de Erro de Build:** Removida a declaração duplicada da variável `user` em `src/app/(dashboard)/cursos/[id]/page.js`.