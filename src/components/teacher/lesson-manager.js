'use client'

import { useState, useEffect, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import { FileUpload } from '@/components/ui/file-upload'
import { useCourseUpload } from '@/hooks/use-file-upload'
import Button from '@/components/ui/button'
import Input from '@/components/ui/input'
import Label from '@/components/ui/label'
import { Card } from '@/components/ui/card'
import { 
  AlertCircle, 
  Check, 
  Upload, 
  Play, 
  Link, 
  Plus, 
  Edit2, 
  Trash2, 
  GripVertical,
  Eye,
  EyeOff,
  Clock,
  Video,
  FileText,
  Type
} from 'lucide-react'

const supabase = createClient()

export default function LessonManager({ courseId, userId, onLessonsChange }) {
  const { uploadCourseFile, error: uploadError } = useCourseUpload()
  const [lessons, setLessons] = useState([])
  const [modules, setModules] = useState([])
  const [loading, setLoading] = useState(false)
  const [editingLesson, setEditingLesson] = useState(null)
  const [editingModule, setEditingModule] = useState(null)
  const [showAddForm, setShowAddForm] = useState(false)
  const [showAddModuleForm, setShowAddModuleForm] = useState(false)
  const [message, setMessage] = useState({ type: '', text: '' })
  const [activeTab, setActiveTab] = useState('modules') // 'modules' ou 'lessons'

  // Refs para scroll automático
  const lessonFormRef = useRef(null)
  const moduleFormRef = useRef(null)

  // Função para scroll suave até o formulário
  const scrollToForm = (ref) => {
    setTimeout(() => {
      ref.current?.scrollIntoView({
        behavior: 'smooth',
        block: 'start',
        inline: 'nearest'
      })
    }, 100) // Pequeno delay para garantir que o formulário seja renderizado
  }

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    content_type: 'video',
    video_type: 'upload',
    video_url: '',
    video_file_url: '',
    pdf_file_url: '',
    text_content: '',
    duration: '',
    is_free_preview: false,
    module_id: ''
  })

  const [moduleFormData, setModuleFormData] = useState({
    title: '',
    description: ''
  })

  useEffect(() => {
    loadLessons()
    loadModules()
  }, [courseId])

  const loadLessons = async () => {
    try {
      const { data, error } = await supabase
        .from('lessons')
        .select('*')
        .eq('course_id', courseId)
        .order('order_index')
      
      if (error) throw error
      setLessons(data || [])
      onLessonsChange?.(data || [])
    } catch (error) {
      console.error('Erro ao carregar aulas:', error)
      setMessage({ type: 'error', text: 'Erro ao carregar aulas' })
    }
  }

  const loadModules = async () => {
    try {
      const { data, error } = await supabase
        .from('course_modules')
        .select('*')
        .eq('course_id', courseId)
        .order('order_index')
      
      if (error) throw error
      setModules(data || [])
    } catch (error) {
      console.error('Erro ao carregar módulos:', error)
      setMessage({ type: 'error', text: 'Erro ao carregar módulos' })
    }
  }

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      content_type: 'video',
      video_type: 'upload',
      video_url: '',
      video_file_url: '',
      pdf_file_url: '',
      text_content: '',
      duration: '',
      is_free_preview: false,
      module_id: ''
    })
    setEditingLesson(null)
    setShowAddForm(false)
  }

  const resetModuleForm = () => {
    setModuleFormData({
      title: '',
      description: ''
    })
    setEditingModule(null)
    setShowAddModuleForm(false)
  }

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target
    
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }))
  }

  const handleVideoUpload = async (uploadResult) => {
    setFormData(prev => ({
      ...prev,
      video_file_url: uploadResult.path,
      video_type: 'upload'
    }))
    
    setMessage({
      type: 'success',
      text: 'Vídeo carregado com sucesso!'
    })
    setTimeout(() => setMessage({ type: '', text: '' }), 3000)
  }

  const handlePDFUpload = async (uploadResult) => {
    setFormData(prev => ({
      ...prev,
      pdf_file_url: uploadResult.path,
      content_type: 'pdf'
    }))
    
    setMessage({
      type: 'success',
      text: 'PDF carregado com sucesso!'
    })
    setTimeout(() => setMessage({ type: '', text: '' }), 3000)
  }

  const handleUploadError = (errorMessage) => {
    setMessage({
      type: 'error',
      text: errorMessage
    })
    setTimeout(() => setMessage({ type: '', text: '' }), 5000)
  }

  const validateForm = () => {
    if (!formData.title.trim()) {
      setMessage({ type: 'error', text: 'Título da aula é obrigatório' })
      return false
    }
    if (!formData.duration || formData.duration <= 0) {
      setMessage({ type: 'error', text: 'Duração deve ser maior que zero' })
      return false
    }
    
    // Validate based on content type
    if (formData.content_type === 'video') {
      if (formData.video_type === 'url' && !formData.video_url.trim()) {
        setMessage({ type: 'error', text: 'URL do vídeo é obrigatória' })
        return false
      }
      if (formData.video_type === 'upload' && !formData.video_file_url && !editingLesson) {
        setMessage({ type: 'error', text: 'Faça upload do vídeo' })
        return false
      }
    } else if (formData.content_type === 'pdf') {
      if (!formData.pdf_file_url && !editingLesson) {
        setMessage({ type: 'error', text: 'Faça upload do PDF' })
        return false
      }
    } else if (formData.content_type === 'text') {
      if (!formData.text_content.trim()) {
        setMessage({ type: 'error', text: 'Conteúdo de texto é obrigatório' })
        return false
      }
    }
    
    return true
  }

  // Funções para gerenciar módulos
  const handleModuleSubmit = async (e) => {
    e.preventDefault()
    
    if (!moduleFormData.title.trim()) {
      setMessage({ type: 'error', text: 'Título do módulo é obrigatório' })
      return
    }

    setLoading(true)
    setMessage({ type: '', text: '' })

    try {
      const nextOrderIndex = editingModule 
        ? editingModule.order_index 
        : Math.max(...modules.map(m => m.order_index), 0) + 1

      const moduleData = {
        title: moduleFormData.title.trim(),
        description: moduleFormData.description.trim(),
        course_id: courseId,
        order_index: nextOrderIndex
      }

      if (editingModule) {
        const { error } = await supabase
          .from('course_modules')
          .update(moduleData)
          .eq('id', editingModule.id)

        if (error) throw error
        setMessage({ type: 'success', text: 'Módulo atualizado com sucesso!' })
      } else {
        const { error } = await supabase
          .from('course_modules')
          .insert([moduleData])

        if (error) throw error
        setMessage({ type: 'success', text: 'Módulo criado com sucesso!' })
      }

      await loadModules()
      resetModuleForm()
    } catch (error) {
      console.error('Erro ao salvar módulo:', error)
      setMessage({ type: 'error', text: 'Erro ao salvar módulo' })
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteModule = async (moduleId) => {
    if (!window.confirm('Tem certeza que deseja deletar este módulo? As aulas do módulo não serão deletadas.')) {
      return
    }

    try {
      const { error } = await supabase
        .from('course_modules')
        .delete()
        .eq('id', moduleId)

      if (error) throw error
      
      setMessage({ type: 'success', text: 'Módulo deletado com sucesso!' })
      await loadModules()
      await loadLessons() // Recarregar aulas para atualizar referências
    } catch (error) {
      console.error('Erro ao deletar módulo:', error)
      setMessage({ type: 'error', text: 'Erro ao deletar módulo' })
    }
  }

  const handleEditModule = (module) => {
    setModuleFormData({
      title: module.title,
      description: module.description || ''
    })
    setEditingModule(module)
    setShowAddModuleForm(true)
    scrollToForm(moduleFormRef)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (!validateForm()) return

    setLoading(true)
    setMessage({ type: '', text: '' })

    try {
      const nextOrderIndex = editingLesson 
        ? editingLesson.order_index 
        : Math.max(...lessons.map(l => l.order_index), 0) + 1

      const lessonData = {
        title: formData.title.trim(),
        description: formData.description.trim(),
        content_type: formData.content_type,
        video_type: formData.content_type === 'video' ? formData.video_type : null,
        video_url: formData.content_type === 'video' && formData.video_type === 'url' ? formData.video_url.trim() : null,
        video_file_url: formData.content_type === 'video' && formData.video_type === 'upload' ? formData.video_file_url : null,
        pdf_file_url: formData.content_type === 'pdf' ? formData.pdf_file_url : null,
        text_content: formData.content_type === 'text' ? formData.text_content.trim() : null,
        duration: parseInt(formData.duration),
        is_free_preview: formData.is_free_preview,
        order_index: nextOrderIndex,
        module_id: formData.module_id || null
      }

      if (editingLesson) {
        const { error } = await supabase
          .from('lessons')
          .update(lessonData)
          .eq('id', editingLesson.id)
          .eq('course_id', courseId)

        if (error) throw error
        
        setMessage({ type: 'success', text: 'Aula atualizada com sucesso!' })
      } else {
        const { error } = await supabase
          .from('lessons')
          .insert([{ ...lessonData, course_id: courseId }])

        if (error) throw error
        
        setMessage({ type: 'success', text: 'Aula criada com sucesso!' })
      }

      resetForm()
      loadLessons()
      
    } catch (error) {
      console.error('Erro ao salvar aula:', error)
      setMessage({
        type: 'error',
        text: `Erro ao ${editingLesson ? 'atualizar' : 'criar'} aula: ${error.message}`
      })
    } finally {
      setLoading(false)
    }
  }

  const handleEdit = (lesson) => {
    setFormData({
      title: lesson.title || '',
      description: lesson.description || '',
      content_type: lesson.content_type || 'video',
      video_type: lesson.video_type || 'upload',
      video_url: lesson.video_url || '',
      video_file_url: lesson.video_file_url || '',
      pdf_file_url: lesson.pdf_file_url || '',
      text_content: lesson.text_content || '',
      duration: lesson.duration || '',
      is_free_preview: lesson.is_free_preview || false,
      module_id: lesson.module_id || ''
    })
    setEditingLesson(lesson)
    setShowAddForm(true)
    scrollToForm(lessonFormRef)
  }

  const handleDelete = async (lessonId) => {
    if (!confirm('Tem certeza que deseja excluir esta aula?')) return

    try {
      const { error } = await supabase
        .from('lessons')
        .delete()
        .eq('id', lessonId)
        .eq('course_id', courseId)

      if (error) throw error
      
      setMessage({ type: 'success', text: 'Aula excluída com sucesso!' })
      loadLessons()
    } catch (error) {
      console.error('Erro ao excluir aula:', error)
      setMessage({ type: 'error', text: 'Erro ao excluir aula' })
    }
  }

  const handleReorder = async (lessonId, newIndex) => {
    try {
      const { error } = await supabase
        .from('lessons')
        .update({ order_index: newIndex })
        .eq('id', lessonId)

      if (error) throw error
      loadLessons()
    } catch (error) {
      console.error('Erro ao reordenar aula:', error)
    }
  }

  const moveLesson = (lessonId, direction) => {
    const currentIndex = lessons.findIndex(l => l.id === lessonId)
    const newIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1
    
    if (newIndex < 0 || newIndex >= lessons.length) return
    
    const currentLesson = lessons[currentIndex]
    const targetLesson = lessons[newIndex]
    
    handleReorder(currentLesson.id, targetLesson.order_index)
    handleReorder(targetLesson.id, currentLesson.order_index)
  }

  const formatDuration = (minutes) => {
    if (minutes < 60) return `${minutes} min`
    const hours = Math.floor(minutes / 60)
    const mins = minutes % 60
    return `${hours}h ${mins}min`
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Gerenciar Aulas e Módulos</h3>
        <div className="flex items-center gap-2">
          <Button
            onClick={() => {
              setShowAddModuleForm(true)
              scrollToForm(moduleFormRef)
            }}
            variant="outline"
            className="flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Criar Módulo
          </Button>
          <Button
            onClick={() => {
              setShowAddForm(true)
              scrollToForm(lessonFormRef)
            }}
            className="flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Adicionar Aula
          </Button>
        </div>
      </div>

      {/* Seção de Módulos */}
      {modules.length > 0 && (
        <Card className="p-4">
          <h4 className="font-medium mb-3">Módulos do Curso ({modules.length})</h4>
          <div className="grid gap-2">
            {modules.map((module, index) => (
              <div key={module.id} className="flex items-center justify-between p-2 bg-gray-50 rounded-lg">
                <div className="flex-1">
                  <span className="font-medium">{index + 1}. {module.title}</span>
                  {module.description && (
                    <p className="text-sm text-gray-600">{module.description}</p>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleEditModule(module)}
                  >
                    <Edit2 className="w-3 h-3" />
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleDeleteModule(module.id)}
                    className="text-red-600 hover:text-red-700"
                  >
                    <Trash2 className="w-3 h-3" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

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

      {/* Lista de aulas */}
      {lessons.length > 0 ? (
        <div className="space-y-3">
          {lessons.map((lesson, index) => (
            <Card key={lesson.id} className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3 flex-1">
                  <div className="flex items-center gap-2">
                    <GripVertical className="w-4 h-4 text-gray-400" />
                    <span className="text-sm font-medium text-gray-500">
                      {index + 1}
                    </span>
                  </div>
                  
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <h4 className="font-medium">{lesson.title}</h4>
                      {lesson.module_id && (
                        <span className="text-xs bg-purple-100 text-purple-800 px-2 py-1 rounded">
                          {modules.find(m => m.id === lesson.module_id)?.title || 'Módulo'}
                        </span>
                      )}
                      {lesson.is_free_preview && (
                        <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                          Preview
                        </span>
                      )}
                    </div>
                    
                    <div className="flex items-center gap-4 mt-1 text-sm text-gray-500">
                      <div className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {formatDuration(lesson.duration)}
                      </div>
                      <div className="flex items-center gap-1">
                        <Video className="w-3 h-3" />
                        {lesson.content_type === 'video' 
                          ? (lesson.video_type === 'upload' ? 'Vídeo Upload' : 'Vídeo URL')
                          : lesson.content_type === 'pdf' 
                            ? 'PDF'
                            : lesson.content_type === 'text'
                              ? 'Texto'
                              : 'Conteúdo'
                        }
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => moveLesson(lesson.id, 'up')}
                    disabled={index === 0}
                  >
                    ↑
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => moveLesson(lesson.id, 'down')}
                    disabled={index === lessons.length - 1}
                  >
                    ↓
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleEdit(lesson)}
                  >
                    <Edit2 className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDelete(lesson.id)}
                    className="text-red-600 hover:text-red-700"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
              
              {lesson.description && (
                <p className="text-sm text-gray-600 mt-2 ml-9">
                  {lesson.description}
                </p>
              )}
            </Card>
          ))}
        </div>
      ) : (
        <div className="text-center py-8 text-gray-500">
          <Video className="w-12 h-12 mx-auto mb-4 text-gray-300" />
          <p>Nenhuma aula criada ainda.</p>
          <p className="text-sm">Adicione aulas para estruturar seu curso.</p>
        </div>
      )}

      {/* Formulário de adicionar/editar aula */}
      {showAddForm && (
        <Card ref={lessonFormRef} className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h4 className="text-lg font-semibold">
              {editingLesson ? 'Editar Aula' : 'Nova Aula'}
            </h4>
            <Button
              variant="ghost"
              onClick={resetForm}
            >
              ✕
            </Button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <Label htmlFor="title">Título da Aula *</Label>
              <Input
                id="title"
                name="title"
                value={formData.title}
                onChange={handleInputChange}
                placeholder="Ex: Introdução aos Conceitos Básicos"
                required
              />
            </div>

            <div>
              <Label htmlFor="module_id">Módulo (Opcional)</Label>
              <select
                id="module_id"
                name="module_id"
                value={formData.module_id}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">Sem módulo específico</option>
                {modules.map(module => (
                  <option key={module.id} value={module.id}>
                    {module.title}
                  </option>
                ))}
              </select>
              {modules.length === 0 && (
                <p className="text-sm text-gray-500 mt-1">
                  Nenhum módulo criado ainda. As aulas ficarão sem organização por módulos.
                </p>
              )}
            </div>

            <div>
              <Label htmlFor="description">Descrição (Opcional)</Label>
              <textarea
                id="description"
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                placeholder="Descreva o conteúdo desta aula..."
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-black"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="duration">Duração (em minutos) *</Label>
                <Input
                  id="duration"
                  name="duration"
                  type="number"
                  value={formData.duration}
                  onChange={handleInputChange}
                  placeholder="Ex: 15"
                  min="1"
                  required
                />
              </div>
              
              <div>
                <Label>
                  <input
                    type="checkbox"
                    name="is_free_preview"
                    checked={formData.is_free_preview}
                    onChange={handleInputChange}
                    className="mr-2"
                  />
                  Aula de preview gratuita
                </Label>
                <p className="text-sm text-gray-500 mt-1">
                  Permite visualização sem matrícula
                </p>
              </div>
            </div>

            {/* Content Type Selection */}
            <div>
              <Label>Tipo de Conteúdo *</Label>
              <div className="mt-2 space-y-2">
                <label className="flex items-center">
                  <input
                    type="radio"
                    name="content_type"
                    value="video"
                    checked={formData.content_type === 'video'}
                    onChange={handleInputChange}
                    className="mr-3"
                  />
                  <Video className="w-4 h-4 mr-2" />
                  Vídeo
                </label>
                <label className="flex items-center">
                  <input
                    type="radio"
                    name="content_type"
                    value="pdf"
                    checked={formData.content_type === 'pdf'}
                    onChange={handleInputChange}
                    className="mr-3"
                  />
                  <FileText className="w-4 h-4 mr-2" />
                  PDF
                </label>
                <label className="flex items-center">
                  <input
                    type="radio"
                    name="content_type"
                    value="text"
                    checked={formData.content_type === 'text'}
                    onChange={handleInputChange}
                    className="mr-3"
                  />
                  <Type className="w-4 h-4 mr-2" />
                  Texto/Markdown
                </label>
              </div>
            </div>

            {/* Video Type Selection - Only show when content_type is 'video' */}
            {formData.content_type === 'video' && (
              <div>
                <Label>Tipo de Vídeo *</Label>
                <div className="mt-2 space-y-2">
                  <label className="flex items-center">
                    <input
                      type="radio"
                      name="video_type"
                      value="upload"
                      checked={formData.video_type === 'upload'}
                      onChange={handleInputChange}
                      className="mr-3"
                    />
                    <Upload className="w-4 h-4 mr-2" />
                    Upload de arquivo de vídeo
                  </label>
                  <label className="flex items-center">
                    <input
                      type="radio"
                      name="video_type"
                      value="url"
                      checked={formData.video_type === 'url'}
                      onChange={handleInputChange}
                      className="mr-3"
                    />
                    <Link className="w-4 h-4 mr-2" />
                    URL do vídeo (YouTube, Vimeo, etc.)
                  </label>
                </div>
              </div>
            )}

            {/* Video Upload */}
            {formData.content_type === 'video' && formData.video_type === 'upload' && (
              <div>
                <Label>Arquivo de Vídeo</Label>
                {formData.video_file_url ? (
                  <div className="mt-2 p-4 bg-green-50 border border-green-200 rounded-lg flex items-center justify-between">
                    <div className="flex items-center">
                      <Play className="w-5 h-5 text-green-600 mr-2" />
                      <span className="text-green-800">Vídeo carregado</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setFormData(prev => ({ ...prev, video_file_url: '' }))}
                      className="text-red-600 hover:text-red-800"
                    >
                      Remover
                    </button>
                  </div>
                ) : (
                  <div className="mt-2">
                    <FileUpload
                      bucket="public-assets"
                      path={`lessons/${userId}`}
                      accept="video/*"
                      maxSize={2 * 1024 * 1024 * 1024} // 2GB
                      onUpload={handleVideoUpload}
                      onError={handleUploadError}
                    />
                  </div>
                )}
              </div>
            )}

            {/* Video URL */}
            {formData.content_type === 'video' && formData.video_type === 'url' && (
              <div>
                <Label htmlFor="video_url">URL do Vídeo</Label>
                <Input
                  id="video_url"
                  name="video_url"
                  type="url"
                  value={formData.video_url}
                  onChange={handleInputChange}
                  placeholder="https://www.youtube.com/watch?v=..."
                />
              </div>
            )}

            {/* PDF Upload */}
            {formData.content_type === 'pdf' && (
              <div>
                <Label>Arquivo PDF</Label>
                {formData.pdf_file_url ? (
                  <div className="mt-2 p-4 bg-green-50 border border-green-200 rounded-lg flex items-center justify-between">
                    <div className="flex items-center">
                      <FileText className="w-5 h-5 text-green-600 mr-2" />
                      <span className="text-green-800">PDF carregado</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setFormData(prev => ({ ...prev, pdf_file_url: '' }))}
                      className="text-red-600 hover:text-red-800"
                    >
                      Remover
                    </button>
                  </div>
                ) : (
                  <div className="mt-2">
                    <FileUpload
                      bucket="public-assets"
                      path={`lessons/${userId}`}
                      accept=".pdf"
                      maxSize={50 * 1024 * 1024} // 50MB
                      onUpload={handlePDFUpload}
                      onError={handleUploadError}
                    />
                    <p className="text-sm text-gray-600 mt-2">
                      Formato: PDF. Máximo 50MB
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* Text Content */}
            {formData.content_type === 'text' && (
              <div>
                <Label htmlFor="text_content">Conteúdo de Texto</Label>
                <textarea
                  id="text_content"
                  name="text_content"
                  value={formData.text_content}
                  onChange={handleInputChange}
                  placeholder="Digite ou cole o conteúdo da aula aqui. Suporta Markdown..."
                  rows={12}
                  className="w-full mt-2 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-black"
                />
                <p className="text-sm text-gray-600 mt-2">
                  Suporta Markdown para formatação (títulos, listas, links, etc.)
                </p>
              </div>
            )}

            <div className="flex justify-end space-x-4">
              <Button
                type="button"
                variant="secondary"
                onClick={resetForm}
                disabled={loading}
              >
                Cancelar
              </Button>
              
              <Button
                type="submit"
                disabled={loading}
              >
                {loading ? (
                  <div className="flex items-center gap-2">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    {editingLesson ? 'Salvando...' : 'Criando...'}
                  </div>
                ) : (
                  editingLesson ? 'Salvar Alterações' : 'Criar Aula'
                )}
              </Button>
            </div>
          </form>
        </Card>
      )}

      {/* Formulário de adicionar/editar módulo */}
      {showAddModuleForm && (
        <Card ref={moduleFormRef} className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h4 className="text-lg font-semibold">
              {editingModule ? 'Editar Módulo' : 'Novo Módulo'}
            </h4>
            <Button
              variant="outline"
              onClick={resetModuleForm}
              className="text-gray-600 hover:text-gray-800"
            >
              ✕
            </Button>
          </div>

          <form onSubmit={handleModuleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="module_title">Título do Módulo *</Label>
              <Input
                id="module_title"
                name="title"
                value={moduleFormData.title}
                onChange={(e) => setModuleFormData(prev => ({ ...prev, title: e.target.value }))}
                placeholder="Ex: Conceitos Fundamentais"
                required
              />
            </div>

            <div>
              <Label htmlFor="module_description">Descrição (Opcional)</Label>
              <textarea
                id="module_description"
                name="description"
                value={moduleFormData.description}
                onChange={(e) => setModuleFormData(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Descreva o conteúdo deste módulo..."
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            <div className="flex justify-end gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={resetModuleForm}
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                disabled={loading}
              >
                {loading ? 'Salvando...' : (editingModule ? 'Atualizar Módulo' : 'Criar Módulo')}
              </Button>
            </div>
          </form>
        </Card>
      )}
    </div>
  )
}