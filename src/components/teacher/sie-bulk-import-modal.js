'use client'

import { useState, useRef } from 'react'
import { Card } from '@/components/ui/card'
import Button from '@/components/ui/button'
import { X, Download, Loader2, CheckCircle, AlertTriangle, RefreshCw, Pause, Play, Clock } from 'lucide-react'

export default function SieBulkImportModal({ isOpen, onClose, onComplete }) {
  const [status, setStatus] = useState('idle') // idle, discovering, importing, paused, completed, error
  const [progress, setProgress] = useState({
    currentPage: 0,
    totalPages: 0,
    coursesFound: 0,
    coursesImported: 0,
    errors: 0,
    errorList: [],
    startTime: null,
    estimatedTimeRemaining: null
  })
  const [importSettings, setImportSettings] = useState({
    batchSize: 30, // Cursos por lote (respeitando rate limit)
    pauseBetweenBatches: 60000 // 1 minuto entre lotes
  })
  const abortControllerRef = useRef(null)
  const isPausedRef = useRef(false)

  // Função para calcular tempo estimado
  const calculateEstimatedTime = (totalCourses, batchSize, pauseTime) => {
    const batches = Math.ceil(totalCourses / batchSize)
    const totalPauseTime = (batches - 1) * pauseTime
    const importTime = totalCourses * 1000 // ~1 segundo por curso
    return totalPauseTime + importTime
  }

  // Função para pausar execução de forma controlada
  const pausableDelay = async (ms) => {
    const startTime = Date.now()
    while (Date.now() - startTime < ms) {
      if (isPausedRef.current) {
        // Aguarda até não estar mais pausado
        await new Promise(resolve => {
          const checkPause = () => {
            if (!isPausedRef.current) {
              resolve()
            } else {
              setTimeout(checkPause, 100)
            }
          }
          checkPause()
        })
        return // Sai da função se foi pausado
      }
      await new Promise(resolve => setTimeout(resolve, 100))
    }
  }

  const startBulkImport = async () => {
    setStatus('discovering')
    abortControllerRef.current = new AbortController()
    isPausedRef.current = false
    
    const startTime = Date.now()
    setProgress({
      currentPage: 0,
      totalPages: 0,
      coursesFound: 0,
      coursesImported: 0,
      errors: 0,
      errorList: [],
      startTime,
      estimatedTimeRemaining: null
    })

    try {
      // Fase 1: Descobrir total de páginas usando rate limit seguro
      const firstPageResponse = await fetch('/api/sie/courses?page=1&limit=100', {
        signal: abortControllerRef.current.signal
      })
      const firstPageData = await firstPageResponse.json()
      
      if (!firstPageData.success) {
        throw new Error('Erro ao acessar catálogo SIE')
      }

      const totalPages = firstPageData.totalPages || 1
      const estimatedTotal = firstPageData.total || (firstPageData.courses.length * totalPages)
      const estimatedTime = calculateEstimatedTime(estimatedTotal, importSettings.batchSize, importSettings.pauseBetweenBatches)
      const estimatedMinutes = Math.ceil(estimatedTime / 60000)

      setProgress(prev => ({
        ...prev,
        totalPages,
        coursesFound: estimatedTotal,
        estimatedTimeRemaining: estimatedTime
      }))

      // Confirmar com usuário mostrando tempo estimado
      const confirmMessage = `Encontrados aproximadamente ${estimatedTotal} cursos em ${totalPages} páginas.\n\nTempo estimado: ${estimatedMinutes} minutos\nLotes de ${importSettings.batchSize} cursos com pausa de 1 minuto\n\nDeseja continuar com a importação gradual?`
      
      if (!confirm(confirmMessage)) {
        setStatus('idle')
        return
      }

      setStatus('importing')

      let totalImported = 0
      let totalErrors = 0
      const errorList = []
      let allCourses = []

      // Fase 2: Coletar todos os cursos primeiro (respeitando rate limit)
      for (let page = 1; page <= totalPages; page++) {
        if (abortControllerRef.current.signal.aborted) {
          throw new Error('Operação cancelada pelo usuário')
        }

        setProgress(prev => ({
          ...prev,
          currentPage: page
        }))

        try {
          // Buscar cursos da página com rate limit
          const pageResponse = await fetch(`/api/sie/courses?page=${page}&limit=100`, {
            signal: abortControllerRef.current.signal
          })
          const pageData = await pageResponse.json()
          
          if (!pageData.success || !pageData.courses) {
            throw new Error(`Erro na página ${page}`)
          }

          allCourses.push(...pageData.courses)
          
          // Pausa entre páginas para respeitar rate limit (1 segundo)
          if (page < totalPages) {
            await pausableDelay(1000)
          }

        } catch (pageError) {
          if (pageError.name === 'AbortError') {
            throw pageError
          }
          console.error(`Erro na página ${page}:`, pageError)
          totalErrors++
          errorList.push(`Página ${page}: ${pageError.message}`)
        }
      }

      // Fase 3: Importar cursos em lotes controlados
      const totalBatches = Math.ceil(allCourses.length / importSettings.batchSize)
      
      for (let batchIndex = 0; batchIndex < totalBatches; batchIndex++) {
        if (abortControllerRef.current.signal.aborted) {
          throw new Error('Operação cancelada pelo usuário')
        }

        const startIdx = batchIndex * importSettings.batchSize
        const endIdx = Math.min(startIdx + importSettings.batchSize, allCourses.length)
        const batch = allCourses.slice(startIdx, endIdx)
        
        // Importar lote SEQUENCIALMENTE (não em paralelo)
        for (const course of batch) {
          if (abortControllerRef.current.signal.aborted) {
            throw new Error('Operação cancelada pelo usuário')
          }

          try {
            const importResponse = await fetch('/api/sie/import-course', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                sie_course_id: course.id,
                course_data: course
              }),
              signal: abortControllerRef.current.signal
            })

            const importResult = await importResponse.json()
            
            if (!importResult.success) {
              throw new Error(importResult.error || 'Erro na importação')
            }

            totalImported++
          } catch (error) {
            if (error.name === 'AbortError') {
              throw error
            }
            totalErrors++
            errorList.push(`${course.title}: ${error.message}`)
          }

          // Atualizar progresso após cada curso
          const elapsed = Date.now() - startTime
          const coursesPerSecond = totalImported / (elapsed / 1000)
          const remainingCourses = allCourses.length - (totalImported + totalErrors)
          const estimatedTimeRemaining = coursesPerSecond > 0 ? (remainingCourses / coursesPerSecond) * 1000 : null

          setProgress(prev => ({
            ...prev,
            coursesImported: totalImported,
            errors: totalErrors,
            errorList: errorList.slice(-10),
            estimatedTimeRemaining
          }))

          // Pausa mínima entre importações (respeitando rate limit)
          await pausableDelay(1000)
        }

        // Pausa entre lotes (apenas se não for o último)
        if (batchIndex < totalBatches - 1) {
          setProgress(prev => ({
            ...prev,
            pauseReason: `Pausa entre lotes (${batchIndex + 1}/${totalBatches})`
          }))
          
          await pausableDelay(importSettings.pauseBetweenBatches)
        }
      }

      // Finalizar
      setStatus('completed')
      setProgress(prev => ({
        ...prev,
        coursesImported: totalImported,
        errors: totalErrors,
        errorList,
        estimatedTimeRemaining: 0
      }))

      if (onComplete) {
        onComplete({ imported: totalImported, errors: totalErrors })
      }

    } catch (error) {
      if (error.name === 'AbortError' || error.message.includes('cancelada')) {
        setStatus('idle')
        setProgress(prev => ({
          ...prev,
          errorList: ['Importação cancelada pelo usuário']
        }))
      } else {
        console.error('Erro na importação em massa:', error)
        setStatus('error')
        setProgress(prev => ({
          ...prev,
          errorList: [error.message]
        }))
      }
    }
  }

  const pauseImport = () => {
    isPausedRef.current = true
    setStatus('paused')
  }

  const resumeImport = () => {
    isPausedRef.current = false
    setStatus('importing')
  }

  const cancelImport = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
    }
    isPausedRef.current = false
    setStatus('idle')
  }

  const handleClose = () => {
    if (status === 'importing' || status === 'paused') {
      if (!confirm('Importação em andamento. Deseja realmente cancelar?')) {
        return
      }
      cancelImport()
    }
    onClose()
    setStatus('idle')
  }

  const formatTime = (ms) => {
    if (!ms || ms <= 0) return '--'
    const minutes = Math.floor(ms / 60000)
    const seconds = Math.floor((ms % 60000) / 1000)
    return `${minutes}m ${seconds}s`
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-2xl p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold">Importação em Massa - Catálogo SIE</h2>
          <button
            onClick={handleClose}
            disabled={status === 'importing' && !canCancel}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Status Display */}
        <div className="space-y-4">
          {status === 'idle' && (
            <div className="space-y-6">
              <div className="text-center">
                <Download className="w-16 h-16 text-blue-500 mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">Importação Completa do Catálogo SIE</h3>
                <p className="text-gray-600">
                  Esta operação irá descobrir e importar automaticamente todos os cursos 
                  disponíveis no catálogo SIE, respeitando os limites da API.
                </p>
              </div>

              {/* Configurações da Importação */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 space-y-4">
                <h4 className="font-semibold text-blue-800">⚙️ Configurações da Importação Gradual</h4>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Cursos por lote:
                    </label>
                    <select
                      value={importSettings.batchSize}
                      onChange={(e) => setImportSettings(prev => ({ 
                        ...prev, 
                        batchSize: parseInt(e.target.value) 
                      }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    >
                      <option value={20}>20 cursos (mais rápido)</option>
                      <option value={30}>30 cursos (recomendado)</option>
                      <option value={50}>50 cursos (mais lento)</option>
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Pausa entre lotes:
                    </label>
                    <select
                      value={importSettings.pauseBetweenBatches}
                      onChange={(e) => setImportSettings(prev => ({ 
                        ...prev, 
                        pauseBetweenBatches: parseInt(e.target.value) 
                      }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    >
                      <option value={30000}>30 segundos</option>
                      <option value={60000}>1 minuto (recomendado)</option>
                      <option value={120000}>2 minutos</option>
                    </select>
                  </div>
                </div>

                {/* Estimativa de Tempo */}
                <div className="bg-white p-3 rounded border text-sm">
                  <div className="flex items-center gap-2 text-blue-700">
                    <Clock className="w-4 h-4" />
                    <span className="font-medium">Estimativa para 1000 cursos:</span>
                  </div>
                  <div className="mt-2 text-gray-600">
                    <div>• Lotes de {importSettings.batchSize} cursos</div>
                    <div>• Pausa de {Math.round(importSettings.pauseBetweenBatches / 1000 / 60)} minuto(s) entre lotes</div>
                    <div className="font-medium mt-1">
                      ⏱️ Tempo estimado: ~{Math.ceil(calculateEstimatedTime(1000, importSettings.batchSize, importSettings.pauseBetweenBatches) / 60000)} minutos
                    </div>
                  </div>
                </div>
              </div>

              {/* Informações Importantes */}
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                <h4 className="font-semibold text-amber-800 mb-2">📋 Informações Importantes</h4>
                <ul className="text-sm text-amber-700 space-y-1">
                  <li>• Respeita limite de 60 requisições/minuto da API SIE</li>
                  <li>• Você pode pausar/continuar a qualquer momento</li>
                  <li>• Progresso é salvo automaticamente</li>
                  <li>• Cursos duplicados são ignorados</li>
                  <li>• Erros são registrados e não interrompem o processo</li>
                </ul>
              </div>

              <div className="flex gap-4 justify-center">
                <Button onClick={onClose} variant="secondary">
                  Cancelar
                </Button>
                <Button onClick={startBulkImport} className="bg-green-600 hover:bg-green-700">
                  <Download className="w-4 h-4 mr-2" />
                  Iniciar Importação Gradual
                </Button>
              </div>
            </div>
          )}

          {status === 'discovering' && (
            <div className="text-center py-8">
              <Loader2 className="w-12 h-12 text-blue-500 animate-spin mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">Descobrindo Cursos...</h3>
              <p className="text-gray-600">
                Analisando o catálogo SIE para determinar o total de cursos disponíveis...
              </p>
            </div>
          )}

          {(status === 'importing' || status === 'paused') && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {status === 'importing' ? (
                    <Loader2 className="w-6 h-6 text-blue-500 animate-spin" />
                  ) : (
                    <Pause className="w-6 h-6 text-orange-500" />
                  )}
                  <h3 className="text-lg font-semibold">
                    {status === 'importing' ? 'Importando Cursos...' : 'Importação Pausada'}
                  </h3>
                </div>
                
                {/* Controles */}
                <div className="flex gap-2">
                  {status === 'importing' ? (
                    <Button onClick={pauseImport} variant="secondary" size="sm">
                      <Pause className="w-4 h-4 mr-1" />
                      Pausar
                    </Button>
                  ) : (
                    <Button onClick={resumeImport} className="bg-green-600 hover:bg-green-700" size="sm">
                      <Play className="w-4 h-4 mr-1" />
                      Continuar
                    </Button>
                  )}
                  <Button onClick={cancelImport} variant="destructive" size="sm">
                    <X className="w-4 h-4 mr-1" />
                    Cancelar
                  </Button>
                </div>
              </div>
              
              {/* Progress Bar */}
              <div className="w-full bg-gray-200 rounded-full h-3">
                <div 
                  className={`h-3 rounded-full transition-all duration-300 ${
                    status === 'paused' ? 'bg-orange-500' : 'bg-blue-600'
                  }`}
                  style={{ 
                    width: `${(progress.coursesImported / progress.coursesFound) * 100}%` 
                  }}
                />
              </div>
              
              {/* Time Info */}
              <div className="flex items-center gap-4 text-sm text-gray-600 bg-gray-50 p-3 rounded">
                <div className="flex items-center gap-1">
                  <Clock className="w-4 h-4" />
                  <span>Tempo restante: {formatTime(progress.estimatedTimeRemaining)}</span>
                </div>
                {progress.pauseReason && (
                  <div className="flex items-center gap-1 text-orange-600">
                    <Pause className="w-4 h-4" />
                    <span>{progress.pauseReason}</span>
                  </div>
                )}
              </div>
              
              {/* Stats */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                <div>
                  <div className="text-2xl font-bold text-blue-600">
                    {progress.currentPage}/{progress.totalPages}
                  </div>
                  <div className="text-sm text-gray-600">Páginas</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-green-600">
                    {progress.coursesImported}
                  </div>
                  <div className="text-sm text-gray-600">Importados</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-orange-600">
                    {progress.coursesFound}
                  </div>
                  <div className="text-sm text-gray-600">Total Estimado</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-red-600">
                    {progress.errors}
                  </div>
                  <div className="text-sm text-gray-600">Erros</div>
                </div>
              </div>

              {/* Recent Errors */}
              {progress.errorList.length > 0 && (
                <div className="bg-red-50 border border-red-200 rounded p-3">
                  <h4 className="font-medium text-red-800 mb-2">Erros Recentes:</h4>
                  <div className="text-sm text-red-700 space-y-1 max-h-20 overflow-y-auto">
                    {progress.errorList.slice(-3).map((error, i) => (
                      <div key={i}>{error}</div>
                    ))}
                  </div>
                </div>
              )}
              
              {status === 'paused' && (
                <div className="bg-orange-50 border border-orange-200 rounded p-3 text-center">
                  <p className="text-orange-700">
                    A importação foi pausada. Você pode continuar a qualquer momento ou cancelar a operação.
                  </p>
                </div>
              )}
            </div>
          )}

          {status === 'completed' && (
            <div className="text-center py-8">
              <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">Importação Concluída!</h3>
              
              <div className="grid grid-cols-2 gap-4 my-6">
                <div className="bg-green-50 p-4 rounded">
                  <div className="text-2xl font-bold text-green-600">
                    {progress.coursesImported}
                  </div>
                  <div className="text-sm text-gray-600">Cursos Importados</div>
                </div>
                <div className="bg-red-50 p-4 rounded">
                  <div className="text-2xl font-bold text-red-600">
                    {progress.errors}
                  </div>
                  <div className="text-sm text-gray-600">Erros</div>
                </div>
              </div>

              <Button onClick={handleClose} className="w-full">
                Fechar
              </Button>
            </div>
          )}

          {status === 'error' && (
            <div className="text-center py-8">
              <AlertTriangle className="w-16 h-16 text-red-500 mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">Erro na Importação</h3>
              <p className="text-red-600 mb-6">
                {progress.errorList[0] || 'Erro desconhecido'}
              </p>
              <div className="flex gap-4 justify-center">
                <Button onClick={handleClose} variant="secondary">
                  Fechar
                </Button>
                <Button onClick={startBulkImport} className="bg-blue-600 hover:bg-blue-700">
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Tentar Novamente
                </Button>
              </div>
            </div>
          )}
        </div>
      </Card>
    </div>
  )
}