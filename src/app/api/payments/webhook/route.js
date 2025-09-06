import { createClient } from '@/lib/supabase/server'
import { getPaymentStatus, validateWebhookSignature } from '@/lib/mercadopago/client'
import { NextResponse } from 'next/server'

export async function POST(request) {
  try {
    const body = await request.json()
    const { type, data } = body

    // Validar assinatura do webhook
    const signature = request.headers.get('x-signature')
    if (!validateWebhookSignature(body, signature)) {
      console.error('Webhook signature validation failed')
      return NextResponse.json({ error: 'Invalid signature' }, { status: 401 })
    }

    // Verificar se é notificação de pagamento
    if (type !== 'payment') {
      return NextResponse.json({ status: 'ignored' })
    }

    const paymentId = data.id
    if (!paymentId) {
      return NextResponse.json({ error: 'ID do pagamento não fornecido' }, { status: 400 })
    }

    // Buscar status do pagamento no Mercado Pago
    const payment = await getPaymentStatus(paymentId)
    
    if (!payment) {
      return NextResponse.json({ error: 'Pagamento não encontrado' }, { status: 404 })
    }

    const supabase = await createClient()

    // Extrair informações do external_reference
    const externalRef = payment.external_reference
    if (!externalRef) {
      return NextResponse.json({ error: 'Referência externa não encontrada' }, { status: 400 })
    }

    const [, courseId, , userId] = externalRef.split('_')
    
    if (!courseId || !userId) {
      return NextResponse.json({ error: 'Referência externa inválida' }, { status: 400 })
    }

    // Buscar a compra
    const { data: purchase, error: purchaseError } = await supabase
      .from('purchases')
      .select('*')
      .eq('user_id', userId)
      .eq('course_id', courseId)
      .eq('status', 'pending')
      .single()

    if (purchaseError || !purchase) {
      console.error('Compra não encontrada:', purchaseError)
      return NextResponse.json({ error: 'Compra não encontrada' }, { status: 404 })
    }

    // Mapear status do Mercado Pago para nosso sistema
    let purchaseStatus = 'pending'
    let enrollmentStatus = false

    switch (payment.status) {
      case 'approved':
        purchaseStatus = 'completed'
        enrollmentStatus = true
        break
      case 'rejected':
        purchaseStatus = 'failed'
        break
      case 'cancelled':
        purchaseStatus = 'cancelled'
        break
      case 'refunded':
        purchaseStatus = 'refunded'
        break
      default:
        purchaseStatus = 'processing'
    }

    // Atualizar status da compra
    const { error: updatePurchaseError } = await supabase
      .from('purchases')
      .update({
        status: purchaseStatus,
        mercadopago_payment_id: paymentId,
        updated_at: new Date().toISOString()
      })
      .eq('id', purchase.id)

    if (updatePurchaseError) {
      console.error('Erro ao atualizar compra:', updatePurchaseError)
    }

    // Criar registro de pagamento
    const { error: paymentError } = await supabase
      .from('payments')
      .insert({
        purchase_id: purchase.id,
        gateway_payment_id: paymentId,
        amount: payment.transaction_amount,
        status: payment.status,
        payment_method: payment.payment_method_id,
        paid_at: payment.status === 'approved' ? new Date().toISOString() : null,
        gateway_response: payment
      })

    if (paymentError) {
      console.error('Erro ao criar registro de pagamento:', paymentError)
    }

    // Se aprovado, criar matrícula
    if (enrollmentStatus) {
      // Verificar se já existe matrícula
      const { data: existingEnrollment } = await supabase
        .from('enrollments')
        .select('id')
        .eq('course_id', courseId)
        .eq('student_id', userId)
        .single()

      if (!existingEnrollment) {
        const { error: enrollmentError } = await supabase
          .from('enrollments')
          .insert({
            course_id: courseId,
            student_id: userId,
            enrolled_at: new Date().toISOString(),
            progress: 0
          })

        if (enrollmentError) {
          console.error('Erro ao criar matrícula:', enrollmentError)
        }
      }
    }

    return NextResponse.json({ status: 'processed' })

  } catch (error) {
    console.error('Erro no webhook de pagamento:', error)
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 })
  }
}