'use client'

import { useState, useEffect } from 'react'
import { Card } from '@/components/ui/card'
import Button from '@/components/ui/button'
import Input from '@/components/ui/input'
import { supabase } from '@/lib/supabase/client'
import { 
  Plus, 
  Upload, 
  Download, 
  Search, 
  Filter, 
  Edit, 
  Trash2, 
  Eye, 
  EyeOff,
  Settings,
  FileSpreadsheet,
  MessageCircle
} from 'lucide-react'
import CourseCatalogForm from './course-catalog-form'
import ImportCatalogModal from './import-catalog-modal'
import WhatsAppConfigModal from './whatsapp-config-modal'

const COURSE_CATEGORIES = {
  capacitacao: { label: 'Capacitação', color: 'bg-green-100 text-green-800' },
  tecnologo: { label: 'Tecnólogo', color: 'bg-blue-100 text-blue-800' },
  bacharel: { label: 'Bacharel', color: 'bg-purple-100 text-purple-800' },
  licenciatura: { label: 'Licenciatura', color: 'bg-indigo-100 text-indigo-800' },
  tecnico_competencia: { label: 'Técnico por Competência', color: 'bg-orange-100 text-orange-800' },
  tecnico: { label: 'Técnico', color: 'bg-yellow-100 text-yellow-800' },
  mestrado: { label: 'Mestrado', color: 'bg-red-100 text-red-800' },
  doutorado: { label: 'Doutorado', color: 'bg-pink-100 text-pink-800' },
  pos_doutorado: { label: 'Pós-Doutorado', color: 'bg-gray-100 text-gray-800' }
}

