'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { Card, CardContent } from '@/components/ui/card'
import Button from '@/components/ui/button'
import { createClient } from '@/lib/supabase/client'
import { 
  Clock, 
  Users, 
  Star, 
  Play, 
  BookOpen,
  FileText,
  Type,
  Video,
  ChevronRight,
  Filter,
  ArrowRight
} from 'lucide-react'


const supabase = createClient()

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

export default function CourseCatalog() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [courses, setCourses] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedCategory, setSelectedCategory] = useState('all')

  useEffect(() => {
    loadCourses()
  }, [])

  useEffect(() => {
    // Sincronizar categoria com URL params
    const categoryFromUrl = searchParams.get('categoria') || 'all'
    setSelectedCategory(categoryFromUrl)
  }, [searchParams])

  const loadCourses = async () => {
    try {
      const { data, error } = await supabase
        .from('courses')
        .select(`
          id,
          title,
          description,
          category,
          thumbnail_url,
          price,
          is_free,
          status,
          created_at,
          educational_hubs (name),
          profiles (full_name),
          lessons (id)
        `)
        .eq('status', 'published')
        .order('created_at', { ascending: false })
        .limit(50) // Limite para performance

      if (error) throw error

      // Calculate course stats
      const coursesWithStats = (data || []).map(course => ({
        ...course,
        lesson_count: course.lessons?.length || 0,
        teacher_name: course.profiles?.full_name || 'Instrutor',
        hub_name: course.educational_hubs?.name || 'EduPlatform'
      }))

      setCourses(coursesWithStats)
    } catch (error) {
      console.error('Error loading courses:', error)
      setCourses([]) // Fallback para array vazio
    } finally {
      setLoading(false)
    }
  }

  const getContentTypeIcon = (course) => {
    // Determine primary content type based on lessons
    if (course.lessons && course.lessons.length > 0) {
      return <Video className="w-4 h-4" />
    }
    return <BookOpen className="w-4 h-4" />
  }

  const formatPrice = (price, isFree) => {
    if (isFree) return 'Gratuito'
    return `R$ ${parseFloat(price).toFixed(2).replace('.', ',')}`
  }

  const handleCategoryChange = (category) => {
    setSelectedCategory(category)
    
    // Atualizar URL sem recarregar a página
    const newSearchParams = new URLSearchParams(searchParams)
    if (category === 'all') {
      newSearchParams.delete('categoria')
    } else {
      newSearchParams.set('categoria', category)
    }
    
    const newUrl = newSearchParams.toString() ? `/?${newSearchParams.toString()}` : '/'
    router.replace(newUrl, { scroll: false })
  }

  const filteredCourses = selectedCategory === 'all' 
    ? courses 
    : courses.filter(course => course.category === selectedCategory)

  const displayedCourses = filteredCourses.slice(0, 6)

  const categories = Object.keys(COURSE_CATEGORIES).filter(key => 
    courses.some(course => course.category === key)
  )

  if (loading) {
    return (
      <div className="mb-32">
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">
            Cursos Recentes
          </h2>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Descubra nossa seleção de cursos de alta qualidade
          </p>
        </div>
        
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Carregando cursos...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="mb-32">
      {/* Header */}
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold text-gray-900 mb-4">
          Cursos Recentes
        </h2>
        <p className="text-xl text-gray-600 max-w-2xl mx-auto mb-2">
          Descubra nossa seleção de cursos de alta qualidade, 
          desde capacitação profissional até pós-graduação
        </p>
        {selectedCategory !== 'all' && filteredCourses.length > 0 && (
          <p className="text-sm text-blue-600 font-medium">
            {filteredCourses.length} curso{filteredCourses.length !== 1 ? 's' : ''} em {COURSE_CATEGORIES[selectedCategory]?.label}
          </p>
        )}
      </div>

      {/* Category Filter */}
      {categories.length > 0 && (
        <div className="mb-8">
          {/* Current Category Breadcrumb */}
          {selectedCategory !== 'all' && (
            <div className="flex items-center justify-center gap-2 mb-4 text-sm text-gray-600">
              <button
                onClick={() => handleCategoryChange('all')}
                className="hover:text-blue-600 transition-colors"
              >
                Todos os Cursos
              </button>
              <ChevronRight className="w-3 h-3" />
              <span className="text-blue-600 font-medium flex items-center gap-1">
                <span>{COURSE_CATEGORIES[selectedCategory]?.icon}</span>
                {COURSE_CATEGORIES[selectedCategory]?.label}
              </span>
            </div>
          )}
          
          {/* Category Buttons */}
          <div className="flex flex-wrap justify-center gap-2 max-w-full overflow-hidden">
            <button
              onClick={() => handleCategoryChange('all')}
              className={`px-3 sm:px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 flex items-center gap-2 min-h-[44px] flex-shrink-0 ${
                selectedCategory === 'all'
                  ? 'bg-blue-600 text-white shadow-md transform scale-105'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200 hover:scale-105'
              }`}
            >
              <Filter className="w-4 h-4" />
              <span className="hidden sm:inline whitespace-nowrap">Todos os Cursos</span>
              <span className="sm:hidden">Todos</span>
            </button>
            {categories.map(category => (
              <button
                key={category}
                onClick={() => handleCategoryChange(category)}
                className={`px-3 sm:px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 flex items-center gap-2 min-h-[44px] flex-shrink-0 ${
                  selectedCategory === category
                    ? 'bg-blue-600 text-white shadow-md transform scale-105'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200 hover:scale-105'
                }`}
              >
                <span>{COURSE_CATEGORIES[category].icon}</span>
                <span className="whitespace-nowrap">{COURSE_CATEGORIES[category].label}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Course Grid */}
      {displayedCourses.length > 0 ? (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
            {displayedCourses.map((course) => (
              <Card key={course.id} className="hover:shadow-lg transition-shadow overflow-hidden">
                <div className="relative">
                  {/* Thumbnail */}
                  <div className="h-48 bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center">
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
                  </div>

                  {/* Category Badge */}
                  <div className="absolute top-3 left-3">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      COURSE_CATEGORIES[course.category]?.color || 'bg-gray-100 text-gray-800'
                    }`}>
                      {COURSE_CATEGORIES[course.category]?.label || course.category}
                    </span>
                  </div>

                  {/* Price Badge */}
                  <div className="absolute top-3 right-3">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      course.is_free 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-white text-gray-800 shadow-sm'
                    }`}>
                      {formatPrice(course.price, course.is_free)}
                    </span>
                  </div>
                </div>

                <CardContent className="p-6">
                  {/* Title */}
                  <h3 className="font-semibold text-gray-900 mb-2 line-clamp-2 leading-snug">
                    {course.title}
                  </h3>

                  {/* Description */}
                  <p className="text-gray-600 text-sm mb-4 line-clamp-2">
                    {course.description || 'Conheça mais sobre este curso e desenvolva suas habilidades profissionais.'}
                  </p>

                  {/* Course Info */}
                  <div className="flex items-center justify-between text-sm text-gray-500 mb-4">
                    <div className="flex items-center gap-4">
                      <div className="flex items-center gap-1">
                        <BookOpen className="w-3 h-3" />
                        <span>{course.lesson_count} aulas</span>
                      </div>
                      
                      <div className="flex items-center gap-1">
                        {getContentTypeIcon(course)}
                        <span>Online</span>
                      </div>
                    </div>
                  </div>

                  {/* Teacher & Hub */}
                  <div className="text-xs text-gray-500 mb-4">
                    <div>👨‍🏫 {course.teacher_name}</div>
                    <div>🏢 {course.hub_name}</div>
                  </div>

                  {/* Action Button */}
                  <Link href={`/courses/${course.id}`}>
                    <Button className="w-full flex items-center justify-center gap-2">
                      <Play className="w-4 h-4" />
                      {course.is_free ? 'Começar Grátis' : 'Ver Curso'}
                      <ChevronRight className="w-4 h-4" />
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            ))}
          </div>

        </>
      ) : (
        <div className="text-center py-12">
          <BookOpen className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            Nenhum curso encontrado
          </h3>
          <p className="text-gray-600 mb-4">
            {selectedCategory === 'all' 
              ? 'Ainda não há cursos publicados.'
              : `Não há cursos na categoria ${COURSE_CATEGORIES[selectedCategory]?.label}.`
            }
          </p>
          {selectedCategory !== 'all' && (
            <Button
              variant="outline"
              onClick={() => handleCategoryChange('all')}
              className="mt-2 max-w-full"
            >
              <span className="whitespace-nowrap">Explorar Catálogo</span>
            </Button>
          )}
        </div>
      )}

      {/* Botão Explorar Catálogo Completo */}
      {courses.length > 0 && (
        <div className="flex justify-center mt-8">
          <Link href={'/cursos'}>
            <Button 
              size="lg" 
              className="bg-green-600 hover:bg-green-700 text-white px-8 py-3 text-lg font-semibold shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-110 hover:-translate-y-2 inline-flex items-center gap-3"
            >
              <span>Explorar Catálogo Completo</span>
              <ArrowRight className="w-5 h-5 animate-bounce" />
            </Button>
          </Link>
        </div>
      )}

    </div>
  )
}