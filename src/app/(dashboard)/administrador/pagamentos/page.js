import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Card } from '@/components/ui/card'
import { DollarSign, CreditCard, TrendingUp, Users } from 'lucide-react'

// Força renderização dinâmica
export const dynamic = 'force-dynamic'

export default async function AdminPaymentsPage() {
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

  // Query simplificada - apenas purchases sem joins
  const { data: purchases, error: purchasesError } = await supabase
    .from('purchases')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(50)
  
  if (purchasesError) {
    console.error('Erro ao buscar compras:', purchasesError)
  }

  // Calcular estatísticas básicas
  const totalPurchases = purchases?.length || 0
  const completedPurchases = purchases?.filter(p => p.status === 'completed').length || 0
  const pendingPurchases = purchases?.filter(p => p.status === 'pending').length || 0
  const totalRevenue = purchases?.reduce((sum, p) => {
    if (p.status === 'completed' && p.amount) {
      return sum + parseFloat(p.amount)
    }
    return sum
  }, 0) || 0

  const getStatusColor = (status) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-800'
      case 'pending': return 'bg-yellow-100 text-yellow-800'
      case 'processing': return 'bg-blue-100 text-blue-800'
      case 'failed': return 'bg-red-100 text-red-800'
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
      default: return status || 'N/A'
    }
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Gestão de Pagamentos
        </h1>
        <p className="text-gray-600">
          Acompanhe todas as transações e vendas da plataforma
        </p>
      </div>

      {/* Estatísticas */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
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

      {/* Lista de Compras Simplificada */}
      <Card className="p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">
          Compras Recentes
        </h2>
        
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left py-3 px-4 font-medium text-gray-600">
                  ID da Compra
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
                <th className="text-left py-3 px-4 font-medium text-gray-600">
                  Data
                </th>
              </tr>
            </thead>
            <tbody>
              {purchases?.map((purchase) => (
                <tr key={purchase.id} className="border-b border-gray-100">
                  <td className="py-3 px-4">
                    <p className="text-sm text-gray-600">
                      {purchase.id.substring(0, 8)}...
                    </p>
                  </td>
                  <td className="py-3 px-4">
                    <p className="font-medium text-gray-900">
                      R$ {parseFloat(purchase.amount || 0).toFixed(2)}
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
                  <td className="py-3 px-4">
                    <p className="text-sm text-gray-600">
                      {new Date(purchase.created_at).toLocaleDateString('pt-BR')}
                    </p>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        
        {(!purchases || purchases.length === 0) && (
          <div className="text-center py-8">
            <p className="text-gray-500">Nenhuma compra encontrada</p>
          </div>
        )}
      </Card>
    </div>
  )
}