import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function POST() {
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
    
    // First, check if hubs exist
    const { data: existingHubs, error: checkError } = await supabase
      .from('educational_hubs')
      .select('id, name, is_active')
    
    if (checkError) {
      return NextResponse.json({ 
        error: 'Erro ao verificar hubs', 
        details: checkError 
      }, { status: 500 })
    }
    
    if (!existingHubs || existingHubs.length === 0) {
      // No hubs exist, insert them
      const hubsToInsert = [
        { name: 'EduPlatform', description: 'Cursos próprios do Instituto EduPlatform', is_active: true },
        { name: 'SIE', description: 'Sistema Integrado de Ensino', is_active: true },
        { name: 'Escola Avançada', description: 'Parceria com Escola Avançada', is_active: true },
        { name: 'UniUnica', description: 'Universidade UniUnica', is_active: true },
        { name: 'UniFil', description: 'Centro Universitário Filadélfia', is_active: true },
        { name: 'Faculdade Guerra', description: 'Faculdade Guerra', is_active: true },
        { name: 'UNAR', description: 'Centro Universitário de Araras', is_active: true },
        { name: 'CEPET', description: 'Centro de Educação Profissional e Tecnológica', is_active: true },
        { name: 'Ember', description: 'Ember Educação', is_active: true }
      ]
      
      const { data: insertedHubs, error: insertError } = await supabase
        .from('educational_hubs')
        .insert(hubsToInsert)
        .select()
      
      if (insertError) {
        return NextResponse.json({ 
          error: 'Erro ao inserir hubs', 
          details: insertError 
        }, { status: 500 })
      }
      
      return NextResponse.json({
        success: true,
        message: `${insertedHubs.length} hubs educacionais foram criados e ativados`,
        hubs: insertedHubs
      })
    } else {
      // Hubs exist, activate any that are inactive
      const inactiveHubs = existingHubs.filter(h => !h.is_active)
      
      if (inactiveHubs.length === 0) {
        return NextResponse.json({
          success: true,
          message: 'Todos os hubs já estão ativos',
          hubs: existingHubs
        })
      }
      
      const { data: updatedHubs, error: updateError } = await supabase
        .from('educational_hubs')
        .update({ is_active: true, updated_at: new Date().toISOString() })
        .in('id', inactiveHubs.map(h => h.id))
        .select()
      
      if (updateError) {
        return NextResponse.json({ 
          error: 'Erro ao ativar hubs', 
          details: updateError 
        }, { status: 500 })
      }
      
      return NextResponse.json({
        success: true,
        message: `${updatedHubs.length} hubs educacionais foram ativados`,
        previouslyInactive: inactiveHubs,
        nowActive: updatedHubs
      })
    }
    
  } catch (error) {
    console.error('Erro ao ativar hubs:', error)
    return NextResponse.json(
      { error: 'Erro ao ativar hubs', details: error.message },
      { status: 500 }
    )
  }
}