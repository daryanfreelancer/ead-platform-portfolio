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

  // Buscar dados reais para relatórios
  const currentDate = new Date()
  const currentMonth = currentDate.getMonth()
  const currentYear = currentDate.getFullYear()
  const firstDayOfMonth = new Date(currentYear, currentMonth, 1).toISOString()
  const firstDayOfYear = new Date(currentYear, 0, 1).toISOString()

  // Buscar dados reais de pagamentos aprovados
  const { data: paymentsData } = await supabase
    .from('payments')
    .select(`
      id,
      amount,
      status,
      created_at,
      enrollments!inner(
        id,
        course:courses!inner(
          id,
          title,
          price
        )
      )
    `)
    .eq('status', 'approved')
    .order('created_at', { ascending: false })

  // Buscar total de usuários e novos usuários do mês
  const { data: usersData } = await supabase
    .from('profiles')
    .select('id, created_at, role')
    .eq('role', 'student')

  // Calcular métricas reais
  const payments = paymentsData || []
  const users = usersData || []
  
  // Receita total
  const totalRevenue = payments.reduce((sum, payment) => sum + (payment.amount || 0), 0)
  
  // Receita mensal
  const monthlyPayments = payments.filter(payment => 
    new Date(payment.created_at) >= new Date(firstDayOfMonth)
  )
  const monthlyRevenue = monthlyPayments.reduce((sum, payment) => sum + (payment.amount || 0), 0)
  
  // Total de vendas
  const totalSales = payments.length
  const monthlySales = monthlyPayments.length
  
  // Ticket médio
  const averageTicket = totalSales > 0 ? totalRevenue / totalSales : 0
  
  // Novos usuários do mês
  const newUsersThisMonth = users.filter(user => 
    new Date(user.created_at) >= new Date(firstDayOfMonth)
  ).length
  
  // Taxa de conversão (aproximada: vendas / usuários totais)
  const conversionRate = users.length > 0 ? (totalSales / users.length) * 100 : 0
  
  // Top cursos mais vendidos
  const courseSales = {}
  payments.forEach(payment => {
    if (payment.enrollments && payment.enrollments.course) {
      const course = payment.enrollments.course
      const courseId = course.id
      if (!courseSales[courseId]) {
        courseSales[courseId] = {
          title: course.title,
          sales: 0,
          revenue: 0
        }
      }
      courseSales[courseId].sales += 1
      courseSales[courseId].revenue += payment.amount || 0
    }
  })
  
  const topCourses = Object.values(courseSales)
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, 5)

  const salesData = {
    totalRevenue,
    monthlyRevenue,
    totalSales,
    monthlySales,
    averageTicket,
    conversionRate,
    topCourses,
    newUsersThisMonth
  }

  // Buscar dados adicionais para métricas
  const { data: coursesData } = await supabase
    .from('courses')
    .select('id, title, status, created_at')
    .eq('status', 'published')

  const { data: enrollmentsData } = await supabase
    .from('enrollments')
    .select('id, created_at, completed')

  const totalCourses = coursesData?.length || 0
  const totalEnrollments = enrollmentsData?.length || 0
  const completedCourses = enrollmentsData?.filter(e => e.completed)?.length || 0
  const completionRate = totalEnrollments > 0 ? (completedCourses / totalEnrollments) * 100 : 0

  const stats = [
    {
      title: 'Receita Total',
      value: `R$ ${salesData.totalRevenue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`,
      icon: DollarSign,
      color: 'text-green-600',
      bgColor: 'bg-green-100',
      change: salesData.monthlyRevenue > 0 ? `+R$ ${salesData.monthlyRevenue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })} este mês` : 'Sem vendas este mês'
    },
    {
      title: 'Total de Vendas',
      value: salesData.totalSales.toLocaleString('pt-BR'),
      icon: TrendingUp,
      color: 'text-blue-600',
      bgColor: 'bg-blue-100',
      change: `${salesData.monthlySales} vendas este mês`
    },
    {
      title: 'Ticket Médio',
      value: `R$ ${salesData.averageTicket.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`,
      icon: CalendarDays,
      color: 'text-purple-600',
      bgColor: 'bg-purple-100',
      change: 'Por transação'
    },
    {
      title: 'Taxa de Conclusão',
      value: `${completionRate.toFixed(1)}%`,
      icon: BookOpen,
      color: 'text-orange-600',
      bgColor: 'bg-orange-100',
      change: `${completedCourses} de ${totalEnrollments} matrículas`
    },
    {
      title: 'Cursos Ativos',
      value: totalCourses.toLocaleString('pt-BR'),
      icon: BookOpen,
      color: 'text-indigo-600',
      bgColor: 'bg-indigo-100',
      change: 'Cursos publicados'
    },
    {
      title: 'Total de Alunos',
      value: users.length.toLocaleString('pt-BR'),
      icon: Users,
      color: 'text-pink-600',
      bgColor: 'bg-pink-100',
      change: `${salesData.newUsersThisMonth} novos este mês`
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

      {/* Estatísticas de Sistema */}
      <Card className="p-4 mb-8 bg-green-50 border-green-200">
        <div className="flex items-center space-x-3">
          <TrendingUp className="w-5 h-5 text-green-600" />
          <div>
            <h4 className="font-semibold text-green-900">
              Relatórios em Tempo Real
            </h4>
            <p className="text-sm text-green-700">
              Dados atualizados automaticamente baseados nas transações e atividades da plataforma.
              Última atualização: {new Date().toLocaleString('pt-BR')}
            </p>
          </div>
        </div>
      </Card>

      {/* Estatísticas Principais */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        {stats.map((stat, index) => (
          <Card key={index} className="p-6 hover:shadow-lg transition-shadow">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-600 mb-1">
                  {stat.title}
                </p>
                <p className="text-2xl font-bold text-gray-900 mb-1">
                  {stat.value}
                </p>
                <p className="text-xs text-gray-500">
                  {stat.change}
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
            {salesData.topCourses.length > 0 ? (
              salesData.topCourses.map((course, index) => (
                <div key={index} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
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
                      R$ {course.revenue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </p>
                    <p className="text-xs text-gray-500">
                      R$ {(course.revenue / course.sales).toLocaleString('pt-BR', { minimumFractionDigits: 2 })} /venda
                    </p>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-8">
                <BookOpen className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600 font-medium">Nenhuma venda registrada</p>
                <p className="text-sm text-gray-500">Os cursos mais vendidos aparecerão aqui quando houver transações aprovadas.</p>
              </div>
            )}
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
                {salesData.newUsersThisMonth}
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