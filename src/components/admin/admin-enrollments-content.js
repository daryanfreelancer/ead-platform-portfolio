'use client'

import { useState, memo } from 'react'
import { Users, BookOpen, Clock, CheckCircle, Search, Filter, Edit2, Trash2, Download } from 'lucide-react'
import Button from '@/components/ui/button'
import Input from '@/components/ui/input'
import MobileEnrollmentCard from './mobile-enrollment-card'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase/client'
import { formatDate } from '@/lib/utils'

function AdminEnrollmentsContent({ initialEnrollments = [], stats = [] }) {
  const router = useRouter()
  const safeEnrollments = Array.isArray(initialEnrollments) ? initialEnrollments : []
  const safeStats = Array.isArray(stats) ? stats : []

  const [enrollments, setEnrollments] = useState(safeEnrollments)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterStatus, setFilterStatus] = useState('all')
  const [deleteLoading, setDeleteLoading] = useState(null)
  const [exportLoading, setExportLoading] = useState(false)

  const filteredEnrollments = enrollments.filter(enrollment => {
    if (!enrollment || typeof enrollment !== 'object') return false
    
    const matchesSearch = 
      enrollment.student?.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      enrollment.student?.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      enrollment.course?.title?.toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchesStatus = 
      filterStatus === 'all' ||
      (filterStatus === 'active' && !enrollment.completed_at) ||
      (filterStatus === 'completed' && enrollment.completed_at)

    return matchesSearch && matchesStatus
  })

  const getStatIcon = (index) => {
    const icons = [Users, BookOpen, CheckCircle, Clock]
    const IconComponent = icons[index] || Users
    return <IconComponent className="w-6 h-6" />
  }

  const getStatusBadge = (enrollment) => {
    if (enrollment.completed_at) {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
          Concluído
        </span>
      )
    }
    return (
      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
        Em andamento
      </span>
    )
  }

  const handleDelete = async (enrollment) => {
    const confirmMessage = `Tem certeza que deseja excluir a matrícula de ${enrollment.student?.full_name || 'este aluno'} no curso ${enrollment.course?.title || 'selecionado'}?\\n\\nEsta ação não pode ser desfeita.`
    
    if (!confirm(confirmMessage)) return

    setDeleteLoading(enrollment.id)

    try {
      const { error } = await supabase
        .from('enrollments')
        .delete()
        .eq('id', enrollment.id)

      if (error) {
        console.error('Erro ao deletar matrícula:', error)
        alert('Erro ao excluir matrícula. Tente novamente.')
      } else {
        // Remove a matrícula da lista local
        setEnrollments(enrollments.filter(e => e.id !== enrollment.id))
        // Recarrega a página para atualizar estatísticas
        router.refresh()
      }
    } catch (error) {
      console.error('Erro:', error)
      alert('Erro ao excluir matrícula')
    } finally {
      setDeleteLoading(null)
    }
  }

  const handleExportEnrollments = async () => {
    setExportLoading(true)
    try {
      // Preparar dados para exportação
      const exportData = filteredEnrollments.map(enrollment => ({
        'ID': enrollment.id,
        'Aluno': enrollment.student?.full_name || 'N/A',
        'Email': enrollment.student?.email || 'N/A',
        'CPF': enrollment.student?.cpf || 'N/A',
        'Curso': enrollment.course?.title || 'N/A',
        'Professor': enrollment.course?.teacher?.full_name || 'N/A',
        'Data de Matrícula': enrollment.enrolled_at ? formatDate(enrollment.enrolled_at) : 'N/A',
        'Progresso': `${enrollment.progress || 0}%`,
        'Status': enrollment.completed_at ? 'Concluído' : 'Em Andamento',
        'Data de Conclusão': enrollment.completed_at ? formatDate(enrollment.completed_at) : 'N/A'
      }))

      // Criar CSV
      const headers = Object.keys(exportData[0])
      const csvContent = [
        headers.join(','),
        ...exportData.map(row => 
          headers.map(header => `"${row[header]}"`).join(',')
        )
      ].join('\n')

      // Download do arquivo
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
      const link = document.createElement('a')
      link.href = URL.createObjectURL(blob)
      link.download = `matriculas_${new Date().toISOString().split('T')[0]}.csv`
      link.click()
      URL.revokeObjectURL(link.href)
      
    } catch (error) {
      console.error('Erro ao exportar matrículas:', error)
      alert('Erro ao exportar dados. Tente novamente.')
    } finally {
      setExportLoading(false)
    }
  }

  const handleGenerateCertificate = async (enrollment) => {
    if (!enrollment.completed_at) {
      alert('O aluno deve concluir o curso antes de gerar o certificado')
      return
    }
    
    try {
      // Gerar certificado básico
      const certificateData = {
        studentName: enrollment.student?.full_name || 'N/A',
        courseName: enrollment.course?.title || 'N/A',
        completionDate: enrollment.completed_at,
        duration: enrollment.course?.duration || 0,
        registrationNumber: `CERT-${enrollment.id.substring(0, 8).toUpperCase()}-${new Date().getFullYear()}`
      }

      // Criar URL do certificado (simples)
      const certificateUrl = `/consulta-certificados?cert=${certificateData.registrationNumber}`
      
      // Atualizar a matrícula com URL do certificado
      const { error } = await supabase
        .from('enrollments')
        .update({ certificate_url: certificateUrl })
        .eq('id', enrollment.id)

      if (error) {
        console.error('Erro ao gerar certificado:', error)
        alert('Erro ao gerar certificado. Tente novamente.')
        return
      }

      // Atualizar a lista local
      setEnrollments(enrollments.map(e => 
        e.id === enrollment.id 
          ? { ...e, certificate_url: certificateUrl }
          : e
      ))

      alert(`Certificado gerado com sucesso!\nNúmero: ${certificateData.registrationNumber}`)
      
    } catch (error) {
      console.error('Erro ao gerar certificado:', error)
      alert('Erro ao gerar certificado. Tente novamente.')
    }
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Gerenciar Matrículas
        </h1>
        <p className="text-gray-600">
          Visualize e gerencie todas as matrículas dos alunos
        </p>
      </div>

      {/* Estatísticas */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        {safeStats.map((stat, index) => (
          <div key={index} className="bg-white p-6 rounded-lg shadow-md">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 mb-1">
                  {stat.title}
                </p>
                <p className="text-2xl font-bold text-gray-900">
                  {stat.value}
                </p>
              </div>
              <div className={`p-3 rounded-full bg-gray-100 ${stat.color}`}>
                {getStatIcon(index)}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Barra de ferramentas */}
      <div className="mb-6 space-y-4">
        {/* Busca */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          <Input
            type="text"
            placeholder="Buscar por aluno ou curso..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 min-h-[44px]"
          />
        </div>
        
        {/* Filtros e Ações */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="flex-1">
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-[44px]"
            >
              <option value="all">Todas as matrículas</option>
              <option value="active">Em andamento</option>
              <option value="completed">Concluídas</option>
            </select>
          </div>

          <div className="flex-shrink-0">
            <Button
              variant="outline"
              className="flex items-center justify-center gap-2 min-h-[44px] w-full sm:w-auto"
              onClick={handleExportEnrollments}
              disabled={exportLoading}
            >
              <Download className="w-4 h-4" />
              <span className="hidden sm:inline whitespace-nowrap">
                {exportLoading ? 'Exportando...' : 'Exportar'}
              </span>
              <span className="sm:hidden">
                {exportLoading ? 'Export...' : 'Export'}
              </span>
            </Button>
          </div>
        </div>
      </div>

      {/* Lista de matrículas - Desktop (Tabela) */}
      <div className="hidden md:block bg-white rounded-lg shadow-md overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Aluno
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Curso
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Progresso
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Data de Matrícula
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Ações
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredEnrollments.map((enrollment) => (
                <tr key={enrollment.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="max-w-[180px] sm:max-w-[220px]">
                      <div className="text-sm font-medium text-gray-900 truncate">
                        {enrollment.student?.full_name || 'Sem nome'}
                      </div>
                      <div className="text-sm text-gray-500 truncate">
                        {enrollment.student?.email}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center">
                      {enrollment.course?.thumbnail_url && (
                        <img
                          src={enrollment.course.thumbnail_url}
                          alt=""
                          className="w-10 h-10 rounded object-cover mr-3"
                        />
                      )}
                      <div className="max-w-[160px] sm:max-w-[200px]">
                        <div className="text-sm font-medium text-gray-900 truncate">
                          {enrollment.course?.title || 'Curso não encontrado'}
                        </div>
                        <div className="text-sm text-gray-500 truncate">
                          {enrollment.course?.is_free ? 'Gratuito' : `R$ ${enrollment.course?.price || '0,00'}`}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {getStatusBadge(enrollment)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="flex-1 bg-gray-200 rounded-full h-2 mr-2">
                        <div 
                          className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                          style={{ width: `${enrollment.progress || 0}%` }}
                        />
                      </div>
                      <span className="text-sm text-gray-600">
                        {enrollment.progress || 0}%
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {enrollment.enrolled_at ? formatDate(enrollment.enrolled_at) : '-'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex items-center justify-end gap-2">
                      {enrollment.completed_at && (
                        <button
                          onClick={() => handleGenerateCertificate(enrollment)}
                          className="text-green-600 hover:text-green-900 p-2 rounded hover:bg-green-50 transition-colors min-w-[44px] min-h-[44px] flex items-center justify-center"
                          title="Gerar certificado"
                        >
                          <Download className="w-4 h-4" />
                        </button>
                      )}
                      <button
                        onClick={() => handleDelete(enrollment)}
                        disabled={deleteLoading === enrollment.id}
                        className="text-red-600 hover:text-red-900 p-2 rounded hover:bg-red-50 transition-colors disabled:opacity-50 min-w-[44px] min-h-[44px] flex items-center justify-center"
                        title="Excluir matrícula"
                      >
                        {deleteLoading === enrollment.id ? (
                          <div className="w-4 h-4 border-2 border-red-600 border-t-transparent rounded-full animate-spin" />
                        ) : (
                          <Trash2 className="w-4 h-4" />
                        )}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        
        {filteredEnrollments.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            {enrollments.length === 0 ? 'Nenhuma matrícula encontrada no sistema' : 'Nenhuma matrícula encontrada com os filtros selecionados'}
          </div>
        )}
      </div>

      {/* Lista de matrículas - Mobile (Cards) */}
      <div className="md:hidden space-y-4">
        {filteredEnrollments.map((enrollment) => (
          <MobileEnrollmentCard
            key={enrollment.id}
            enrollment={enrollment}
            onDelete={handleDelete}
            onGenerateCertificate={handleGenerateCertificate}
            deleteLoading={deleteLoading}
          />
        ))}
        
        {filteredEnrollments.length === 0 && (
          <div className="text-center py-8 text-gray-500 bg-white rounded-lg shadow-md">
            {enrollments.length === 0 ? 'Nenhuma matrícula encontrada no sistema' : 'Nenhuma matrícula encontrada com os filtros selecionados'}
          </div>
        )}
      </div>
    </div>
  )
}

export default memo(AdminEnrollmentsContent)