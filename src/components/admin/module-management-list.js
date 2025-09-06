'use client'

import { useState, useMemo } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import ModuleActivationToggle from '@/components/admin/module-activation-toggle'
import { 
  BookOpen, 
  Eye, 
  EyeOff, 
  Search, 
  Plus, 
  Edit, 
  Trash2, 
  GripVertical,
  Layers,
  Clock,
  User,
  Calendar
} from 'lucide-react'

export default function ModuleManagementList({ 
  initialModules = [], 
  courseId = null,
  onCreateModule,
  onEditModule,
  onDeleteModule 
}) {
  const [modules, setModules] = useState(initialModules)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterStatus, setFilterStatus] = useState('all') // all, active, inactive
  const [filterCourse, setFilterCourse] = useState(courseId || 'all')

  // Obter cursos únicos para filtro
  const uniqueCourses = useMemo(() => {
    const courses = modules
      .map(module => module.course)
      .filter((course, index, self) => 
        course && self.findIndex(c => c?.id === course.id) === index
      )
    return courses.sort((a, b) => a?.title?.localeCompare(b?.title || '') || 0)
  }, [modules])

  // Filtrar módulos
  const filteredModules = useMemo(() => {
    return modules.filter(module => {
      const matchesSearch = module.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           module.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           module.course?.title?.toLowerCase().includes(searchTerm.toLowerCase())
      
      const matchesStatus = filterStatus === 'all' || 
                           (filterStatus === 'active' && module.is_active !== false) ||
                           (filterStatus === 'inactive' && module.is_active === false)
      
      const matchesCourse = filterCourse === 'all' || module.course?.id === filterCourse

      return matchesSearch && matchesStatus && matchesCourse
    })
  }, [modules, searchTerm, filterStatus, filterCourse])

  // Estatísticas
  const stats = useMemo(() => {
    const total = modules.length
    const active = modules.filter(m => m.is_active !== false).length
    const inactive = modules.filter(m => m.is_active === false).length
    
    return { total, active, inactive }
  }, [modules])

  const handleModuleToggle = (moduleId, isActive) => {
    setModules(modules.map(module => 
      module.id === moduleId 
        ? { ...module, is_active: isActive }
        : module
    ))
  }

  const handleCreateModule = () => {
    onCreateModule?.()
  }

  const handleEditModule = (module) => {
    onEditModule?.(module)
  }

  const handleDeleteModule = async (module) => {
    if (window.confirm(
      `Tem certeza que deseja deletar o módulo "${module.title}"?\n\n` +
      `Esta ação irá:\n` +
      `• Remover o módulo permanentemente\n` +
      `• Desassociar todas as aulas do módulo\n` +
      `• As aulas permanecerão no curso, mas sem módulo\n\n` +
      `Esta ação não pode ser desfeita.`
    )) {
      const success = await onDeleteModule?.(module)
      if (success) {
        setModules(modules.filter(m => m.id !== module.id))
      }
    }
  }

  return (
    <div className="space-y-6">
      {/* Estatísticas */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 mb-1">
                Total de Módulos
              </p>
              <p className="text-2xl font-bold text-gray-900">
                {stats.total}
              </p>
            </div>
            <Layers className="w-8 h-8 text-blue-600" />
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 mb-1">
                Módulos Ativos
              </p>
              <p className="text-2xl font-bold text-gray-900">
                {stats.active}
              </p>
            </div>
            <Eye className="w-8 h-8 text-green-600" />
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 mb-1">
                Módulos Inativos
              </p>
              <p className="text-2xl font-bold text-gray-900">
                {stats.inactive}
              </p>
            </div>
            <EyeOff className="w-8 h-8 text-orange-600" />
          </div>
        </Card>
      </div>

      {/* Filtros e Ações */}
      <Card className="p-6">
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Buscar módulos, descrições ou cursos..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-black"
              />
            </div>
          </div>
          
          <div className="flex flex-wrap gap-3">
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="flex-1 sm:flex-none px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-black min-h-[44px]"
            >
              <option value="all">Todos os Status</option>
              <option value="active">Módulos Ativos</option>
              <option value="inactive">Módulos Inativos</option>
            </select>
            
            {!courseId && (
              <select
                value={filterCourse}
                onChange={(e) => setFilterCourse(e.target.value)}
                className="flex-1 sm:flex-none px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-black min-h-[44px]"
              >
                <option value="all">Todos os Cursos</option>
                {uniqueCourses.map(course => (
                  <option key={course.id} value={course.id}>
                    {course.title}
                  </option>
                ))}
              </select>
            )}
            
            <Button
              onClick={handleCreateModule}
              className="flex items-center gap-2 w-full sm:w-auto min-h-[44px]"
            >
              <Plus className="w-4 h-4" />
              Novo Módulo
            </Button>
          </div>
        </div>

        {/* Resultados */}
        <div className="text-sm text-gray-600 mb-4">
          Mostrando {filteredModules.length} de {modules.length} módulos
        </div>
      </Card>

      {/* Lista de Módulos */}
      <div className="space-y-4">
        {filteredModules.map((module) => (
          <Card key={module.id} className="p-6">
            <div className="flex items-start gap-4">
              {/* Ícone drag handle */}
              <div className="flex-shrink-0 mt-1">
                <GripVertical className="w-5 h-5 text-gray-400" />
              </div>

              {/* Conteúdo do módulo */}
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">
                      {module.title}
                    </h3>
                    <p className="text-sm text-gray-600">
                      Curso: {module.course?.title || 'Curso não encontrado'}
                    </p>
                    {module.description && (
                      <p className="text-sm text-gray-500 mt-1">
                        {module.description}
                      </p>
                    )}
                  </div>
                  
                  {/* Status visual */}
                  <div className={`flex items-center gap-1 px-3 py-2 rounded-full text-sm font-medium min-h-[44px] ${
                    module.is_active !== false 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-orange-100 text-orange-800'
                  }`}>
                    {module.is_active !== false ? (
                      <>
                        <Eye className="w-3 h-3" />
                        Ativo
                      </>
                    ) : (
                      <>
                        <EyeOff className="w-3 h-3" />
                        Inativo
                      </>
                    )}
                  </div>
                </div>

                {/* Informações adicionais */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 text-sm text-gray-500 mb-4">
                  <div className="flex items-center">
                    <User className="w-4 h-4 mr-2" />
                    <span>
                      Professor: {module.course?.teacher?.full_name || 'N/A'}
                    </span>
                  </div>
                  
                  <div className="flex items-center">
                    <Layers className="w-4 h-4 mr-2" />
                    <span>
                      Posição: {module.order_index + 1}
                    </span>
                  </div>
                  
                  <div className="flex items-center">
                    <Calendar className="w-4 h-4 mr-2" />
                    <span>
                      Criado em: {new Date(module.created_at).toLocaleDateString('pt-BR')}
                    </span>
                  </div>
                </div>

                {/* Controles */}
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <div className="flex items-center gap-3 flex-wrap w-full sm:w-auto">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleEditModule(module)}
                      className="flex-1 sm:flex-none min-h-[44px]"
                    >
                      <Edit className="w-4 h-4 sm:mr-1" />
                      <span className="sm:inline hidden whitespace-nowrap">Editar</span>
                    </Button>
                    
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDeleteModule(module)}
                      className="text-red-600 hover:text-red-700 flex-1 sm:flex-none min-h-[44px]"
                    >
                      <Trash2 className="w-4 h-4 sm:mr-1" />
                      <span className="sm:inline hidden whitespace-nowrap">Deletar</span>
                    </Button>
                  </div>
                  
                  <div className="flex-shrink-0 w-full sm:w-auto">
                    <ModuleActivationToggle
                      module={module}
                      onToggle={handleModuleToggle}
                      size="sm"
                    />
                  </div>
                </div>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* Mensagem quando não há resultados */}
      {filteredModules.length === 0 && (
        <Card className="p-12 text-center">
          <Layers className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            Nenhum módulo encontrado
          </h3>
          <p className="text-gray-600 mb-4">
            {searchTerm || filterStatus !== 'all' || filterCourse !== 'all'
              ? 'Tente ajustar os filtros para encontrar módulos.'
              : 'Ainda não há módulos cadastrados.'}
          </p>
          <Button onClick={handleCreateModule}>
            <Plus className="w-4 h-4 mr-2" />
            Criar Primeiro Módulo
          </Button>
        </Card>
      )}
    </div>
  )
}