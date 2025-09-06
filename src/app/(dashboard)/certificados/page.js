import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { CertificatesList } from '@/components/certificates/certificates-list'
import { Card } from '@/components/ui/card'
import { Award, Download, Calendar, BookOpen } from 'lucide-react'

// Força renderização dinâmica
export const dynamic = 'force-dynamic'

export default async function CertificatesPage() {
  const supabase = await createClient()

  // Verificar se o usuário está logado
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    redirect('/entrar')
  }

  // Buscar perfil do usuário
  const { data: profile } = await supabase
    .from('profiles')
    .select('role, full_name')
    .eq('id', user.id)
    .single()

  if (!profile) {
    redirect('/entrar')
  }

  // Buscar certificados do usuário
  const { data: certificates, error: certificatesError } = await supabase
    .from('legacy_certificates')
    .select(`
      *,
      courses (
        title,
        duration
      )
    `)
    .eq('student_id', user.id)
    .order('created_at', { ascending: false })

  // Log any errors for debugging
  if (certificatesError) {
    console.error('Certificates query error:', certificatesError)
  }

  // Estatísticas
  const totalCertificates = certificates?.length || 0
  const thisYear = new Date().getFullYear()
  const certificatesThisYear = certificates?.filter(cert => 
    new Date(cert.created_at).getFullYear() === thisYear
  ).length || 0

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Meus Certificados
        </h1>
        <p className="text-gray-600">
          Todos os seus certificados de conclusão de cursos
        </p>
      </div>

      {/* Estatísticas */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 mb-1">
                Total de Certificados
              </p>
              <p className="text-2xl font-bold text-gray-900">
                {totalCertificates}
              </p>
            </div>
            <div className="p-3 rounded-full bg-blue-100 text-blue-600">
              <Award className="w-6 h-6" />
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 mb-1">
                Certificados em {thisYear}
              </p>
              <p className="text-2xl font-bold text-gray-900">
                {certificatesThisYear}
              </p>
            </div>
            <div className="p-3 rounded-full bg-green-100 text-green-600">
              <Calendar className="w-6 h-6" />
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 mb-1">
                Cursos Concluídos
              </p>
              <p className="text-2xl font-bold text-gray-900">
                {totalCertificates}
              </p>
            </div>
            <div className="p-3 rounded-full bg-purple-100 text-purple-600">
              <BookOpen className="w-6 h-6" />
            </div>
          </div>
        </Card>
      </div>

      {/* Lista de Certificados */}
      {certificates && certificates.length > 0 ? (
        <CertificatesList certificates={certificates} user={user} />
      ) : (
        <Card className="p-12 text-center">
          <Award className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-900 mb-2">
            Nenhum certificado ainda
          </h3>
          <p className="text-gray-600 mb-6">
            Complete seus primeiros cursos para ganhar certificados
          </p>
          <Link
            href="/cursos"
            className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <BookOpen className="w-4 h-4 mr-2" />
            Explorar Cursos
          </Link>
        </Card>
      )}
    </div>
  )
}