import { createClient } from '@/lib/supabase/server'
import { createPaymentPreference } from '@/lib/mercadopago/client'
import { NextResponse } from 'next/server'

export async function POST(request) {
  try {
    // Verificar se Mercado Pago está configurado
    if (!process.env.MERCADOPAGO_ACCESS_TOKEN) {
      return NextResponse.json({ 
        error: 'Sistema de pagamentos temporariamente indisponível. Tente novamente mais tarde.'
      }, { status: 503 })
    }

    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Usuário não autenticado' }, { status: 401 })
    }

    const { courseId } = await request.json()

    if (!courseId) {
      return NextResponse.json({ error: 'ID do curso é obrigatório' }, { status: 400 })
    }

    // Buscar dados do curso
    const { data: course, error: courseError } = await supabase
      .from('courses')
      .select('*')
      .eq('id', courseId)
      .single()

    if (courseError || !course) {
      return NextResponse.json({ error: 'Curso não encontrado' }, { status: 404 })
    }

    // Verificar se o curso é gratuito
    if (course.is_free || !course.price || course.price <= 0) {
      return NextResponse.json({ error: 'Curso gratuito não requer pagamento' }, { status: 400 })
    }

    // Buscar dados do usuário
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single()

    if (profileError || !profile) {
      return NextResponse.json({ error: 'Perfil do usuário não encontrado' }, { status: 404 })
    }

    // Verificar se já existe matrícula
    const { data: enrollments, error: enrollmentError } = await supabase
      .from('enrollments')
      .select('id')
      .eq('course_id', courseId)
      .eq('student_id', user.id)

    // Verificar se há erro diferente de "não encontrado"
    if (enrollmentError && enrollmentError.code !== 'PGRST116') {
      console.error('Erro ao verificar matrícula:', enrollmentError)
      return NextResponse.json({ error: 'Erro ao verificar matrícula existente' }, { status: 500 })
    }

    // Se já existe matrícula
    if (enrollments && enrollments.length > 0) {
      return NextResponse.json({ error: 'Usuário já matriculado neste curso' }, { status: 400 })
    }


    // Criar registro de compra
    const { data: purchase, error: purchaseError } = await supabase
      .from('purchases')
      .insert({
        user_id: user.id,
        course_id: courseId,
        amount: course.price,
        status: 'pending'
      })
      .select()
      .single()

    if (purchaseError) {
      console.error('Erro ao criar compra:', purchaseError)
      return NextResponse.json({ error: 'Erro ao criar compra' }, { status: 500 })
    }

    // Criar preferência no Mercado Pago
    const preference = await createPaymentPreference(course, {
      ...profile,
      email: user.email
    })


    // Atualizar compra com ID da preferência
    const { error: updateError } = await supabase
      .from('purchases')
      .update({
        mercadopago_preference_id: preference.id
      })
      .eq('id', purchase.id)

    if (updateError) {
      console.error('Erro ao atualizar compra:', updateError)
    }

    return NextResponse.json({
      preference_id: preference.id,
      init_point: preference.init_point,
      purchase_id: purchase.id
    })

  } catch (error) {
    console.error('Erro ao criar preferência de pagamento:', error)
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 })
  }
}