import { NextResponse } from 'next/server'

export async function GET() {
  // Headers para forçar revalidação
  const headers = {
    'Cache-Control': 'no-cache, no-store, must-revalidate',
    'Pragma': 'no-cache',
    'Expires': '0',
    'X-Cache-Status': 'BYPASS',
    'X-Deployment-Id': process.env.VERCEL_DEPLOYMENT_ID || 'local',
    'X-Timestamp': new Date().toISOString()
  }

  return NextResponse.json(
    { 
      message: 'Cache headers set for revalidation',
      deployment: process.env.VERCEL_DEPLOYMENT_ID,
      timestamp: new Date().toISOString()
    },
    { headers }
  )
}