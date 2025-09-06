#!/usr/bin/env node

/**
 * Servidor MCP para documentação SIE
 * Permite acesso inteligente a documentação grande sem exceder limites de token
 */

const fs = require('fs');
const path = require('path');

class SieDocumentationMCP {
  constructor() {
    this.docPath = path.join(__dirname, '../docs/sie-api-documentation.md');
    this.documentation = '';
    this.sections = {};
    this.endpoints = {};
    
    this.loadDocumentation();
  }

  loadDocumentation() {
    try {
      this.documentation = fs.readFileSync(this.docPath, 'utf8');
      this.parseSections();
      this.parseEndpoints();
      console.log('✅ Documentação SIE carregada com sucesso');
    } catch (error) {
      console.error('❌ Erro ao carregar documentação:', error);
    }
  }

  parseSections() {
    // Divide o documento em seções baseadas em headers
    const lines = this.documentation.split('\n');
    let currentSection = 'intro';
    let sectionContent = [];
    
    lines.forEach(line => {
      if (line.startsWith('## ')) {
        // Salva seção anterior
        if (sectionContent.length > 0) {
          this.sections[currentSection] = sectionContent.join('\n');
        }
        // Inicia nova seção
        currentSection = line.replace('## ', '').toLowerCase()
          .replace(/[^a-z0-9]/g, '-')
          .replace(/-+/g, '-');
        sectionContent = [line];
      } else {
        sectionContent.push(line);
      }
    });
    
    // Salva última seção
    if (sectionContent.length > 0) {
      this.sections[currentSection] = sectionContent.join('\n');
    }
  }

  parseEndpoints() {
    // Extrai informações específicas de endpoints
    const endpointRegex = /Endpoint:\s*(.+)/g;
    const matches = [...this.documentation.matchAll(endpointRegex)];
    
    matches.forEach(match => {
      const endpoint = match[1].trim();
      const startIndex = match.index;
      const endIndex = this.documentation.indexOf('\n---', startIndex);
      
      if (endIndex > startIndex) {
        const content = this.documentation.substring(startIndex, endIndex);
        this.endpoints[endpoint] = this.parseEndpointDetails(content);
      }
    });
  }

  parseEndpointDetails(content) {
    const details = {
      endpoint: '',
      parameters: [],
      returns: '',
      limits: {},
      example: ''
    };

    // Extrai parâmetros
    const paramRegex = /Parâmetros:\s*([\s\S]*?)(?=Objetos retornados:|Exemplo|$)/;
    const paramMatch = content.match(paramRegex);
    if (paramMatch) {
      details.parameters = paramMatch[1].trim().split('\n')
        .filter(line => line.trim())
        .map(line => line.trim());
    }

    // Busca por limites específicos
    if (content.includes('results')) {
      const resultsMatch = content.match(/results.*?(padrão\s*=\s*\d+|máximo\s*=\s*\d+)/gi);
      if (resultsMatch) {
        details.limits.results = resultsMatch[0];
      }
    }

    if (content.includes('limit')) {
      const limitMatch = content.match(/limit.*?(\d+)/gi);
      if (limitMatch) {
        details.limits.general = limitMatch[0];
      }
    }

    return details;
  }

  // === Ferramentas MCP ===

  searchDocumentation(query) {
    const results = [];
    const searchTerms = query.toLowerCase().split(' ');
    
    // Busca em seções
    Object.entries(this.sections).forEach(([name, content]) => {
      const lowerContent = content.toLowerCase();
      const matches = searchTerms.filter(term => lowerContent.includes(term)).length;
      
      if (matches > 0) {
        const snippet = this.extractSnippet(content, searchTerms[0], 200);
        results.push({
          type: 'section',
          name,
          matches,
          snippet
        });
      }
    });

    // Busca em endpoints
    Object.entries(this.endpoints).forEach(([endpoint, details]) => {
      const searchableText = JSON.stringify(details).toLowerCase();
      const matches = searchTerms.filter(term => searchableText.includes(term)).length;
      
      if (matches > 0) {
        results.push({
          type: 'endpoint',
          endpoint,
          matches,
          details: details.limits
        });
      }
    });

    // Ordena por relevância
    results.sort((a, b) => b.matches - a.matches);
    
    return results.slice(0, 10); // Top 10 resultados
  }

