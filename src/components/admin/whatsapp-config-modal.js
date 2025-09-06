'use client'

import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { X, MessageCircle, Phone, AlertCircle, CheckCircle } from 'lucide-react'
import Button from '@/components/ui/button'
import Input from '@/components/ui/input'

const whatsappSchema = z.object({
  whatsapp_number: z.string()
    .min(10, 'Número deve ter pelo menos 10 dígitos')
    .max(15, 'Número muito longo')
    .regex(/^[0-9]+$/, 'Use apenas números'),
  whatsapp_message_template: z.string()
    .min(10, 'Mensagem deve ter pelo menos 10 caracteres')
    .max(500, 'Mensagem muito longa')
})

export default function WhatsAppConfigModal({ isOpen, onClose, config, onSave }) {
  const [isSaving, setIsSaving] = useState(false)
  const [saveStatus, setSaveStatus] = useState(null)
  const [previewUrl, setPreviewUrl] = useState('')

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors }
  } = useForm({
    resolver: zodResolver(whatsappSchema),
    defaultValues: {
      whatsapp_number: '',
      whatsapp_message_template: 'Olá! Gostaria de mais informações sobre o curso: {CURSO_NOME}'
    }
  })

  // Watch form values for preview
  const watchedNumber = watch('whatsapp_number')
  const watchedMessage = watch('whatsapp_message_template')

  // Preencher dados do config atual
  useEffect(() => {
    if (config && isOpen) {
      setValue('whatsapp_number', config.whatsapp_number || '')
      setValue('whatsapp_message_template', config.whatsapp_message_template || 'Olá! Gostaria de mais informações sobre o curso: {CURSO_NOME}')
    }
  }, [config, isOpen, setValue])

  // Gerar preview da URL do WhatsApp
  useEffect(() => {
    if (watchedNumber && watchedMessage) {
      const sampleMessage = watchedMessage.replace('{CURSO_NOME}', 'Nome do Curso Exemplo')
      const encodedMessage = encodeURIComponent(sampleMessage)
      const url = `https://wa.me/55${watchedNumber}?text=${encodedMessage}`
      setPreviewUrl(url)
    } else {
      setPreviewUrl('')
    }
  }, [watchedNumber, watchedMessage])

  const onSubmit = async (data) => {
    try {
      setIsSaving(true)
      setSaveStatus(null)

      const response = await fetch('/api/admin/whatsapp-config', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(data)
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Erro ao salvar configuração')
      }

      const result = await response.json()
      setSaveStatus('success')
      
      // Notificar componente pai
      onSave(data)

      // Fechar modal após 2 segundos
      setTimeout(() => {
        handleClose()
      }, 2000)

    } catch (error) {
      console.error('Erro ao salvar config WhatsApp:', error)
      setSaveStatus('error')
    } finally {
      setIsSaving(false)
    }
  }

  const handleClose = () => {
    setSaveStatus(null)
    onClose()
  }

  const formatPhoneNumber = (value) => {
    // Remove tudo que não é número
    const numbers = value.replace(/\D/g, '')
    
    // Limita a 11 dígitos (DDD + número)
    const limited = numbers.slice(0, 11)
    
    // Formata: (XX) XXXXX-XXXX
    if (limited.length <= 2) return limited
    if (limited.length <= 7) return `(${limited.slice(0, 2)}) ${limited.slice(2)}`
    return `(${limited.slice(0, 2)}) ${limited.slice(2, 7)}-${limited.slice(7)}`
  }

  const handlePhoneChange = (e) => {
    const formatted = formatPhoneNumber(e.target.value)
    const numbersOnly = formatted.replace(/\D/g, '')
    
    // Atualizar campo visual com formatação
    e.target.value = formatted
    
    // Atualizar form com apenas números
    setValue('whatsapp_number', numbersOnly)
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-4 border-b">
          <div className="flex items-center gap-2">
            <MessageCircle className="w-5 h-5 text-green-600" />
            <h2 className="text-lg font-semibold text-gray-900">
              Configuração WhatsApp
            </h2>
          </div>
          <button
            onClick={handleClose}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-6">
          {/* Número do WhatsApp */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              <Phone className="w-4 h-4 inline mr-1" />
              Número do WhatsApp *
            </label>
            <Input
              placeholder="(11) 99999-9999"
              onChange={handlePhoneChange}
              defaultValue={config?.whatsapp_number ? formatPhoneNumber(config.whatsapp_number) : ''}
              className={errors.whatsapp_number ? 'border-red-500' : ''}
            />
            {errors.whatsapp_number && (
              <p className="text-sm text-red-600 mt-1">{errors.whatsapp_number.message}</p>
            )}
            <p className="text-xs text-gray-500 mt-1">
              Número com DDD, sem código do país (+55)
            </p>
          </div>

          {/* Template da Mensagem */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Template da Mensagem *
            </label>
            <textarea
              {...register('whatsapp_message_template')}
              placeholder="Olá! Gostaria de mais informações sobre o curso: {CURSO_NOME}"
              rows={4}
              className={`w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none ${
                errors.whatsapp_message_template ? 'border-red-500' : ''
              }`}
            />
            {errors.whatsapp_message_template && (
              <p className="text-sm text-red-600 mt-1">{errors.whatsapp_message_template.message}</p>
            )}
            <p className="text-xs text-gray-500 mt-1">
              Use <code className="bg-gray-100 px-1 rounded">{'{CURSO_NOME}'}</code> onde o nome do curso será substituído
            </p>
          </div>

          {/* Preview */}
          {previewUrl && (
            <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
              <h3 className="font-medium text-green-900 mb-2">Preview da URL:</h3>
              <div className="text-sm text-green-700 break-all bg-white p-2 rounded border">
                {previewUrl}
              </div>
              <p className="text-xs text-green-600 mt-2">
                ↑ Esta será a URL gerada para o botão "Mais Informações"
              </p>
            </div>
          )}

          {/* Status de Salvamento */}
          {saveStatus === 'success' && (
            <div className="flex items-center gap-2 p-3 bg-green-50 border border-green-200 rounded-lg">
              <CheckCircle className="w-5 h-5 text-green-600" />
              <p className="text-sm text-green-700">
                Configuração salva com sucesso! Modal será fechado automaticamente.
              </p>
            </div>
          )}

          {saveStatus === 'error' && (
            <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg">
              <AlertCircle className="w-5 h-5 text-red-600" />
              <p className="text-sm text-red-700">
                Erro ao salvar configuração. Tente novamente.
              </p>
            </div>
          )}

          {/* Botões */}
          <div className="flex gap-3 pt-4 border-t">
            <Button
              type="button"
              variant="secondary"
              onClick={handleClose}
              disabled={isSaving}
              className="flex-1"
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={isSaving || saveStatus === 'success'}
              className="flex-1"
            >
              {isSaving ? 'Salvando...' : 'Salvar Configuração'}
            </Button>
          </div>
        </form>

        {/* Instruções de Uso */}
        <div className="border-t p-4 bg-gray-50">
          <h4 className="font-medium text-gray-800 mb-2">Como funciona:</h4>
          <ul className="text-sm text-gray-600 space-y-1">
            <li>• Cada curso terá um botão "Mais Informações"</li>
            <li>• O botão abrirá o WhatsApp com a mensagem pré-preenchida</li>
            <li>• O nome do curso será automaticamente inserido na mensagem</li>
            <li>• O estudante poderá editar a mensagem antes de enviar</li>
          </ul>
        </div>
      </div>
    </div>
  )
}