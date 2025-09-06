import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function POST(request) {
  try {
    const requestBody = await request.json()
    
    const { email, password, full_name, cpf, phone, role = 'student' } = requestBody

    // Validação básica
    if (!email || !password || !full_name || !cpf) {
      return NextResponse.json(
        { error: 'Campos obrigatórios ausentes' },
        { status: 400 }
      )
    }

    // Validar role
    if (!['student', 'teacher', 'admin'].includes(role)) {
      return NextResponse.json(
        { error: 'Role inválido' },
        { status: 400 }
      )
    }
    const supabase = await createClient()
    
    // Verificar se usuário atual é admin (necessário para criar novos usuários)
    const { data: { user: currentUser }, error: getUserError } = await supabase.auth.getUser()
    
    if (getUserError) {
      return NextResponse.json(
        { error: 'Erro ao verificar usuário atual' },
        { status: 500 }
      )
    }
    
    if (currentUser) {
      const { data: currentProfile, error: profileError } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', currentUser.id)
        .single()
      
      if (profileError) {
        return NextResponse.json(
          { error: 'Erro ao verificar perfil do usuário atual' },
          { status: 500 }
        )
      }
      
      if (!currentProfile || currentProfile.role !== 'admin') {
        return NextResponse.json(
          { error: 'Acesso negado - apenas administradores podem criar usuários' },
          { status: 403 }
        )
      }
    }

    // Verificar se CPF já existe
    const { data: existingCpf, error: cpfError } = await supabase
      .from('profiles')
      .select('cpf')
      .eq('cpf', cpf)
      .single()

    // Se houve erro que não seja "not found", é um problema real
    if (cpfError && cpfError.code !== 'PGRST116') {
      return NextResponse.json(
        { error: 'Erro ao verificar CPF no sistema' },
        { status: 500 }
      )
    }

    if (existingCpf) {
      return NextResponse.json(
        { error: 'CPF já cadastrado no sistema' },
        { status: 400 }
      )
    }

    // Verificar se o email já existe antes de criar
    const { data: existingUser } = await supabase
      .from('profiles')
      .select('email')
      .eq('email', email)
      .single()
    
    if (existingUser) {
      return NextResponse.json(
        { error: 'Email já cadastrado no sistema' },
        { status: 400 }
      )
    }

    // Criar usuário na auth
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name,
          cpf,
          phone,
          role
        }
      }
    })

    if (authError) {
      if (authError.message.includes('duplicate') || authError.message.includes('already') || authError.message.includes('User already registered')) {
        return NextResponse.json(
          { error: 'Email já cadastrado no sistema' },
          { status: 400 }
        )
      }
      
      return NextResponse.json(
        { error: 'Erro ao criar usuário: ' + authError.message },
        { status: 400 }
      )
    }

    // Criar perfil do usuário
    const profileData = {
      id: authData.user.id,
      email,
      full_name,
      cpf,
      role
    }
    
    const { data: insertedProfile, error: profileError } = await supabase
      .from('profiles')
      .insert(profileData)
      .select()

    if (profileError) {
      // Nota: Não é possível fazer rollback automático do usuário auth
      console.error('Erro ao criar perfil:', profileError)
      
      // Retornar erro específico baseado no tipo de erro
      if (profileError.code === '23505') {
        return NextResponse.json(
          { error: 'CPF já cadastrado no sistema' },
          { status: 400 }
        )
      }
      
      return NextResponse.json(
        { error: 'Erro ao criar perfil do usuário' },
        { status: 500 }
      )
    }
    
    return NextResponse.json(
      { 
        message: 'Usuário criado com sucesso',
        user: {
          id: authData.user.id,
          email,
          full_name,
          role
        }
      },
      { status: 201 }
    )

  } catch (error) {
    console.error('Erro interno não tratado:', error)
    
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}