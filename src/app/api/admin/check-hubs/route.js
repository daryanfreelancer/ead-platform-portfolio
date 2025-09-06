import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET() {
  try {
    const supabase = await createClient()
    
    // Check if user is admin
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })
    }
    
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()
    
    if (profile?.role !== 'admin') {
      return NextResponse.json({ error: 'Acesso negado' }, { status: 403 })
    }
    
    // Get all hubs (admin can see all)
    const { data: allHubs, error: allError } = await supabase
      .from('educational_hubs')
      .select('*')
      .order('name')
    
    // Try to get hubs as a regular user would see them (only active)
    // We'll use a raw query for this
    const { data: activeHubs, error: activeError } = await supabase
      .from('educational_hubs')
      .select('*')
      .eq('is_active', true)
      .order('name')
    
    return NextResponse.json({
      success: true,
      summary: {
        totalHubs: allHubs?.length || 0,
        activeHubs: allHubs?.filter(h => h.is_active).length || 0,
        inactiveHubs: allHubs?.filter(h => !h.is_active).length || 0,
        visibleToUsers: activeHubs?.length || 0
      },
      allHubs: allHubs || [],
      errors: {
        all: allError,
        active: activeError
      }
    })
    
  } catch (error) {
    console.error('Erro ao verificar hubs:', error)
    return NextResponse.json(
      { error: 'Erro ao verificar hubs', details: error.message },
      { status: 500 }
    )
  }
}