#!/bin/bash

# Script de Análise do Projeto EAD
# Executa no Ubuntu 22.04
# Coleta informações sobre estrutura, dependências e configurações

echo "========================================"
echo "   ANÁLISE DO PROJETO EAD - IAPEG"
echo "========================================"
echo ""

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Função para verificar se arquivo existe
check_file() {
    if [ -f "$1" ]; then
        echo -e "${GREEN}✓${NC} $1 encontrado"
        return 0
    else
        echo -e "${RED}✗${NC} $1 não encontrado"
        return 1
    fi
}

# Função para verificar se diretório existe
check_dir() {
    if [ -d "$1" ]; then
        echo -e "${GREEN}✓${NC} Diretório $1 encontrado"
        return 0
    else
        echo -e "${RED}✗${NC} Diretório $1 não encontrado"
        return 1
    fi
}

# 1. Informações básicas do sistema
echo -e "${YELLOW}1. INFORMAÇÕES DO SISTEMA:${NC}"
echo "----------------------------"
echo "SO: $(lsb_release -d | cut -f2)"
echo "Node.js: $(node -v 2>/dev/null || echo 'Não instalado')"
echo "NPM: $(npm -v 2>/dev/null || echo 'Não instalado')"
echo "Yarn: $(yarn -v 2>/dev/null || echo 'Não instalado')"
echo ""

# 2. Estrutura do projeto
echo -e "${YELLOW}2. ESTRUTURA DO PROJETO:${NC}"
echo "----------------------------"

# Detectar se é Next.js App Router ou Pages
if [ -d "app" ]; then
    echo "✓ Next.js com App Router detectado"
    ROUTER_TYPE="app"
elif [ -d "pages" ]; then
    echo "✓ Next.js com Pages Router detectado"
    ROUTER_TYPE="pages"
else
    echo "⚠ Estrutura Next.js não detectada"
    ROUTER_TYPE="unknown"
fi

echo ""
echo "Estrutura de diretórios:"
tree -L 3 -I 'node_modules|.git|.next|out|build' 2>/dev/null || {
    echo "Instalando tree para melhor visualização..."
    sudo apt-get install tree -y >/dev/null 2>&1
    tree -L 3 -I 'node_modules|.git|.next|out|build' 2>/dev/null || ls -la
}

echo ""

# 3. Verificar arquivos importantes
echo -e "${YELLOW}3. ARQUIVOS DE CONFIGURAÇÃO:${NC}"
echo "----------------------------"

