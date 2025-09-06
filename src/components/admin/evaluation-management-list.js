'use client'

import { useState, useMemo } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import EvaluationActivationToggle from './evaluation-activation-toggle'
import { 
  CheckCircle,
  Clock,
  Eye,
  EyeOff,
  Search,
  Plus,
  Edit,
  Trash2,
  Target,
  Users,
  Calendar,
  BookOpen,
  FileText,
  HelpCircle,
  ClipboardCheck
} from 'lucide-react'

export default function EvaluationManagementList({ 
  initialEvaluations = [], 
  courseId = null,
  onCreateEvaluation,
  onEditEvaluation,
  onDeleteEvaluation,
  onManageQuestions,
  onManageGrading
}) {
  const [evaluations, setEvaluations] = useState(initialEvaluations)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterStatus, setFilterStatus] = useState('all') // all, active, inactive
  const [filterCourse, setFilterCourse] = useState(courseId || 'all')

  // Obter cursos únicos para filtro
  const uniqueCourses = useMemo(() => {
    const courses = evaluations
      .map(evaluation => evaluation.course)
      .filter((course, index, self) => 
        course && self.findIndex(c => c?.id === course.id) === index
      )
    return courses.sort((a, b) => a?.title?.localeCompare(b?.title || '') || 0)
  }, [evaluations])

  // Filtrar avaliações
  const filteredEvaluations = useMemo(() => {
    return evaluations.filter(evaluation => {
      const matchesSearch = evaluation.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           evaluation.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           evaluation.course?.title?.toLowerCase().includes(searchTerm.toLowerCase())
      
      const matchesStatus = filterStatus === 'all' || 
                           (filterStatus === 'active' && evaluation.is_active !== false) ||
                           (filterStatus === 'inactive' && evaluation.is_active === false)
      
      const matchesCourse = filterCourse === 'all' || evaluation.course?.id === filterCourse

      return matchesSearch && matchesStatus && matchesCourse
    })
  }, [evaluations, searchTerm, filterStatus, filterCourse])

  // Estatísticas
  const stats = useMemo(() => {
    const total = evaluations.length
    const active = evaluations.filter(e => e.is_active !== false).length
    const inactive = evaluations.filter(e => e.is_active === false).length
    
    return { total, active, inactive }
  }, [evaluations])

  const handleEvaluationToggle = (evaluationId, isActive) => {
    setEvaluations(evaluations.map(evaluation => 
      evaluation.id === evaluationId 
        ? { ...evaluation, is_active: isActive }
        : evaluation
    ))
  }

  const handleCreateEvaluation = () => {
    onCreateEvaluation?.()
  }

  const handleEditEvaluation = (evaluation) => {
    onEditEvaluation?.(evaluation)
  }

  const handleDeleteEvaluation = async (evaluation) => {
    if (window.confirm(
      `Tem certeza que deseja deletar a avaliação "${evaluation.title}"?\n\n` +
      `Esta ação irá:\n` +
      `• Remover a avaliação permanentemente\n` +
      `• Deletar todas as questões e opções\n` +
      `• ATENÇÃO: Tentativas de estudantes impedirão a exclusão\n\n` +
      `Esta ação não pode ser desfeita.`
    )) {
      const success = await onDeleteEvaluation?.(evaluation)
      if (success) {
        setEvaluations(evaluations.filter(e => e.id !== evaluation.id))
      }
    }
  }

  const getQuestionCount = (evaluation) => {
    return evaluation.questions?.length || 0
  }

  const getTotalPoints = (evaluation) => {
    if (!evaluation.questions) return 0
    return evaluation.questions.reduce((total, question) => total + (question.points || 0), 0)
  }

  return (
    <div className="space-y-6">
      {/* Estatísticas */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 mb-1">
                Total de Avaliações
              </p>
              <p className="text-2xl font-bold text-gray-900">
                {stats.total}
              </p>
            </div>
            <FileText className="w-8 h-8 text-blue-600" />
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 mb-1">
                Avaliações Ativas
              </p>
              <p className="text-2xl font-bold text-gray-900">
                {stats.active}
              </p>
            </div>
            <Eye className="w-8 h-8 text-green-600" />
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 mb-1">
                Avaliações Inativas
              </p>
              <p className="text-2xl font-bold text-gray-900">
                {stats.inactive}
              </p>
            </div>
            <EyeOff className="w-8 h-8 text-orange-600" />
          </div>
        </Card>
      </div>

      {/* Filtros e Ações */}
      <Card className="p-6">
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Buscar avaliações, descrições ou cursos..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-black"
              />
            </div>
          </div>
          
          <div className="flex flex-wrap gap-3 max-w-full overflow-hidden">
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-black min-h-[44px] flex-shrink-0"
            >
              <option value="all">Todos os Status</option>
              <option value="active">Avaliações Ativas</option>
              <option value="inactive">Avaliações Inativas</option>
            </select>
            
            {!courseId && (
              <select
                value={filterCourse}
                onChange={(e) => setFilterCourse(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-black min-h-[44px] flex-shrink-0 max-w-[200px] truncate"
              >
                <option value="all">Todos os Cursos</option>
                {uniqueCourses.map(course => (
                  <option key={course.id} value={course.id}>
                    {course.title}
                  </option>
                ))}
              </select>
            )}
            
            <Button
              variant="outline"
              onClick={() => onManageGrading?.()}
              className="flex items-center gap-2 min-h-[44px] flex-shrink-0"
            >
              <ClipboardCheck className="w-4 h-4" />
              <span className="hidden sm:inline whitespace-nowrap">Correções Pendentes</span>
              <span className="sm:hidden">Correções</span>
            </Button>
            
            <Button
              onClick={handleCreateEvaluation}
              className="flex items-center gap-2 min-h-[44px] flex-shrink-0"
            >
              <Plus className="w-4 h-4" />
              <span className="hidden sm:inline whitespace-nowrap">Nova Avaliação</span>
              <span className="sm:hidden">Nova</span>
            </Button>
          </div>
        </div>

        {/* Resultados */}
        <div className="text-sm text-gray-600 mb-4">
          Mostrando {filteredEvaluations.length} de {evaluations.length} avaliações
        </div>
      </Card>

      {/* Lista de Avaliações */}
      <div className="space-y-4">
        {filteredEvaluations.map((evaluation) => (
          <Card key={evaluation.id} className="p-6">
            <div className="flex items-start gap-4">
              {/* Ícone */}
              <div className="flex-shrink-0 mt-1">
                <FileText className="w-5 h-5 text-blue-600" />
              </div>

              {/* Conteúdo da avaliação */}
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">
                      {evaluation.title}
                    </h3>
                    <p className="text-sm text-gray-600">
                      Curso: {evaluation.course?.title || 'Curso não encontrado'}
                    </p>
                    {evaluation.description && (
                      <p className="text-sm text-gray-500 mt-1">
                        {evaluation.description}
                      </p>
                    )}
                  </div>
                  
                  {/* Status visual */}
                  <div className={`flex items-center gap-1 px-3 py-2 rounded-full text-sm font-medium min-h-[44px] ${
                    evaluation.is_active !== false 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-orange-100 text-orange-800'
                  }`}>
                    {evaluation.is_active !== false ? (
                      <>
                        <Eye className="w-3 h-3" />
                        Ativa
                      </>
                    ) : (
                      <>
                        <EyeOff className="w-3 h-3" />
                        Inativa
                      </>
                    )}
                  </div>
                </div>

                {/* Informações adicionais */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-sm text-gray-500 mb-4">
                  <div className="flex items-center">
                    <BookOpen className="w-4 h-4 mr-2" />
                    <span>
                      {getQuestionCount(evaluation)} questões
                    </span>
                  </div>
                  
                  <div className="flex items-center">
                    <Target className="w-4 h-4 mr-2" />
                    <span>
                      {getTotalPoints(evaluation)} pontos
                    </span>
                  </div>
                  
                  <div className="flex items-center">
                    <CheckCircle className="w-4 h-4 mr-2" />
                    <span>
                      Nota mínima: {evaluation.passing_score}%
                    </span>
                  </div>
                  
                  <div className="flex items-center">
                    <Clock className="w-4 h-4 mr-2" />
                    <span>
                      {evaluation.time_limit ? `${evaluation.time_limit} min` : 'Sem limite'}
                    </span>
                  </div>
                </div>

                {/* Associações */}
                {(evaluation.lesson || evaluation.module) && (
                  <div className="flex items-center gap-4 text-xs text-gray-500 mb-4">
                    {evaluation.lesson && (
                      <span>Aula: {evaluation.lesson.title}</span>
                    )}
                    {evaluation.module && (
                      <span>Módulo: {evaluation.module.title}</span>
                    )}
                  </div>
                )}

                {/* Controles */}
                <div className="flex flex-col gap-4 max-w-full overflow-hidden">
                  <div className="flex flex-wrap items-center gap-2 w-full">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => onManageQuestions?.(evaluation)}
                      className="flex-1 sm:flex-none min-h-[44px] min-w-0"
                    >
                      <HelpCircle className="w-4 h-4 sm:mr-1" />
                      <span className="sm:inline hidden">Questões</span>
                    </Button>
                    
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleEditEvaluation(evaluation)}
                      className="flex-1 sm:flex-none min-h-[44px] min-w-0"
                    >
                      <Edit className="w-4 h-4 sm:mr-1" />
                      <span className="sm:inline hidden">Editar</span>
                    </Button>
                    
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDeleteEvaluation(evaluation)}
                      className="text-red-600 hover:text-red-700 flex-1 sm:flex-none min-h-[44px] min-w-0"
                    >
                      <Trash2 className="w-4 h-4 sm:mr-1" />
                      <span className="sm:inline hidden">Deletar</span>
                    </Button>
                  </div>
                  
                  <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 w-full max-w-full overflow-hidden">
                    <div className="text-xs text-gray-500 min-w-0 flex-1">
                      <span className="whitespace-nowrap">Criado em: {new Date(evaluation.created_at).toLocaleDateString('pt-BR')}</span>
                    </div>
                    <div className="flex-shrink-0 w-full sm:w-auto">
                      <EvaluationActivationToggle
                        evaluation={evaluation}
                        onToggle={handleEvaluationToggle}
                        size="sm"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* Mensagem quando não há resultados */}
      {filteredEvaluations.length === 0 && (
        <Card className="p-12 text-center">
          <FileText className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            Nenhuma avaliação encontrada
          </h3>
          <p className="text-gray-600 mb-4">
            {searchTerm || filterStatus !== 'all' || filterCourse !== 'all'
              ? 'Tente ajustar os filtros para encontrar avaliações.'
              : 'Ainda não há avaliações cadastradas.'}
          </p>
          <Button onClick={handleCreateEvaluation}>
            <Plus className="w-4 h-4 mr-2" />
            Criar Primeira Avaliação
          </Button>
        </Card>
      )}
    </div>
  )
}