import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Card } from '@/components/ui/card'
import { SalesReport } from '@/components/reports/sales-report'
import { 
  TrendingUp, 
  DollarSign, 
  Users, 
  BookOpen,
  CalendarDays
} from 'lucide-react'

// Força renderização dinâmica
export const dynamic = 'force-dynamic'

export default async function ReportsPage() {
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

  // Buscar dados para relatórios (simulados)
  const currentDate = new Date()
  const currentMonth = currentDate.getMonth()
  const currentYear = currentDate.getFullYear()

  // Dados simulados para demonstração
  const salesData = {
    totalRevenue: 15750.00,
    monthlyRevenue: 3250.00,
    totalSales: 127,
    monthlySales: 23,
    averageTicket: 124.02,
    conversionRate: 12.5,
    topCourses: [
      { title: 'JavaScript Avançado', sales: 45, revenue: 5400.00 },
      { title: 'React para Iniciantes', sales: 38, revenue: 3800.00 },
      { title: 'Node.js Backend', sales: 22, revenue: 2640.00 },
      { title: 'CSS Grid Layout', sales: 15, revenue: 1200.00 },
      { title: 'Vue.js Essencial', sales: 7, revenue: 910.00 }
    ]
  }

  const stats = [
    {
      title: 'Receita Total',
      value: `R$ ${salesData.totalRevenue.toFixed(2)}`,
      icon: DollarSign,
      color: 'text-green-600',
      bgColor: 'bg-green-100'
    },
    {
      title: 'Vendas Este Mês',
      value: salesData.monthlySales,
      icon: TrendingUp,
      color: 'text-blue-600',
      bgColor: 'bg-blue-100'
    },
    {
      title: 'Ticket Médio',
      value: `R$ ${salesData.averageTicket.toFixed(2)}`,
      icon: CalendarDays,
      color: 'text-purple-600',
      bgColor: 'bg-purple-100'
    },
    {
      title: 'Taxa de Conversão',
      value: `${salesData.conversionRate}%`,
      icon: Users,
      color: 'text-orange-600',
      bgColor: 'bg-orange-100'
    }
  ]

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Relatórios de Vendas
        </h1>
        <p className="text-gray-600">
          Acompanhe o desempenho financeiro da plataforma
        </p>
      </div>

      {/* Aviso de Sistema Placeholder */}
      <Card className="p-4 mb-8 bg-blue-50 border-blue-200">
        <div className="flex items-center space-x-3">
          <TrendingUp className="w-5 h-5 text-blue-600" />
          <div>
            <h4 className="font-semibold text-blue-900">
              Dados Demonstrativos
            </h4>
            <p className="text-sm text-blue-700">
              Os dados exibidos são simulados para demonstração do sistema de relatórios.
            </p>
          </div>
        </div>
      </Card>

      {/* Estatísticas Principais */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {stats.map((stat, index) => (
          <Card key={index} className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 mb-1">
                  {stat.title}
                </p>
                <p className="text-2xl font-bold text-gray-900">
                  {stat.value}
                </p>
              </div>
              <div className={`p-3 rounded-full ${stat.bgColor} ${stat.color}`}>
                <stat.icon className="w-6 h-6" />
              </div>
            </div>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Cursos Mais Vendidos */}
        <Card className="p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-6">
            Cursos Mais Vendidos
          </h2>
          <div className="space-y-4">
            {salesData.topCourses.map((course, index) => (
              <div key={index} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center space-x-3">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white font-bold ${
                    index === 0 ? 'bg-yellow-500' :
                    index === 1 ? 'bg-gray-400' :
                    index === 2 ? 'bg-orange-600' : 'bg-blue-500'
                  }`}>
                    {index + 1}
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">{course.title}</p>
                    <p className="text-sm text-gray-600">{course.sales} vendas</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-semibold text-green-600">
                    R$ {course.revenue.toFixed(2)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </Card>

        {/* Resumo Mensal */}
        <Card className="p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-6">
            Resumo do Mês
          </h2>
          <div className="space-y-6">
            <div className="flex items-center justify-between p-4 bg-green-50 rounded-lg">
              <div className="flex items-center space-x-3">
                <DollarSign className="w-8 h-8 text-green-600" />
                <div>
                  <p className="font-medium text-gray-900">Receita Mensal</p>
                  <p className="text-sm text-gray-600">
                    {new Date().toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })}
                  </p>
                </div>
              </div>
              <p className="text-2xl font-bold text-green-600">
                R$ {salesData.monthlyRevenue.toFixed(2)}
              </p>
            </div>

            <div className="flex items-center justify-between p-4 bg-blue-50 rounded-lg">
              <div className="flex items-center space-x-3">
                <BookOpen className="w-8 h-8 text-blue-600" />
                <div>
                  <p className="font-medium text-gray-900">Vendas Realizadas</p>
                  <p className="text-sm text-gray-600">Total no mês</p>
                </div>
              </div>
              <p className="text-2xl font-bold text-blue-600">
                {salesData.monthlySales}
              </p>
            </div>

            <div className="flex items-center justify-between p-4 bg-purple-50 rounded-lg">
              <div className="flex items-center space-x-3">
                <Users className="w-8 h-8 text-purple-600" />
                <div>
                  <p className="font-medium text-gray-900">Novos Clientes</p>
                  <p className="text-sm text-gray-600">Primeira compra</p>
                </div>
              </div>
              <p className="text-2xl font-bold text-purple-600">
                18
              </p>
            </div>
          </div>
        </Card>
      </div>

      {/* Componente de Relatório Detalhado */}
      <div className="mt-8">
        <SalesReport data={salesData} />
      </div>
    </div>
  )
}