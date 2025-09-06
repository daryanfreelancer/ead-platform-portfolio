'use client'

import { Construction, Calendar, Clock } from 'lucide-react'

import { isMaintenanceExpired, getFormattedMaintenanceEndDate } from '@/lib/config/maintenance'

export default function MaintenanceBanner() {
  const maintenanceEndDate = getFormattedMaintenanceEndDate()
  const isMaintenanceMode = process.env.NEXT_PUBLIC_MAINTENANCE_MODE === 'true'

  // Se não está em modo de manutenção, não exibir
  if (!isMaintenanceMode) {
    return null
  }

  // Se a data de manutenção já passou, não exibir o banner
  if (isMaintenanceExpired()) {
    return null
  }

  return (
    <div className="bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-lg p-6 mb-6 shadow-sm">
      <div className="flex items-start space-x-4">
        <div className="flex-shrink-0">
          <div className="flex items-center justify-center w-10 h-10 bg-amber-100 rounded-full">
            <Construction className="w-5 h-5 text-amber-600" />
          </div>
        </div>
        
        <div className="flex-1">
          <div className="flex items-center space-x-2 mb-2">
            <h3 className="text-lg font-semibold text-amber-800">
              Plataforma em Construção
            </h3>
            <div className="flex items-center space-x-1 text-amber-600">
              <Clock className="w-4 h-4" />
              <span className="text-sm font-medium">Temporário</span>
            </div>
          </div>
          
          <p className="text-amber-700 mb-3 leading-relaxed">
            A <strong>consulta pública de CPF</strong> e o <strong>cadastro de novos estudantes</strong> estarão 
            indisponíveis até o dia <strong className="text-amber-800">{maintenanceEndDate}</strong>.
          </p>
          
          
          <p className="text-amber-600 text-sm">
            Agradecemos pela compreensão e pedimos desculpas pelo inconveniente. 
            Nossa equipe está trabalhando para oferecer a melhor experiência possível.
          </p>
        </div>
      </div>
    </div>
  )
}