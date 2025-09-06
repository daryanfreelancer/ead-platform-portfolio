import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { AdminOnly } from '@/components/auth/role-guard'
import AdminCertificatesList from '@/components/admin/admin-certificates-list'
import LegacyCertificatesSection from '@/components/admin/legacy-certificates-section'

// Força renderização dinâmica
export const dynamic = 'force-dynamic'

export default async function AdminCertificatesPage() {
  const supabase = await createClient()

  // Verificar se o usuário está logado
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    redirect('/entrar')
  }

  // Verificar se é admin
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (!profile || profile.role !== 'admin') {
    redirect('/administrador')
  }

  // Buscar certificados gerados pelo sistema (da tabela enrollments)
  const { data: systemCertificates } = await supabase
    .from('enrollments')
    .select(`
      *,
      profiles!student_id (
        id,
        full_name,
        cpf,
        email
      ),
      courses (
        id,
        title,
        duration,
        category
      )
    `)
    .not('completed_at', 'is', null)
    .order('completed_at', { ascending: false })
    .limit(100)

  // Buscar certificados legados (importados - tabela híbrida)
  const { data: legacyCertificates } = await supabase
    .from('legacy_certificates')
    .select('*')
    .order('data_conclusao', { ascending: false })
    .limit(100)

  // Buscar certificados históricos (nova tabela simplificada)
  const { data: historicalCertificates } = await supabase
    .from('certificados_antigos')
    .select('*')
    .order('data_conclusao', { ascending: false })
    .limit(100)

  // Estatísticas
  const { count: totalSystemCerts } = await supabase
    .from('enrollments')
    .select('*', { count: 'exact', head: true })
    .not('completed_at', 'is', null)

  const { count: totalLegacyCerts } = await supabase
    .from('legacy_certificates')
    .select('*', { count: 'exact', head: true })

  const { count: totalHistoricalCerts } = await supabase
    .from('certificados_antigos')
    .select('*', { count: 'exact', head: true })

  return (
    <div className="p-4 sm:p-6 max-w-7xl mx-auto">
      <AdminOnly showUnauthorized={true}>
        {/* Header */}
        <div className="mb-6 sm:mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">
            Gerenciar Certificados
          </h1>
          <p className="text-sm sm:text-base text-gray-600">
            Gerencie certificados emitidos pelo sistema e certificados legados importados
          </p>
        </div>

        {/* Estatísticas - Cards responsivos */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6 mb-6 sm:mb-8">
          <div className="bg-white rounded-lg shadow p-4 sm:p-6">
            <div className="text-xs sm:text-sm font-medium text-gray-600 mb-1">
              Total de Certificados
            </div>
            <div className="text-xl sm:text-2xl font-bold text-gray-900">
              {(totalSystemCerts || 0) + (totalLegacyCerts || 0) + (totalHistoricalCerts || 0)}
            </div>
          </div>
          <div className="bg-white rounded-lg shadow p-4 sm:p-6">
            <div className="text-xs sm:text-sm font-medium text-gray-600 mb-1">
              Certificados do Sistema
            </div>
            <div className="text-xl sm:text-2xl font-bold text-blue-600">
              {totalSystemCerts || 0}
            </div>
          </div>
          <div className="bg-white rounded-lg shadow p-4 sm:p-6">
            <div className="text-xs sm:text-sm font-medium text-gray-600 mb-1">
              Certificados Legados
            </div>
            <div className="text-xl sm:text-2xl font-bold text-orange-600">
              {totalLegacyCerts || 0}
            </div>
          </div>
        </div>

        {/* Seção de Certificados Legados */}
        <LegacyCertificatesSection />

        {/* Lista de Certificados */}
        <AdminCertificatesList 
          systemCertificates={systemCertificates || []}
          legacyCertificates={legacyCertificates || []}
          historicalCertificates={historicalCertificates || []}
        />
      </AdminOnly>
    </div>
  )
}