'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Card } from '@/components/ui/card'
import Button from '@/components/ui/button'
import { Power, AlertCircle, RefreshCw, BookOpen } from 'lucide-react'

const supabase = createClient()

export default function SieApiControl() {
  const [sieEnabled, setSieEnabled] = useState(false) // Estado inicial desabilitado
  const [loading, setLoading] = useState(false)
  const [initialLoading, setInitialLoading] = useState(true) // Carregamento inicial
  const [courseCount, setCourseCount] = useState(0)

  useEffect(() => {
    loadSieStatus()
  }, [])

  const loadSieStatus = async () => {
    try {
      console.log('Frontend: Iniciando carregamento do status SIE...')
      const response = await fetch('/api/sie/toggle')
      const data = await response.json()

      console.log('Frontend: Response da API:', { response: response.ok, data })
      
      if (response.ok) {
        console.log('Frontend: Definindo sieEnabled para:', data.enabled)
        setSieEnabled(data.enabled)
        setCourseCount(data.courseCount)
      } else {
        console.error('Erro ao carregar status SIE:', data.error)
      }
    } catch (error) {
      console.error('Erro ao carregar status SIE:', error)
    } finally {
      setInitialLoading(false) // Finaliza carregamento inicial
    }
  }

  const toggleSieApi = async () => {
    setLoading(true)

    try {
      const newStatus = !sieEnabled

      const response = await fetch('/api/sie/toggle', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ enabled: newStatus })
      })

      const data = await response.json()

      if (response.ok) {
        setSieEnabled(newStatus)
        alert(data.message)
      } else {
        throw new Error(data.error || 'Erro ao alterar status')
      }

    } catch (error) {
      console.error('Erro ao alterar status SIE:', error)
      alert('Erro ao alterar status da API SIE: ' + error.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card className="p-6">
      <div className="flex flex-col lg:flex-row items-start justify-between gap-4 max-w-full overflow-hidden">
        <div className="space-y-3 flex-1 min-w-0">
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-lg flex-shrink-0 ${
              sieEnabled 
                ? 'bg-green-100 text-green-700' 
                : 'bg-red-100 text-red-700'
            }`}>
              <Power className="w-5 h-5" />
            </div>
            <div className="min-w-0 flex-1">
              <h3 className="font-semibold text-lg truncate">Integração SIE</h3>
              <p className="text-sm text-gray-600">
                Status: {initialLoading ? (
                  <span className="text-gray-500">Carregando...</span>
                ) : (
                  <span className={`font-medium ${
                    sieEnabled ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {sieEnabled ? 'Ativa' : 'Pausada'}
                  </span>
                )}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3 sm:gap-6 text-sm text-gray-600">
            <div className="flex items-center gap-2 flex-shrink-0">
              <BookOpen className="w-4 h-4" />
              <span className="whitespace-nowrap">{courseCount} cursos SIE</span>
            </div>
            <a 
              href="https://www.sie.com.br/api/doc/" 
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 hover:underline flex items-center gap-1 flex-shrink-0"
            >
              <AlertCircle className="w-4 h-4" />
              <span className="whitespace-nowrap">Documentação API</span>
            </a>
          </div>

          {!sieEnabled && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 text-sm">
              <p className="text-yellow-800">
                <strong>Atenção:</strong> Com a API pausada, os cursos SIE não estão visíveis 
                para os alunos e novas matrículas estão bloqueadas.
              </p>
            </div>
          )}
        </div>

        <Button
          onClick={toggleSieApi}
          disabled={loading || initialLoading}
          variant={sieEnabled ? 'destructive' : 'primary'}
          className="w-full lg:w-auto min-w-[120px] sm:min-w-[140px] px-4 min-h-[44px] flex-shrink-0"
        >
          <span className="whitespace-nowrap">
            {loading ? (
              <div className="flex items-center gap-2">
                <RefreshCw className="w-4 h-4 animate-spin" />
                Processando...
              </div>
            ) : initialLoading ? (
              'Carregando...'
            ) : (
              sieEnabled ? 'Pausar API' : 'Ativar API'
            )}
          </span>
        </Button>
      </div>
    </Card>
  )
}