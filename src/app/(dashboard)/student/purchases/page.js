import { createClient } from '@/lib/supabase/server'
import { Card } from '@/components/ui/card'
import { formatInTimeZone } from 'date-fns-tz'
import { 
  ShoppingCart, 
  CreditCard, 
  CheckCircle, 
  Clock, 
  XCircle, 
  AlertCircle,
  Eye,
  BookOpen 
} from 'lucide-react'
import Link from 'next/link'

export default async function StudentPurchasesPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return <div>Usuário não autenticado</div>
  }

  // Buscar compras do usuário
  const { data: purchases } = await supabase
    .from('purchases')
    .select(`
      *,
      courses!purchases_course_id_fkey (
        id,
        title,
        description,
        thumbnail_url,
        price,
        duration
      ),
      payments!payments_purchase_id_fkey (
        id,
        status,
        payment_method,
        paid_at,
        amount
      )
    `)
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  // Buscar matrículas para verificar acesso aos cursos
  const { data: enrollments } = await supabase
    .from('enrollments')
    .select('course_id, enrolled_at, progress')
    .eq('student_id', user.id)

  const enrollmentMap = enrollments?.reduce((map, enrollment) => {
    map[enrollment.course_id] = enrollment
    return map
  }, {}) || {}

  const getStatusIcon = (status) => {
    switch (status) {
      case 'completed': return <CheckCircle className="w-5 h-5 text-green-600" />
      case 'pending': return <Clock className="w-5 h-5 text-yellow-600" />
      case 'processing': return <AlertCircle className="w-5 h-5 text-blue-600" />
      case 'failed': return <XCircle className="w-5 h-5 text-red-600" />
      case 'cancelled': return <XCircle className="w-5 h-5 text-gray-600" />
      case 'refunded': return <AlertCircle className="w-5 h-5 text-orange-600" />
      default: return <Clock className="w-5 h-5 text-gray-600" />
    }
  }

  const getStatusColor = (status) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-800'
      case 'pending': return 'bg-yellow-100 text-yellow-800'
      case 'processing': return 'bg-blue-100 text-blue-800'
      case 'failed': return 'bg-red-100 text-red-800'
      case 'cancelled': return 'bg-gray-100 text-gray-800'
      case 'refunded': return 'bg-orange-100 text-orange-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getStatusLabel = (status) => {
    switch (status) {
      case 'completed': return 'Concluído'
      case 'pending': return 'Pendente'
      case 'processing': return 'Processando'
      case 'failed': return 'Falhou'
      case 'cancelled': return 'Cancelado'
      case 'refunded': return 'Reembolsado'
      default: return status
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">
          Meu Histórico de Compras
        </h1>
        <div className="flex items-center gap-2 text-sm text-gray-600">
          <ShoppingCart className="w-4 h-4" />
          {purchases?.length || 0} compras
        </div>
      </div>

      {/* Resumo */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">
                Total Gasto
              </p>
              <p className="text-lg font-bold text-gray-900">
                R$ {purchases?.reduce((sum, purchase) => 
                  purchase.status === 'completed' ? sum + parseFloat(purchase.amount) : sum, 0).toFixed(2) || '0.00'}
              </p>
            </div>
            <CreditCard className="w-6 h-6 text-blue-600" />
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">
                Compras Aprovadas
              </p>
              <p className="text-lg font-bold text-gray-900">
                {purchases?.filter(p => p.status === 'completed').length || 0}
              </p>
            </div>
            <CheckCircle className="w-6 h-6 text-green-600" />
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">
                Pendentes
              </p>
              <p className="text-lg font-bold text-gray-900">
                {purchases?.filter(p => p.status === 'pending').length || 0}
              </p>
            </div>
            <Clock className="w-6 h-6 text-yellow-600" />
          </div>
        </Card>
      </div>

      {/* Lista de Compras */}
      <div className="space-y-4">
        {purchases?.map((purchase) => {
          const enrollment = enrollmentMap[purchase.course_id]
          const latestPayment = purchase.payments?.sort((a, b) => 
            new Date(b.created_at) - new Date(a.created_at)
          )[0]

          return (
            <Card key={purchase.id} className="p-6">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    {getStatusIcon(purchase.status)}
                    <h3 className="text-lg font-semibold text-gray-900">
                      {purchase.courses?.title || 'Curso não encontrado'}
                    </h3>
                    <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(purchase.status)}`}>
                      {getStatusLabel(purchase.status)}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                    <div>
                      <p className="text-sm text-gray-600 mb-1">
                        Data da Compra
                      </p>
                      <p className="font-medium text-gray-900">
                        {formatInTimeZone(
                          new Date(purchase.created_at),
                          'America/Sao_Paulo',
                          'dd/MM/yyyy HH:mm'
                        )}
                      </p>
                    </div>

                    <div>
                      <p className="text-sm text-gray-600 mb-1">
                        Valor
                      </p>
                      <p className="font-medium text-gray-900">
                        R$ {parseFloat(purchase.amount).toFixed(2)}
                      </p>
                    </div>

                    {latestPayment && (
                      <>
                        <div>
                          <p className="text-sm text-gray-600 mb-1">
                            Método de Pagamento
                          </p>
                          <p className="font-medium text-gray-900">
                            {latestPayment.payment_method || 'N/A'}
                          </p>
                        </div>

                        {latestPayment.paid_at && (
                          <div>
                            <p className="text-sm text-gray-600 mb-1">
                              Data do Pagamento
                            </p>
                            <p className="font-medium text-gray-900">
                              {formatInTimeZone(
                                new Date(latestPayment.paid_at),
                                'America/Sao_Paulo',
                                'dd/MM/yyyy HH:mm'
                              )}
                            </p>
                          </div>
                        )}
                      </>
                    )}
                  </div>

                  {/* Status da Matrícula */}
                  {enrollment && (
                    <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg">
                      <p className="text-sm font-medium text-green-800">
                        ✓ Matriculado em {formatInTimeZone(
                          new Date(enrollment.enrolled_at),
                          'America/Sao_Paulo',
                          'dd/MM/yyyy'
                        )}
                      </p>
                      <p className="text-sm text-green-700">
                        Progresso: {enrollment.progress}%
                      </p>
                    </div>
                  )}
                </div>

                {/* Thumbnail do Curso */}
                {purchase.courses?.thumbnail_url && (
                  <img
                    src={purchase.courses.thumbnail_url}
                    alt={purchase.courses.title}
                    className="w-20 h-20 object-cover rounded-lg ml-4"
                  />
                )}
              </div>

              {/* Ações */}
              <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-200">
                <div className="flex items-center gap-2">
                  <Eye className="w-4 h-4 text-gray-600" />
                  <span className="text-sm text-gray-600">
                    ID: {purchase.id.substring(0, 8)}...
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  {purchase.status === 'completed' && enrollment && (
                    <Link href={`/courses/${purchase.course_id}/learn`}>
                      <button className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                        <BookOpen className="w-4 h-4" />
                        Acessar Curso
                      </button>
                    </Link>
                  )}
                  
                  {purchase.status === 'pending' && (
                    <button
                      onClick={() => window.location.reload()}
                      className="flex items-center gap-2 px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 transition-colors"
                    >
                      <Clock className="w-4 h-4" />
                      Verificar Status
                    </button>
                  )}
                </div>
              </div>
            </Card>
          )
        })}
      </div>

      {!purchases || purchases.length === 0 && (
        <Card className="p-12 text-center">
          <ShoppingCart className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            Nenhuma compra encontrada
          </h3>
          <p className="text-gray-600 mb-4">
            Você ainda não fez nenhuma compra. Explore nossos cursos!
          </p>
          <Link href="/cursos">
            <button className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
              Explorar Cursos
            </button>
          </Link>
        </Card>
      )}
    </div>
  )
}