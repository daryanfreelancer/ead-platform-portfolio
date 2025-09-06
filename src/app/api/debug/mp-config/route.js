import { NextResponse } from 'next/server'

export async function GET() {
  try {
    const config = {
      mercadopago_configured: !!process.env.MERCADOPAGO_ACCESS_TOKEN,
      public_key_configured: !!process.env.NEXT_PUBLIC_MERCADOPAGO_PUBLIC_KEY,
      webhook_secret_configured: !!process.env.MERCADOPAGO_WEBHOOK_SECRET,
      next_public_url: process.env.NEXT_PUBLIC_URL || 'Não configurado',
      node_env: process.env.NODE_ENV,
      timestamp: new Date().toISOString()
    }

    // Log seguro no servidor (sem expor tokens)
    console.log('[MP-CONFIG] Status das variáveis:', config)

    return NextResponse.json(config)
  } catch (error) {
    console.error('[MP-CONFIG] Erro:', error)
    return NextResponse.json({ 
      error: 'Erro ao verificar configuração',
      details: error.message 
    }, { status: 500 })
  }
}