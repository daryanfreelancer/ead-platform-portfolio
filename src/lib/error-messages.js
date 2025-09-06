// Mapeamento de mensagens de erro do Supabase para português
export const authErrorMessages = {
  // Erros de autenticação
  'Invalid login credentials': 'Credenciais de login inválidas',
  'Email not confirmed': 'Email não confirmado. Verifique sua caixa de entrada',
  'User already registered': 'Usuário já registrado',
  'Password should be at least 6 characters': 'A senha deve ter pelo menos 6 caracteres',
  'Invalid email': 'Email inválido',
  'Email rate limit exceeded': 'Limite de tentativas excedido. Tente novamente mais tarde',
  'User not found': 'Usuário não encontrado',
  'Invalid password': 'Senha inválida',
  'New password should be different from the old password': 'A nova senha deve ser diferente da senha atual',
  
  // Erros de signup
  'User already exists': 'Este email já está cadastrado',
  'Signup disabled': 'Novos cadastros estão temporariamente desabilitados',
  'Email address invalid': 'Endereço de email inválido',
  
  // Erros de reset de senha
  'Password reset required': 'É necessário redefinir sua senha',
  'Password reset email sent': 'Email de recuperação enviado',
  'Password reset token invalid': 'Token de recuperação inválido ou expirado',
  
  // Erros de sessão
  'Session expired': 'Sessão expirada. Faça login novamente',
  'No session found': 'Nenhuma sessão encontrada',
  'Refresh token invalid': 'Token de atualização inválido',
  
  // Erros genéricos
  'Network request failed': 'Erro de conexão. Verifique sua internet',
  'Too many requests': 'Muitas tentativas. Aguarde alguns minutos',
  'Service unavailable': 'Serviço temporariamente indisponível',
  'Internal server error': 'Erro interno do servidor',
  
  // Erros de permissão
  'Unauthorized': 'Não autorizado',
  'Access denied': 'Acesso negado',
  'Insufficient permissions': 'Permissões insuficientes',
  
  // Erros customizados
  'duplicate': 'Email já cadastrado no sistema',
  'already': 'Email já cadastrado no sistema',
  'Invalid CPF': 'CPF inválido',
  'Phone number invalid': 'Número de telefone inválido',
  'Name is required': 'Nome é obrigatório',
  'Password confirmation does not match': 'As senhas não coincidem',
  'CPF já cadastrado no sistema': 'CPF já cadastrado no sistema',
  'Email já cadastrado no sistema': 'Email já cadastrado no sistema',
  'Erro ao verificar CPF no sistema': 'Erro ao verificar CPF no sistema',
  'Erro ao criar perfil': 'Erro ao criar perfil do usuário',
  'Erro interno do servidor': 'Erro interno do servidor. Tente novamente em alguns instantes.'
}

// Função para traduzir mensagens de erro
export function translateError(error) {
  if (!error) return 'Erro desconhecido'
  
  // Se for string simples
  if (typeof error === 'string') {
    // Procura por palavras-chave nas mensagens
    for (const [key, value] of Object.entries(authErrorMessages)) {
      if (error.toLowerCase().includes(key.toLowerCase())) {
        return value
      }
    }
    return error
  }
  
  // Se for objeto de erro
  if (error.message) {
    for (const [key, value] of Object.entries(authErrorMessages)) {
      if (error.message.toLowerCase().includes(key.toLowerCase())) {
        return value
      }
    }
    return error.message
  }
  
  return 'Erro ao processar solicitação'
}

// Mensagens de validação de formulário
export const formValidationMessages = {
  required: 'Este campo é obrigatório',
  email: 'Email inválido',
  minLength: (min) => `Mínimo de ${min} caracteres`,
  maxLength: (max) => `Máximo de ${max} caracteres`,
  pattern: 'Formato inválido',
  cpf: 'CPF inválido',
  phone: 'Telefone inválido',
  password: 'A senha deve ter pelo menos 6 caracteres',
  passwordMatch: 'As senhas não coincidem',
  number: 'Deve ser um número',
  positive: 'Deve ser um valor positivo',
  url: 'URL inválida',
  date: 'Data inválida',
  futureDate: 'A data deve ser futura',
  pastDate: 'A data deve ser passada'
}