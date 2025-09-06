'use client'

import { useState, useEffect, useMemo } from 'react'
import { MessageCircle, BookOpen, ChevronDown, ChevronUp, Search, Loader2, ChevronRight } from 'lucide-react'
import { Card } from '@/components/ui/card'
import SearchAutocomplete from '@/components/ui/search-autocomplete'

const COURSE_CATEGORIES = {
  capacitacao: { 
    label: 'Capacitação', 
    color: 'bg-green-100 text-green-800 border-green-200',
    icon: '📚'
  },
  tecnologo: { 
    label: 'Tecnólogo', 
    color: 'bg-blue-100 text-blue-800 border-blue-200',
    icon: '💻'
  },
  bacharel: { 
    label: 'Bacharel', 
    color: 'bg-purple-100 text-purple-800 border-purple-200',
    icon: '🎓'
  },
  licenciatura: { 
    label: 'Licenciatura', 
    color: 'bg-indigo-100 text-indigo-800 border-indigo-200',
    icon: '👩‍🏫'
  },
  tecnico_competencia: { 
    label: 'Técnico por Competência', 
    color: 'bg-orange-100 text-orange-800 border-orange-200',
    icon: '🏆'
  },
  tecnico: { 
    label: 'Técnico', 
    color: 'bg-yellow-100 text-yellow-800 border-yellow-200',
    icon: '🔧'
  },
  mestrado: { 
    label: 'Mestrado', 
    color: 'bg-red-100 text-red-800 border-red-200',
    icon: '📖'
  },
  doutorado: { 
    label: 'Doutorado', 
    color: 'bg-pink-100 text-pink-800 border-pink-200',
    icon: '🔬'
  },
  pos_doutorado: { 
    label: 'Pós-Doutorado', 
    color: 'bg-gray-100 text-gray-800 border-gray-200',
    icon: '🎯'
  }
}

const ITEMS_PER_PAGE = 20

