'use client'

import { useState, useEffect } from 'react'
import { Card } from '@/components/ui/card'
import Button from '@/components/ui/button'
import { auditLogger } from '@/lib/audit/logger'
import { 
  Shield, 
  Clock, 
  User, 
  AlertTriangle,
  CheckCircle,
  Filter,
  RefreshCw,
  Download,
  Eye,
  Trash2,
  UserX,
  FileText
} from 'lucide-react'

export default function AuditLogsComponent() {
  const [logs, setLogs] = useState([])
  const [filteredLogs, setFilteredLogs] = useState([])
  const [filterAction, setFilterAction] = useState('all')
  const [filterSeverity, setFilterSeverity] = useState('all')
  const [loading, setLoading] = useState(false)

  const actionIcons = {
    user_delete: UserX,
    user_role_change: User,
    course_delete: Trash2,
    course_approve: CheckCircle,
    course_reject: AlertTriangle,
    enrollment_delete: FileText,
    certificate_delete: FileText,
    bulk_delete: Trash2,
    storage_cleanup: RefreshCw,
    teacher_create: User
  }

  const severityColors = {
    low: 'text-green-600 bg-green-50 border-green-200',
    medium: 'text-blue-600 bg-blue-50 border-blue-200',
    high: 'text-orange-600 bg-orange-50 border-orange-200',
    critical: 'text-red-600 bg-red-50 border-red-200'
  }

  const actionLabels = {
    user_delete: 'Usuário Deletado',
    user_role_change: 'Papel Alterado',
    course_delete: 'Curso Deletado',
    course_approve: 'Curso Aprovado',
    course_reject: 'Curso Rejeitado',
    enrollment_delete: 'Matrícula Removida',
    certificate_delete: 'Certificado Deletado',
    bulk_delete: 'Operação em Lote',
    storage_cleanup: 'Limpeza de Storage',
    teacher_create: 'Professor Criado'
  }

  useEffect(() => {
    loadLogs()
  }, [])

  useEffect(() => {
    applyFilters()
  }, [logs, filterAction, filterSeverity])

  const loadLogs = () => {
    setLoading(true)
    try {
      const auditLogs = auditLogger.getLogs(100)
      setLogs(auditLogs)
    } catch (error) {
      console.error('Erro ao carregar logs:', error)
    } finally {
      setLoading(false)
    }
  }

  const applyFilters = () => {
    let filtered = [...logs]

    if (filterAction !== 'all') {
      filtered = filtered.filter(log => log.action === filterAction)
    }

    if (filterSeverity !== 'all') {
      filtered = filtered.filter(log => log.severity === filterSeverity)
    }

    setFilteredLogs(filtered)
  }

  const clearLogs = () => {
    if (window.confirm('Tem certeza que deseja limpar todos os logs de auditoria?')) {
      auditLogger.clearOldLogs()
      loadLogs()
    }
  }

  const exportLogs = () => {
    const dataStr = JSON.stringify(filteredLogs, null, 2)
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr)
    
    const exportFileDefaultName = `audit_logs_${new Date().toISOString().split('T')[0]}.json`
    
    const linkElement = document.createElement('a')
    linkElement.setAttribute('href', dataUri)
    linkElement.setAttribute('download', exportFileDefaultName)
    linkElement.click()
  }

  const formatTimestamp = (timestamp) => {
    return new Date(timestamp).toLocaleString('pt-BR', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    })
  }

  const getActionIcon = (action) => {
    const IconComponent = actionIcons[action] || Shield
    return <IconComponent className="w-4 h-4" />
  }

  const getSeverityStats = () => {
    const stats = {
      low: 0,
      medium: 0,
      high: 0,
      critical: 0
    }

    logs.forEach(log => {
      if (stats.hasOwnProperty(log.severity)) {
        stats[log.severity]++
      }
    })

    return stats
  }

  const getActionStats = () => {
    const stats = {}
    logs.forEach(log => {
      stats[log.action] = (stats[log.action] || 0) + 1
    })
    return stats
  }

  const severityStats = getSeverityStats()
  const actionStats = getActionStats()

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            Logs de Auditoria
          </h2>
          <p className="text-gray-600">
            Histórico de ações sensíveis executadas por administradores
          </p>
        </div>
        
        <div className="flex gap-2">
          <Button
            onClick={loadLogs}
            disabled={loading}
            variant="outline"
            className="flex items-center gap-2"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            Atualizar
          </Button>
          
          <Button
            onClick={exportLogs}
            variant="outline"
            className="flex items-center gap-2"
          >
            <Download className="w-4 h-4" />
            Exportar
          </Button>
          
          <Button
            onClick={clearLogs}
            variant="outline"
            className="flex items-center gap-2 text-red-600 hover:text-red-700"
          >
            <Trash2 className="w-4 h-4" />
            Limpar Logs
          </Button>
        </div>
      </div>

      {/* Estatísticas */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 mb-1">
                Total de Logs
              </p>
              <p className="text-2xl font-bold text-gray-900">
                {logs.length}
              </p>
            </div>
            <Shield className="w-8 h-8 text-blue-600" />
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 mb-1">
                Alta Severidade
              </p>
              <p className="text-2xl font-bold text-orange-600">
                {severityStats.high + severityStats.critical}
              </p>
            </div>
            <AlertTriangle className="w-8 h-8 text-orange-600" />
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 mb-1">
                Últimas 24h
              </p>
              <p className="text-2xl font-bold text-gray-900">
                {logs.filter(log => {
                  const logDate = new Date(log.timestamp)
                  const now = new Date()
                  return (now - logDate) < 24 * 60 * 60 * 1000
                }).length}
              </p>
            </div>
            <Clock className="w-8 h-8 text-green-600" />
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 mb-1">
                Ações Filtradas
              </p>
              <p className="text-2xl font-bold text-gray-900">
                {filteredLogs.length}
              </p>
            </div>
            <Filter className="w-8 h-8 text-purple-600" />
          </div>
        </Card>
      </div>

      {/* Filtros */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Filtros</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Tipo de Ação
            </label>
            <select
              value={filterAction}
              onChange={(e) => setFilterAction(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">Todas as ações</option>
              {Object.entries(actionLabels).map(([key, label]) => (
                <option key={key} value={key}>
                  {label} ({actionStats[key] || 0})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Severidade
            </label>
            <select
              value={filterSeverity}
              onChange={(e) => setFilterSeverity(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">Todas as severidades</option>
              <option value="low">Baixa ({severityStats.low})</option>
              <option value="medium">Média ({severityStats.medium})</option>
              <option value="high">Alta ({severityStats.high})</option>
              <option value="critical">Crítica ({severityStats.critical})</option>
            </select>
          </div>
        </div>
      </Card>

      {/* Lista de Logs */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Registros de Auditoria ({filteredLogs.length})
        </h3>
        
        {filteredLogs.length === 0 ? (
          <div className="text-center py-8">
            <Shield className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500">Nenhum log encontrado com os filtros selecionados</p>
          </div>
        ) : (
          <div className="space-y-3 max-h-96 overflow-y-auto">
            {filteredLogs.map((log, index) => (
              <div key={index} className="flex items-start justify-between p-4 bg-gray-50 rounded-lg border">
                <div className="flex items-start gap-3 flex-1">
                  <div className="flex-shrink-0 mt-1">
                    {getActionIcon(log.action)}
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-medium text-gray-900">
                        {actionLabels[log.action] || log.action}
                      </span>
                      <span className={`px-2 py-1 text-xs font-semibold rounded-full border ${severityColors[log.severity] || severityColors.medium}`}>
                        {log.severity}
                      </span>
                    </div>
                    
                    <p className="text-sm text-gray-600 mb-2">
                      <span className="font-medium">Ator:</span> {log.actor_id} • 
                      <span className="font-medium"> Alvo:</span> {log.target_type}/{log.target_id}
                    </p>
                    
                    <p className="text-xs text-gray-500">
                      {formatTimestamp(log.timestamp)}
                      {log.ip_address && ` • IP: ${log.ip_address}`}
                    </p>
                    
                    {log.details && (
                      <details className="mt-2">
                        <summary className="text-xs text-blue-600 cursor-pointer hover:text-blue-800">
                          Ver detalhes
                        </summary>
                        <pre className="mt-1 text-xs text-gray-600 bg-white p-2 rounded border overflow-x-auto">
                          {JSON.stringify(JSON.parse(log.details), null, 2)}
                        </pre>
                      </details>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* Informações */}
      <Card className="p-6 bg-blue-50 border-blue-200">
        <h3 className="text-lg font-semibold text-blue-900 mb-3">
          ℹ️ Sobre os Logs de Auditoria
        </h3>
        <div className="space-y-2 text-sm text-blue-800">
          <p>
            • <strong>Armazenamento:</strong> Os logs são armazenados localmente para demonstração
          </p>
          <p>
            • <strong>Severidade:</strong> Crítica (falhas de segurança), Alta (deleções), Média (modificações), Baixa (consultas)
          </p>
          <p>
            • <strong>Retenção:</strong> Últimos 100 registros são mantidos automaticamente
          </p>
          <p>
            • <strong>Exportação:</strong> Logs podem ser exportados em formato JSON para análise externa
          </p>
        </div>
      </Card>
    </div>
  )
}