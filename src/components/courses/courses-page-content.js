'use client'

import { useState, useMemo, memo } from 'react'
import Link from 'next/link'
import { Card } from '@/components/ui/card'
import Button from '@/components/ui/button'
import { 
  BookOpen, 
  Users, 
  Clock, 
  Search,
  Filter,
  Play,
  CheckCircle,
  X,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight
} from 'lucide-react'

// Constantes de categorias de cursos
const COURSE_CATEGORIES = {
  capacitacao: { label: 'Capacitação', color: 'bg-green-100 text-green-800', icon: '📚' },
  tecnologo: { label: 'Tecnólogo', color: 'bg-blue-100 text-blue-800', icon: '🎓' },
  bacharel: { label: 'Bacharel', color: 'bg-purple-100 text-purple-800', icon: '🎓' },
  licenciatura: { label: 'Licenciatura', color: 'bg-indigo-100 text-indigo-800', icon: '👩‍🏫' },
  tecnico_competencia: { label: 'Técnico por Competência', color: 'bg-orange-100 text-orange-800', icon: '🔧' },
  tecnico: { label: 'Técnico', color: 'bg-yellow-100 text-yellow-800', icon: '⚙️' },
  mestrado: { label: 'Mestrado', color: 'bg-red-100 text-red-800', icon: '🎯' },
  doutorado: { label: 'Doutorado', color: 'bg-pink-100 text-pink-800', icon: '🔬' },
  pos_doutorado: { label: 'Pós-Doutorado', color: 'bg-gray-100 text-gray-800', icon: '🏆' }
}

