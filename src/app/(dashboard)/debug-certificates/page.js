'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Card } from '@/components/ui/card'

const supabase = createClient()

export default function DebugCertificatesPage() {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      setLoading(true)
      
      // Get current user
      const { data: { user }, error: authError } = await supabase.auth.getUser()
      
      if (authError || !user) {
        setError('Usuário não autenticado')
        return
      }

      // Check legacy_certificates table
      const { data: certificates, error: certsError } = await supabase
        .from('legacy_certificates')
        .select('*')
        .eq('student_id', user.id)
        .order('created_at', { ascending: false })

      // Check enrollments with completed_at
      const { data: completedEnrollments, error: enrollError } = await supabase
        .from('enrollments')
        .select(`
          id,
          student_id,
          course_id,
          progress,
          completed_at,
          courses (
            title
          )
        `)
        .eq('student_id', user.id)
        .not('completed_at', 'is', null)

      // Check all enrollments
      const { data: allEnrollments, error: allEnrollError } = await supabase
        .from('enrollments')
        .select(`
          id,
          student_id,
          course_id,
          progress,
          completed_at,
          courses (
            title
          )
        `)
        .eq('student_id', user.id)

      setData({
        user: {
          id: user.id,
          email: user.email
        },
        certificates: certificates || [],
        certificatesCount: certificates?.length || 0,
        completedEnrollments: completedEnrollments || [],
        completedEnrollmentsCount: completedEnrollments?.length || 0,
        allEnrollments: allEnrollments || [],
        allEnrollmentsCount: allEnrollments?.length || 0,
        errors: {
          certificates: certsError?.message || null,
          enrollments: enrollError?.message || null,
          allEnrollments: allEnrollError?.message || null
        }
      })

    } catch (err) {
      console.error('Debug error:', err)
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="p-6 max-w-4xl mx-auto">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-2 text-gray-600">Carregando dados...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="p-6 max-w-4xl mx-auto">
        <Card className="p-6 bg-red-50 border-red-200">
          <h2 className="text-xl font-bold text-red-900 mb-2">Erro</h2>
          <p className="text-red-700">{error}</p>
        </Card>
      </div>
    )
  }

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Debug: Dados de Certificados</h1>
      
      {/* User Info */}
      <Card className="p-4 mb-6">
        <h2 className="text-lg font-semibold mb-2">Usuário</h2>
        <pre className="bg-gray-100 p-3 rounded text-sm overflow-auto">
          {JSON.stringify(data.user, null, 2)}
        </pre>
      </Card>

      {/* Certificates */}
      <Card className="p-4 mb-6">
        <h2 className="text-lg font-semibold mb-2">
          Certificados na Tabela ({data.certificatesCount})
        </h2>
        {data.errors.certificates && (
          <div className="bg-red-100 border border-red-300 text-red-700 p-2 rounded mb-3">
            Erro: {data.errors.certificates}
          </div>
        )}
        <pre className="bg-gray-100 p-3 rounded text-sm overflow-auto max-h-64">
          {JSON.stringify(data.certificates, null, 2)}
        </pre>
      </Card>

      {/* Completed Enrollments */}
      <Card className="p-4 mb-6">
        <h2 className="text-lg font-semibold mb-2">
          Matrículas Concluídas ({data.completedEnrollmentsCount})
        </h2>
        {data.errors.enrollments && (
          <div className="bg-red-100 border border-red-300 text-red-700 p-2 rounded mb-3">
            Erro: {data.errors.enrollments}
          </div>
        )}
        <pre className="bg-gray-100 p-3 rounded text-sm overflow-auto max-h-64">
          {JSON.stringify(data.completedEnrollments, null, 2)}
        </pre>
      </Card>

      {/* All Enrollments */}
      <Card className="p-4 mb-6">
        <h2 className="text-lg font-semibold mb-2">
          Todas as Matrículas ({data.allEnrollmentsCount})
        </h2>
        {data.errors.allEnrollments && (
          <div className="bg-red-100 border border-red-300 text-red-700 p-2 rounded mb-3">
            Erro: {data.errors.allEnrollments}
          </div>
        )}
        <pre className="bg-gray-100 p-3 rounded text-sm overflow-auto max-h-64">
          {JSON.stringify(data.allEnrollments, null, 2)}
        </pre>
      </Card>

      {/* Actions */}
      <Card className="p-4">
        <h2 className="text-lg font-semibold mb-2">Ações</h2>
        <button
          onClick={loadData}
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          Recarregar Dados
        </button>
      </Card>
    </div>
  )
}