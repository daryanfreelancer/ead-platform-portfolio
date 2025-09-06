import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function POST(request) {
  try {
    const { email } = await request.json()

    if (!email) {
      return NextResponse.json(
        { error: 'Email é obrigatório' },
        { status: 400 }
      )
    }

    const supabase = await createClient()
    
    // Verificar se usuário atual é admin
    const { data: { user: currentUser }, error: getUserError } = await supabase.auth.getUser()
    
    if (getUserError || !currentUser) {
      return NextResponse.json(
        { error: 'Usuário não autenticado' },
        { status: 401 }
      )
    }
    
    const { data: currentProfile, error: profileError } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', currentUser.id)
      .single()
    
    if (profileError || !currentProfile || currentProfile.role !== 'admin') {
      return NextResponse.json(
        { error: 'Acesso negado - apenas administradores podem resetar senhas' },
        { status: 403 }
      )
    }

    // Verificar se o usuário alvo existe
    const { data: targetUser, error: targetError } = await supabase
      .from('profiles')
      .select('email, full_name')
      .eq('email', email)
      .single()

    if (targetError || !targetUser) {
      return NextResponse.json(
        { error: 'Usuário não encontrado' },
        { status: 404 }
      )
    }

    // Enviar email de reset de senha
    const origin = process.env.NEXT_PUBLIC_URL || 'https://www.eduplatform.com.br'
    
    const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${origin}/reset-password`,
    })

    if (resetError) {
      console.error('Erro ao enviar email de reset:', resetError)
      return NextResponse.json(
        { error: 'Erro ao enviar email de redefinição de senha' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      message: 'Link de redefinição de senha enviado com sucesso',
      email: email
    })

  } catch (error) {
    console.error('Erro interno ao resetar senha:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}