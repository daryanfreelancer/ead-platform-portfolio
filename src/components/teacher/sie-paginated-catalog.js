'use client'

import { useState, useEffect, useCallback } from 'react'
import { Card } from '@/components/ui/card'
import Button from '@/components/ui/button'
import Input from '@/components/ui/input'
import Label from '@/components/ui/label'
import { Search, X, ChevronLeft, ChevronRight, Loader2, CheckCircle, AlertCircle, Download } from 'lucide-react'
import { COURSE_CATEGORIES } from '@/lib/constants/course-categories'
import { createClient } from '@/lib/supabase/client'

const supabase = createClient()

export default function SiePaginatedCatalog({ isOpen, onClose, onImport }) {
  const [courses, setCourses] = useState([])
  const [loading, setLoading] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [categories, setCategories] = useState([])
  const [selectedCourse, setSelectedCourse] = useState(null)
  const [importing, setImporting] = useState(false)
  const [message, setMessage] = useState({ type: '', text: '' })
  const [importOptions, setImportOptions] = useState({
    category: 'capacitacao',
    price: 0,
    is_free: true
  })
  
  const itemsPerPage = 20

  // Buscar categorias da API SIE
  const fetchCategories = async () => {
    try {
      const response = await fetch('/api/sie/categories')
      const data = await response.json()
      
      if (data.categories && Array.isArray(data.categories)) {
        setCategories(data.categories)
      }
    } catch (error) {
      console.error('Erro ao buscar categorias:', error)
      // Fallback: extrair categorias dos cursos
      if (courses.length > 0) {
        const uniqueCategories = new Set()
        courses.forEach(course => {
          if (course.category) {
            uniqueCategories.add(course.category)
          }
        })
        const extractedCategories = Array.from(uniqueCategories).sort()
        setCategories(extractedCategories.map(cat => ({ 
          id: cat, 
          name: cat 
        })))
      }
    }
  }

  // Buscar cursos da API SIE
  const fetchCourses = async (page = 1) => {
    setLoading(true)
    setMessage({ type: '', text: '' })
    
    try {
      const params = new URLSearchParams({
        search: searchQuery,
        category: selectedCategory,
        page: page.toString(),
        limit: itemsPerPage.toString()
      })

      const response = await fetch(`/api/sie/courses?${params}`)
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Erro ao buscar cursos')
      }

      if (data.courses && Array.isArray(data.courses)) {
        setCourses(data.courses)
        
        // Calcular total de páginas baseado na resposta
        if (data.total) {
          setTotalPages(Math.ceil(data.total / itemsPerPage))
        } else {
          // Se não houver total, assumir que há mais páginas se retornou o limite
          setTotalPages(data.courses.length === itemsPerPage ? page + 1 : page)
        }
      } else {
        setCourses([])
        setTotalPages(1)
      }
    } catch (error) {
      console.error('Erro ao buscar cursos:', error)
      setMessage({
        type: 'error',
        text: `Erro ao buscar cursos: ${error.message}`
      })
      setCourses([])
      setTotalPages(1)
    } finally {
      setLoading(false)
    }
  }

  // Buscar cursos quando o modal abrir ou filtros mudarem
  useEffect(() => {
    if (isOpen) {
      fetchCourses(currentPage)
      // Buscar categorias apenas na primeira vez que o modal abrir
      if (categories.length === 0) {
        fetchCategories()
      }
    }
  }, [isOpen, currentPage])

  // Resetar página ao mudar filtros
  const handleSearch = () => {
    setCurrentPage(1)
    fetchCourses(1)
  }

  const handleCategoryChange = (e) => {
    setSelectedCategory(e.target.value)
    setCurrentPage(1)
    fetchCourses(1)
  }

  // Importar curso selecionado
  const importCourse = async () => {
    if (!selectedCourse) return

    setImporting(true)
    setMessage({ type: '', text: '' })

    try {
      // Buscar polo SIE
      const { data: sieHub } = await supabase
        .from('educational_hubs')
        .select('id')
        .eq('name', 'SIE')
        .single()

      if (!sieHub) {
        throw new Error('Polo SIE não encontrado')
      }

      // Criar curso importado
      const courseData = {
        title: selectedCourse.title,
        description: selectedCourse.description,
        category: importOptions.category,
        educational_hub_id: sieHub.id,
        duration: selectedCourse.duration / 60, // Converter para minutos
        price: importOptions.is_free ? 0 : parseFloat(importOptions.price),
        is_free: importOptions.is_free,
        video_type: 'external',
        video_url: `https://www.sie.com.br/course/${selectedCourse.id}`,
        thumbnail_url: selectedCourse.thumbnail,
        teacher_id: (await supabase.auth.getUser()).data.user.id,
        is_sie_course: true,
        sie_course_id: selectedCourse.id,
        status: 'published'
      }

      const { data, error } = await supabase
        .from('courses')
        .insert([courseData])
        .select()
        .single()

      if (error) throw error

      setMessage({
        type: 'success',
        text: 'Curso importado com sucesso!'
      })

      // Limpar seleção
      setTimeout(() => {
        setSelectedCourse(null)
        if (onImport) {
          onImport(data)
        }
        onClose()
      }, 2000)

    } catch (error) {
      console.error('Erro ao importar curso:', error)
      setMessage({
        type: 'error',
        text: 'Erro ao importar curso. Verifique se ele já não foi importado.'
      })
    } finally {
      setImporting(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-6xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-6 border-b flex items-center justify-between">
          <h2 className="text-2xl font-bold">Catálogo Completo SIE</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Filters */}
        <div className="p-6 border-b bg-gray-50">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <Input
                placeholder="Buscar cursos..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
              />
            </div>
            <div className="w-full md:w-48">
              <select
                value={selectedCategory}
                onChange={handleCategoryChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
              >
                <option value="">Todas as categorias</option>
                {categories.map((cat) => (
                  <option key={cat.id || cat} value={cat.id || cat}>
                    {cat.name || cat}
                  </option>
                ))}
              </select>
            </div>
            <Button
              onClick={handleSearch}
              disabled={loading}
              className="flex items-center gap-2"
            >
              {loading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Search className="w-4 h-4" />
              )}
              Buscar
            </Button>
          </div>
        </div>

        {/* Messages */}
        {message.text && (
          <div className={`mx-6 mt-4 p-4 rounded-lg flex items-center gap-3 ${
            message.type === 'success' 
              ? 'bg-green-50 text-green-700 border border-green-200' 
              : message.type === 'error'
              ? 'bg-red-50 text-red-700 border border-red-200'
              : 'bg-blue-50 text-blue-700 border border-blue-200'
          }`}>
            {message.type === 'success' ? (
              <CheckCircle className="w-5 h-5" />
            ) : (
              <AlertCircle className="w-5 h-5" />
            )}
            <span>{message.text}</span>
          </div>
        )}

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {loading ? (
            <div className="flex items-center justify-center h-64">
              <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
            </div>
          ) : courses.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <p className="text-lg">Nenhum curso encontrado</p>
              <p className="text-sm mt-2">Tente ajustar os filtros de busca</p>
            </div>
          ) : (
            <div className="grid gap-4">
              {courses.map((course) => (
                <Card 
                  key={course.id}
                  className={`p-4 cursor-pointer transition-all ${
                    selectedCourse?.id === course.id 
                      ? 'ring-2 ring-blue-500 bg-blue-50' 
                      : 'hover:shadow-md'
                  }`}
                  onClick={() => setSelectedCourse(course)}
                >
                  <div className="flex gap-4">
                    <img
                      src={course.thumbnail || '/placeholder-course.jpg'}
                      alt={course.title}
                      className="w-32 h-20 object-cover rounded"
                      onError={(e) => {
                        e.target.src = '/placeholder-course.jpg'
                      }}
                    />
                    <div className="flex-1">
                      <h5 className="font-semibold">{course.title}</h5>
                      <p className="text-sm text-gray-600 line-clamp-2">
                        {course.description}
                      </p>
                      <div className="flex items-center gap-4 mt-2 text-sm text-gray-500">
                        <span>Professor: {course.teacher || 'N/A'}</span>
                        <span>{course.duration ? `${course.duration / 60} horas` : 'Duração não informada'}</span>
                        {course.category && (
                          <span className="px-2 py-1 bg-gray-100 rounded text-xs">
                            {course.category}
                          </span>
                        )}
                      </div>
                    </div>
                    {selectedCourse?.id === course.id && (
                      <CheckCircle className="w-5 h-5 text-blue-600" />
                    )}
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>

        {/* Import Options */}
        {selectedCourse && (
          <div className="p-6 bg-blue-50 border-t">
            <h4 className="font-semibold mb-4">Configurar Importação</h4>
            
            <div className="grid md:grid-cols-3 gap-4">
              <div>
                <Label htmlFor="import-category">Categoria do Curso *</Label>
                <select
                  id="import-category"
                  value={importOptions.category}
                  onChange={(e) => setImportOptions({ ...importOptions, category: e.target.value })}
                  className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-md"
                >
                  {Object.entries(COURSE_CATEGORIES).map(([key, cat]) => (
                    <option key={key} value={key}>{cat.label}</option>
                  ))}
                </select>
              </div>

              <div>
                <Label>Configuração de Preço</Label>
                <div className="mt-2 space-y-2">
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={importOptions.is_free}
                      onChange={(e) => setImportOptions({ 
                        ...importOptions, 
                        is_free: e.target.checked,
                        price: e.target.checked ? 0 : importOptions.price
                      })}
                      className="mr-2"
                    />
                    <span className="text-sm">Curso Gratuito</span>
                  </label>
                  
                  {!importOptions.is_free && (
                    <Input
                      type="number"
                      value={importOptions.price}
                      onChange={(e) => setImportOptions({ ...importOptions, price: e.target.value })}
                      placeholder="Preço (R$)"
                      min="0.01"
                      step="0.01"
                    />
                  )}
                </div>
              </div>

              <div className="flex items-end gap-2">
                <Button
                  variant="secondary"
                  onClick={() => setSelectedCourse(null)}
                  className="flex-1"
                >
                  Cancelar
                </Button>
                <Button
                  onClick={importCourse}
                  disabled={importing}
                  className="flex-1 flex items-center justify-center gap-2"
                >
                  {importing ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Download className="w-4 h-4" />
                  )}
                  Importar
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Pagination */}
        {!selectedCourse && totalPages > 1 && (
          <div className="p-6 border-t flex items-center justify-between">
            <Button
              variant="secondary"
              onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
              disabled={currentPage === 1 || loading}
              className="flex items-center gap-2"
            >
              <ChevronLeft className="w-4 h-4" />
              Anterior
            </Button>
            
            <span className="text-sm text-gray-600">
              Página {currentPage} de {totalPages}
            </span>
            
            <Button
              variant="secondary"
              onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
              disabled={currentPage === totalPages || loading}
              className="flex items-center gap-2"
            >
              Próxima
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}