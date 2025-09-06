import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const pdfUrl = searchParams.get('url')
    
    if (!pdfUrl) {
      return NextResponse.json({ error: 'PDF URL is required' }, { status: 400 })
    }

    // Validate that the URL is from our Supabase storage
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    if (!pdfUrl.includes(supabaseUrl)) {
      return NextResponse.json({ error: 'Invalid PDF URL' }, { status: 403 })
    }

    // Fetch the PDF file
    const response = await fetch(pdfUrl)
    
    if (!response.ok) {
      return NextResponse.json({ error: 'PDF not found' }, { status: 404 })
    }

    const pdfBuffer = await response.arrayBuffer()
    
    // Return the PDF with proper headers for CORS
    return new NextResponse(pdfBuffer, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': 'inline',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Cache-Control': 'public, max-age=3600', // Cache for 1 hour
      },
    })
  } catch (error) {
    console.error('PDF proxy error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}