export default function CategorizedCourseCatalogV2() {
  const [courses, setCourses] = useState([])
  const [expandedCategories, setExpandedCategories] = useState({})
  const [expandedSubcategories, setExpandedSubcategories] = useState({})
  const [searchTerms, setSearchTerms] = useState({})
  const [loadedItems, setLoadedItems] = useState({})
  const [whatsappConfig, setWhatsappConfig] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    fetchCoursesAndConfig()
  }, [])

  const fetchCoursesAndConfig = async () => {
    try {
      setLoading(true)
      
      // Buscar cursos ativos do catálogo
      const coursesResponse = await fetch('/api/course-catalog?ativo=true')
      if (!coursesResponse.ok) throw new Error('Erro ao carregar cursos')
      
      const coursesData = await coursesResponse.json()
      setCourses(coursesData.courses || [])

      // Buscar configuração do WhatsApp (API pública)
      try {
        const configResponse = await fetch('/api/whatsapp-config')
        if (configResponse.ok) {
          const configData = await configResponse.json()
          setWhatsappConfig(configData.config)
        } else {
          throw new Error('Erro ao buscar configuração')
        }
      } catch (configError) {
        console.warn('Configuração WhatsApp não encontrada, usando padrões')
        setWhatsappConfig({
          whatsapp_number: '6132998180',
          whatsapp_message_template: 'Olá! Gostaria de mais informações sobre o curso: {CURSO_NOME}'
        })
      }

    } catch (error) {
      console.error('Erro ao carregar catálogo:', error)
      setError('Erro ao carregar catálogo de cursos')
    } finally {
      setLoading(false)
    }
  }

  const generateWhatsAppUrl = (courseName, courseCategory, courseSubcategory) => {
    if (!whatsappConfig) return '#'
    
    const categoryLabel = COURSE_CATEGORIES[courseCategory]?.label || courseCategory
    const subcategoryText = courseSubcategory && courseSubcategory !== 'Sem subcategoria' 
      ? ` - ${courseSubcategory}` 
      : ''
    
    // Template customizado com mais informações
    const fullMessage = `Olá! 👋

Gostaria de mais informações sobre o curso:

📚 *${courseName}*
📂 Categoria: ${categoryLabel}${subcategoryText}

Aguardo retorno. Obrigado!`
    
    const encodedMessage = encodeURIComponent(fullMessage)
    return `https://wa.me/55${whatsappConfig.whatsapp_number}?text=${encodedMessage}`
  }

  const toggleCategory = (categoria) => {
    setExpandedCategories(prev => ({
      ...prev,
      [categoria]: !prev[categoria]
    }))
  }

  const toggleSubcategory = (categoryKey, subcategoryKey) => {
    const key = `${categoryKey}_${subcategoryKey}`
    setExpandedSubcategories(prev => ({
      ...prev,
      [key]: !prev[key]
    }))
    
    // Initialize pagination for this subcategory if not exists
    if (!loadedItems[key]) {
      setLoadedItems(prev => ({
        ...prev,
        [key]: ITEMS_PER_PAGE
      }))
    }
  }

  const loadMoreCourses = (categoryKey, subcategoryKey) => {
    const key = `${categoryKey}_${subcategoryKey}`
    setLoadedItems(prev => ({
      ...prev,
      [key]: (prev[key] || ITEMS_PER_PAGE) + ITEMS_PER_PAGE
    }))
  }

  const handleSearch = (categoria, value) => {
    setSearchTerms(prev => ({
      ...prev,
      [categoria]: value.toLowerCase()
    }))
  }

  // Organizar cursos por categoria e subcategoria com busca
  const organizedCourses = useMemo(() => {
    const organized = {}
    
    courses.forEach(course => {
      if (!organized[course.categoria]) {
        organized[course.categoria] = {
          all: [],
          bySubcategory: {}
        }
      }
      
      // Adicionar ao array geral da categoria
      organized[course.categoria].all.push(course)
      
      // Organizar por subcategoria
      const subcategoria = course.subcategoria || 'Sem subcategoria'
      if (!organized[course.categoria].bySubcategory[subcategoria]) {
        organized[course.categoria].bySubcategory[subcategoria] = []
      }
      organized[course.categoria].bySubcategory[subcategoria].push(course)
    })
    
    return organized
  }, [courses])

  // Filtrar cursos baseado na busca
  const getFilteredCourses = (categoria) => {
    const searchTerm = searchTerms[categoria]
    if (!searchTerm) return organizedCourses[categoria]
    
    const filtered = {
      all: [],
      bySubcategory: {}
    }
    
    organizedCourses[categoria]?.all.forEach(course => {
      if (course.nome_curso.toLowerCase().includes(searchTerm) ||
          course.subcategoria?.toLowerCase().includes(searchTerm)) {
        filtered.all.push(course)
        
        const subcategoria = course.subcategoria || 'Sem subcategoria'
        if (!filtered.bySubcategory[subcategoria]) {
          filtered.bySubcategory[subcategoria] = []
        }
        filtered.bySubcategory[subcategoria].push(course)
      }
    })
    
    return filtered
  }

  if (loading) {
    return (
      <div className="mb-32">
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">Catálogo de Cursos por Categoria</h2>
          <p className="text-gray-600">Carregando cursos disponíveis...</p>
        </div>
        <div className="flex justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="mb-32 text-center">
        <Card className="p-8 max-w-md mx-auto">
          <BookOpen className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Erro ao carregar cursos</h3>
          <p className="text-gray-600 mb-4">{error}</p>
          <button 
            onClick={fetchCoursesAndConfig}
            className="bg-gray-200 hover:bg-gray-300 text-gray-900 px-4 py-2 min-h-[44px] font-medium rounded-lg transition-colors duration-200"
          >
            Tentar Novamente
          </button>
        </Card>
      </div>
    )
  }

  if (courses.length === 0) {
    return (
      <div className="mb-32 text-center">
        <Card className="p-8 max-w-md mx-auto">
          <BookOpen className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Catálogo em construção</h3>
          <p className="text-gray-600">
            Novos cursos serão adicionados em breve. Acompanhe nossas atualizações!
          </p>
        </Card>
      </div>
    )
  }

  return (
    <div className="mb-32">
      <div className="text-center mb-8 animate-fade-in-up">
        <h2 className="text-3xl font-bold text-gray-900 mb-4">
          Catálogo de Cursos por Categoria
        </h2>
        <p className="text-gray-600">
          Explore nossos {courses.length} cursos organizados por área de conhecimento
        </p>
      </div>

      <div className="space-y-8">
        {Object.entries(organizedCourses).map(([categoria, data]) => {
          const categoryInfo = COURSE_CATEGORIES[categoria] || { 
            label: categoria, 
            color: 'bg-gray-100 text-gray-800 border-gray-200',
            icon: '📚'
          }
          const isExpanded = expandedCategories[categoria]
          const filteredData = getFilteredCourses(categoria)
          const searchTerm = searchTerms[categoria] || ''

          return (
            <Card key={categoria} className="overflow-hidden">
              {/* Category Header */}
              <div 
                className="p-6 border-b cursor-pointer hover:bg-gray-50 transition-colors"
                onClick={() => toggleCategory(categoria)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{categoryInfo.icon}</span>
                    <div>
                      <h3 className="text-xl font-semibold text-gray-900">
                        {categoryInfo.label}
                      </h3>
                      <p className="text-sm text-gray-600">
                        {data.all.length} curso{data.all.length !== 1 ? 's' : ''} disponível{data.all.length !== 1 ? 'eis' : ''}
                        {searchTerm && ` (${filteredData.all.length} encontrado${filteredData.all.length !== 1 ? 's' : ''})`}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`px-3 py-1 rounded-full text-sm font-medium border ${categoryInfo.color}`}>
                      {categoryInfo.label}
                    </span>
                    {isExpanded ? (
                      <ChevronUp className="w-5 h-5 text-gray-400" />
                    ) : (
                      <ChevronDown className="w-5 h-5 text-gray-400" />
                    )}
                  </div>
                </div>
              </div>

              {/* Category Content - Expandable */}
              {isExpanded && (
                <div className="p-6">
                  {/* Search Bar with Autocomplete */}
                  <div className="mb-6">
                    <SearchAutocomplete
                      items={data.all}
                      value={searchTerm}
                      onChange={(value) => handleSearch(categoria, value)}
                      placeholder={`Buscar em ${categoryInfo.label}...`}
                      category={categoria}
                      categoryLabel={categoryInfo.label}
                    />
                  </div>

                  {/* Subcategories */}
                  <div className="space-y-4">
                    {Object.entries(filteredData.bySubcategory).map(([subcategoria, cursos]) => {
                      const subcategoryKey = `${categoria}_${subcategoria}`
                      const isSubExpanded = expandedSubcategories[subcategoryKey]
                      const itemsToShow = loadedItems[subcategoryKey] || ITEMS_PER_PAGE
                      const visibleCourses = cursos.slice(0, itemsToShow)
                      const hasMore = cursos.length > itemsToShow

                      return (
                        <div key={subcategoria} className="border border-gray-200 rounded-lg">
                          {/* Subcategory Header */}
                          <div
                            className="p-4 bg-gray-50 hover:bg-gray-100 cursor-pointer transition-colors flex items-center justify-between"
                            onClick={() => toggleSubcategory(categoria, subcategoria)}
                          >
                            <div className="flex items-center gap-2">
                              {isSubExpanded ? (
                                <ChevronDown className="w-4 h-4 text-gray-500" />
                              ) : (
                                <ChevronRight className="w-4 h-4 text-gray-500" />
                              )}
                              <h4 className="font-medium text-gray-900">
                                {subcategoria}
                              </h4>
                              <span className="text-sm text-gray-500">
                                ({cursos.length} curso{cursos.length !== 1 ? 's' : ''})
                              </span>
                            </div>
                          </div>

                          {/* Courses List */}
                          {isSubExpanded && (
                            <div className="p-4 space-y-3">
                              {/* Course Grid */}
                              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                {visibleCourses.map((curso) => (
                                  <div
                                    key={curso.id}
                                    className="border border-gray-200 rounded-lg hover:shadow-md hover:border-blue-300 transition-all duration-200 bg-white p-6"
                                  >
                                    {/* Course Title - Main Focus */}
                                    <h5 className="text-xl font-bold text-gray-900 mb-6 line-clamp-3 leading-relaxed">
                                      {curso.nome_curso}
                                    </h5>

                                    {/* Bottom Row - Button and Badge */}
                                    <div className="flex flex-col sm:flex-row gap-3">
                                      <a
                                        href={generateWhatsAppUrl(curso.nome_curso, categoria, subcategoria)}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700 text-white px-4 py-2.5 text-sm rounded-lg font-medium transition-colors duration-200"
                                      >
                                        <MessageCircle className="w-4 h-4" />
                                        WhatsApp
                                      </a>
                                      
                                      {/* MEC Badge - Informational Tag Style */}
                                      <div className="relative bg-gray-100 border-2 border-blue-200 text-blue-800 px-3 py-2 rounded-full flex items-center gap-1.5 text-xs font-semibold">
                                        <span className="text-[10px]">🏛️</span>
                                        <span className="whitespace-nowrap">Reconhecido pelo MEC</span>
                                        {/* Decorative corner ribbon effect */}
                                        <div className="absolute -top-1 -right-1 w-3 h-3 bg-blue-600 rounded-full flex items-center justify-center">
                                          <span className="text-[8px] text-white">✓</span>
                                        </div>
                                      </div>
                                    </div>
                                  </div>
                                ))}
                              </div>

                              {/* Load More Button */}
                              {hasMore && (
                                <div className="text-center pt-4">
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation()
                                      loadMoreCourses(categoria, subcategoria)
                                    }}
                                    className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-medium transition-colors duration-200"
                                  >
                                    Carregar mais {Math.min(ITEMS_PER_PAGE, cursos.length - itemsToShow)} cursos
                                  </button>
                                  <p className="text-sm text-gray-500 mt-2">
                                    Mostrando {visibleCourses.length} de {cursos.length} cursos
                                  </p>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      )
                    })}
                  </div>

                  {/* No results message */}
                  {filteredData.all.length === 0 && (
                    <div className="text-center py-8">
                      <p className="text-gray-500">
                        Nenhum curso encontrado para "{searchTerm}"
                      </p>
                    </div>
                  )}
                </div>
              )}
            </Card>
          )
        })}
      </div>

      {/* Footer Info */}
      <div className="text-center mt-8 p-4 bg-blue-50 rounded-lg">
        <p className="text-sm text-blue-700">
          <MessageCircle className="w-4 h-4 inline mr-1" />
          Clique em "Mais Informações" para falar conosco via WhatsApp sobre qualquer curso
        </p>
      </div>
    </div>
  )
}