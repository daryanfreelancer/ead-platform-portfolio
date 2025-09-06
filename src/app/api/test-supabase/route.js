import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET() {
  try {
    console.log('🧪 Testing Supabase connection...')
    
    const supabase = await createClient()
    console.log('✅ Supabase client created')
    
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    console.log('👤 User check result:', user ? 'Found' : 'Not found', userError)
    
    // Test simple query
    const { data, error } = await supabase
      .from('profiles')
      .select('id')
      .limit(1)
    
    console.log('📊 Query test:', data ? 'Success' : 'Failed', error)
    
    return NextResponse.json({ 
      status: 'ok',
      supabaseClient: 'created',
      user: user ? 'found' : 'not found',
      queryTest: data ? 'success' : 'failed',
      error: error?.message || null
    })
  } catch (error) {
    console.error('❌ Supabase test error:', error)
    return NextResponse.json({ 
      status: 'error',
      message: error.message,
      stack: error.stack
    }, { status: 500 })
  }
}