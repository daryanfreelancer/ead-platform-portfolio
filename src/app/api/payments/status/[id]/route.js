import { createClient } from '@/lib/supabase/server'
import { getPaymentStatus } from '@/lib/mercadopago/client'
import { NextResponse } from 'next/server'

export async function GET(request, { params }) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Usuário não autenticado' }, { status: 401 })
    }

    const purchaseId = params.id

    // Buscar compra
    const { data: purchase, error: purchaseError } = await supabase
      .from('purchases')
      .select(`
        *,
        courses (
          title,
          price,
          currency
        )
      `)
      .eq('id', purchaseId)
      .eq('user_id', user.id)
      .single()

    if (purchaseError || !purchase) {
      return NextResponse.json({ error: 'Compra não encontrada' }, { status: 404 })
    }

    // Se tem payment_id do Mercado Pago, buscar status atualizado
    let mercadoPagoStatus = null
    if (purchase.mercadopago_payment_id) {
      try {
        mercadoPagoStatus = await getPaymentStatus(purchase.mercadopago_payment_id)
      } catch (error) {
        console.error('Erro ao buscar status no Mercado Pago:', error)
      }
    }

    // Buscar pagamentos relacionados
    const { data: payments } = await supabase
      .from('payments')
      .select('*')
      .eq('purchase_id', purchaseId)
      .order('created_at', { ascending: false })

    // Verificar se existe matrícula
    const { data: enrollment } = await supabase
      .from('enrollments')
      .select('id, enrolled_at, progress')
      .eq('course_id', purchase.course_id)
      .eq('student_id', user.id)
      .single()

    return NextResponse.json({
      purchase: {
        id: purchase.id,
        status: purchase.status,
        amount: purchase.amount,
        currency: purchase.currency,
        created_at: purchase.created_at,
        updated_at: purchase.updated_at,
        course: purchase.courses
      },
      payments: payments || [],
      enrollment: enrollment || null,
      mercadopago_status: mercadoPagoStatus?.status || null
    })

  } catch (error) {
    console.error('Erro ao buscar status do pagamento:', error)
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 })
  }
}