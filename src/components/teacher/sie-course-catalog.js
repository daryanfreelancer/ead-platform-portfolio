'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import Button from '@/components/ui/button'
import Input from '@/components/ui/input'
import { Card } from '@/components/ui/card'
import SieBulkImportModal from './sie-bulk-import-modal'
import { 
  Search, 
  Filter, 
  BookOpen, 
  Clock, 
  Users, 
  Star,
  Download,
  Upload,
  ChevronLeft,
  ChevronRight,
  AlertCircle,
  Loader2,
  X,
  Check,
  Zap
} from 'lucide-react'

const supabase = createClient()

export default function SieCourseCatalog({ onImport, onClose }) {
  const [showBulkImport, setShowBulkImport] = useState(false)
  const [courses, setCourses] = useState([])
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const [importing, setImporting] = useState(null)
  const [importedCourses, setImportedCourses] = useState(new Set())
  const [sieApiEnabled, setSieApiEnabled] = useState(false)
  const [totalPages, setTotalPages] = useState(1)
  const [hasNextPage, setHasNextPage] = useState(false)
  const [hasPrevPage, setHasPrevPage] = useState(false)
  
  const coursesPerPage = 100 // Máximo da API SIE

  useEffect(() => {
    checkSieApiStatusAndLoad()
  }, [])

  const checkSieApiStatusAndLoad = async () => {
    try {
      setLoading(true)
      setError(null)

      // Verificar status da API SIE primeiro
      const statusResponse = await fetch('/api/sie/status')
      if (!statusResponse.ok) {
        throw new Error('SIE API não está disponível')
      }

      const statusData = await statusResponse.json()
      setSieApiEnabled(statusData.enabled || false)
      
      if (!statusData.enabled) {
        throw new Error('SIE API está desabilitado no momento')
      }

      // Se API está ativa, carregar primeira página
      await loadSieCourses(1)
    } catch (error) {
      console.error('Erro ao verificar status e carregar cursos:', error)
      setError(error.message)
      setLoading(false)
    }
  }

  useEffect(() => {
    // Recarregar com novos filtros sempre que mudam
    const timeoutId = setTimeout(() => {
      if (sieApiEnabled) {
        loadSieCourses(1, searchTerm, selectedCategory)
      }
    }, 500) // Debounce de 500ms para busca
    
    return () => clearTimeout(timeoutId)
  }, [searchTerm, selectedCategory, sieApiEnabled])

  const loadSieCourses = async (page = 1, search = '', category = '') => {
    try {
      setLoading(true)
      setError(null)
      
      // Construir URL com parâmetros de paginação e busca
      const params = new URLSearchParams({
        page: page.toString(),
        limit: coursesPerPage.toString()
      })
      
      if (search.trim()) {
        params.append('search', search.trim())
      }
      
      if (category) {
        params.append('category', category)
      }
      
      const response = await fetch(`/api/sie/courses?${params.toString()}`)
      if (!response.ok) {
        throw new Error('Erro ao carregar catálogo SIE')
      }

      const data = await response.json()
      
      console.log('Resposta da API SIE (página', page + '):', data)
      
      if (data.success && data.courses) {
        setCourses(data.courses)
        setTotalPages(data.totalPages || 1)
        setHasNextPage(data.hasNextPage || false)
        setHasPrevPage(data.hasPrevPage || false)
        setCurrentPage(data.page || page)
        
        // Extrair categorias únicas na primeira página (sem filtros)
        if (page === 1 && !search && !category) {
          const uniqueCategories = [...new Set(data.courses
            .map(course => course.category)
            .filter(cat => cat && cat.trim())
          )].sort()
          
          setCategories(uniqueCategories)
        }
      } else {
        throw new Error(data.error || 'Erro ao processar dados do catálogo')
      }
      
    } catch (error) {
      console.error('Erro ao carregar catálogo SIE:', error)
      setError(error.message)
    } finally {
      setLoading(false)
    }
  }

  // Navegar para página específica
  const goToPage = (page) => {
    if (page >= 1 && page <= totalPages && page !== currentPage) {
      loadSieCourses(page, searchTerm, selectedCategory)
    }
  }
  
  // Como agora fazemos busca server-side, courses já vêm filtrados

  const handleImportCourse = async (sieCourse) => {
    try {
      setImporting(sieCourse.id)

      // Importar curso via API
      const response = await fetch('/api/sie/import-course', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          sie_course_id: sieCourse.id,
          course_data: sieCourse
        })
      })

      if (!response.ok) {
        throw new Error('Erro ao importar curso')
      }

      const result = await response.json()
      
      if (result.success) {
        setImportedCourses(prev => new Set([...prev, sieCourse.id]))
        
        // Chamar callback de importação
        if (onImport) {
          onImport(result.course)
        }
      } else {
        throw new Error(result.error || 'Erro ao importar curso')
      }

    } catch (error) {
      console.error('Erro na importação:', error)
      alert(`Erro ao importar curso: ${error.message}`)
    } finally {
      setImporting(null)
    }
  }

  const handleBulkImport = async () => {
    if (!confirm(`Deseja importar ${courses.length} cursos desta página?`)) {
      return
    }

    setImporting('bulk')
    let successCount = 0
    let errorCount = 0
    const errors = []

    try {
      // Importar cursos em lotes de 5 para evitar sobrecarga
      const batchSize = 5
      for (let i = 0; i < courses.length; i += batchSize) {
        const batch = courses.slice(i, i + batchSize)
        
        // Processar lote em paralelo
        const promises = batch.map(async (course) => {
          try {
            const response = await fetch('/api/sie/import-course', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                sie_course_id: course.id,
                course_data: course
              })
            })

            if (!response.ok) {
              throw new Error(`Erro HTTP: ${response.status}`)
            }

            const result = await response.json()
            
            if (result.success) {
              successCount++
              setImportedCourses(prev => new Set([...prev, course.id]))
            } else {
              throw new Error(result.error || 'Erro desconhecido')
            }
          } catch (error) {
            errorCount++
            errors.push(`${course.title}: ${error.message}`)
            console.error(`Erro ao importar curso ${course.title}:`, error)
          }
        })

        await Promise.all(promises)
      }

      // Mostrar resultados
      const message = `Importação concluída!\n\n✅ Sucesso: ${successCount} cursos\n❌ Erros: ${errorCount} cursos`
      
      if (errors.length > 0) {
        const errorDetails = errors.slice(0, 5).join('\n')
        const moreErrors = errors.length > 5 ? `\n... e mais ${errors.length - 5} erros` : ''
        alert(`${message}\n\nErros:\n${errorDetails}${moreErrors}`)
      } else {
        alert(message)
      }

      // Chamar callback se todos foram importados com sucesso
      if (successCount > 0 && onImport) {
        onImport({ count: successCount })
      }

    } catch (error) {
      console.error('Erro na importação em lote:', error)
      alert(`Erro crítico na importação: ${error.message}`)
    } finally {
      setImporting(null)
    }
  }

  const formatDuration = (duration) => {
    if (!duration) return 'Não informado'
    // duration está em minutos
    if (duration < 60) return `${duration}min`
    const hours = Math.floor(duration / 60)
    const minutes = duration % 60
    return minutes > 0 ? `${hours}h ${minutes}min` : `${hours}h`
  }

  const formatPrice = (price) => {
    if (!price || price === 0) return 'Gratuito'
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(price)
  }

  // Paginação server-side - courses já vem paginados
  const currentCourses = courses
  const startIndex = (currentPage - 1) * coursesPerPage + 1
  const endIndex = Math.min(startIndex + courses.length - 1, startIndex + coursesPerPage - 1)

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
        <Card className="p-8 max-w-md w-full mx-4">
          <div className="text-center">
            <Loader2 className="w-8 h-8 text-blue-600 animate-spin mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">Carregando Catálogo SIE</h3>
            <p className="text-gray-600">Aguarde enquanto buscamos os cursos disponíveis...</p>
          </div>
        </Card>
      </div>
    )
  }

  if (error) {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
        <Card className="p-8 max-w-md w-full mx-4">
          <div className="text-center">
            <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">Erro ao Carregar Catálogo</h3>
            <p className="text-gray-600 mb-4">{error}</p>
            <div className="flex gap-3 justify-center">
              <Button onClick={checkSieApiStatusAndLoad} variant="primary">
                Tentar Novamente
              </Button>
              <Button onClick={onClose} variant="secondary">
                Fechar
              </Button>
            </div>
          </div>
        </Card>
      </div>
    )
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg w-full max-w-7xl h-full max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-4">
              <div>
                <h2 className="text-2xl font-semibold text-gray-900">Catálogo de Cursos SIE</h2>
                <p className="text-gray-600">
                  {courses.length} curso{courses.length !== 1 ? 's' : ''} nesta página
                  {totalPages > 1 && ` (Página ${currentPage} de ${totalPages})`}
                </p>
              </div>
              <div className="flex gap-2">
                <Button
                  onClick={() => handleBulkImport()}
                  className="bg-blue-600 hover:bg-blue-700 text-white"
                  disabled={courses.length === 0 || importing === 'bulk'}
                >
                  {importing === 'bulk' ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Importando...
                    </>
                  ) : (
                    <>
                      <Upload className="w-4 h-4 mr-2" />
                      Importar Página ({courses.length})
                    </>
                  )}
                </Button>
                
                <Button
                  onClick={() => setShowBulkImport(true)}
                  className="bg-green-600 hover:bg-green-700 text-white"
                  disabled={importing === 'bulk'}
                >
                  <Zap className="w-4 h-4 mr-2" />
                  Importar TODOS os Cursos
                </Button>
              </div>
            </div>
            <Button onClick={onClose} variant="ghost" className="p-2">
              <X className="w-5 h-5" />
            </Button>
          </div>

          {/* Filtros */}
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  placeholder="Buscar cursos..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            
            <div className="sm:w-64">
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Todas as categorias</option>
                {categories.map(category => (
                  <option key={category} value={category}>
                    {category}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Course Grid */}
        <div className="flex-1 overflow-y-auto p-6">
          {currentCourses.length === 0 ? (
            <div className="text-center py-12">
              <BookOpen className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Nenhum curso encontrado
              </h3>
              <p className="text-gray-600">
                Tente ajustar os filtros ou termos de busca
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {currentCourses.map((course) => (
                <Card key={course.id} className="p-4 hover:shadow-lg transition-shadow">
                  <div className="flex flex-col h-full">
                    {/* Course Image */}
                    <div className="w-full h-32 rounded-lg mb-3 overflow-hidden relative">
                      {course.thumbnail ? (
                        <>
                          <img 
                            src={course.thumbnail}
                            alt={course.title}
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              e.target.style.display = 'none'
                              e.target.nextElementSibling.style.display = 'flex'
                            }}
                          />
                          <div 
                            className="w-full h-full bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center absolute inset-0"
                            style={{display: 'none'}}
                          >
                            <BookOpen className="w-8 h-8 text-white" />
                          </div>
                        </>
                      ) : (
                        <div className="w-full h-full bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center">
                          <BookOpen className="w-8 h-8 text-white" />
                        </div>
                      )}
                    </div>

                    {/* Course Info */}
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-900 mb-2 line-clamp-2 text-sm">
                        {course.title}
                      </h3>
                      
                      <p className="text-xs text-gray-600 mb-3 line-clamp-2">
                        {course.description || 'Sem descrição disponível'}
                      </p>
                      
                      <div className="space-y-2 mb-4">
                        {course.category && (
                          <div className="flex items-center text-xs text-gray-500">
                            <Filter className="w-3 h-3 mr-1" />
                            {course.category}
                          </div>
                        )}
                        
                        {course.duration && (
                          <div className="flex items-center text-xs text-gray-500">
                            <Clock className="w-3 h-3 mr-1" />
                            {formatDuration(course.duration)}
                          </div>
                        )}
                        
                        {course.price !== undefined && (
                          <div className="flex items-center text-xs font-medium text-green-600">
                            <span className="text-green-500 mr-1">R$</span>
                            {formatPrice(course.price)}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Import Button */}
                    <div className="mt-auto">
                      {importedCourses.has(course.id) ? (
                        <div className="flex items-center justify-center py-2 px-3 bg-green-50 text-green-700 rounded-md text-sm">
                          <Check className="w-4 h-4 mr-1" />
                          Importado
                        </div>
                      ) : (
                        <Button
                          onClick={() => handleImportCourse(course)}
                          disabled={importing === course.id}
                          size="sm"
                          className="w-full"
                        >
                          {importing === course.id ? (
                            <>
                              <Loader2 className="w-4 h-4 mr-1 animate-spin" />
                              Importando...
                            </>
                          ) : (
                            <>
                              <Download className="w-4 h-4 mr-1" />
                              Importar
                            </>
                          )}
                        </Button>
                      )}
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="p-6 border-t border-gray-200">
            <div className="flex items-center justify-between">
              <div className="text-sm text-gray-600">
                Mostrando {startIndex} a {endIndex} cursos
                {totalPages > 1 && ` - Página ${currentPage} de ${totalPages}`}
              </div>
              
              <div className="flex items-center gap-2">
                <Button
                  onClick={() => goToPage(currentPage - 1)}
                  disabled={!hasPrevPage || loading}
                  variant="ghost"
                  size="sm"
                >
                  <ChevronLeft className="w-4 h-4" />
                  Anterior
                </Button>
                
                <div className="flex items-center gap-1">
                  {/* Primeira página */}
                  {currentPage > 3 && (
                    <>
                      <Button
                        onClick={() => goToPage(1)}
                        variant="ghost"
                        size="sm"
                        className="w-8 h-8 p-0"
                      >
                        1
                      </Button>
                      {currentPage > 4 && <span className="text-gray-400">...</span>}
                    </>
                  )}
                  
                  {/* Páginas ao redor da atual */}
                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    const start = Math.max(1, currentPage - 2)
                    const page = start + i
                    
                    if (page > totalPages) return null
                    
                    return (
                      <Button
                        key={page}
                        onClick={() => goToPage(page)}
                        variant={currentPage === page ? "primary" : "ghost"}
                        size="sm"
                        className="w-8 h-8 p-0"
                        disabled={loading}
                      >
                        {page}
                      </Button>
                    )
                  })}
                  
                  {/* Última página */}
                  {currentPage < totalPages - 2 && (
                    <>
                      {currentPage < totalPages - 3 && <span className="text-gray-400">...</span>}
                      <Button
                        onClick={() => goToPage(totalPages)}
                        variant="ghost"
                        size="sm"
                        className="w-8 h-8 p-0"
                      >
                        {totalPages}
                      </Button>
                    </>
                  )}
                </div>
                
                <Button
                  onClick={() => goToPage(currentPage + 1)}
                  disabled={!hasNextPage || loading}
                  variant="ghost"
                  size="sm"
                >
                  Próxima
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Modal de Importação em Massa */}
        <SieBulkImportModal 
          isOpen={showBulkImport}
          onClose={() => setShowBulkImport(false)}
          onComplete={(result) => {
            setShowBulkImport(false)
            if (onImport) {
              onImport(result)
            }
            // Recarregar a página atual para mostrar cursos importados
            loadSieCourses(currentPage, searchTerm, selectedCategory)
          }}
        />
      </div>
    </div>
  )
}