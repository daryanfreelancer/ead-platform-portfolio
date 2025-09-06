'use client'
import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { StorageCleanup } from '@/lib/storage/cleanup'
import { auditLogger } from '@/lib/audit/logger'

export function useDeleteOperations() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const supabase = createClient()
  const storageCleanup = new StorageCleanup()

  // Deleta usuário e todos os dados relacionados
  const deleteUser = async (userId, userProfile) => {
    setLoading(true)
    setError(null)
    
    try {
      // 1. Verificar se é seguro deletar (não é admin único)
      const { data: adminCount } = await supabase
        .from('profiles')
        .select('id', { count: 'exact', head: true })
        .eq('role', 'admin')
      
      if (userProfile.role === 'admin' && adminCount.count <= 1) {
        throw new Error('Não é possível deletar o último administrador do sistema')
      }

      // 2. Deletar matrículas
      await supabase
        .from('enrollments')
        .delete()
        .eq('student_id', userId)

      // 3. Deletar certificados
      await supabase
        .from('legacy_certificates')
        .delete()
        .eq('user_id', userId)

      // 4. Deletar cursos criados (se for professor)
      if (userProfile.role === 'teacher') {
        const { data: courses } = await supabase
          .from('courses')
          .select('thumbnail_url, video_url')
          .eq('teacher_id', userId)

        // Deletar arquivos dos cursos
        for (const course of courses || []) {
          await storageCleanup.deleteCourseFiles(course.thumbnail_url, course.video_url)
        }

        // Deletar cursos
        await supabase
          .from('courses')
          .delete()
          .eq('teacher_id', userId)
      }

      // 5. Deletar avatar
      if (userProfile.avatar_url) {
        await storageCleanup.deleteUserAvatar(userProfile.avatar_url)
      }

      // 6. Deletar perfil
      const { error: profileError } = await supabase
        .from('profiles')
        .delete()
        .eq('id', userId)

      if (profileError) throw profileError

      // 7. Registrar auditoria
      const { data: { user: currentUser } } = await supabase.auth.getUser()
      if (currentUser) {
        await auditLogger.logUserDeletion(currentUser.id, userProfile)
      }

      // 8. Deletar usuário do auth (apenas admin pode fazer isso)
      // Nota: Isso requer chamada para API admin do Supabase
      console.log('Usuário deletado do banco, auth precisa ser deletado via Admin API')

      return { success: true }
    } catch (err) {
      console.error('Erro ao deletar usuário:', err)
      setError(err.message)
      return { success: false, error: err.message }
    } finally {
      setLoading(false)
    }
  }

  // Deleta curso e arquivos relacionados
  const deleteCourse = async (courseId, course) => {
    setLoading(true)
    setError(null)
    
    try {
      // 1. Verificar se usuário tem permissão
      const { data: { user } } = await supabase.auth.getUser()
      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single()

      if (profile.role !== 'admin' && course.teacher_id !== user.id) {
        throw new Error('Sem permissão para deletar este curso')
      }

      // 2. Deletar matrículas relacionadas
      await supabase
        .from('enrollments')
        .delete()
        .eq('course_id', courseId)

      // 3. Deletar certificados relacionados
      await supabase
        .from('legacy_certificates')
        .delete()
        .eq('course_id', courseId)

      // 4. Deletar arquivos do storage
      await storageCleanup.deleteCourseFiles(course.thumbnail_url, course.video_url)

      // 5. Deletar curso
      const { error: courseError } = await supabase
        .from('courses')
        .delete()
        .eq('id', courseId)

      if (courseError) throw courseError

      // 6. Registrar auditoria
      const { data: { user: currentUser } } = await supabase.auth.getUser()
      if (currentUser) {
        await auditLogger.logCourseDeletion(currentUser.id, course)
      }

      return { success: true }
    } catch (err) {
      console.error('Erro ao deletar curso:', err)
      setError(err.message)
      return { success: false, error: err.message }
    } finally {
      setLoading(false)
    }
  }

  // Desmatricula usuário de um curso
  const unenrollFromCourse = async (enrollmentId, userId, courseId) => {
    setLoading(true)
    setError(null)
    
    try {
      // 1. Verificar se é o próprio usuário ou admin
      const { data: { user } } = await supabase.auth.getUser()
      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single()

      if (profile.role !== 'admin' && user.id !== userId) {
        throw new Error('Sem permissão para desmatricular este usuário')
      }

      // 2. Deletar certificados relacionados (se existirem)
      await supabase
        .from('legacy_certificates')
        .delete()
        .and(`user_id.eq.${userId},course_id.eq.${courseId}`)

      // 3. Deletar matrícula
      const { error: enrollmentError } = await supabase
        .from('enrollments')
        .delete()
        .eq('id', enrollmentId)

      if (enrollmentError) throw enrollmentError

      // 4. Registrar auditoria
      const { data: { user: currentUser } } = await supabase.auth.getUser()
      if (currentUser) {
        await auditLogger.logEnrollmentDeletion(currentUser.id, enrollmentId, userId, courseId)
      }

      return { success: true }
    } catch (err) {
      console.error('Erro ao desmatricular:', err)
      setError(err.message)
      return { success: false, error: err.message }
    } finally {
      setLoading(false)
    }
  }

  // Deleta certificado
  const deleteCertificate = async (certificateId, userId, isHistorical = false) => {
    setLoading(true)
    setError(null)
    
    try {
      // 1. Verificar permissões
      const { data: { user } } = await supabase.auth.getUser()
      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single()

      if (profile.role !== 'admin') {
        throw new Error('Sem permissão para deletar este certificado')
      }

      // 2. Deletar certificado da tabela apropriada
      const tableName = isHistorical ? 'certificados_antigos' : 'legacy_certificates'
      const { error: certError } = await supabase
        .from(tableName)
        .delete()
        .eq('id', certificateId)

      if (certError) throw certError

      // 3. Registrar auditoria
      const { data: { user: currentUser } } = await supabase.auth.getUser()
      if (currentUser) {
        await auditLogger.logCertificateDeletion(currentUser.id, certificateId, userId)
      }

      return { success: true }
    } catch (err) {
      console.error('Erro ao deletar certificado:', err)
      setError(err.message)
      return { success: false, error: err.message }
    } finally {
      setLoading(false)
    }
  }

  // Operações em lote para admin
  const bulkDeleteUsers = async (userIds) => {
    setLoading(true)
    setError(null)
    
    try {
      const results = []
      
      for (const userId of userIds) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', userId)
          .single()
        
        if (profile) {
          const result = await deleteUser(userId, profile)
          results.push({ userId, ...result })
        }
      }
      
      // Registrar auditoria para operação em lote
      const { data: { user: currentUser } } = await supabase.auth.getUser()
      if (currentUser) {
        await auditLogger.logBulkOperation(
          currentUser.id, 
          'bulk_user_delete', 
          userIds.length,
          { userIds: userIds.slice(0, 5) } // Apenas os primeiros 5 IDs
        )
      }

      return { success: true, results }
    } catch (err) {
      console.error('Erro em operação em lote:', err)
      setError(err.message)
      return { success: false, error: err.message }
    } finally {
      setLoading(false)
    }
  }

  return {
    deleteUser,
    deleteCourse,
    unenrollFromCourse,
    deleteCertificate,
    bulkDeleteUsers,
    loading,
    error,
    clearError: () => setError(null)
  }
}