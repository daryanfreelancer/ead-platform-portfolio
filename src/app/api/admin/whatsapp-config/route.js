import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

// GET - Buscar configurações do WhatsApp
export async function GET(request) {
  try {
    const supabase = await createClient()
    
    // Verificar autenticação de admin
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (!profile || profile.role !== 'admin') {
      return NextResponse.json({ error: 'Acesso negado' }, { status: 403 })
    }

    // Buscar configurações do WhatsApp
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

    return NextResponse.json({ config })

  } catch (error) {
    console.error('Erro ao buscar configurações WhatsApp:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}

// POST - Salvar configurações do WhatsApp
export async function POST(request) {
  try {
    const supabase = await createClient()
    
    // Verificar autenticação de admin
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (!profile || profile.role !== 'admin') {
      return NextResponse.json({ error: 'Acesso negado' }, { status: 403 })
    }

    const body = await request.json()
    const { whatsapp_number, whatsapp_message_template } = body

    // Validações
    if (!whatsapp_number || whatsapp_number.length < 10) {
      return NextResponse.json({ error: 'Número do WhatsApp é obrigatório' }, { status: 400 })
    }

    if (!whatsapp_message_template || whatsapp_message_template.length < 10) {
      return NextResponse.json({ error: 'Template da mensagem é obrigatório' }, { status: 400 })
    }

    // Validar se o número contém apenas dígitos
    if (!/^[0-9]+$/.test(whatsapp_number)) {
      return NextResponse.json({ error: 'Número deve conter apenas dígitos' }, { status: 400 })
    }

    // Verificar se template contém a variável {CURSO_NOME}
    if (!whatsapp_message_template.includes('{CURSO_NOME}')) {
      return NextResponse.json({ 
        error: 'Template deve conter a variável {CURSO_NOME}' 
      }, { status: 400 })
    }

    // Preparar configurações para salvar
    const configsToSave = [
      {
        key: 'whatsapp_number',
        value: JSON.stringify(whatsapp_number),
        description: 'Número do WhatsApp para contato sobre cursos'
      },
      {
        key: 'whatsapp_message_template',
        value: JSON.stringify(whatsapp_message_template),
        description: 'Template da mensagem enviada via WhatsApp'
      }
    ]

    // Salvar configurações (upsert para atualizar se já existir)
    for (const config of configsToSave) {
      const { error } = await supabase
        .from('system_settings')
        .upsert(config, { 
          onConflict: 'key',
          ignoreDuplicates: false 
        })

      if (error) throw error
    }

    return NextResponse.json({
      message: 'Configuração do WhatsApp salva com sucesso',
      config: {
        whatsapp_number,
        whatsapp_message_template
      }
    })

  } catch (error) {
    console.error('Erro ao salvar configurações WhatsApp:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}