'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Card } from '@/components/ui/card'
import Button from '@/components/ui/button'
import Input from '@/components/ui/input'
import Label from '@/components/ui/label'
import { Search, Download, AlertCircle, CheckCircle, Loader2, ExternalLink } from 'lucide-react'
import { COURSE_CATEGORIES } from '@/lib/constants/course-categories'
import SiePaginatedCatalog from './sie-paginated-catalog'

const supabase = createClient()

export default function SieCourseImporter({ onImport }) {
  const [showCatalog, setShowCatalog] = useState(false)
  const [searching, setSearching] = useState(false)
  const [importing, setImporting] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [sieCourses, setSieCourses] = useState([])
  const [selectedCourse, setSelectedCourse] = useState(null)
  const [importOptions, setImportOptions] = useState({
    category: 'capacitacao',
    price: 0,
    is_free: true
  })
  const [message, setMessage] = useState({ type: '', text: '' })
  const [sieApiEnabled, setSieApiEnabled] = useState(false)
  const [checkingStatus, setCheckingStatus] = useState(true)

  // Verificar status da API SIE quando o componente for montado
  useEffect(() => {
    checkSieApiStatus()
  }, [])

  const checkSieApiStatus = async () => {
    try {
      setCheckingStatus(true)
      const response = await fetch('/api/sie/status')
      const data = await response.json()
      
      setSieApiEnabled(data.enabled || false)
      
      if (!data.enabled) {
        setMessage({
          type: 'error',
          text: data.message || 'API SIE está pausada. Contate o administrador.'
        })
      }
    } catch (error) {
      console.error('Erro ao verificar status SIE:', error)
      setSieApiEnabled(false)
      setMessage({
        type: 'error',
        text: 'Erro ao verificar status da API SIE'
      })
    } finally {
      setCheckingStatus(false)
    }
  }

  // Buscar cursos da API SIE via API route
  const searchSieCourses = async () => {
    // Verificar se API está habilitada antes de buscar
    if (!sieApiEnabled) {
      setMessage({
        type: 'error',
        text: 'API SIE está pausada. Contate o administrador.'
      })
      return
    }

    setSearching(true)
    setMessage({ type: '', text: '' })

    try {
      // Re-verificar status da API SIE (redundante mas mantendo segurança)
      const statusResponse = await fetch('/api/sie/status')
      const statusData = await statusResponse.json()

      if (!statusData.enabled) {
        setSieApiEnabled(false)
        setMessage({
          type: 'error',
          text: statusData.message || 'API SIE foi pausada. Contate o administrador.'
        })
        return
      }

      if (!statusData.apiAvailable) {
        setMessage({
          type: 'error',
          text: 'API SIE está indisponível no momento. Tente novamente mais tarde.'
        })
        return
      }

      // Buscar cursos via API route
      const params = new URLSearchParams({
        search: searchQuery,
        limit: '20',
        page: '1'
      })

      const response = await fetch(`/api/sie/courses?${params}`)
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Erro ao buscar cursos')
      }

      if (data.courses && data.courses.length > 0) {
        setSieCourses(data.courses)
      } else {
        setSieCourses([])
        setMessage({
          type: 'info',
          text: 'Nenhum curso encontrado com os critérios de busca.'
        })
      }

    } catch (error) {
      console.error('Erro ao buscar cursos SIE:', error)
      setMessage({
        type: 'error',
        text: `Erro ao buscar cursos da API SIE: ${error.message}`
      })
    } finally {
      setSearching(false)
    }
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

      // Verificar se curso SIE já foi importado
      const { data: existingCourses, error: checkError } = await supabase
        .from('courses')
        .select('id, title')
        .eq('sie_course_id', String(selectedCourse.id))

      if (checkError && checkError.code !== 'PGRST116') { // PGRST116 = no rows found (ok)
        console.error('Erro ao verificar curso duplicado:', checkError)
        throw new Error('Erro ao verificar se curso já foi importado')
      }

      if (existingCourses && existingCourses.length > 0) {
        throw new Error(`O curso "${existingCourses[0].title}" já foi importado.`)
      }

      // Obter ID do usuário atual
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        throw new Error('Usuário não autenticado')
      }

      // Preparar duração (garantir que seja um número válido)
      let courseDuration = 40 // Default duration em horas
      if (selectedCourse.duration && typeof selectedCourse.duration === 'number') {
        // Se duração estiver em minutos, converter para horas
        courseDuration = selectedCourse.duration > 1000 ? 
          Math.round(selectedCourse.duration / 60) : 
          selectedCourse.duration
      }

      // Criar curso importado
      const courseData = {
        title: selectedCourse.title?.trim() || 'Curso SIE Importado',
        description: selectedCourse.description?.trim() || 'Curso importado do catálogo SIE',
        category: importOptions.category,
        educational_hub_id: sieHub.id,
        duration: parseInt(courseDuration),
        price: importOptions.is_free ? 0 : parseFloat(importOptions.price || 0),
        is_free: Boolean(importOptions.is_free),
        video_type: 'url',
        video_url: `https://www.sie.com.br/course/${selectedCourse.id}`,
        thumbnail_url: selectedCourse.thumbnail || null,
        teacher_id: user.id,
        is_sie_course: true,
        sie_course_id: String(selectedCourse.id),
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
      setSelectedCourse(null)
      setSieCourses([])
      setSearchQuery('')

      // Callback para o componente pai
      if (onImport) {
        onImport(data)
      }

    } catch (error) {
      console.error('Erro ao importar curso:', error)
      
      let errorMessage = 'Erro ao importar curso'
      
      // Detectar tipos específicos de erro
      if (error.message?.includes('já foi importado')) {
        errorMessage = error.message
      } else if (error.message?.includes('not found') || error.message?.includes('não encontrado')) {
        errorMessage = 'Polo SIE não encontrado. Contate o administrador.'
      } else if (error.message?.includes('not authenticated') || error.message?.includes('não autenticado')) {
        errorMessage = 'Sessão expirada. Faça login novamente.'
      } else if (error.code === '23505') { // Unique constraint violation
        errorMessage = 'Este curso SIE já foi importado anteriormente.'
      } else if (error.code === '23502') { // Not null constraint violation
        errorMessage = 'Dados obrigatórios não foram fornecidos. Verifique se as colunas SIE existem no banco.'
      } else if (error.message?.includes('column') && error.message?.includes('does not exist')) {
        errorMessage = 'Erro de estrutura do banco. Execute a migração para adicionar colunas SIE.'
      } else if (error.message) {
        errorMessage = `Erro: ${error.message}`
      }
      
      setMessage({
        type: 'error',
        text: errorMessage
      })
    } finally {
      setImporting(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Busca de cursos SIE */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">Importar Curso do Catálogo SIE</h3>
        
        <div className="space-y-4">
          <div className="flex gap-4">
            <div className="flex-1">
              <Input
                placeholder="Buscar cursos por título ou descrição..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && searchSieCourses()}
              />
            </div>
            <Button
              onClick={searchSieCourses}
              disabled={searching || checkingStatus || !sieApiEnabled}
              className="flex items-center gap-2"
            >
              {searching ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : checkingStatus ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Search className="w-4 h-4" />
              )}
              {checkingStatus ? 'Verificando...' : 'Buscar'}
            </Button>
          </div>

          <div className="flex items-center gap-2 text-sm text-gray-600">
            <AlertCircle className="w-4 h-4" />
            <span>Busque e importe cursos diretamente do catálogo SIE</span>
            <button
              onClick={() => setShowCatalog(true)}
              className="text-blue-600 hover:underline flex items-center gap-1"
            >
              <ExternalLink className="w-3 h-3" />
              Ver catálogo completo
            </button>
          </div>
        </div>
      </Card>

      {/* Mensagens */}
      {message.text && (
        <div className={`p-4 rounded-lg flex items-center gap-3 ${
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

      {/* Lista de cursos encontrados */}
      {sieCourses.length > 0 && (
        <div className="space-y-4">
          <h4 className="font-medium">Cursos encontrados:</h4>
          
          <div className="grid gap-4">
            {sieCourses.map((course) => (
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
                    src={course.thumbnail}
                    alt={course.title}
                    className="w-32 h-20 object-cover rounded"
                  />
                  <div className="flex-1">
                    <h5 className="font-semibold">{course.title}</h5>
                    <p className="text-sm text-gray-600 line-clamp-2">
                      {course.description}
                    </p>
                    <div className="flex items-center gap-4 mt-2 text-sm text-gray-500">
                      <span>Professor: {course.teacher}</span>
                      <span>{course.duration / 60} horas</span>
                    </div>
                  </div>
                  {selectedCourse?.id === course.id && (
                    <CheckCircle className="w-5 h-5 text-blue-600" />
                  )}
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Opções de importação */}
      {selectedCourse && (
        <Card className="p-6 bg-blue-50 border-blue-200">
          <h4 className="font-semibold mb-4">Configurar Importação</h4>
          
          <div className="space-y-4">
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
              <div className="mt-2 space-y-3">
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
                  <span className="text-sm font-medium">Curso Gratuito</span>
                </label>
                
                {!importOptions.is_free && (
                  <div>
                    <Label htmlFor="import-price">Preço (R$)</Label>
                    <Input
                      id="import-price"
                      type="number"
                      value={importOptions.price}
                      onChange={(e) => setImportOptions({ ...importOptions, price: e.target.value })}
                      placeholder="0,00"
                      min="0.01"
                      step="0.01"
                    />
                  </div>
                )}
              </div>
            </div>

            <div className="flex justify-end gap-4 pt-4">
              <Button
                variant="secondary"
                onClick={() => {
                  setSelectedCourse(null)
                  setSieCourses([])
                }}
              >
                Cancelar
              </Button>
              <Button
                onClick={importCourse}
                disabled={importing}
                className="flex items-center gap-2"
              >
                {importing ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Download className="w-4 h-4" />
                )}
                Importar Curso
              </Button>
            </div>
          </div>
        </Card>
      )}

      {/* Modal de Catálogo Paginado */}
      <SiePaginatedCatalog 
        isOpen={showCatalog}
        onClose={() => setShowCatalog(false)}
        onImport={(course) => {
          setShowCatalog(false)
          if (onImport) {
            onImport(course)
          }
        }}
      />
    </div>
  )
}