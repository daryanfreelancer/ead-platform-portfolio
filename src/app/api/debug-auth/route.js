import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET() {
  try {
    const supabase = await createClient()
    
    // Buscar usuário atual
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    
    if (userError || !user) {
      return NextResponse.json({ 
        error: 'Não autenticado',
        details: userError 
      }, { status: 401 })
    }
    
    // Buscar perfil
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single()
    
    // Retornar informações de debug
    return NextResponse.json({
      user: {
        id: user.id,
        email: user.email
      },
      profile: profile,
      profileError: profileError,
      debug: {
        hasProfile: !!profile,
        role: profile?.role,
        user_type: profile?.user_type,
        columns: Object.keys(profile || {})
      }
    })
    
  } catch (error) {
    return NextResponse.json({ 
      error: 'Erro no servidor',
      details: error.message 
    }, { status: 500 })
  }
}