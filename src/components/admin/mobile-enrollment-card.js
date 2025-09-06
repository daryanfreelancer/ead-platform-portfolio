'use client'

import { useState, memo } from 'react'
import { BookOpen, User, Calendar, TrendingUp, Download, Trash2, CheckCircle, Clock } from 'lucide-react'

function MobileEnrollmentCard({ enrollment, onDelete, onGenerateCertificate, deleteLoading }) {
  const getStatusBadge = (enrollment) => {
    if (enrollment.completed_at) {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 border border-green-200 whitespace-nowrap">
          <CheckCircle className="w-3 h-3 mr-1 flex-shrink-0" />
          Concluído
        </span>
      )
    }
    return (
      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 border border-blue-200 whitespace-nowrap">
        <Clock className="w-3 h-3 mr-1 flex-shrink-0" />
        Em andamento
      </span>
    )
  }

  const formatDate = (dateString) => {
    if (!dateString) return '-'
    return new Date(dateString).toLocaleDateString('pt-BR', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  return (
    <div className="bg-white rounded-lg shadow-md p-4 relative">
      {/* Cabeçalho do Card */}
      <div className="flex items-start justify-between mb-4 gap-2">
        <div className="flex items-center space-x-3 flex-1 min-w-0">
          {/* Avatar do aluno */}
          <div className="flex-shrink-0">
            {enrollment.student?.avatar_url ? (
              <img
                className="h-12 w-12 rounded-full border-2 border-gray-200"
                src={enrollment.student.avatar_url}
                alt=""
              />
            ) : (
              <div className="h-12 w-12 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center border-2 border-gray-200">
                <User className="w-6 h-6 text-white" />
              </div>
            )}
          </div>
          
          {/* Informações do aluno */}
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-gray-900 text-base truncate">
              {enrollment.student?.full_name || 'Sem nome'}
            </h3>
            <p className="text-sm text-gray-600 truncate">
              {enrollment.student?.email}
            </p>
          </div>
        </div>

        {/* Status badge */}
        <div className="flex-shrink-0">
          {getStatusBadge(enrollment)}
        </div>
      </div>

      {/* Informações do curso */}
      <div className="mb-4 p-3 bg-gray-50 rounded-lg">
        <div className="flex items-center space-x-3">
          {enrollment.course?.thumbnail_url && (
            <img
              src={enrollment.course.thumbnail_url}
              alt=""
              className="w-12 h-12 rounded-lg object-cover flex-shrink-0"
            />
          )}
          <div className="flex-1 min-w-0">
            <h4 className="font-medium text-gray-900 truncate mb-1">
              {enrollment.course?.title || 'Curso não encontrado'}
            </h4>
            <p className="text-sm text-gray-600">
              {enrollment.course?.is_free ? 'Gratuito' : `R$ ${enrollment.course?.price || '0,00'}`}
            </p>
          </div>
        </div>
      </div>

      {/* Progresso */}
      <div className="mb-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-gray-700">Progresso</span>
          <span className="text-sm text-gray-600">{enrollment.progress || 0}%</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div 
            className="bg-blue-600 h-2 rounded-full transition-all duration-300"
            style={{ width: `${enrollment.progress || 0}%` }}
          />
        </div>
      </div>

      {/* Informações detalhadas */}
      <div className="grid grid-cols-1 gap-3 mb-4">
        <div className="flex items-center space-x-2">
          <Calendar className="w-4 h-4 text-gray-400" />
          <div>
            <p className="text-xs text-gray-500">Data de Matrícula</p>
            <p className="text-sm font-medium text-gray-900">
              {formatDate(enrollment.enrolled_at)}
            </p>
          </div>
        </div>
        
        {enrollment.completed_at && (
          <div className="flex items-center space-x-2">
            <CheckCircle className="w-4 h-4 text-green-500" />
            <div>
              <p className="text-xs text-gray-500">Data de Conclusão</p>
              <p className="text-sm font-medium text-gray-900">
                {formatDate(enrollment.completed_at)}
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Ações */}
      <div className="flex gap-2 pt-3 border-t border-gray-100">
        {enrollment.completed_at && (
          <button
            onClick={() => onGenerateCertificate(enrollment)}
            className="flex-1 flex items-center justify-center gap-2 px-3 py-2 text-sm font-medium text-green-600 bg-green-50 rounded-md hover:bg-green-100 transition-colors min-h-[44px]"
          >
            <Download className="w-4 h-4" />
            Certificado
          </button>
        )}
        
        <button
          onClick={() => onDelete(enrollment)}
          disabled={deleteLoading === enrollment.id}
          className={`${enrollment.completed_at ? 'flex-1' : 'w-full'} flex items-center justify-center gap-2 px-3 py-2 text-sm font-medium text-red-600 bg-red-50 rounded-md hover:bg-red-100 transition-colors disabled:opacity-50 min-h-[44px]`}
        >
          {deleteLoading === enrollment.id ? (
            <div className="w-4 h-4 border-2 border-red-600 border-t-transparent rounded-full animate-spin" />
          ) : (
            <Trash2 className="w-4 h-4" />
          )}
          {deleteLoading === enrollment.id ? 'Excluindo...' : 'Excluir'}
        </button>
      </div>
    </div>
  )
}

export default memo(MobileEnrollmentCard)