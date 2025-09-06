'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import Button from '@/components/ui/button'
import { Check, X, AlertTriangle } from 'lucide-react'

const supabase = createClient()

export function CourseApprovalButton({ courseId }) {
  const [loading, setLoading] = useState(false)
  const [showConfirm, setShowConfirm] = useState(null) // 'approve' | 'reject' | null
  const router = useRouter()

  const handleApproval = async (action) => {
    setLoading(true)

    try {
      const newStatus = action === 'approve' ? 'published' : 'draft'
      
      const { error } = await supabase
        .from('courses')
        .update({ 
          status: newStatus,
          updated_at: new Date().toISOString()
        })
        .eq('id', courseId)

      if (error) {
        throw new Error(error.message)
      }

      // Refresh da página para mostrar as mudanças
      router.refresh()
      setShowConfirm(null)

    } catch (error) {
      console.error(`Erro ao ${action === 'approve' ? 'aprovar' : 'rejeitar'} curso:`, error)
      alert(`Erro ao ${action === 'approve' ? 'aprovar' : 'rejeitar'} curso: ${error.message}`)
    } finally {
      setLoading(false)
    }
  }

  if (showConfirm) {
    return (
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 p-3 bg-gray-50 rounded-lg border max-w-full overflow-hidden">
        <div className="flex items-center gap-2 min-w-0">
          <AlertTriangle className="w-4 h-4 text-orange-500 flex-shrink-0" />
          <span className="text-sm text-gray-700 whitespace-nowrap">
            {showConfirm === 'approve' ? 'Aprovar curso?' : 'Rejeitar curso?'}
          </span>
        </div>
        <div className="flex flex-wrap gap-2 w-full sm:w-auto">
          <Button
            size="sm"
            onClick={() => handleApproval(showConfirm)}
            disabled={loading}
            className="bg-green-600 hover:bg-green-700 text-white px-3 py-2 text-xs min-h-[44px] flex-1 sm:flex-none"
          >
            <span className="whitespace-nowrap">{loading ? 'Processando...' : 'Confirmar'}</span>
          </Button>
          <Button
            size="sm"
            variant="secondary"
            onClick={() => setShowConfirm(null)}
            disabled={loading}
            className="px-3 py-2 text-xs min-h-[44px] flex-1 sm:flex-none"
          >
            <span className="whitespace-nowrap">Cancelar</span>
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-wrap items-center gap-2 max-w-full overflow-hidden">
      <Button
        size="sm"
        onClick={() => setShowConfirm('approve')}
        className="bg-green-600 hover:bg-green-700 text-white flex items-center gap-1 px-3 py-2 text-sm min-h-[44px] flex-shrink-0"
      >
        <Check className="w-3 h-3" />
        <span className="whitespace-nowrap">Aprovar</span>
      </Button>
      
      <Button
        size="sm"
        variant="secondary"
        onClick={() => setShowConfirm('reject')}
        className="border-red-300 text-red-700 hover:bg-red-50 flex items-center gap-1 px-3 py-2 text-sm min-h-[44px] flex-shrink-0"
      >
        <X className="w-3 h-3" />
        <span className="whitespace-nowrap">Rejeitar</span>
      </Button>
    </div>
  )
}