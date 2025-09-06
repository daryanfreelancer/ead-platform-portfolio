# Implementação de PDF para Certificados

## Estrutura de Campos

### Certificados Atuais (tabela `enrollments`)
- **`certificate_url`**: Armazena a URL do PDF do certificado
- Quando um certificado é gerado, salvar o PDF no bucket `certificates` e armazenar a URL neste campo

### Certificados Legados (tabela `legacy_certificates`) 
- **Campos obrigatórios em português**:
  - `nome_aluno`: Nome completo do aluno
  - `cpf`: CPF do aluno (11 dígitos)
  - `numero_certificado`: Número único do certificado
  - `nome_curso`: Nome do curso
  - `carga_horaria`: Carga horária em horas (inteiro)
  - `data_conclusao`: Data de conclusão (formato YYYY-MM-DD)
  - `pdf_url`: URL do PDF do certificado (opcional)
  - `is_active`: Status ativo/inativo (boolean, padrão: true)

## Funcionalidades Implementadas

### 1. Cadastro Individual
- Interface modal em `/administrador/certificados`
- Formulário com todos os campos obrigatórios
- Upload opcional de PDF
- Validação completa dos dados

### 2. Importação em Lote
- Importação via Excel/CSV
- Upload de PDFs individuais por certificado
- Validação de estrutura e dados

### 3. Consulta Pública
- Busca por CPF em `/consulta-certificados`
- Download de PDFs quando disponíveis
- Suporte para certificados atuais e legados

## Uso no Código

### Consulta Pública (`/consulta-certificados`)
```javascript
// Para certificados atuais
certificate_url: cert.certificate_url

// Para certificados legados - mapear pdf_url para certificate_url
certificate_url: cert.pdf_url || null
```

### Admin Certificates List
```javascript
// Certificados do sistema usam certificate_url
{cert.certificate_url && (
  <a href={cert.certificate_url}>Download PDF</a>
)}

// Certificados legados usam pdf_url
{cert.pdf_url && (
  <a href={cert.pdf_url}>Download PDF</a>
)}
```

## Bucket Storage
- Bucket: `certificates` (público)
- Caminho: `{numero_certificado}-{timestamp}.pdf`

## APIs Implementadas
- `POST /api/admin/create-legacy-certificate` - Criar certificado individual
- `POST /api/admin/bulk-import-certificates` - Importação em lote
- `POST /api/admin/toggle-certificate-status` - Ativar/desativar certificado

## Importante
- ✅ Usar apenas campos em português conforme padrão do projeto
- ✅ Validar CPF com 11 dígitos
- ✅ Certificados atuais: usar `certificate_url`
- ✅ Certificados legados: usar `pdf_url`
- ❌ NÃO usar `certificate_pdf_url` - este campo não existe
- ❌ NÃO usar campos híbridos como `student_name`, `course_name`, etc.