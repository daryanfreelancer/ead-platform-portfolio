'use client'

import { useState } from 'react'
import { Card } from '@/components/ui/card'
import Button from '@/components/ui/button'
import { StorageCleanup } from '@/lib/storage/cleanup'
import { auditLogger } from '@/lib/audit/logger'
import { createClient } from '@/lib/supabase/client'
import { 
  HardDrive, 
  Trash2, 
  RefreshCw, 
  AlertTriangle,
  CheckCircle,
  FileText,
  FolderOpen
} from 'lucide-react'

export default function StorageCleanupComponent() {
  const [orphanedFiles, setOrphanedFiles] = useState({})
  const [loading, setLoading] = useState(false)
  const [scanning, setScanning] = useState(false)
  const [cleanupResults, setCleanupResults] = useState(null)

  const storageCleanup = new StorageCleanup()
  const supabase = createClient()

  const buckets = [
    { name: 'avatars', label: 'Avatares de Usuários' },
    { name: 'course-thumbnails', label: 'Thumbnails de Cursos' },
    { name: 'course-files', label: 'Arquivos de Cursos' }
  ]

  const scanForOrphanedFiles = async () => {
    setScanning(true)
    setOrphanedFiles({})
    
    try {
      const results = {}
      
      for (const bucket of buckets) {
        const files = await storageCleanup.findOrphanedFiles(bucket.name)
        results[bucket.name] = files
      }
      
      setOrphanedFiles(results)
    } catch (error) {
      console.error('Erro ao escanear arquivos órfãos:', error)
      alert('Erro ao escanear arquivos órfãos: ' + error.message)
    } finally {
      setScanning(false)
    }
  }

  const cleanupBucket = async (bucketName) => {
    setLoading(true)
    
    try {
      const results = await storageCleanup.cleanupOrphanedFiles(bucketName)
      
      // Atualizar a lista de arquivos órfãos removendo os que foram deletados
      setOrphanedFiles(prev => ({
        ...prev,
        [bucketName]: []
      }))
      
      setCleanupResults({
        bucket: bucketName,
        results: results
      })

      // Registrar auditoria
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        await auditLogger.logStorageCleanup(user.id, bucketName, results)
      }
      
      alert(`Limpeza do bucket "${bucketName}" concluída! ${results.length} arquivo(s) processado(s).`)
    } catch (error) {
      console.error('Erro ao limpar bucket:', error)
      alert('Erro ao limpar bucket: ' + error.message)
    } finally {
      setLoading(false)
    }
  }

  const getTotalOrphanedFiles = () => {
    return Object.values(orphanedFiles).reduce((total, files) => total + files.length, 0)
  }

  const formatFileSize = (bytes) => {
    if (!bytes) return 'N/A'
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(1024))
    return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i]
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            Limpeza de Arquivos
          </h2>
          <p className="text-gray-600">
            Encontre e remova arquivos órfãos no storage para economizar espaço
          </p>
        </div>
        
        <Button
          onClick={scanForOrphanedFiles}
          disabled={scanning}
          className="flex items-center gap-2"
        >
          {scanning ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
              Escaneando...
            </>
          ) : (
            <>
              <RefreshCw className="w-4 h-4" />
              Escanear Arquivos
            </>
          )}
        </Button>
      </div>

      {/* Estatísticas */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 mb-1">
                Total de Buckets
              </p>
              <p className="text-2xl font-bold text-gray-900">
                {buckets.length}
              </p>
            </div>
            <HardDrive className="w-8 h-8 text-blue-600" />
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 mb-1">
                Arquivos Órfãos
              </p>
              <p className="text-2xl font-bold text-gray-900">
                {getTotalOrphanedFiles()}
              </p>
            </div>
            <FileText className="w-8 h-8 text-orange-600" />
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 mb-1">
                Buckets Escaneados
              </p>
              <p className="text-2xl font-bold text-gray-900">
                {Object.keys(orphanedFiles).length}
              </p>
            </div>
            <FolderOpen className="w-8 h-8 text-green-600" />
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 mb-1">
                Status
              </p>
              <p className="text-sm font-bold text-gray-900">
                {scanning ? 'Escaneando' : getTotalOrphanedFiles() > 0 ? 'Limpeza Necessária' : 'Limpo'}
              </p>
            </div>
            {getTotalOrphanedFiles() > 0 ? (
              <AlertTriangle className="w-8 h-8 text-yellow-600" />
            ) : (
              <CheckCircle className="w-8 h-8 text-green-600" />
            )}
          </div>
        </Card>
      </div>

      {/* Lista de Buckets */}
      <div className="space-y-4">
        {buckets.map((bucket) => {
          const files = orphanedFiles[bucket.name] || []
          
          return (
            <Card key={bucket.name} className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">
                    {bucket.label}
                  </h3>
                  <p className="text-sm text-gray-600">
                    Bucket: {bucket.name}
                  </p>
                </div>

                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <p className="text-sm text-gray-600">Arquivos órfãos</p>
                    <p className="text-xl font-bold text-gray-900">
                      {files.length}
                    </p>
                  </div>

                  {files.length > 0 && (
                    <Button
                      onClick={() => cleanupBucket(bucket.name)}
                      disabled={loading}
                      variant="outline"
                      className="text-red-600 hover:text-red-700"
                    >
                      <Trash2 className="w-4 h-4 mr-2" />
                      Limpar Bucket
                    </Button>
                  )}
                </div>
              </div>

              {files.length > 0 && (
                <div className="border-t pt-4">
                  <p className="text-sm text-gray-600 mb-3">
                    Arquivos encontrados:
                  </p>
                  <div className="max-h-48 overflow-y-auto space-y-1">
                    {files.slice(0, 10).map((file, index) => (
                      <div key={index} className="flex items-center justify-between text-sm bg-gray-50 p-2 rounded">
                        <span className="text-gray-700">{file.name}</span>
                        <span className="text-gray-500">{formatFileSize(file.metadata?.size)}</span>
                      </div>
                    ))}
                    {files.length > 10 && (
                      <p className="text-xs text-gray-500 text-center pt-2">
                        E mais {files.length - 10} arquivo(s)...
                      </p>
                    )}
                  </div>
                </div>
              )}

              {bucket.name in orphanedFiles && files.length === 0 && (
                <div className="border-t pt-4 text-center">
                  <CheckCircle className="w-8 h-8 text-green-500 mx-auto mb-2" />
                  <p className="text-sm text-green-600">
                    Nenhum arquivo órfão encontrado
                  </p>
                </div>
              )}
            </Card>
          )
        })}
      </div>

      {/* Resultados da Limpeza */}
      {cleanupResults && (
        <Card className="p-6 bg-green-50 border-green-200">
          <h3 className="text-lg font-semibold text-green-900 mb-3">
            ✅ Limpeza Concluída - {cleanupResults.bucket}
          </h3>
          <div className="space-y-2">
            {cleanupResults.results.map((result, index) => (
              <div key={index} className="flex items-center justify-between text-sm">
                <span className="text-green-800">{result.file}</span>
                <span className={result.success ? 'text-green-600' : 'text-red-600'}>
                  {result.success ? '✓ Deletado' : '✗ Erro'}
                </span>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Instruções */}
      <Card className="p-6 bg-blue-50 border-blue-200">
        <h3 className="text-lg font-semibold text-blue-900 mb-3">
          ℹ️ Como Funciona
        </h3>
        <div className="space-y-2 text-sm text-blue-800">
          <p>
            • <strong>Escanear:</strong> Analisa todos os buckets em busca de arquivos órfãos
          </p>
          <p>
            • <strong>Arquivos Órfãos:</strong> Arquivos no storage que não são referenciados no banco de dados
          </p>
          <p>
            • <strong>Limpeza:</strong> Remove permanentemente os arquivos órfãos para economizar espaço
          </p>
          <p>
            • <strong>Segurança:</strong> A verificação é feita contra o banco de dados antes da exclusão
          </p>
        </div>
      </Card>
    </div>
  )
}