# package.json
if check_file "package.json"; then
    echo "Dependências principais:"
    echo "- Next.js: $(grep -Po '"next":\s*"[^"]*"' package.json | cut -d'"' -f4)"
    echo "- React: $(grep -Po '"react":\s*"[^"]*"' package.json | cut -d'"' -f4)"
    echo "- Supabase: $(grep -Po '"@supabase/supabase-js":\s*"[^"]*"' package.json | cut -d'"' -f4)"
    echo "- Tailwind: $(grep -Po '"tailwindcss":\s*"[^"]*"' package.json | cut -d'"' -f4)"
fi

echo ""

# 4. Verificar arquivos de ambiente
echo -e "${YELLOW}4. VARIÁVEIS DE AMBIENTE:${NC}"
echo "----------------------------"

for env_file in ".env" ".env.local" ".env.development" ".env.production"; do
    if [ -f "$env_file" ]; then
        echo -e "${GREEN}✓${NC} $env_file encontrado"
        echo "Variáveis Supabase configuradas:"
        grep -E "SUPABASE|SIE" "$env_file" | sed 's/=.*/=***/' | head -10
    fi
done

echo ""

# 5. Verificar rotas específicas
echo -e "${YELLOW}5. ROTAS DO PROJETO:${NC}"
echo "----------------------------"

if [ "$ROUTER_TYPE" = "app" ]; then
    echo "Rotas do App Router:"
    find app -name "page.js" -o -name "page.jsx" -o -name "page.ts" -o -name "page.tsx" 2>/dev/null | sort
    
    # Verificar reset-password
    echo ""
    echo "Verificando rota de reset de senha:"
    find app -path "*reset-password*" -name "page.*" 2>/dev/null || echo "- Rota /reset-password não encontrada"
    
elif [ "$ROUTER_TYPE" = "pages" ]; then
    echo "Páginas encontradas:"
    find pages -name "*.js" -o -name "*.jsx" -o -name "*.ts" -o -name "*.tsx" 2>/dev/null | grep -v "_" | sort
fi

echo ""

# 6. Verificar configuração do Supabase
echo -e "${YELLOW}6. CONFIGURAÇÃO SUPABASE:${NC}"
echo "----------------------------"

# Procurar arquivos de configuração Supabase
find . -path ./node_modules -prune -o -name "*supabase*" -type f -print 2>/dev/null | grep -E "\.(js|jsx|ts|tsx)$" | head -10

echo ""

# 7. Verificar layout principal
echo -e "${YELLOW}7. LAYOUT PRINCIPAL:${NC}"
echo "----------------------------"

if [ "$ROUTER_TYPE" = "app" ]; then
    if check_file "app/layout.js" || check_file "app/layout.jsx" || check_file "app/layout.ts" || check_file "app/layout.tsx"; then
        echo "Primeiras 50 linhas do layout:"
        head -50 app/layout.* 2>/dev/null
    fi
elif [ "$ROUTER_TYPE" = "pages" ]; then
    if check_file "pages/_app.js" || check_file "pages/_app.jsx" || check_file "pages/_app.ts" || check_file "pages/_app.tsx"; then
        echo "Primeiras 50 linhas do _app:"
        head -50 pages/_app.* 2>/dev/null
    fi
fi

echo ""

# 8. Verificar middleware
echo -e "${YELLOW}8. MIDDLEWARE:${NC}"
echo "----------------------------"

if check_file "middleware.js" || check_file "middleware.ts"; then
    echo "Conteúdo do middleware:"
    cat middleware.* 2>/dev/null
fi

echo ""

# 9. Verificar configuração de autenticação
echo -e "${YELLOW}9. AUTENTICAÇÃO SUPABASE:${NC}"
echo "----------------------------"

echo "Procurando por onAuthStateChange:"
grep -r "onAuthStateChange" --include="*.js" --include="*.jsx" --include="*.ts" --include="*.tsx" . 2>/dev/null | grep -v node_modules | head -5

echo ""
echo "Procurando por PASSWORD_RECOVERY:"
grep -r "PASSWORD_RECOVERY" --include="*.js" --include="*.jsx" --include="*.ts" --include="*.tsx" . 2>/dev/null | grep -v node_modules

echo ""

# 10. Scripts do package.json
echo -e "${YELLOW}10. SCRIPTS DISPONÍVEIS:${NC}"
echo "----------------------------"

if [ -f "package.json" ]; then
    echo "Scripts do package.json:"
    grep -A 10 '"scripts"' package.json | grep -E '^\s*"[^"]+":' | head -10
fi

echo ""

# 11. Verificar se o projeto está rodando
echo -e "${YELLOW}11. STATUS DO SERVIDOR:${NC}"
echo "----------------------------"

if lsof -i:3000 >/dev/null 2>&1; then
    echo -e "${GREEN}✓${NC} Servidor rodando na porta 3000"
else
    echo -e "${YELLOW}⚠${NC} Servidor não está rodando na porta 3000"
fi

echo ""

# 12. Gerar resumo
echo -e "${YELLOW}12. RESUMO DA ANÁLISE:${NC}"
echo "----------------------------"

# Criar arquivo com resumo
REPORT_FILE="project-analysis-$(date +%Y%m%d-%H%M%S).txt"

{
    echo "RELATÓRIO DE ANÁLISE DO PROJETO EAD"
    echo "Data: $(date)"
    echo "=================================="
    echo ""
    echo "1. TIPO DE ROUTER: $ROUTER_TYPE"
    echo ""
    echo "2. ARQUIVOS IMPORTANTES ENCONTRADOS:"
    ls -la | grep -E "(package.json|.env|middleware|supabase)" | awk '{print "   - " $9}'
    echo ""
    echo "3. ESTRUTURA DE ROTAS:"
    if [ "$ROUTER_TYPE" = "app" ]; then
        find app -name "page.*" -type f 2>/dev/null | sort | awk '{print "   - " $0}'
    fi
    echo ""
    echo "4. RESET PASSWORD:"
    echo "   - Rota reset-password: $(find . -path "*reset-password*" -name "page.*" 2>/dev/null | wc -l) arquivo(s) encontrado(s)"
    echo ""
    echo "5. COMPONENTES SUPABASE:"
    find . -path ./node_modules -prune -o -name "*supabase*" -type f -print 2>/dev/null | grep -E "\.(js|jsx|ts|tsx)$" | wc -l
    echo " arquivo(s) relacionado(s) ao Supabase"
} > "$REPORT_FILE"

echo "✓ Relatório salvo em: $REPORT_FILE"
echo ""
echo "Para executar o servidor de desenvolvimento:"
echo "  npm run dev"
echo "  # ou"
echo "  yarn dev"
echo ""
echo "========================================"
echo "         ANÁLISE CONCLUÍDA"
echo "========================================"

# Perguntar se deve mostrar mais detalhes
echo ""
read -p "Deseja ver o conteúdo de algum arquivo específico? (s/n): " -n 1 -r
echo ""
if [[ $REPLY =~ ^[Ss]$ ]]; then
    read -p "Digite o caminho do arquivo: " filepath
    if [ -f "$filepath" ]; then
        echo ""
        echo "Conteúdo de $filepath:"
        echo "----------------------------"
        cat "$filepath"
    else
        echo "Arquivo não encontrado!"
    fi
fi