  extractSnippet(content, searchTerm, maxLength = 200) {
    const index = content.toLowerCase().indexOf(searchTerm.toLowerCase());
    if (index === -1) return content.substring(0, maxLength);
    
    const start = Math.max(0, index - 50);
    const end = Math.min(content.length, index + searchTerm.length + 150);
    
    let snippet = content.substring(start, end);
    if (start > 0) snippet = '...' + snippet;
    if (end < content.length) snippet = snippet + '...';
    
    return snippet;
  }

  getSection(sectionName) {
    const normalizedName = sectionName.toLowerCase()
      .replace(/[^a-z0-9]/g, '-')
      .replace(/-+/g, '-');
    
    return this.sections[normalizedName] || `Seção '${sectionName}' não encontrada`;
  }

  getEndpointInfo(endpoint) {
    if (this.endpoints[endpoint]) {
      return this.endpoints[endpoint];
    }
    
    // Busca parcial
    const matches = Object.keys(this.endpoints)
      .filter(e => e.includes(endpoint));
    
    if (matches.length === 1) {
      return this.endpoints[matches[0]];
    } else if (matches.length > 1) {
      return {
        message: 'Múltiplos endpoints encontrados',
        matches
      };
    }
    
    return { error: `Endpoint '${endpoint}' não encontrado` };
  }

  getLimitsAndPagination() {
    const limitsInfo = {
      courses: {},
      general: {},
      bestPractices: []
    };

    // Busca informações específicas sobre limites de cursos
    const coursesEndpoint = this.endpoints['/api/course/get-courses'];
    if (coursesEndpoint) {
      limitsInfo.courses = coursesEndpoint.limits;
    }

    // Extrai boas práticas da documentação
    const bestPracticesSection = this.sections['primeiros-passos'] || '';
    if (bestPracticesSection.includes('máximo')) {
      const maxMatch = bestPracticesSection.match(/máximo.*?(\d+)/gi);
      if (maxMatch) {
        limitsInfo.bestPractices.push(maxMatch[0]);
      }
    }

    // Busca por informações de paginação
    Object.entries(this.endpoints).forEach(([endpoint, details]) => {
      if (details.limits && Object.keys(details.limits).length > 0) {
        limitsInfo.general[endpoint] = details.limits;
      }
    });

    return limitsInfo;
  }

  listAvailableSections() {
    return Object.keys(this.sections).map(name => ({
      name,
      size: this.sections[name].length,
      preview: this.sections[name].substring(0, 100) + '...'
    }));
  }

  listAvailableEndpoints() {
    return Object.keys(this.endpoints).sort();
  }
}

// === Interface MCP ===

const mcp = new SieDocumentationMCP();

// Simula interface MCP para testes locais
if (require.main === module) {
  console.log('\n📚 Servidor MCP de Documentação SIE');
  console.log('====================================\n');
  
  // Exemplos de uso
  console.log('1. Buscando por "paginação limits":');
  console.log(JSON.stringify(mcp.searchDocumentation('paginação limits'), null, 2));
  
  console.log('\n2. Informações sobre limites:');
  console.log(JSON.stringify(mcp.getLimitsAndPagination(), null, 2));
  
  console.log('\n3. Seções disponíveis:');
  console.log(mcp.listAvailableSections().map(s => s.name).join(', '));
  
  console.log('\n4. Info do endpoint get-courses:');
  console.log(JSON.stringify(mcp.getEndpointInfo('/api/course/get-courses'), null, 2));
}

module.exports = { SieDocumentationMCP };