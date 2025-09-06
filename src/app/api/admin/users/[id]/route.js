import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function PUT(request, { params }) {
  try {
    const { id } = params
    const { full_name, email, cpf, phone, role } = await request.json()

    // Validação básica
    if (!full_name || !email || !role) {
      return NextResponse.json(
        { error: 'Campos obrigatórios: full_name, email, role' },
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

    // Verificar se o usuário atual é admin
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json(
        { error: 'Não autorizado' },
        { status: 401 }
      )
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (!profile || profile.role !== 'admin') {
      return NextResponse.json(
        { error: 'Acesso negado. Apenas administradores podem editar usuários' },
        { status: 403 }
      )
    }

    // Verificar se o usuário a ser editado existe
    const { data: existingUser } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', id)
      .single()

    if (!existingUser) {
      return NextResponse.json(
        { error: 'Usuário não encontrado' },
        { status: 404 }
      )
    }

    // Verificar se o email já existe em outro usuário
    if (email !== existingUser.email) {
      const { data: emailCheck } = await supabase
        .from('profiles')
        .select('id')
        .eq('email', email)
        .neq('id', id)
        .single()

      if (emailCheck) {
        return NextResponse.json(
          { error: 'Email já cadastrado para outro usuário' },
          { status: 400 }
        )
      }
    }

    // Verificar se está tentando remover o último admin
    if (existingUser.role === 'admin' && role !== 'admin') {
      const { data: adminCount } = await supabase
        .from('profiles')
        .select('id')
        .eq('role', 'admin')

      if (adminCount && adminCount.length === 1) {
        return NextResponse.json(
          { error: 'Não é possível alterar o papel do último administrador do sistema' },
          { status: 400 }
        )
      }
    }

    // Atualizar o perfil do usuário
    const { data: updatedUser, error: updateError } = await supabase
      .from('profiles')
      .update({
        full_name,
        email,
        cpf,
        phone,
        role,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single()

    if (updateError) {
      console.error('Erro ao atualizar usuário:', updateError)
      
      if (updateError.message.includes('duplicate') || updateError.message.includes('unique')) {
        return NextResponse.json(
          { error: 'Email já cadastrado no sistema' },
          { status: 400 }
        )
      }
      
      return NextResponse.json(
        { error: 'Erro ao atualizar usuário: ' + updateError.message },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { 
        message: 'Usuário atualizado com sucesso',
        user: updatedUser
      },
      { status: 200 }
    )

  } catch (error) {
    console.error('Erro interno:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}

export async function DELETE(request, { params }) {
  try {
    const { id } = params

    const supabase = await createClient()

    // Verificar se o usuário atual é admin
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json(
        { error: 'Não autorizado' },
        { status: 401 }
      )
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (!profile || profile.role !== 'admin') {
      return NextResponse.json(
        { error: 'Acesso negado. Apenas administradores podem deletar usuários' },
        { status: 403 }
      )
    }

    // Verificar se o usuário a ser deletado existe
    const { data: existingUser } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', id)
      .single()

    if (!existingUser) {
      return NextResponse.json(
        { error: 'Usuário não encontrado' },
        { status: 404 }
      )
    }

    // Verificar se é o último admin
    if (existingUser.role === 'admin') {
      const { data: adminCount } = await supabase
        .from('profiles')
        .select('id')
        .eq('role', 'admin')

      if (adminCount && adminCount.length === 1) {
        return NextResponse.json(
          { error: 'Não é possível excluir o último administrador do sistema' },
          { status: 400 }
        )
      }
    }

    // Deletar matrículas do usuário primeiro (cascade)
    await supabase
      .from('enrollments')
      .delete()
      .eq('student_id', id)

    // Deletar cursos criados pelo usuário se for professor
    if (existingUser.role === 'teacher') {
      await supabase
        .from('courses')
        .delete()
        .eq('teacher_id', id)
    }

    // Deletar o perfil do usuário
    const { error: deleteError } = await supabase
      .from('profiles')
      .delete()
      .eq('id', id)

    if (deleteError) {
      console.error('Erro ao deletar usuário:', deleteError)
      return NextResponse.json(
        { error: 'Erro ao deletar usuário: ' + deleteError.message },
        { status: 400 }
      )
    }

    // Tentar deletar da auth (pode falhar se não tiver permissão)
    try {
      await supabase.auth.admin.deleteUser(id)
    } catch (authError) {
      console.warn('Aviso: Não foi possível deletar usuário da auth:', authError)
      // Não falha a operação se não conseguir deletar da auth
    }

    return NextResponse.json(
      { message: 'Usuário deletado com sucesso' },
      { status: 200 }
    )

  } catch (error) {
    console.error('Erro interno:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}