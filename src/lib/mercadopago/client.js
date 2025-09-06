import { MercadoPagoConfig, Preference, Payment } from 'mercadopago'
import crypto from 'crypto'

// Configurar Mercado Pago com SDK v2
const client = process.env.MERCADOPAGO_ACCESS_TOKEN ? new MercadoPagoConfig({ 
  accessToken: process.env.MERCADOPAGO_ACCESS_TOKEN,
  options: { timeout: 5000 }
}) : null

// Instanciar APIs
const preference = client ? new Preference(client) : null
const payment = client ? new Payment(client) : null

export const createPaymentPreference = async (courseData, userData) => {
  try {
    if (!preference) {
      throw new Error('Mercado Pago não configurado')
    }

    const body = {
      items: [{
        title: courseData.title,
        unit_price: parseFloat(courseData.price),
        quantity: 1,
        currency_id: courseData.currency || 'BRL',
        description: courseData.description || `Curso ${courseData.title}`,
      }],
      payer: {
        email: userData.email,
        name: userData.full_name,
        identification: {
          type: 'CPF',
          number: userData.cpf?.replace(/\D/g, '') || ''
        }
      },
      external_reference: `course_${courseData.id}_user_${userData.id}`,
      notification_url: `${process.env.NEXT_PUBLIC_URL}/api/payments/webhook`,
      back_urls: {
        success: `${process.env.NEXT_PUBLIC_URL}/payment/success`,
        failure: `${process.env.NEXT_PUBLIC_URL}/payment/failure`,
        pending: `${process.env.NEXT_PUBLIC_URL}/payment/pending`
      },
      auto_return: 'approved',
      statement_descriptor: 'EduPlatform',
      expires: true,
      expiration_date_from: new Date().toISOString(),
      expiration_date_to: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // 24 horas
      payment_methods: {
        excluded_payment_types: [],
        excluded_payment_methods: [],
        installments: 12,
        default_installments: 1
      }
    }

    const response = await preference.create({ body })
    return response
  } catch (error) {
    console.error('Erro ao criar preferência de pagamento:', error)
    throw new Error('Erro ao criar preferência de pagamento')
  }
}

export const getPaymentStatus = async (paymentId) => {
  try {
    if (!payment) {
      throw new Error('Mercado Pago não configurado')
    }

    const response = await payment.get({ id: paymentId })
    return response
  } catch (error) {
    console.error('Erro ao buscar status do pagamento:', error)
    throw new Error('Erro ao buscar status do pagamento')
  }
}

export const validateWebhookSignature = (body, signature) => {
  try {
    if (!signature || !process.env.MERCADOPAGO_WEBHOOK_SECRET) {
      console.warn('Webhook signature validation skipped - missing signature or secret')
      return true // Permitir em desenvolvimento
    }

    // Extrair componentes da assinatura
    const parts = signature.split(',')
    let timestamp = null
    let hash = null

    for (const part of parts) {
      const [key, value] = part.split('=')
      if (key === 'ts') timestamp = value
      if (key === 'v1') hash = value
    }

    if (!timestamp || !hash) {
      console.error('Invalid webhook signature format')
      return false
    }

    // Criar payload para validação
    const payload = `id:${body.id};request-id:${body.request_id};ts:${timestamp};`
    
    // Calcular hash esperado
    const expectedHash = crypto
      .createHmac('sha256', process.env.MERCADOPAGO_WEBHOOK_SECRET)
      .update(payload)
      .digest('hex')

    // Comparar hashes
    return crypto.timingSafeEqual(
      Buffer.from(hash, 'hex'),
      Buffer.from(expectedHash, 'hex')
    )
  } catch (error) {
    console.error('Erro na validação da assinatura do webhook:', error)
    return false
  }
}