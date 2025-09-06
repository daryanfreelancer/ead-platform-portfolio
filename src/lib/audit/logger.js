import { createClient } from '@/lib/supabase/client'

class AuditLogger {
  constructor() {
    this.supabase = createClient()
  }

  // Tipos de ações auditáveis
  static ACTION_TYPES = {
    USER_DELETE: 'user_delete',
    USER_ROLE_CHANGE: 'user_role_change',
    COURSE_DELETE: 'course_delete',
    COURSE_APPROVE: 'course_approve',
    COURSE_REJECT: 'course_reject',
    ENROLLMENT_DELETE: 'enrollment_delete',
    CERTIFICATE_DELETE: 'certificate_delete',
    BULK_DELETE: 'bulk_delete',
    STORAGE_CLEANUP: 'storage_cleanup',
    LOGIN_ADMIN: 'login_admin',
    TEACHER_CREATE: 'teacher_create'
  }

  // Níveis de severidade
  static SEVERITY_LEVELS = {
    LOW: 'low',
    MEDIUM: 'medium',
    HIGH: 'high',
    CRITICAL: 'critical'
  }

  /**
   * Registra uma ação de auditoria
   * @param {string} action - Tipo da ação (usar ACTION_TYPES)
   * @param {string} actor_id - ID do usuário que executou a ação
   * @param {string} target_type - Tipo do alvo (user, course, enrollment, etc.)
   * @param {string} target_id - ID do alvo da ação
   * @param {Object} details - Detalhes adicionais da ação
   * @param {string} severity - Nível de severidade (usar SEVERITY_LEVELS)
   */
  async log(action, actor_id, target_type, target_id, details = {}, severity = AuditLogger.SEVERITY_LEVELS.MEDIUM) {
    try {
      const auditEntry = {
        action,
        actor_id,
        target_type,
        target_id,
        details: JSON.stringify(details),
        severity,
        timestamp: new Date().toISOString(),
        ip_address: this.getClientIP(),
        user_agent: typeof window !== 'undefined' ? navigator.userAgent : null
      }

      // Para agora, vamos apenas logar no console e localStorage
      // Em produção, isso seria enviado para uma tabela de auditoria
      console.log('🔍 AUDIT LOG:', auditEntry)
      
      // Armazenar localmente para demonstração
      if (typeof window !== 'undefined') {
        const existingLogs = JSON.parse(localStorage.getItem('audit_logs') || '[]')
        existingLogs.unshift(auditEntry)
        
        // Manter apenas os últimos 100 logs
        if (existingLogs.length > 100) {
          existingLogs.splice(100)
        }
        
        localStorage.setItem('audit_logs', JSON.stringify(existingLogs))
      }

      return { success: true, auditId: Date.now().toString() }
    } catch (error) {
      console.error('Erro ao registrar log de auditoria:', error)
      return { success: false, error: error.message }
    }
  }

  /**
   * Log específico para deleção de usuário
   */
  async logUserDeletion(actor_id, deleted_user) {
    return this.log(
      AuditLogger.ACTION_TYPES.USER_DELETE,
      actor_id,
      'user',
      deleted_user.id,
      {
        deleted_user_email: deleted_user.email,
        deleted_user_name: deleted_user.full_name,
        deleted_user_role: deleted_user.role,
        reason: 'Admin deletion'
      },
      AuditLogger.SEVERITY_LEVELS.HIGH
    )
  }

  /**
   * Log específico para mudança de papel
   */
  async logRoleChange(actor_id, target_user_id, old_role, new_role) {
    return this.log(
      AuditLogger.ACTION_TYPES.USER_ROLE_CHANGE,
      actor_id,
      'user',
      target_user_id,
      {
        old_role,
        new_role,
        reason: 'Admin role change'
      },
      AuditLogger.SEVERITY_LEVELS.HIGH
    )
  }

  /**
   * Log específico para deleção de curso
   */
  async logCourseDeletion(actor_id, course) {
    return this.log(
      AuditLogger.ACTION_TYPES.COURSE_DELETE,
      actor_id,
      'course',
      course.id,
      {
        course_title: course.title,
        course_teacher: course.teacher_id,
        enrollments_count: course.enrollments?.length || 0,
        reason: 'Admin/Teacher deletion'
      },
      AuditLogger.SEVERITY_LEVELS.MEDIUM
    )
  }

