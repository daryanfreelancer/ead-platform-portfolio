import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

// GET - Buscar configurações públicas do WhatsApp (sem autenticação)
export async function GET(request) {
  try {
    const supabase = await createClient()

    // Buscar configurações do WhatsApp (acesso público)
    const { data: settings, error } = await supabase
      .from('system_settings')
      .select('key, value')
      .in('key', ['whatsapp_number', 'whatsapp_message_template'])

    if (error) throw error

    // Converter array em objeto
    const config = {}
    settings?.forEach(setting => {
      config[setting.key] = JSON.parse(setting.value)
    })

    // Fornecer valores padrão se não encontrados
    const defaultConfig = {
      whatsapp_number: config.whatsapp_number || '6132998180',
      whatsapp_message_template: config.whatsapp_message_template || 'Olá! Gostaria de mais informações sobre o curso: {CURSO_NOME}'
    }

    return NextResponse.json({ config: defaultConfig })

  } catch (error) {
    console.error('Erro ao buscar configurações WhatsApp públicas:', error)
    
    // Em caso de erro, retornar configuração padrão
    return NextResponse.json({
      config: {
        whatsapp_number: '6132998180',
        whatsapp_message_template: 'Olá! Gostaria de mais informações sobre o curso: {CURSO_NOME}'
      }
    })
  }
}