function CoursesPageContent({ 
  initialCourses = [], 
  userEnrollments = [], 
  enrolledCourseIds = [], 
  enrollmentMap = {},
  user = null,
  profile = null
}) {
  const [searchTerm, setSearchTerm] = useState('')
  const [filterType, setFilterType] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('')
  const [showFilters, setShowFilters] = useState(false)
  
  // Estados de paginação
  const [currentPage, setCurrentPage] = useState(1)
  const [coursesPerPage, setCoursesPerPage] = useState(12) // 12 cursos por página por padrão

  // Filtrar cursos baseado na busca e filtros
  const filteredCourses = useMemo(() => {
    let filtered = initialCourses

    // Filtro por busca
    if (searchTerm.trim()) {
      const searchLower = searchTerm.toLowerCase()
      filtered = filtered.filter(course => 
        course.title?.toLowerCase().includes(searchLower) ||
        course.description?.toLowerCase().includes(searchLower) ||
        course.profiles?.full_name?.toLowerCase().includes(searchLower)
      )
    }

    // Filtro por categoria
    if (categoryFilter) {
      filtered = filtered.filter(course => course.category === categoryFilter)
    }

    // Filtro por tipo
    if (filterType) {
      switch (filterType) {
        case 'enrolled':
          filtered = filtered.filter(course => enrolledCourseIds.includes(course.id))
          break
        case 'not-enrolled':
          filtered = filtered.filter(course => !enrolledCourseIds.includes(course.id))
          break
        case 'completed':
          filtered = filtered.filter(course => {
            const enrollment = enrollmentMap[course.id]
            return enrollment?.completed_at
          })
          break
        default:
          break
      }
    }

    return filtered
  }, [initialCourses, searchTerm, filterType, categoryFilter, enrolledCourseIds, enrollmentMap])

  // Cálculos de paginação
  const totalPages = Math.ceil(filteredCourses.length / coursesPerPage)
  const indexOfLastCourse = currentPage * coursesPerPage
  const indexOfFirstCourse = indexOfLastCourse - coursesPerPage
  const currentCourses = filteredCourses.slice(indexOfFirstCourse, indexOfLastCourse)

  // Resetar para primeira página quando filtros mudarem
  useMemo(() => {
    setCurrentPage(1)
  }, [searchTerm, filterType, categoryFilter])

  // Estatísticas calculadas
  const stats = useMemo(() => {
    const totalCourses = initialCourses.length
    const myCourses = enrolledCourseIds.length
    const completed = userEnrollments.filter(e => e.completed_at).length
    const inProgress = userEnrollments.filter(e => !e.completed_at && e.progress > 0).length

    return { totalCourses, myCourses, completed, inProgress }
  }, [initialCourses, enrolledCourseIds, userEnrollments])

  const clearFilters = () => {
    setSearchTerm('')
    setFilterType('')
    setCategoryFilter('')
    setShowFilters(false)
    setCurrentPage(1)
  }

  const hasActiveFilters = searchTerm.trim() || filterType || categoryFilter

  // Funções de navegação da paginação
  const goToPage = (pageNumber) => {
    setCurrentPage(pageNumber)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const goToFirstPage = () => goToPage(1)
  const goToLastPage = () => goToPage(totalPages)
  const goToPreviousPage = () => goToPage(Math.max(1, currentPage - 1))
  const goToNextPage = () => goToPage(Math.min(totalPages, currentPage + 1))

  // Gerar array de páginas para exibir
  const getPageNumbers = () => {
    const delta = 2 // Páginas para mostrar em cada lado da página atual
    const range = []
    const rangeWithDots = []
    let l

    for (let i = 1; i <= totalPages; i++) {
      if (i === 1 || i === totalPages || (i >= currentPage - delta && i <= currentPage + delta)) {
        range.push(i)
      }
    }

    range.forEach((i) => {
      if (l) {
        if (i - l === 2) {
          rangeWithDots.push(l + 1)
        } else if (i - l !== 1) {
          rangeWithDots.push('...')
        }
      }
      rangeWithDots.push(i)
      l = i
    })

    return rangeWithDots
  }

  return (
    <>
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Catálogo de Cursos
        </h1>
        <p className="text-gray-600">
          Explore nossos cursos e expanda seus conhecimentos
        </p>
      </div>

      {/* Filtros e Busca */}
      <Card className="p-6 mb-8">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Buscar cursos..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent min-h-[44px]"
              />
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm('')}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 min-w-[44px] min-h-[44px] flex items-center justify-center"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>
          
          <div className="flex flex-wrap gap-2 max-w-full overflow-hidden">
            <Button 
              variant={showFilters ? "default" : "secondary"} 
              className="flex items-center gap-2 min-h-[44px] flex-shrink-0"
              onClick={() => setShowFilters(!showFilters)}
            >
              <Filter className="w-4 h-4" />
              <span className="whitespace-nowrap">Filtros</span>
              {hasActiveFilters && (
                <span className="bg-blue-600 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                  !
                </span>
              )}
            </Button>
            
            <select 
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent min-h-[44px] max-w-[160px] sm:max-w-[200px] md:max-w-none truncate flex-shrink-0"
            >
              <option value="">Todas as Categorias</option>
              {Object.entries(COURSE_CATEGORIES).map(([key, category]) => (
                <option key={key} value={key}>{category.label}</option>
              ))}
            </select>
            
            <select 
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent min-h-[44px] max-w-[160px] sm:max-w-[200px] md:max-w-none truncate flex-shrink-0"
            >
              <option value="">Todos os Tipos</option>
              <option value="enrolled">Meus cursos</option>
              <option value="not-enrolled">Disponíveis</option>
              <option value="completed">Concluídos</option>
            </select>
          </div>
        </div>

        {/* Filtros Expandidos */}
        {showFilters && (
          <div className="mt-4 pt-4 border-t border-gray-200">
            <div className="flex flex-wrap gap-2 items-center max-w-full overflow-hidden">
              <span className="text-sm font-medium text-gray-700 flex-shrink-0">Filtros ativos:</span>
              
              {searchTerm && (
                <span className="inline-flex items-center gap-1 bg-blue-100 text-blue-800 text-xs font-medium px-2.5 py-0.5 rounded max-w-full">
                  <span className="truncate">Busca: "{searchTerm}"</span>
                  <button 
                    onClick={() => setSearchTerm('')}
                    className="min-w-[20px] min-h-[20px] w-5 h-5 flex items-center justify-center hover:bg-blue-200 rounded flex-shrink-0"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              )}
              
              {categoryFilter && (
                <span className="inline-flex items-center gap-1 bg-purple-100 text-purple-800 text-xs font-medium px-2.5 py-0.5 rounded">
                  Categoria: {COURSE_CATEGORIES[categoryFilter]?.label || categoryFilter}
                  <button 
                    onClick={() => setCategoryFilter('')}
                    className="min-w-[20px] min-h-[20px] w-5 h-5 flex items-center justify-center hover:bg-purple-200 rounded flex-shrink-0"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              )}
              
              {filterType && (
                <span className="inline-flex items-center gap-1 bg-green-100 text-green-800 text-xs font-medium px-2.5 py-0.5 rounded">
                  Tipo: {filterType === 'enrolled' ? 'Meus cursos' : 
                          filterType === 'not-enrolled' ? 'Disponíveis' : 
                          filterType === 'completed' ? 'Concluídos' : filterType}
                  <button 
                    onClick={() => setFilterType('')}
                    className="min-w-[20px] min-h-[20px] w-5 h-5 flex items-center justify-center hover:bg-green-200 rounded flex-shrink-0"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              )}
              
              {hasActiveFilters && (
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={clearFilters}
                  className="ml-2 min-h-[44px]"
                >
                  Limpar tudo
                </Button>
              )}
              
              {!hasActiveFilters && (
                <span className="text-sm text-gray-500">Nenhum filtro ativo</span>
              )}
            </div>
          </div>
        )}
      </Card>

      {/* Estatísticas Rápidas */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 mb-1">
                Cursos Disponíveis
              </p>
              <p className="text-2xl font-bold text-gray-900">
                {stats.totalCourses}
              </p>
            </div>
            <BookOpen className="w-8 h-8 text-blue-600" />
          </div>
        </Card>

        {user ? (
          <>
            <Card className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 mb-1">
                    Meus Cursos
                  </p>
                  <p className="text-2xl font-bold text-gray-900">
                    {stats.myCourses}
                  </p>
                </div>
                <Users className="w-8 h-8 text-green-600" />
              </div>
            </Card>

            <Card className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 mb-1">
                    Concluídos
                  </p>
                  <p className="text-2xl font-bold text-gray-900">
                    {stats.completed}
                  </p>
                </div>
                <CheckCircle className="w-8 h-8 text-purple-600" />
              </div>
            </Card>

            <Card className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 mb-1">
                    Em Progresso
                  </p>
                  <p className="text-2xl font-bold text-gray-900">
                    {stats.inProgress}
                  </p>
                </div>
                <Play className="w-8 h-8 text-orange-600" />
              </div>
            </Card>
          </>
        ) : (
          <Card className="p-6 md:col-span-3">
            <div className="text-center">
              <p className="text-sm font-medium text-gray-600 mb-2">
                Faça login para acompanhar seu progresso
              </p>
              <Link href="/entrar">
                <Button variant="outline" className="min-h-[44px]">
                  Entrar
                </Button>
              </Link>
            </div>
          </Card>
        )}
      </div>

      {/* Indicador de Resultados e Controles de Itens por Página */}
      <div className="mb-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex items-center gap-4">
          {hasActiveFilters && (
            <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-sm text-blue-800">
                {filteredCourses.length} resultado{filteredCourses.length !== 1 ? 's' : ''}
                {searchTerm && ` para "${searchTerm}"`}
              </p>
            </div>
          )}
        </div>
        
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-600">Cursos por página:</span>
          <select
            value={coursesPerPage}
            onChange={(e) => {
              setCoursesPerPage(Number(e.target.value))
              setCurrentPage(1)
            }}
            className="px-3 py-1 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value={12}>12</option>
            <option value={24}>24</option>
            <option value={48}>48</option>
            <option value={96}>96</option>
          </select>
        </div>
      </div>

      {/* Lista de Cursos */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {currentCourses.map((course) => {
          const isEnrolled = enrolledCourseIds.includes(course.id)
          const enrollment = enrollmentMap[course.id]
          const totalEnrollments = course.enrollments?.length || 0

          return (
            <Card key={course.id} className="overflow-hidden hover:shadow-lg transition-shadow">
              {/* Thumbnail */}
              <div className="relative h-48 bg-gradient-to-br from-blue-400 to-blue-600">
                {course.thumbnail_url ? (
                  <img
                    src={course.thumbnail_url}
                    alt={course.title}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <BookOpen className="w-16 h-16 text-white" />
                  </div>
                )}
                
                {/* Badge de status */}
                {isEnrolled && (
                  <div className="absolute top-3 right-3">
                    {enrollment?.completed_at ? (
                      <div className="bg-green-500 text-white px-3 py-1 rounded-full text-sm font-medium flex items-center gap-1">
                        <CheckCircle className="w-4 h-4" />
                        Concluído
                      </div>
                    ) : (
                      <div className="bg-blue-500 text-white px-3 py-1 rounded-full text-sm font-medium">
                        {enrollment?.progress || 0}% concluído
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Conteúdo */}
              <div className="p-6">
                <div className="mb-4">
                  <h3 className="text-lg font-semibold text-gray-900 mb-2 line-clamp-2">
                    {course.title}
                  </h3>
                  
                  {/* Badge de categoria */}
                  {course.category && COURSE_CATEGORIES[course.category] && (
                    <div className="mb-2">
                      <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${COURSE_CATEGORIES[course.category].color}`}>
                        <span>{COURSE_CATEGORIES[course.category].icon}</span>
                        {COURSE_CATEGORIES[course.category].label}
                      </span>
                    </div>
                  )}
                  
                  <p className="text-gray-600 text-sm line-clamp-3">
                    {course.description}
                  </p>
                </div>

                {/* Informações do curso */}
                <div className="space-y-2 mb-4">
                  <div className="flex items-center text-sm text-gray-500">
                    <Users className="w-4 h-4 mr-2" />
                    <span>Por {course.profiles?.full_name || 'Professor'}</span>
                  </div>
                  
                  <div className="flex items-center text-sm text-gray-500">
                    <Clock className="w-4 h-4 mr-2" />
                    <span>
                      {course.duration ? `${course.duration} horas` : 'Duração não definida'}
                    </span>
                  </div>
                  
                  <div className="flex items-center text-sm text-gray-500">
                    <Users className="w-4 h-4 mr-2" />
                    <span>{totalEnrollments} aluno{totalEnrollments !== 1 ? 's' : ''} matriculado{totalEnrollments !== 1 ? 's' : ''}</span>
                  </div>

                  {/* Indicador de preço */}
                  <div className="flex items-center text-sm font-medium">
                    {course.is_free ? (
                      <span className="bg-green-100 text-green-800 px-2 py-1 rounded-full text-xs">
                        GRATUITO
                      </span>
                    ) : (
                      <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-xs">
                        R$ {course.price?.toFixed(2) || '0,00'}
                      </span>
                    )}
                  </div>
                </div>

                {/* Progresso para cursos matriculados */}
                {isEnrolled && enrollment && !enrollment.completed_at && (
                  <div className="mb-4">
                    <div className="flex justify-between text-sm text-gray-600 mb-1">
                      <span>Progresso</span>
                      <span>{enrollment.progress || 0}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${enrollment.progress || 0}%` }}
                      ></div>
                    </div>
                  </div>
                )}

                {/* Ações */}
                <div className="flex gap-2">
                  {user && isEnrolled ? (
                    <>
                      <Link href={`/courses/${course.id}/learn`} className="flex-1">
                        <Button className="w-full flex items-center gap-2 min-h-[44px]">
                          <Play className="w-4 h-4" />
                          {enrollment?.completed_at ? 'Revisar' : 'Continuar'}
                        </Button>
                      </Link>
                      <Link href={`/courses/${course.id}`}>
                        <Button variant="secondary" className="flex items-center gap-2 min-h-[44px]">
                          <BookOpen className="w-4 h-4" />
                          Detalhes
                        </Button>
                      </Link>
                    </>
                  ) : user ? (
                    <Link href={`/courses/${course.id}`} className="flex-1">
                      <Button className="w-full flex items-center gap-2 min-h-[44px]">
                        <BookOpen className="w-4 h-4" />
                        {course.is_free ? 'Matricular-se Gratuitamente' : `Adquirir por R$ ${course.price?.toFixed(2) || '0,00'}`}
                      </Button>
                    </Link>
                  ) : (
                    <>
                      <Link href={`/courses/${course.id}`} className="flex-1">
                        <Button variant="secondary" className="w-full flex items-center gap-2 min-h-[44px]">
                          <BookOpen className="w-4 h-4" />
                          Ver Detalhes
                        </Button>
                      </Link>
                      <Link href="/entrar">
                        <Button className="flex items-center gap-2 min-h-[44px]">
                          Entrar
                        </Button>
                      </Link>
                    </>
                  )}
                </div>
              </div>
            </Card>
          )
        })}
      </div>

      {/* Controles de Paginação */}
      {totalPages > 1 && (
        <div className="mt-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="text-sm text-gray-600">
            Mostrando {indexOfFirstCourse + 1}-{Math.min(indexOfLastCourse, filteredCourses.length)} de {filteredCourses.length} cursos
          </div>
          
          <div className="flex items-center gap-2">
            {/* Botão Primeira Página */}
            <button
              onClick={goToFirstPage}
              disabled={currentPage === 1}
              className="p-2 rounded-lg border border-gray-300 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed min-w-[40px] min-h-[40px] flex items-center justify-center"
              aria-label="Primeira página"
            >
              <ChevronsLeft className="w-4 h-4" />
            </button>
            
            {/* Botão Página Anterior */}
            <button
              onClick={goToPreviousPage}
              disabled={currentPage === 1}
              className="p-2 rounded-lg border border-gray-300 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed min-w-[40px] min-h-[40px] flex items-center justify-center"
              aria-label="Página anterior"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            
            {/* Números de Página */}
            <div className="flex items-center gap-1">
              {getPageNumbers().map((number, index) => (
                number === '...' ? (
                  <span key={`dots-${index}`} className="px-3 py-2 text-gray-500">
                    ...
                  </span>
                ) : (
                  <button
                    key={number}
                    onClick={() => goToPage(number)}
                    className={`px-3 py-2 rounded-lg min-w-[40px] min-h-[40px] flex items-center justify-center transition-colors ${
                      currentPage === number
                        ? 'bg-blue-600 text-white font-semibold'
                        : 'border border-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    {number}
                  </button>
                )
              ))}
            </div>
            
            {/* Botão Próxima Página */}
            <button
              onClick={goToNextPage}
              disabled={currentPage === totalPages}
              className="p-2 rounded-lg border border-gray-300 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed min-w-[40px] min-h-[40px] flex items-center justify-center"
              aria-label="Próxima página"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
            
            {/* Botão Última Página */}
            <button
              onClick={goToLastPage}
              disabled={currentPage === totalPages}
              className="p-2 rounded-lg border border-gray-300 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed min-w-[40px] min-h-[40px] flex items-center justify-center"
              aria-label="Última página"
            >
              <ChevronsRight className="w-4 h-4" />
            </button>
          </div>
          
          <div className="text-sm text-gray-600 hidden lg:block">
            Página {currentPage} de {totalPages}
          </div>
        </div>
      )}

      {/* Mensagem quando não há cursos ou resultados */}
      {filteredCourses.length === 0 && (
        <Card className="p-12 text-center">
          <BookOpen className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          {hasActiveFilters ? (
            <>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                Nenhum curso encontrado
              </h3>
              <p className="text-gray-600 mb-4">
                Tente ajustar os filtros ou buscar por outros termos.
              </p>
              <Button onClick={clearFilters} variant="outline">
                Limpar filtros
              </Button>
            </>
          ) : (
            <>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                Nenhum curso disponível
              </h3>
              <p className="text-gray-600">
                Novos cursos serão adicionados em breve. Volte mais tarde!
              </p>
            </>
          )}
        </Card>
      )}
    </>
  )
}

export default memo(CoursesPageContent)