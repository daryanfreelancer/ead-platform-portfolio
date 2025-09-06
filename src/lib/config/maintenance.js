/**
 * Configurações de Modo de Manutenção
 * 
 * Controla funcionalidades que podem ser desabilitadas temporariamente
 * durante deploys graduais ou manutenção da plataforma
 */

export const MAINTENANCE_CONFIG = {
  // Controle geral de manutenção
  isMaintenanceMode: process.env.NEXT_PUBLIC_MAINTENANCE_MODE === 'true',
  
  // Data de fim da manutenção (formato ISO para parsing correto)
  maintenanceEndDate: process.env.NEXT_PUBLIC_MAINTENANCE_END_DATE || '2025-07-19',
  
  // Funcionalidades específicas que podem ser desabilitadas
  features: {
    // Cadastro de novos usuários
    registrationDisabled: process.env.NEXT_PUBLIC_MAINTENANCE_MODE === 'true',
    
    // Consulta pública de certificados por CPF
    publicCertificateSearchDisabled: process.env.NEXT_PUBLIC_MAINTENANCE_MODE === 'true',
    
    // Sistema de pagamentos (manter ativo por enquanto)
    paymentsDisabled: false,
    
    // Matrícula em cursos (manter ativo para usuários existentes)
    enrollmentDisabled: false
  },
  
  // Mensagens personalizadas
  messages: {
    registration: 'O cadastro de novos estudantes está temporariamente indisponível.',
    certificateSearch: 'A consulta pública de certificados está temporariamente indisponível.',
    general: 'Esta funcionalidade está temporariamente indisponível para manutenção.'
  }
}

/**
 * Verifica se uma funcionalidade está disponível
 * @param {string} featureName - Nome da funcionalidade
 * @returns {boolean} - True se a funcionalidade está disponível
 */
export function isFeatureAvailable(featureName) {
  // Se a data de manutenção já passou, tudo está disponível, independentemente do modo
  if (isMaintenanceExpired()) {
    return true
  }
  
  // Se não está em modo de manutenção, tudo está disponível
  if (!MAINTENANCE_CONFIG.isMaintenanceMode) {
    return true
  }
  
  // Caso contrário, verificar configuração específica da funcionalidade
  return !MAINTENANCE_CONFIG.features[featureName]
}

/**
 * Obtém a mensagem de manutenção para uma funcionalidade
 * @param {string} featureName - Nome da funcionalidade
 * @returns {string} - Mensagem de manutenção
 */
export function getMaintenanceMessage(featureName) {
  return MAINTENANCE_CONFIG.messages[featureName] || MAINTENANCE_CONFIG.messages.general
}

/**
 * Verifica se a data de manutenção já passou
 * @returns {boolean} - True se a manutenção deveria ter terminado
 */
export function isMaintenanceExpired() {
  // Adiciona 'T12:00:00' para garantir que seja meio-dia e evitar problemas de timezone
  const endDate = new Date(MAINTENANCE_CONFIG.maintenanceEndDate + 'T12:00:00')
  const today = new Date()
  return today > endDate
}

/**
 * Formata a data de fim da manutenção para exibição
 * @returns {string} - Data formatada em pt-BR
 */
export function getFormattedMaintenanceEndDate() {
  // Adiciona 'T12:00:00' para garantir que seja meio-dia e evitar problemas de timezone
  const endDate = new Date(MAINTENANCE_CONFIG.maintenanceEndDate + 'T12:00:00')
  return endDate.toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    timeZone: 'America/Sao_Paulo'
  })
}