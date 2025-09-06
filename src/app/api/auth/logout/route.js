import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function POST() {
  try {
    const supabase = await createClient()
    
    // Fazer logout
    const { error } = await supabase.auth.signOut()
    
    if (error) {
      console.error('Erro ao fazer logout:', error)
    }
    
    // Criar resposta que limpa cookies
    const response = NextResponse.json({ success: true })
    
    // Limpar cookies do Supabase
    response.cookies.set('sb-access-token', '', {
      path: '/',
      maxAge: 0
    })
    response.cookies.set('sb-refresh-token', '', {
      path: '/',
      maxAge: 0
    })
    
    return response
    
  } catch (error) {
    console.error('Erro no logout:', error)
    return NextResponse.json({ 
      success: false, 
      error: error.message 
    }, { status: 500 })
  }
}