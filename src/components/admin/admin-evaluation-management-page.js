'use client'

import { useState } from 'react'
import EvaluationManagementList from './evaluation-management-list'
import EvaluationFormModal from './evaluation-form-modal'
import QuestionsManagementModal from './questions-management-modal'
import GradingCorrectionModal from './grading-correction-modal'

export default function AdminEvaluationManagementPage({ 
  initialEvaluations = [], 
  courses = [] 
}) {
  const [evaluations, setEvaluations] = useState(initialEvaluations)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingEvaluation, setEditingEvaluation] = useState(null)
  const [showQuestionsModal, setShowQuestionsModal] = useState(false)
  const [managingEvaluation, setManagingEvaluation] = useState(null)
  const [showGradingModal, setShowGradingModal] = useState(false)

  const handleCreateEvaluation = () => {
    setEditingEvaluation(null)
    setIsModalOpen(true)
  }

  const handleEditEvaluation = (evaluation) => {
    setEditingEvaluation(evaluation)
    setIsModalOpen(true)
  }

  const handleDeleteEvaluation = async (evaluation) => {
    try {
      const response = await fetch(`/api/evaluations/${evaluation.id}`, {
        method: 'DELETE'
      })
      
      if (response.ok) {
        // Remover avaliação da lista local
        setEvaluations(evaluations.filter(e => e.id !== evaluation.id))
        return true
      } else {
        const data = await response.json()
        throw new Error(data.error)
      }
    } catch (error) {
      console.error('Erro ao deletar avaliação:', error)
      alert('Erro ao deletar avaliação: ' + error.message)
      return false
    }
  }

  const handleManageQuestions = (evaluation) => {
    setManagingEvaluation(evaluation)
    setShowQuestionsModal(true)
  }

  const handleManageGrading = () => {
    setShowGradingModal(true)
  }

  const handleEvaluationSuccess = (savedEvaluation) => {
    if (editingEvaluation) {
      // Atualizar avaliação existente
      setEvaluations(evaluations.map(e => 
        e.id === savedEvaluation.id ? savedEvaluation : e
      ))
    } else {
      // Adicionar nova avaliação
      setEvaluations([savedEvaluation, ...evaluations])
    }
  }

  return (
    <>
      <EvaluationManagementList 
        initialEvaluations={evaluations} 
        onCreateEvaluation={handleCreateEvaluation}
        onEditEvaluation={handleEditEvaluation}
        onDeleteEvaluation={handleDeleteEvaluation}
        onManageQuestions={handleManageQuestions}
        onManageGrading={handleManageGrading}
      />

      <EvaluationFormModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false)
          setEditingEvaluation(null)
        }}
        evaluation={editingEvaluation}
        courses={courses}
        onSuccess={handleEvaluationSuccess}
      />

      <QuestionsManagementModal
        isOpen={showQuestionsModal}
        onClose={() => {
          setShowQuestionsModal(false)
          setManagingEvaluation(null)
        }}
        evaluation={managingEvaluation}
      />

      <GradingCorrectionModal
        isOpen={showGradingModal}
        onClose={() => setShowGradingModal(false)}
        onGradeCompleted={(attempt) => {
          console.log('Correção finalizada:', attempt)
        }}
      />
    </>
  )
}