export default function CourseCatalogManager({ initialCourses, initialWhatsappConfig }) {
  const [courses, setCourses] = useState(initialCourses)
  const [filteredCourses, setFilteredCourses] = useState(initialCourses)
  const [loading, setLoading] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [showActiveOnly, setShowActiveOnly] = useState(false)
  
  // Modais
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [isImportOpen, setIsImportOpen] = useState(false)
  const [isWhatsAppConfigOpen, setIsWhatsAppConfigOpen] = useState(false)
  const [editingCourse, setEditingCourse] = useState(null)
  const [whatsappConfig, setWhatsappConfig] = useState(initialWhatsappConfig)

  useEffect(() => {
    filterCourses()
  }, [courses, searchTerm, selectedCategory, showActiveOnly])

  const filterCourses = () => {
    let filtered = courses

    // Filtro por busca
    if (searchTerm) {
      filtered = filtered.filter(course => 
        course.nome_curso.toLowerCase().includes(searchTerm.toLowerCase()) ||
        course.subcategoria?.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    // Filtro por categoria
    if (selectedCategory !== 'all') {
      filtered = filtered.filter(course => course.categoria === selectedCategory)
    }

    // Filtro por status ativo
    if (showActiveOnly) {
      filtered = filtered.filter(course => course.is_active)
    }

    setFilteredCourses(filtered)
  }

  const handleSaveCourse = async (courseData) => {
    try {
      setLoading(true)

      if (editingCourse) {
        // Atualizar curso
        const { data, error } = await supabase
          .from('course_catalog')
          .update(courseData)
          .eq('id', editingCourse.id)
          .select()
          .single()

        if (error) throw error

        setCourses(prev => prev.map(c => c.id === editingCourse.id ? data : c))
      } else {
        // Criar novo curso
        const { data, error } = await supabase
          .from('course_catalog')
          .insert(courseData)
          .select()
          .single()

        if (error) throw error

        setCourses(prev => [data, ...prev])
      }

      setIsFormOpen(false)
      setEditingCourse(null)
    } catch (error) {
      console.error('Erro ao salvar curso:', error)
      alert('Erro ao salvar curso: ' + error.message)
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteCourse = async (courseId) => {
    if (!confirm('Tem certeza que deseja excluir este curso?')) return

    try {
      setLoading(true)
      
      const { error } = await supabase
        .from('course_catalog')
        .delete()
        .eq('id', courseId)

      if (error) throw error

      setCourses(prev => prev.filter(c => c.id !== courseId))
    } catch (error) {
      console.error('Erro ao excluir curso:', error)
      alert('Erro ao excluir curso: ' + error.message)
    } finally {
      setLoading(false)
    }
  }

  const handleToggleActive = async (courseId, currentStatus) => {
    try {
      setLoading(true)

      const { data, error } = await supabase
        .from('course_catalog')
        .update({ is_active: !currentStatus })
        .eq('id', courseId)
        .select()
        .single()

      if (error) throw error

      setCourses(prev => prev.map(c => c.id === courseId ? data : c))
    } catch (error) {
      console.error('Erro ao alterar status:', error)
      alert('Erro ao alterar status: ' + error.message)
    } finally {
      setLoading(false)
    }
  }

  const handleImportSuccess = (importedCourses) => {
    setCourses(prev => [...importedCourses, ...prev])
    setIsImportOpen(false)
  }

  const handleExport = async () => {
    try {
      const response = await fetch('/api/admin/export-catalog')
      
      if (!response.ok) throw new Error('Erro ao exportar')

      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `catalogo-cursos-${new Date().toISOString().split('T')[0]}.xlsx`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      window.URL.revokeObjectURL(url)
    } catch (error) {
      console.error('Erro ao exportar:', error)
      alert('Erro ao exportar catálogo')
    }
  }

  const handleWhatsAppConfigSave = (config) => {
    setWhatsappConfig(config)
    setIsWhatsAppConfigOpen(false)
  }

  return (
    <div className="space-y-6">
      {/* Actions Bar */}
      <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
        <div className="flex flex-wrap gap-2">
          <Button
            onClick={() => {
              setEditingCourse(null)
              setIsFormOpen(true)
            }}
            className="flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Novo Curso
          </Button>
          
          <Button
            variant="secondary"
            onClick={() => setIsImportOpen(true)}
            className="flex items-center gap-2"
          >
            <Upload className="w-4 h-4" />
            Importar Excel
          </Button>
          
          <Button
            variant="secondary"
            onClick={handleExport}
            className="flex items-center gap-2"
          >
            <Download className="w-4 h-4" />
            Exportar Excel
          </Button>

          <Button
            variant="secondary"
            onClick={() => setIsWhatsAppConfigOpen(true)}
            className="flex items-center gap-2"
          >
            <MessageCircle className="w-4 h-4" />
            Config WhatsApp
          </Button>
        </div>

        {/* Stats */}
        <div className="text-sm text-gray-600">
          Total: {courses.length} | Ativos: {courses.filter(c => c.is_active).length}
        </div>
      </div>

      {/* Filters */}
      <Card className="p-4">
        <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center">
          {/* Search */}
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <Input
              placeholder="Buscar por nome ou subcategoria..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>

          {/* Category Filter */}
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">Todas as Categorias</option>
            {Object.entries(COURSE_CATEGORIES).map(([key, category]) => (
              <option key={key} value={key}>{category.label}</option>
            ))}
          </select>

          {/* Active Filter */}
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={showActiveOnly}
              onChange={(e) => setShowActiveOnly(e.target.checked)}
              className="rounded"
            />
            <span className="text-sm text-gray-700">Apenas Ativos</span>
          </label>
        </div>
      </Card>

      {/* Courses List */}
      <div className="space-y-4">
        {filteredCourses.length === 0 ? (
          <Card className="p-8 text-center">
            <FileSpreadsheet className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Nenhum curso encontrado
            </h3>
            <p className="text-gray-500 mb-4">
              {courses.length === 0 
                ? 'Comece adicionando cursos ao catálogo'
                : 'Tente ajustar os filtros de busca'
              }
            </p>
            {courses.length === 0 && (
              <Button onClick={() => setIsFormOpen(true)}>
                Adicionar Primeiro Curso
              </Button>
            )}
          </Card>
        ) : (
          filteredCourses.map(course => (
            <Card key={course.id} className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="font-medium text-gray-900 truncate">
                      {course.nome_curso}
                    </h3>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${COURSE_CATEGORIES[course.categoria]?.color}`}>
                      {COURSE_CATEGORIES[course.categoria]?.label}
                    </span>
                    {!course.is_active && (
                      <span className="px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-600">
                        Inativo
                      </span>
                    )}
                  </div>
                  
                  {course.subcategoria && (
                    <p className="text-sm text-gray-600">
                      Subcategoria: {course.subcategoria}
                    </p>
                  )}
                  
                  <p className="text-xs text-gray-500 mt-1">
                    Criado em {new Date(course.created_at).toLocaleDateString('pt-BR')}
                  </p>
                </div>

                <div className="flex items-center gap-2 ml-4">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleToggleActive(course.id, course.is_active)}
                    title={course.is_active ? 'Desativar' : 'Ativar'}
                  >
                    {course.is_active ? (
                      <Eye className="w-4 h-4 text-green-600" />
                    ) : (
                      <EyeOff className="w-4 h-4 text-gray-400" />
                    )}
                  </Button>

                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setEditingCourse(course)
                      setIsFormOpen(true)
                    }}
                    title="Editar"
                  >
                    <Edit className="w-4 h-4 text-blue-600" />
                  </Button>

                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDeleteCourse(course.id)}
                    title="Excluir"
                  >
                    <Trash2 className="w-4 h-4 text-red-600" />
                  </Button>
                </div>
              </div>
            </Card>
          ))
        )}
      </div>

      {/* Modals */}
      <CourseCatalogForm
        isOpen={isFormOpen}
        onClose={() => {
          setIsFormOpen(false)
          setEditingCourse(null)
        }}
        course={editingCourse}
        onSave={handleSaveCourse}
        loading={loading}
      />

      <ImportCatalogModal
        isOpen={isImportOpen}
        onClose={() => setIsImportOpen(false)}
        onSuccess={handleImportSuccess}
      />

      <WhatsAppConfigModal
        isOpen={isWhatsAppConfigOpen}
        onClose={() => setIsWhatsAppConfigOpen(false)}
        config={whatsappConfig}
        onSave={handleWhatsAppConfigSave}
      />
    </div>
  )
}