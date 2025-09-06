'use client'
import { useState } from 'react'
import { supabase } from '@/lib/supabase/client'
import Button from '@/components/ui/button'
import Input from '@/components/ui/input'
import { Card, CardContent, CardHeader } from '@/components/ui/card'

export default function DebugCertificatesSearchPage() {
  const [cpf, setCpf] = useState('')
  const [results, setResults] = useState(null)
  const [loading, setLoading] = useState(false)

  const debugSearch = async () => {
    if (!cpf || cpf.length !== 11) {
      alert('Digite um CPF com 11 dígitos')
      return
    }

    setLoading(true)
    try {
      // 1. Buscar todos os certificados na legacy_certificates (sem filtro is_active)
      const { data: allLegacy, error: errorAllLegacy } = await supabase
        .from('legacy_certificates')
        .select('*')
        .eq('cpf', cpf)

      // 2. Buscar certificados ativos na legacy_certificates
      const { data: activeLegacy, error: errorActiveLegacy } = await supabase
        .from('legacy_certificates')
        .select('*')
        .eq('cpf', cpf)
        .eq('is_active', true)

      // 3. Buscar na tabela certificados_antigos
      const { data: historical, error: errorHistorical } = await supabase
        .from('certificados_antigos')
        .select('*')
        .eq('cpf', cpf)
        .eq('is_active', true)

      // 4. Buscar matrículas concluídas com esse CPF
      const { data: enrollments, error: errorEnrollments } = await supabase
        .from('enrollments')
        .select(`
          id,
          completed_at,
          student_id,
          course_id,
          profiles!inner (
            full_name,
            cpf
          ),
          courses (
            title
          )
        `)
        .eq('profiles.cpf', cpf)
        .not('completed_at', 'is', null)

      setResults({
        cpfSearched: cpf,
        allLegacyCertificates: {
          count: allLegacy?.length || 0,
          data: allLegacy || [],
          error: errorAllLegacy
        },
        activeLegacyCertificates: {
          count: activeLegacy?.length || 0,
          data: activeLegacy || [],
          error: errorActiveLegacy
        },
        historicalCertificates: {
          count: historical?.length || 0,
          data: historical || [],
          error: errorHistorical
        },
        enrollments: {
          count: enrollments?.length || 0,
          data: enrollments || [],
          error: errorEnrollments
        }
      })

    } catch (error) {
      console.error('Debug error:', error)
      alert('Erro no debug: ' + error.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-6xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">🔍 Debug - Busca de Certificados</h1>
      
      <Card className="mb-6">
        <CardContent className="p-6">
          <div className="flex gap-4 items-end">
            <div className="flex-1">
              <label className="block text-sm font-medium mb-2">CPF (apenas números)</label>
              <Input
                value={cpf}
                onChange={(e) => setCpf(e.target.value.replace(/\D/g, ''))}
                placeholder="12345678901"
                maxLength={11}
              />
            </div>
            <Button 
              onClick={debugSearch}
              disabled={loading || cpf.length !== 11}
            >
              {loading ? 'Debugando...' : 'Debug Busca'}
            </Button>
          </div>
        </CardContent>
      </Card>

      {results && (
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <h2 className="text-lg font-semibold">📊 Resumo da Busca</h2>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center p-4 bg-blue-50 rounded">
                  <div className="text-2xl font-bold text-blue-600">
                    {results.allLegacyCertificates.count}
                  </div>
                  <div className="text-sm text-blue-800">Todos Legacy</div>
                </div>
                <div className="text-center p-4 bg-green-50 rounded">
                  <div className="text-2xl font-bold text-green-600">
                    {results.activeLegacyCertificates.count}
                  </div>
                  <div className="text-sm text-green-800">Legacy Ativos</div>
                </div>
                <div className="text-center p-4 bg-purple-50 rounded">
                  <div className="text-2xl font-bold text-purple-600">
                    {results.historicalCertificates.count}
                  </div>
                  <div className="text-sm text-purple-800">Históricos</div>
                </div>
                <div className="text-center p-4 bg-orange-50 rounded">
                  <div className="text-2xl font-bold text-orange-600">
                    {results.enrollments.count}
                  </div>
                  <div className="text-sm text-orange-800">Matrículas</div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Detalhes de cada busca */}
          {[
            { title: 'Todos os Certificados Legacy', data: results.allLegacyCertificates, color: 'blue' },
            { title: 'Certificados Legacy Ativos', data: results.activeLegacyCertificates, color: 'green' },
            { title: 'Certificados Históricos', data: results.historicalCertificates, color: 'purple' },
            { title: 'Matrículas Concluídas', data: results.enrollments, color: 'orange' }
          ].map((section, idx) => (
            <Card key={idx}>
              <CardHeader>
                <h3 className={`text-lg font-semibold text-${section.color}-700`}>
                  {section.title} ({section.data.count})
                </h3>
              </CardHeader>
              <CardContent>
                {section.data.error && (
                  <div className="bg-red-100 text-red-700 p-3 rounded mb-4">
                    <strong>Erro:</strong> {section.data.error.message}
                  </div>
                )}
                
                {section.data.count > 0 ? (
                  <div className="space-y-4">
                    {section.data.data.map((item, itemIdx) => (
                      <div key={itemIdx} className="bg-gray-50 p-4 rounded border">
                        <pre className="text-xs overflow-auto">
                          {JSON.stringify(item, null, 2)}
                        </pre>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-gray-500 text-center py-4">
                    Nenhum resultado encontrado
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}