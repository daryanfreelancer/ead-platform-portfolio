'use client'

import { useState, useEffect } from 'react'
import { MessageCircle, BookOpen, ChevronDown, ChevronUp } from 'lucide-react'
import { Card } from '@/components/ui/card'

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

export default function CategorizedCourseCatalog() {
  const [courses, setCourses] = useState([])
  const [expandedCategories, setExpandedCategories] = useState({})
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

  const generateWhatsAppUrl = (courseName, courseCategory) => {
    if (!whatsappConfig) return '#'
    
    const categoryLabel = COURSE_CATEGORIES[courseCategory]?.label || courseCategory
    
    const message = whatsappConfig.whatsapp_message_template
      .replace('{CURSO_NOME}', courseName)
      .replace('{curso_nome}', courseName)
      .replace('{categoria}', categoryLabel)
      .replace('{CATEGORIA}', categoryLabel)
    const encodedMessage = encodeURIComponent(message)
    return `https://wa.me/55${whatsappConfig.whatsapp_number}?text=${encodedMessage}`
  }

  const toggleCategory = (categoria) => {
    setExpandedCategories(prev => ({
      ...prev,
      [categoria]: !prev[categoria]
    }))
  }

  // Organizar cursos por categoria
  const coursesByCategory = courses.reduce((acc, course) => {
    if (!acc[course.categoria]) {
      acc[course.categoria] = []
    }
    acc[course.categoria].push(course)
    return acc
  }, {})

  // Organizar subcategorias dentro de cada categoria
  const organizedCourses = Object.entries(coursesByCategory).map(([categoria, cursos]) => {
    const subcategorias = cursos.reduce((acc, curso) => {
      const sub = curso.subcategoria || 'Geral'
      if (!acc[sub]) {
        acc[sub] = []
      }
      acc[sub].push(curso)
      return acc
    }, {})

    return {
      categoria,
      subcategorias: Object.entries(subcategorias)
    }
  })

  if (loading) {
    return (
      <div className="mb-32">
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">Catálogo de Cursos por Categoria</h2>
          <p className="text-gray-600">Carregando cursos disponíveis...</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map(i => (
            <Card key={i} className="p-6">
              <div className="animate-pulse">
                <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                <div className="h-3 bg-gray-200 rounded w-1/2 mb-4"></div>
                <div className="h-8 bg-gray-200 rounded w-full"></div>
              </div>
            </Card>
          ))}
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
          Explore nossos cursos organizados por área de conhecimento
        </p>
      </div>

      <div className="space-y-8">
        {organizedCourses.map(({ categoria, subcategorias }, categoryIndex) => {
          const categoryInfo = COURSE_CATEGORIES[categoria] || { 
            label: categoria, 
            color: 'bg-gray-100 text-gray-800 border-gray-200',
            icon: '📚'
          }
          const isExpanded = expandedCategories[categoria]
          const totalCourses = subcategorias.reduce((total, [_, cursos]) => total + cursos.length, 0)

          return (
            <Card key={categoria} className={`animate-fade-in-up delay-${categoryIndex * 100}`}>
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
                        {totalCourses} curso{totalCourses !== 1 ? 's' : ''} disponível{totalCourses !== 1 ? 'eis' : ''}
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

              {/* Courses List - Expandable */}
              {isExpanded && (
                <div className="p-6 space-y-6">
                  {subcategorias.map(([subcategoria, cursos], subIndex) => (
                    <div key={subcategoria} className={`animate-fade-in-up delay-${subIndex * 50}`}>
                      {subcategorias.length > 1 && (
                        <h4 className="text-lg font-medium text-gray-800 mb-3 pb-2 border-b border-gray-100">
                          {subcategoria}
                        </h4>
                      )}
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {cursos.map((curso) => (
                          <div
                            key={curso.id}
                            className="p-4 border border-gray-200 rounded-lg hover:shadow-md hover:border-blue-300 transition-all duration-200"
                          >
                            <h5 className="font-medium text-gray-900 mb-2 line-clamp-2">
                              {curso.nome_curso}
                            </h5>
                            
                            {curso.subcategoria && subcategorias.length === 1 && (
                              <p className="text-xs text-gray-500 mb-3">
                                {curso.subcategoria}
                              </p>
                            )}

                            <a
                              href={generateWhatsAppUrl(curso.nome_curso, categoria)}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="w-full flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700 text-white px-3 py-2 text-sm rounded-lg font-medium transition-colors duration-200"
                            >
                              <MessageCircle className="w-4 h-4" />
                              Mais Informações
                            </a>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
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