  /**
   * Log específico para aprovação/rejeição de curso
   */
  async logCourseApproval(actor_id, course_id, action, reason = '') {
    const actionType = action === 'approve' ? 
      AuditLogger.ACTION_TYPES.COURSE_APPROVE : 
      AuditLogger.ACTION_TYPES.COURSE_REJECT

    return this.log(
      actionType,
      actor_id,
      'course',
      course_id,
      {
        action,
        reason,
        timestamp: new Date().toISOString()
      },
      AuditLogger.SEVERITY_LEVELS.MEDIUM
    )
  }

  /**
   * Log específico para deleção de matrícula
   */
  async logEnrollmentDeletion(actor_id, enrollment_id, student_id, course_id) {
    return this.log(
      AuditLogger.ACTION_TYPES.ENROLLMENT_DELETE,
      actor_id,
      'enrollment',
      enrollment_id,
      {
        student_id,
        course_id,
        reason: 'Unenrollment'
      },
      AuditLogger.SEVERITY_LEVELS.LOW
    )
  }

  /**
   * Log específico para deleção de certificado
   */
  async logCertificateDeletion(actor_id, certificate_id, user_id) {
    return this.log(
      AuditLogger.ACTION_TYPES.CERTIFICATE_DELETE,
      actor_id,
      'certificate',
      certificate_id,
      {
        certificate_owner: user_id,
        reason: 'Certificate deletion'
      },
      AuditLogger.SEVERITY_LEVELS.MEDIUM
    )
  }

  /**
   * Log específico para operações em lote
   */
  async logBulkOperation(actor_id, operation_type, targets_count, details = {}) {
    return this.log(
      AuditLogger.ACTION_TYPES.BULK_DELETE,
      actor_id,
      'bulk_operation',
      `bulk_${Date.now()}`,
      {
        operation_type,
        targets_count,
        ...details
      },
      AuditLogger.SEVERITY_LEVELS.HIGH
    )
  }

  /**
   * Log específico para limpeza de storage
   */
  async logStorageCleanup(actor_id, bucket, files_deleted) {
    return this.log(
      AuditLogger.ACTION_TYPES.STORAGE_CLEANUP,
      actor_id,
      'storage',
      bucket,
      {
        bucket_name: bucket,
        files_deleted_count: files_deleted.length,
        files_deleted: files_deleted.map(f => f.file || f.name).slice(0, 10) // Primeiros 10 arquivos
      },
      AuditLogger.SEVERITY_LEVELS.MEDIUM
    )
  }

  /**
   * Log para criação de professor
   */
  async logTeacherCreation(actor_id, teacher_data) {
    return this.log(
      AuditLogger.ACTION_TYPES.TEACHER_CREATE,
      actor_id,
      'user',
      teacher_data.id || 'pending',
      {
        teacher_email: teacher_data.email,
        teacher_name: teacher_data.full_name,
        created_by_admin: true
      },
      AuditLogger.SEVERITY_LEVELS.MEDIUM
    )
  }

  /**
   * Obter logs de auditoria (para demonstração, lê do localStorage)
   */
  getLogs(limit = 50) {
    if (typeof window === 'undefined') return []
    
    const logs = JSON.parse(localStorage.getItem('audit_logs') || '[]')
    return logs.slice(0, limit)
  }

  /**
   * Filtrar logs por tipo de ação
   */
  getLogsByAction(action, limit = 20) {
    const allLogs = this.getLogs(100)
    return allLogs.filter(log => log.action === action).slice(0, limit)
  }

  /**
   * Filtrar logs por ator
   */
  getLogsByActor(actor_id, limit = 20) {
    const allLogs = this.getLogs(100)
    return allLogs.filter(log => log.actor_id === actor_id).slice(0, limit)
  }

  /**
   * Obter IP do cliente (simulado)
   */
  getClientIP() {
    // Em produção, isso viria do servidor via headers
    return '127.0.0.1'
  }

  /**
   * Limpar logs antigos (para demonstração)
   */
  clearOldLogs() {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('audit_logs')
    }
  }
}

// Instância singleton
export const auditLogger = new AuditLogger()
export default AuditLogger