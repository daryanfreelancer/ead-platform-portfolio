import { createClient } from '@/lib/supabase/server'
import { Card } from '@/components/ui/card'
import { formatInTimeZone } from 'date-fns-tz'
import { DollarSign, CreditCard, TrendingUp, Users, Eye, RefreshCw } from 'lucide-react'

export default async function AdminPaymentsPage() {
  const supabase = await createClient()

  // Buscar estatísticas de pagamentos
  const { data: purchases } = await supabase
    .from('purchases')
    .select(`
      *,
      profiles!purchases_user_id_fkey (
        full_name,
        email
      ),
      courses!purchases_course_id_fkey (
        title,
        price
      )
    `)
    .order('created_at', { ascending: false })

  const { data: payments } = await supabase
    .from('payments')
    .select('*')
    .order('created_at', { ascending: false })

  // Calcular estatísticas
  const totalRevenue = purchases?.reduce((sum, purchase) => 
    purchase.status === 'completed' ? sum + parseFloat(purchase.amount) : sum, 0) || 0
  
  const completedPurchases = purchases?.filter(p => p.status === 'completed').length || 0
  const pendingPurchases = purchases?.filter(p => p.status === 'pending').length || 0
  const totalPurchases = purchases?.length || 0

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
          Gestão de Pagamentos
        </h1>
        <button
          onClick={() => window.location.reload()}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <RefreshCw className="w-4 h-4" />
          Atualizar
        </button>
      </div>

      {/* Estatísticas */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">
                Receita Total
              </p>
              <p className="text-2xl font-bold text-gray-900">
                R$ {totalRevenue.toFixed(2)}
              </p>
            </div>
            <DollarSign className="w-8 h-8 text-green-600" />
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">
                Vendas Concluídas
              </p>
              <p className="text-2xl font-bold text-gray-900">
                {completedPurchases}
              </p>
            </div>
            <TrendingUp className="w-8 h-8 text-blue-600" />
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">
                Pendentes
              </p>
              <p className="text-2xl font-bold text-gray-900">
                {pendingPurchases}
              </p>
            </div>
            <CreditCard className="w-8 h-8 text-yellow-600" />
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">
                Total de Compras
              </p>
              <p className="text-2xl font-bold text-gray-900">
                {totalPurchases}
              </p>
            </div>
            <Users className="w-8 h-8 text-purple-600" />
          </div>
        </Card>
      </div>

      {/* Lista de Compras */}
      <Card className="p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">
          Histórico de Compras
        </h2>
        
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left py-3 px-4 font-medium text-gray-600">
                  Data
                </th>
                <th className="text-left py-3 px-4 font-medium text-gray-600">
                  Usuário
                </th>
                <th className="text-left py-3 px-4 font-medium text-gray-600">
                  Curso
                </th>
                <th className="text-left py-3 px-4 font-medium text-gray-600">
                  Valor
                </th>
                <th className="text-left py-3 px-4 font-medium text-gray-600">
                  Status
                </th>
                <th className="text-left py-3 px-4 font-medium text-gray-600">
                  Método
                </th>
              </tr>
            </thead>
            <tbody>
              {purchases?.map((purchase) => (
                <tr key={purchase.id} className="border-b border-gray-100">
                  <td className="py-3 px-4">
                    {formatInTimeZone(
                      new Date(purchase.created_at),
                      'America/Sao_Paulo',
                      'dd/MM/yyyy HH:mm'
                    )}
                  </td>
                  <td className="py-3 px-4">
                    <div>
                      <p className="font-medium text-gray-900">
                        {purchase.profiles?.full_name || 'N/A'}
                      </p>
                      <p className="text-sm text-gray-600">
                        {purchase.profiles?.email || 'N/A'}
                      </p>
                    </div>
                  </td>
                  <td className="py-3 px-4">
                    <p className="font-medium text-gray-900">
                      {purchase.courses?.title || 'Curso não encontrado'}
                    </p>
                  </td>
                  <td className="py-3 px-4">
                    <p className="font-medium text-gray-900">
                      R$ {parseFloat(purchase.amount).toFixed(2)}
                    </p>
                  </td>
                  <td className="py-3 px-4">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(purchase.status)}`}>
                      {getStatusLabel(purchase.status)}
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    <p className="text-sm text-gray-600">
                      {purchase.payment_method || 'N/A'}
                    </p>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          
          {!purchases || purchases.length === 0 && (
            <div className="text-center py-8">
              <p className="text-gray-500">Nenhuma compra encontrada</p>
            </div>
          )}
        </div>
      </Card>

      {/* Configurações de Pagamento */}
      <Card className="p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">
          Configurações de Pagamento
        </h2>
        
        <div className="space-y-4">
          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
            <div>
              <h3 className="font-medium text-gray-900">
                Status do Mercado Pago
              </h3>
              <p className="text-sm text-gray-600">
                Verificar configuração da API
              </p>
            </div>
            <div className="flex items-center gap-2">
              <div className={`w-3 h-3 rounded-full ${
                process.env.MERCADOPAGO_ACCESS_TOKEN ? 'bg-green-500' : 'bg-red-500'
              }`}></div>
              <span className="text-sm text-gray-600">
                {process.env.MERCADOPAGO_ACCESS_TOKEN ? 'Configurado' : 'Não configurado'}
              </span>
            </div>
          </div>

          <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <h4 className="font-medium text-blue-900 mb-2">
              Variáveis de Ambiente Necessárias
            </h4>
            <ul className="text-sm text-blue-700 space-y-1">
              <li>• MERCADOPAGO_ACCESS_TOKEN</li>
              <li>• MERCADOPAGO_WEBHOOK_SECRET</li>
              <li>• NEXT_PUBLIC_URL (para webhooks)</li>
            </ul>
          </div>
        </div>
      </Card>
    </div>
  )
}