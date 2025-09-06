'use client'

import { AlertTriangle, ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import Button from '@/components/ui/button'

export default function MaintenanceMessage({ 
  title = "Funcionalidade Temporariamente Indisponível",
  message = "Esta página está temporariamente indisponível para manutenção.",
  showBackButton = true,
  backUrl = "/"
}) {

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow-lg sm:rounded-lg sm:px-10">
          <div className="text-center">
            <div className="mx-auto flex items-center justify-center w-16 h-16 bg-amber-100 rounded-full mb-4">
              <AlertTriangle className="w-8 h-8 text-amber-600" />
            </div>
            
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              {title}
            </h2>
            
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-6">
              <p className="text-amber-800 text-sm leading-relaxed">
                {message}
              </p>
            </div>
            
            <p className="text-gray-600 text-sm mb-6">
              Agradecemos pela compreensão e pedimos desculpas pelo inconveniente.
              Nossa equipe está trabalhando para oferecer a melhor experiência possível.
            </p>
            
            {showBackButton && (
              <Link href={backUrl}>
                <Button className="flex items-center space-x-2">
                  <ArrowLeft className="w-4 h-4" />
                  <span>Voltar à Página Inicial</span>
                </Button>
              </Link>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}