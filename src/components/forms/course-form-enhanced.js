'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { FileUpload } from '@/components/ui/file-upload'
import { useCourseUpload } from '@/hooks/use-file-upload'
import Button from '@/components/ui/button'
import Input from '@/components/ui/input'
import Label from '@/components/ui/label'
import { Card } from '@/components/ui/card'
import { AlertCircle, Check, Upload, Play, Link, FileText, DollarSign, Building2, Download, BookOpen } from 'lucide-react'
import { COURSE_CATEGORIES, getCategoryOptions } from '@/lib/constants/course-categories'
import SieCourseImporter from '@/components/teacher/sie-course-importer'
import SieCourseCatalog from '@/components/teacher/sie-course-catalog'
import LessonManager from '@/components/teacher/lesson-manager'

const supabase = createClient()

export function CourseFormEnhanced({ user, course = null, mode = 'create' }) {
  const router = useRouter()
  const { uploadThumbnail, uploadCourseFile, error: uploadError, uploading } = useCourseUpload()
  const [userRole, setUserRole] = useState(null)
  
  const [formData, setFormData] = useState({
    title: course?.title || '',
    description: course?.description || '',
    category: course?.category || '',
    educational_hub_id: course?.educational_hub_id || '',
    duration: course?.duration || '',
    price: course?.price || 0,
    is_free: course?.is_free ?? true,
    video_type: course?.video_type || 'url',
    video_url: course?.video_url || '',
    thumbnail_url: course?.thumbnail_url || '',
    materials: course?.materials || []
  })

  const [hubs, setHubs] = useState([])
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState({ type: '', text: '' })
  const [showSieImporter, setShowSieImporter] = useState(false)
  const [showSieCatalog, setShowSieCatalog] = useState(false)
  const [courseId, setCourseId] = useState(course?.id || null)
  const [showLessonManager, setShowLessonManager] = useState(false)
  const [lessons, setLessons] = useState([])
  const [step, setStep] = useState(1) // 1: Course info, 2: Lessons
  const [sieApiEnabled, setSieApiEnabled] = useState(false)
  const [checkingSieStatus, setCheckingSieStatus] = useState(true)

  // Load educational hubs and check SIE API status on component mount
  useEffect(() => {
    loadEducationalHubs()
    checkSieApiStatus()
    loadUserRole()
    console.log('User in course form: ID:', user?.id?.substring(0, 8) + '..., Role:', user?.role || 'N/A')
  }, [])
  
  const loadUserRole = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single()
      
      if (!error && data) {
        setUserRole(data.role)
      }
    } catch (error) {
      console.error('Erro ao carregar role do usuário:', error)
    }
  }

  const checkSieApiStatus = async () => {
    try {
      setCheckingSieStatus(true)
      const response = await fetch('/api/sie/status')
      const data = await response.json()
      
      setSieApiEnabled(data.enabled || false)
    } catch (error) {
      console.error('Erro ao verificar status SIE:', error)
      setSieApiEnabled(false)
    } finally {
      setCheckingSieStatus(false)
    }
  }

  const loadEducationalHubs = async () => {
    try {
      const { data, error } = await supabase
        .from('educational_hubs')
        .select('*')
        .eq('is_active', true)
        .order('name')
      
      if (error) throw error
      
      // Debug logging
      console.log('Educational hubs loaded:', data?.length || 0, 'hubs')
      if (data && data.length === 0) {
        console.warn('No active educational hubs found! This might be a database issue.')
      }
      
      setHubs(data || [])
    } catch (error) {
      console.error('Erro ao carregar polos:', error)
    }
  }

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target
    
    if (type === 'checkbox') {
      setFormData(prev => ({
        ...prev,
        [name]: checked,
        // Reset price if course is free
        ...(name === 'is_free' && checked ? { price: 0 } : {})
      }))
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }))
    }
  }

  const handleThumbnailUpload = async (uploadResult) => {
    console.log('=== CALLBACK THUMBNAIL UPLOAD ===', {
      fileName: uploadResult?.fileName || 'N/A',
      fileSize: uploadResult?.fileSize || 0,
      success: !!uploadResult?.publicUrl
    })
    setFormData(prev => ({
      ...prev,
      thumbnail_url: uploadResult.publicUrl
    }))
    setMessage({
      type: 'success',
      text: 'Thumbnail carregado com sucesso!'
    })
    setTimeout(() => setMessage({ type: '', text: '' }), 3000)
  }

  const handleMaterialUpload = async (uploadResult) => {
    const newMaterial = {
      name: uploadResult.fileName || 'Material',
      url: uploadResult.publicUrl,
      uploadedAt: new Date().toISOString()
    }
    
    setFormData(prev => ({
      ...prev,
      materials: [...(prev.materials || []), newMaterial]
    }))
    
    setMessage({
      type: 'success',
      text: 'Material adicionado com sucesso!'
    })
    setTimeout(() => setMessage({ type: '', text: '' }), 3000)
  }

  const handleRemoveMaterial = (index) => {
    setFormData(prev => ({
      ...prev,
      materials: prev.materials.filter((_, i) => i !== index)
    }))
  }

  // Nota: Upload de vídeo para cursos foi movido para o sistema de aulas
  // Os vídeos de curso serão adicionados como primeira aula automaticamente

  const handleUploadError = (errorMessage) => {
    console.log('=== CALLBACK UPLOAD ERROR ===', errorMessage)
    setMessage({
      type: 'error',
      text: errorMessage
    })
    setTimeout(() => setMessage({ type: '', text: '' }), 5000)
  }

  const validateForm = () => {
    // Limpar mensagem anterior
    setMessage({ type: '', text: '' })
    
    // Validações básicas
    if (!formData.title.trim()) {
      setMessage({ type: 'error', text: 'Título é obrigatório' })
      return false
    }
    
    if (formData.title.trim().length < 5) {
      setMessage({ type: 'error', text: 'Título deve ter pelo menos 5 caracteres' })
      return false
    }
    
    if (!formData.description.trim()) {
      setMessage({ type: 'error', text: 'Descrição é obrigatória' })
      return false
    }
    
    if (formData.description.trim().length < 20) {
      setMessage({ type: 'error', text: 'Descrição deve ter pelo menos 20 caracteres' })
      return false
    }
    
    if (!formData.category) {
      setMessage({ type: 'error', text: 'Categoria é obrigatória' })
      return false
    }
    
    if (!formData.duration || formData.duration <= 0) {
      setMessage({ type: 'error', text: 'Duração deve ser maior que zero' })
      return false
    }
    
    if (formData.duration > 1000) {
      setMessage({ type: 'error', text: 'Duração não pode exceder 1000 horas' })
      return false
    }
    
    // Validação de preço
    if (!formData.is_free && (!formData.price || formData.price <= 0)) {
      setMessage({ type: 'error', text: 'Preço deve ser maior que zero para cursos pagos' })
      return false
    }
    
    if (!formData.is_free && formData.price > 10000) {
      setMessage({ type: 'error', text: 'Preço não pode exceder R$ 10.000,00' })
      return false
    }
    
    // Validação de vídeo (opcional)
    if (formData.video_url && formData.video_url.trim()) {
      const url = formData.video_url.trim()
      
      // Validação melhorada para URLs de vídeo
      try {
        const validUrl = new URL(url.startsWith('http') ? url : `https://${url}`)
        
        // Verifica se é uma URL válida e aceita domínios conhecidos
        const allowedDomains = [
          'youtube.com', 'www.youtube.com', 'youtu.be',
          'vimeo.com', 'www.vimeo.com',
          'drive.google.com', 'docs.google.com'
        ]
        
        const isVideoFile = /\.(mp4|avi|mov|wmv|flv|webm)(\?.*)?$/i.test(validUrl.pathname)
        const isAllowedDomain = allowedDomains.some(domain => validUrl.hostname.includes(domain))
        
        if (!isVideoFile && !isAllowedDomain) {
          setMessage({ 
            type: 'error', 
            text: 'URL deve ser do YouTube, Vimeo, Google Drive ou link direto de vídeo (.mp4, .mov, etc.)' 
          })
          return false
        }
      } catch {
        setMessage({ 
          type: 'error', 
          text: 'URL inválida. Use URLs como: https://youtube.com/watch?v=abc123 ou https://vimeo.com/123456' 
        })
        return false
      }
    }
    
    // Nota: Para cursos com upload de vídeo, o arquivo será adicionado como primeira aula
    // Esta validação será tratada no gerenciador de aulas
    
    return true
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (!validateForm()) return

    setLoading(true)
    setMessage({ type: '', text: '' })

    try {
      const courseData = {
        title: formData.title.trim(),
        description: formData.description.trim(),
        category: formData.category,
        educational_hub_id: formData.educational_hub_id || null,
        duration: parseInt(formData.duration),
        price: formData.is_free ? 0 : parseFloat(formData.price),
        is_free: formData.is_free,
        video_type: formData.video_url ? 'url' : null,
        video_url: formData.video_url ? formData.video_url.trim() : null,
        thumbnail_url: formData.thumbnail_url || null,
        teacher_id: user.id,
        status: 'pending' // Aguardando aprovação do admin
      }

      if (mode === 'create') {
        const { data, error } = await supabase
          .from('courses')
          .insert([courseData])
          .select()
          .single()

        if (error) throw error

        setCourseId(data.id)
        setMessage({
          type: 'success',
          text: 'Curso criado com sucesso! Agora você pode adicionar aulas ao curso.'
        })

        // Mostrar o gerenciador de aulas
        setStep(2)
        setShowLessonManager(true)

      } else {
        const { error } = await supabase
          .from('courses')
          .update(courseData)
          .eq('id', course.id)
          .eq('teacher_id', user.id) // Garantir que só pode editar próprios cursos

        if (error) throw error

        setMessage({
          type: 'success',
          text: 'Curso atualizado com sucesso!'
        })

        setTimeout(() => {
          // Redirecionar baseado no role do usuário
          if (userRole === 'admin') {
            router.push('/administrador/cursos')
          } else {
            router.push('/professor')
          }
        }, 2000)
      }

    } catch (error) {
      console.error('Erro ao salvar curso:', error)
      setMessage({
        type: 'error',
        text: `Erro ao ${mode === 'create' ? 'criar' : 'atualizar'} curso: ${error.message}`
      })
    } finally {
      setLoading(false)
    }
  }

  const categoryOptions = getCategoryOptions()

  // Callback quando um curso SIE é importado
  const handleSieImport = (importedCourse) => {
    // Redirecionar para a página de edição do curso importado baseado no role
    if (userRole === 'admin') {
      router.push('/administrador/cursos')
    } else {
      router.push(`/professor/cursos/${importedCourse.id}/editar`)
    }
  }

  // Callback para quando as aulas são atualizadas
  const handleLessonsChange = (updatedLessons) => {
    setLessons(updatedLessons)
  }

  // Função para finalizar criação do curso
  const handleFinishCourse = async () => {
    setLoading(true)
    
    try {
      // Publicar o curso automaticamente
      const { error } = await supabase
        .from('courses')
        .update({ status: 'published' })
        .eq('id', courseId)
        .eq('teacher_id', user.id)

      if (error) throw error

      setMessage({
        type: 'success',
        text: 'Curso criado e publicado com sucesso! Agora está disponível no catálogo.'
      })
      
      setTimeout(() => {
        // Redirecionar baseado no role do usuário
        if (userRole === 'admin') {
          router.push('/administrador/cursos')
        } else {
          router.push('/professor')
        }
      }, 2000)
    } catch (error) {
      console.error('Erro ao publicar curso:', error)
      setMessage({
        type: 'error',
        text: 'Erro ao publicar curso: ' + error.message
      })
    } finally {
      setLoading(false)
    }
  }

  // Se estiver mostrando o importador SIE
  if (showSieImporter) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-semibold">Importar Curso do Catálogo SIE</h2>
          <Button
            variant="secondary"
            onClick={() => setShowSieImporter(false)}
          >
            Voltar ao Formulário
          </Button>
        </div>
        <SieCourseImporter onImport={handleSieImport} />
      </div>
    )
  }

  // Se estiver mostrando o gerenciador de aulas
  if (showLessonManager && courseId) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-semibold">Gerenciar Aulas</h2>
            <p className="text-gray-600">Adicione e organize as aulas do seu curso</p>
          </div>
          <div className="flex items-center gap-3">
            <Button
              variant="secondary"
              onClick={() => setShowLessonManager(false)}
            >
              Voltar ao Curso
            </Button>
            <Button
              onClick={handleFinishCourse}
              disabled={loading}
              className="flex items-center gap-2"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  Publicando...
                </>
              ) : (
                <>
                  <Check className="w-4 h-4" />
                  Finalizar e Publicar
                </>
              )}
            </Button>
          </div>
        </div>

        <Card className="p-6">
          <div className="flex items-center gap-3 mb-4">
            <BookOpen className="w-5 h-5 text-blue-600" />
            <h3 className="text-lg font-medium">{formData.title}</h3>
          </div>
          
          <div className="text-sm text-gray-600 mb-6">
            <p><strong>Categoria:</strong> {COURSE_CATEGORIES[formData.category]?.label}</p>
            <p><strong>Duração:</strong> {formData.duration} horas</p>
            <p><strong>Preço:</strong> {formData.is_free ? 'Gratuito' : `R$ ${formData.price}`}</p>
            {lessons.length > 0 && (
              <p><strong>Aulas:</strong> {lessons.length} aula{lessons.length > 1 ? 's' : ''}</p>
            )}
          </div>

          <LessonManager
            courseId={courseId}
            userId={user.id}
            onLessonsChange={handleLessonsChange}
          />
        </Card>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      {/* Mensagem de feedback */}
      {message.text && (
        <div className={`p-4 rounded-lg flex items-center gap-3 ${
          message.type === 'success' 
            ? 'bg-green-50 text-green-700 border border-green-200' 
            : 'bg-red-50 text-red-700 border border-red-200'
        }`}>
          {message.type === 'success' ? (
            <Check className="w-5 h-5" />
          ) : (
            <AlertCircle className="w-5 h-5" />
          )}
          <span>{message.text}</span>
        </div>
      )}

      {/* Botões de ação no topo */}
      <div className="flex flex-col gap-4 max-w-full overflow-hidden">
        {/* Botões para importar do catálogo SIE */}
        {mode === 'create' && (
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full flex-wrap">
            <Button
              type="button"
              variant="secondary"
              onClick={() => setShowSieImporter(true)}
              disabled={checkingSieStatus || !sieApiEnabled}
              className="flex items-center justify-center gap-2 min-h-[44px] w-full sm:w-auto flex-shrink-0"
              title={!sieApiEnabled ? 'API SIE está pausada' : 'Importar curso específico do SIE'}
            >
              <Download className="w-4 h-4" />
              <span className="hidden sm:inline whitespace-nowrap">{checkingSieStatus ? 'Verificando...' : 'Importar Curso SIE'}</span>
              <span className="sm:hidden">{checkingSieStatus ? 'Verificando...' : 'Importar SIE'}</span>
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => setShowSieCatalog(true)}
              disabled={checkingSieStatus || !sieApiEnabled}
              className="flex items-center justify-center gap-2 min-h-[44px] w-full sm:w-auto flex-shrink-0"
              title={!sieApiEnabled ? 'API SIE está pausada' : 'Navegar no catálogo completo do SIE'}
            >
              <BookOpen className="w-4 h-4" />
              <span className="hidden sm:inline whitespace-nowrap">{checkingSieStatus ? 'Verificando...' : 'Catálogo Completo'}</span>
              <span className="sm:hidden">{checkingSieStatus ? 'Verificando...' : 'Catálogo'}</span>
            </Button>
            {!sieApiEnabled && !checkingSieStatus && (
              <div className="text-xs text-red-600 text-center sm:text-left w-full sm:w-auto">
                API SIE pausada
              </div>
            )}
          </div>
        )}
        
        {/* Botão para gerenciar aulas (modo edição) */}
        {mode === 'edit' && courseId && (
          <div className="flex justify-start">
            <Button
              type="button"
              variant="secondary"
              onClick={() => setShowLessonManager(true)}
              className="flex items-center justify-center gap-2 min-h-[44px] w-full sm:w-auto"
            >
              <BookOpen className="w-4 h-4" />
              Gerenciar Aulas
            </Button>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Seção do Thumbnail */}
        <Card className="p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            Imagem do Curso
          </h2>
          
          <div className="space-y-4">
            {formData.thumbnail_url ? (
              <div className="relative">
                <img
                  src={formData.thumbnail_url}
                  alt="Thumbnail do curso"
                  className="w-full h-40 object-cover rounded-lg"
                />
                <button
                  type="button"
                  onClick={() => setFormData(prev => ({ ...prev, thumbnail_url: '' }))}
                  className="absolute top-2 right-2 bg-red-500 text-white p-1 rounded-full hover:bg-red-600 min-w-[44px] min-h-[44px] flex items-center justify-center"
                >
                  <AlertCircle className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                <FileUpload
                  bucket="public-assets"
                  path={`thumbnails/${user?.id || 'anonymous'}`}
                  accept="image/*"
                  maxSize={10 * 1024 * 1024} // 10MB
                  onUpload={handleThumbnailUpload}
                  onError={handleUploadError}
                  className="h-40"
                />
                
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-2 mt-8">
                  <p className="text-xs text-blue-800 font-medium mb-1">
                    📐 Orientações:
                  </p>
                  <div className="text-xs text-blue-700 leading-tight">
                    <p>• 1200x675px (16:9) • JPG/PNG/WebP • Máx. 10MB</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </Card>

        {/* Seção de Informações Básicas */}
        <Card className="p-6 lg:col-span-2">
          <h2 className="text-xl font-semibold text-gray-900 mb-6">
            Informações do Curso
          </h2>
          
          <div className="space-y-6">
            <div>
              <Label htmlFor="title">Título do Curso *</Label>
              <Input
                id="title"
                name="title"
                type="text"
                value={formData.title}
                onChange={handleInputChange}
                placeholder="Ex: Introdução ao JavaScript"
                required
                maxLength={100}
                className="min-h-[44px]"
              />
            </div>

            <div>
              <Label htmlFor="description">Descrição *</Label>
              <textarea
                id="description"
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                placeholder="Descreva o que os alunos irão aprender neste curso..."
                required
                rows={4}
                maxLength={1000}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-black min-h-[44px]"
              />
              <p className="text-sm text-gray-500 mt-1">
                {formData.description.length}/1000 caracteres
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <Label htmlFor="category">Categoria *</Label>
                <select
                  id="category"
                  name="category"
                  value={formData.category}
                  onChange={handleInputChange}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-black min-h-[44px]"
                >
                  <option value="">Selecione uma categoria</option>
                  {categoryOptions.map(option => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
                {formData.category && COURSE_CATEGORIES[formData.category] && (
                  <p className="text-sm text-gray-500 mt-1">
                    {COURSE_CATEGORIES[formData.category].icon} Duração típica: {COURSE_CATEGORIES[formData.category].duration}
                  </p>
                )}
              </div>

              <div>
                <Label htmlFor="duration">Duração (em horas) *</Label>
                <Input
                  id="duration"
                  name="duration"
                  type="number"
                  value={formData.duration}
                  onChange={handleInputChange}
                  placeholder="Ex: 40"
                  required
                  min="1"
                  max="1000"
                  className="min-h-[44px]"
                />
                <p className="text-sm text-gray-500 mt-1">
                  {formData.duration ? `${formData.duration} horas` : ''}
                </p>
              </div>
            </div>
          </div>
        </Card>
      </div>

      {/* Seção de Polo e Preço */}
      <Card className="p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-6">
          Configurações Institucionais e Preço
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Polo Educacional */}
          <div>
            <Label htmlFor="educational_hub_id">
              <Building2 className="inline w-4 h-4 mr-1" />
              Polo Educacional (Opcional)
            </Label>
            <select
              id="educational_hub_id"
              name="educational_hub_id"
              value={formData.educational_hub_id}
              onChange={handleInputChange}
              className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-black min-h-[44px]"
            >
              <option value="">Sem polo específico</option>
              {hubs.map(hub => (
                <option key={hub.id} value={hub.id}>
                  {hub.name}
                </option>
              ))}
            </select>
            <p className="text-sm text-gray-500 mt-1">
              Associe o curso a uma instituição parceira
            </p>
          </div>

          {/* Configuração de Preço */}
          <div>
            <Label>
              <DollarSign className="inline w-4 h-4 mr-1" />
              Configuração de Preço
            </Label>
            
            <div className="mt-2 space-y-3">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  name="is_free"
                  checked={formData.is_free}
                  onChange={handleInputChange}
                  className="mr-2"
                />
                <span className="text-sm font-medium">Curso Gratuito</span>
              </label>
              
              {!formData.is_free && (
                <div>
                  <Label htmlFor="price">Preço (R$)</Label>
                  <Input
                    id="price"
                    name="price"
                    type="number"
                    value={formData.price}
                    onChange={handleInputChange}
                    placeholder="0,00"
                    min="0.01"
                    step="0.01"
                    required={!formData.is_free}
                    className="min-h-[44px]"
                  />
                  <p className="text-sm text-gray-500 mt-1">
                    Valor que será cobrado dos alunos
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </Card>

      {/* Seção de Vídeo */}
      <Card className="p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-6">
          Conteúdo do Curso
        </h2>

        <div className="space-y-6">
          {/* URL do vídeo principal do curso */}
          <div>
            <Label htmlFor="video_url">URL do Vídeo Principal (Opcional)</Label>
            <Input
              id="video_url"
              name="video_url"
              type="url"
              value={formData.video_url}
              onChange={handleInputChange}
              placeholder="https://www.youtube.com/watch?v=..."
              className="min-h-[44px]"
            />
            <p className="text-sm text-gray-500 mt-1">
              Suporte para YouTube, Vimeo e links diretos de vídeo. Este será o vídeo de apresentação do curso.
            </p>
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mt-2">
              <p className="text-xs text-blue-800 font-medium mb-1">💡 Dica:</p>
              <p className="text-xs text-blue-700">O vídeo principal é opcional. Você pode adicionar vídeos específicos para cada aula no gerenciador de aulas.</p>
            </div>
          </div>
        </div>
      </Card>

      {/* Seção de Materiais do Curso */}
      <Card className="p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-6">
          Materiais do Curso (Opcional)
        </h2>
        
        <div className="space-y-4">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <p className="text-sm text-blue-800 font-medium mb-2">
              📚 Adicione materiais de apoio ao seu curso
            </p>
            <p className="text-xs text-blue-700">
              • Apostilas em PDF • Exercícios práticos • Slides de apresentação • Códigos de exemplo • Documentos de apoio
            </p>
          </div>
          
          {formData.materials && formData.materials.length > 0 && (
            <div className="space-y-2">
              <h3 className="text-sm font-medium text-gray-900">
                Materiais adicionados ({formData.materials.length}):
              </h3>
              {formData.materials.map((material, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-green-50 border border-green-200 rounded-lg">
                  <div className="flex items-center">
                    <FileText className="w-4 h-4 text-green-600 mr-2" />
                    <div>
                      <span className="text-sm text-green-900 font-medium">{material.name}</span>
                      <p className="text-xs text-green-700">Carregado com sucesso</p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleRemoveMaterial(index)}
                    className="text-red-600 hover:text-red-800 p-1 rounded"
                    title="Remover material"
                  >
                    <AlertCircle className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          )}
          
          <div className="pb-4">
            <FileUpload
              bucket="public-assets"
              path={`materials/${user.id}/${Date.now()}`}
              accept=".pdf,.doc,.docx,.ppt,.pptx,.xls,.xlsx,.txt,.zip"
              maxSize={50 * 1024 * 1024} // 50MB
              onUpload={handleMaterialUpload}
              onError={handleUploadError}
              className="h-32"
            >
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-gray-400 transition-colors cursor-pointer">
                <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                <p className="text-sm text-gray-600 font-medium">
                  Adicionar Material do Curso
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  Clique ou arraste arquivos aqui
                </p>
                <p className="text-xs text-gray-500">
                  PDF, Word, PowerPoint, Excel, ZIP (máx. 50MB)
                </p>
              </div>
            </FileUpload>
          </div>
        </div>
      </Card>

      {/* Botões de ação */}
      <div className="flex flex-col sm:flex-row justify-end gap-4">
        <Button
          type="button"
          variant="secondary"
          onClick={() => router.back()}
          disabled={loading}
          className="min-h-[44px] w-full sm:w-auto"
        >
          Cancelar
        </Button>
        
        <Button
          type="submit"
          disabled={loading || uploading}
          className="min-w-[120px] min-h-[44px] w-full sm:w-auto"
        >
          {loading ? (
            <div className="flex items-center gap-2">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
              <span>{mode === 'create' ? 'Criando...' : 'Salvando...'}</span>
            </div>
          ) : (
            mode === 'create' ? 'Criar Curso' : 'Salvar Alterações'
          )}
        </Button>
      </div>

      {/* SIE Course Catalog Modal */}
      {showSieCatalog && (
        <SieCourseCatalog
          onImport={handleSieImport}
          onClose={() => setShowSieCatalog(false)}
        />
      )}
    </form>
  )
}