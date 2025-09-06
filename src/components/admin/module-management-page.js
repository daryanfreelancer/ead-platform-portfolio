'use client'

import { useState } from 'react'
import ModuleManagementList from './module-management-list'
import ModuleFormModal from './module-form-modal'
import ModuleCourseSelector from './module-course-selector'

export default function ModuleManagementPage({ initialModules = [] }) {
  const [modules, setModules] = useState(initialModules)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingModule, setEditingModule] = useState(null)
  const [selectedCourseId, setSelectedCourseId] = useState(null)

  const handleCreateModule = () => {
    setEditingModule(null)
    setIsModalOpen(true)
  }

  const handleEditModule = (module) => {
    setEditingModule(module)
    setSelectedCourseId(module.course_id)
    setIsModalOpen(true)
  }

  const handleDeleteModule = async (module) => {
    try {
      const response = await fetch(`/api/admin/modules/${module.id}`, {
        method: 'DELETE'
      })
      
      if (response.ok) {
        // Remover módulo da lista local
        setModules(modules.filter(m => m.id !== module.id))
        return true
      } else {
        const data = await response.json()
        throw new Error(data.error)
      }
    } catch (error) {
      console.error('Erro ao deletar módulo:', error)
      alert('Erro ao deletar módulo: ' + error.message)
      return false
    }
  }

  const handleModuleSuccess = (savedModule) => {
    if (editingModule) {
      // Atualizar módulo existente
      setModules(modules.map(m => 
        m.id === savedModule.id ? savedModule : m
      ))
    } else {
      // Adicionar novo módulo
      setModules([savedModule, ...modules])
    }
  }

  return (
    <>
      <ModuleManagementList 
        initialModules={modules} 
        onCreateModule={handleCreateModule}
        onEditModule={handleEditModule}
        onDeleteModule={handleDeleteModule}
      />

      <ModuleFormModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false)
          setEditingModule(null)
          setSelectedCourseId(null)
        }}
        module={editingModule}
        courseId={selectedCourseId}
        onSuccess={handleModuleSuccess}
      />
    </>
  )
}