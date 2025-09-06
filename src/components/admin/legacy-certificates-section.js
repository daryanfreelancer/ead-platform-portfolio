'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import BulkCertificateImport from '@/components/admin/bulk-certificate-import'
import AddLegacyCertificateModal from '@/components/admin/add-legacy-certificate-modal'

export default function LegacyCertificatesSection() {
  const [isModalOpen, setIsModalOpen] = useState(false)
  const router = useRouter()

  const handleSuccess = () => {
    // Refresh suave sem perder sessão usando router do Next.js
    console.log('Certificado - Atualizando página sem reload')
    router.refresh()
    
    // Fechar modal após pequeno delay para garantir que o refresh aconteça
    setTimeout(() => {
      setIsModalOpen(false)
    }, 500)
  }

  return (
    <div className="mb-8 sm:mb-12">
      <Card className="p-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
          <div>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">
              Certificados Legados
            </h2>
            <p className="text-gray-600 text-sm">
              Gerencie certificados históricos importados de sistemas anteriores
            </p>
          </div>
          <Button
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-2 w-full sm:w-auto justify-center min-h-[44px] whitespace-nowrap"
          >
            <Plus className="w-4 h-4" />
            <span>Adicionar Certificado</span>
          </Button>
        </div>

        {/* Importação em Lote */}
        <BulkCertificateImport />
      </Card>

      {/* Modal */}
      <AddLegacyCertificateModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={handleSuccess}
      />
    </div>
  )
}