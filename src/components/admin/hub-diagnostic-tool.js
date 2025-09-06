'use client'

import { useState } from 'react'
import Button from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { AlertCircle, CheckCircle, RefreshCw, Activity } from 'lucide-react'

export default function HubDiagnosticTool() {
  const [loading, setLoading] = useState(false)
  const [diagnosticResult, setDiagnosticResult] = useState(null)
  const [activateResult, setActivateResult] = useState(null)

  const runDiagnostic = async () => {
    setLoading(true)
    setDiagnosticResult(null)
    setActivateResult(null)
    
    try {
      const response = await fetch('/api/admin/check-hubs')
      const data = await response.json()
      
      if (!response.ok) {
        throw new Error(data.error || 'Erro ao executar diagnóstico')
      }
      
      setDiagnosticResult(data)
    } catch (error) {
      setDiagnosticResult({
        error: true,
        message: error.message
      })
    } finally {
      setLoading(false)
    }
  }

  const activateAllHubs = async () => {
    setLoading(true)
    setActivateResult(null)
    
    try {
      const response = await fetch('/api/admin/activate-hubs', {
        method: 'POST'
      })
      const data = await response.json()
      
      if (!response.ok) {
        throw new Error(data.error || 'Erro ao ativar hubs')
      }
      
      setActivateResult(data)
      // Re-run diagnostic after activation
      setTimeout(runDiagnostic, 1000)
    } catch (error) {
      setActivateResult({
        error: true,
        message: error.message
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card className="p-6">
      <div className="space-y-6">
        <div>
          <h2 className="text-xl font-semibold mb-2">Diagnóstico de Polos Educacionais</h2>
          <p className="text-gray-600 text-sm">
            Use esta ferramenta para verificar e corrigir problemas com os polos educacionais
          </p>
        </div>

        <div className="flex gap-4">
          <Button
            onClick={runDiagnostic}
            disabled={loading}
            className="flex items-center gap-2"
          >
            {loading ? (
              <RefreshCw className="w-4 h-4 animate-spin" />
            ) : (
              <Activity className="w-4 h-4" />
            )}
            Executar Diagnóstico
          </Button>

          {diagnosticResult && !diagnosticResult.error && diagnosticResult.summary?.inactiveHubs > 0 && (
            <Button
              onClick={activateAllHubs}
              disabled={loading}
              variant="secondary"
              className="flex items-center gap-2"
            >
              <CheckCircle className="w-4 h-4" />
              Ativar Todos os Hubs
            </Button>
          )}
        </div>

        {/* Diagnostic Results */}
        {diagnosticResult && (
          <div className="space-y-4">
            {diagnosticResult.error ? (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <div className="flex items-center gap-2 text-red-700">
                  <AlertCircle className="w-5 h-5" />
                  <span className="font-medium">Erro no diagnóstico</span>
                </div>
                <p className="text-sm text-red-600 mt-1">{diagnosticResult.message}</p>
              </div>
            ) : (
              <>
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <h3 className="font-medium text-blue-900 mb-2">Resumo do Diagnóstico</h3>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div>
                      <p className="text-blue-600">Total de Hubs</p>
                      <p className="font-semibold text-blue-900">{diagnosticResult.summary.totalHubs}</p>
                    </div>
                    <div>
                      <p className="text-blue-600">Hubs Ativos</p>
                      <p className="font-semibold text-blue-900">{diagnosticResult.summary.activeHubs}</p>
                    </div>
                    <div>
                      <p className="text-blue-600">Hubs Inativos</p>
                      <p className="font-semibold text-blue-900">{diagnosticResult.summary.inactiveHubs}</p>
                    </div>
                    <div>
                      <p className="text-blue-600">Visíveis aos Usuários</p>
                      <p className="font-semibold text-blue-900">{diagnosticResult.summary.visibleToUsers}</p>
                    </div>
                  </div>
                </div>

                {diagnosticResult.summary.totalHubs === 0 && (
                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                    <div className="flex items-center gap-2 text-yellow-700">
                      <AlertCircle className="w-5 h-5" />
                      <span className="font-medium">Nenhum hub encontrado</span>
                    </div>
                    <p className="text-sm text-yellow-600 mt-1">
                      Os polos educacionais não foram criados. Execute a migração ou use o botão "Ativar Todos os Hubs" para criá-los.
                    </p>
                  </div>
                )}

                {diagnosticResult.summary.inactiveHubs > 0 && (
                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                    <div className="flex items-center gap-2 text-yellow-700">
                      <AlertCircle className="w-5 h-5" />
                      <span className="font-medium">Hubs inativos detectados</span>
                    </div>
                    <p className="text-sm text-yellow-600 mt-1">
                      Existem {diagnosticResult.summary.inactiveHubs} hub(s) inativo(s). 
                      Isso explica por que apenas "Sem polo específico" aparece no formulário de criação de curso.
                    </p>
                  </div>
                )}

                {/* List of hubs */}
                {diagnosticResult.allHubs && diagnosticResult.allHubs.length > 0 && (
                  <div className="bg-gray-50 rounded-lg p-4">
                    <h3 className="font-medium text-gray-900 mb-3">Lista de Hubs</h3>
                    <div className="space-y-2">
                      {diagnosticResult.allHubs.map((hub) => (
                        <div key={hub.id} className="flex items-center justify-between p-2 bg-white rounded border">
                          <div>
                            <span className="font-medium">{hub.name}</span>
                            {hub.description && (
                              <p className="text-sm text-gray-600">{hub.description}</p>
                            )}
                          </div>
                          <span className={`px-2 py-1 text-xs rounded ${
                            hub.is_active 
                              ? 'bg-green-100 text-green-700' 
                              : 'bg-gray-100 text-gray-700'
                          }`}>
                            {hub.is_active ? 'Ativo' : 'Inativo'}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        )}

        {/* Activation Results */}
        {activateResult && (
          <div className="mt-4">
            {activateResult.error ? (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <div className="flex items-center gap-2 text-red-700">
                  <AlertCircle className="w-5 h-5" />
                  <span className="font-medium">Erro ao ativar hubs</span>
                </div>
                <p className="text-sm text-red-600 mt-1">{activateResult.message}</p>
              </div>
            ) : (
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <div className="flex items-center gap-2 text-green-700">
                  <CheckCircle className="w-5 h-5" />
                  <span className="font-medium">Sucesso</span>
                </div>
                <p className="text-sm text-green-600 mt-1">{activateResult.message}</p>
              </div>
            )}
          </div>
        )}
      </div>
    </Card>
  )
}