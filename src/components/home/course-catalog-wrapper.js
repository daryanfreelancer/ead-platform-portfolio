'use client'

import { Suspense } from 'react'
import CourseCatalog from './course-catalog'

// Fallback component para loading
function CourseCatalogFallback() {
  return (
    <div className="mb-32">
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold text-gray-900 mb-4">
          Catálogo de Cursos
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

export default function CourseCatalogWrapper() {
  return (
    <Suspense fallback={<CourseCatalogFallback />}>
      <CourseCatalog />
    </Suspense>
  )
}