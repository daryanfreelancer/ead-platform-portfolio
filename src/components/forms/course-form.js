'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { FileUpload } from '@/components/ui/file-upload'
import { useCourseUpload } from '@/hooks/use-file-upload'
import Button from '@/components/ui/button'
import Input from '@/components/ui/input'
import Label from '@/components/ui/label'
import { Card } from '@/components/ui/card'
import { AlertCircle, Check, Upload, Play, Link, FileText } from 'lucide-react'

const supabase = createClient()

export function CourseForm({ user, course = null, mode = 'create' }) {
  const router = useRouter()
  const { uploadThumbnail, uploadCourseFile, error: uploadError } = useCourseUpload()
  
  const [formData, setFormData] = useState({
    title: course?.title || '',
    description: course?.description || '',
    duration: course?.duration || '',
    video_type: course?.video_type || 'upload',
    video_url: course?.video_url || '',
    video_file_url: course?.video_file_url || '',
    thumbnail_url: course?.thumbnail_url || ''
  })

  const [loading, setLoading] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [message, setMessage] = useState({ type: '', text: '' })

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const handleThumbnailUpload = async (uploadResult) => {
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

  const handleUploadError = (errorMessage) => {
    setMessage({
      type: 'error',
      text: errorMessage
    })
    setTimeout(() => setMessage({ type: '', text: '' }), 5000)
  }

  const validateForm = () => {
    if (!formData.title.trim()) {
      setMessage({ type: 'error', text: 'Título é obrigatório' })
      return false
    }
    if (!formData.description.trim()) {
      setMessage({ type: 'error', text: 'Descrição é obrigatória' })
      return false
    }
    if (!formData.duration) {
      setMessage({ type: 'error', text: 'Duração é obrigatória' })
      return false
    }
    if (formData.video_type === 'url' && !formData.video_url.trim()) {
      setMessage({ type: 'error', text: 'URL do vídeo é obrigatória quando tipo é URL' })
      return false
    }
    if (formData.video_type === 'upload' && !formData.video_file_url && mode === 'create') {
      setMessage({ type: 'error', text: 'Faça upload do vídeo ou escolha URL' })
      return false
    }
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
        duration: parseInt(formData.duration),
        video_type: formData.video_type,
        video_url: formData.video_type === 'url' ? formData.video_url.trim() : null,
        video_file_url: formData.video_type === 'upload' ? formData.video_file_url : null,
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

        setMessage({
          type: 'success',
          text: 'Curso criado com sucesso! Aguardando aprovação do administrador.'
        })

        // Redirecionar após 2 segundos
        setTimeout(() => {
          router.push('/professor')
        }, 2000)

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
          router.push('/professor')
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
              <FileUpload
                bucket="course-thumbnails"
                path={`${user.id}`}
                accept="image/*"
                maxSize={10 * 1024 * 1024} // 10MB
                onUpload={handleThumbnailUpload}
                onError={handleUploadError}
                className="h-40"
              />
            )}
            
            <p className="text-sm text-gray-600">
              Tamanho recomendado: 1200x675px (16:9)<br/>
              Formatos: JPG, PNG, WebP. Máximo 10MB
            </p>
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
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <p className="text-sm text-gray-500 mt-1">
                {formData.description.length}/1000 caracteres
              </p>
            </div>

            <div>
              <Label htmlFor="duration">Duração (em minutos) *</Label>
              <Input
                id="duration"
                name="duration"
                type="number"
                value={formData.duration}
                onChange={handleInputChange}
                placeholder="Ex: 60"
                required
                min="1"
                max="1440"
              />
              <p className="text-sm text-gray-500 mt-1">
                {formData.duration ? `${Math.floor(formData.duration / 60)}h ${formData.duration % 60}min` : ''}
              </p>
            </div>
          </div>
        </Card>
      </div>

      {/* Seção de Vídeo */}
      <Card className="p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-6">
          Conteúdo do Curso
        </h2>

        <div className="space-y-6">
          {/* Tipo de vídeo */}
          <div>
            <Label>Tipo de Conteúdo *</Label>
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

          {/* Upload de vídeo */}
          {formData.video_type === 'upload' && (
            <div>
              <Label>Arquivo de Vídeo</Label>
              {formData.video_file_url ? (
                <div className="mt-2 p-4 bg-green-50 border border-green-200 rounded-lg flex items-center justify-between">
                  <div className="flex items-center">
                    <Play className="w-5 h-5 text-green-600 mr-2" />
                    <span className="text-green-800">Vídeo carregado com sucesso</span>
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
                    bucket="course-files"
                    path={`${user.id}`}
                    accept="video/*"
                    maxSize={2 * 1024 * 1024 * 1024} // 2GB
                    onUpload={handleVideoUpload}
                    onError={handleUploadError}
                  />
                  <p className="text-sm text-gray-600 mt-2">
                    Formatos: MP4, MOV. Máximo 2GB
                  </p>
                </div>
              )}
            </div>
          )}

          {/* URL do vídeo */}
          {formData.video_type === 'url' && (
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
              <p className="text-sm text-gray-500 mt-1">
                Suporte para YouTube, Vimeo e links diretos de vídeo
              </p>
            </div>
          )}
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
    </form>
  )
}