'use client'
import { useAuth } from '@/hooks/use-auth'
import { supabase } from '@/lib/supabase/client'
import { useState } from 'react'

export default function DebugMiddleware() {
  const { user, profile, loading } = useAuth()
  const [testResult, setTestResult] = useState('')

  const testMiddleware = async () => {
    try {
      // Simular uma requisição que passa pelo middleware
      const response = await fetch('/administrador', {
        method: 'HEAD',
        credentials: 'include'
      })
      
      setTestResult(`Status: ${response.status}, Redirected: ${response.redirected}`)
      
      if (response.redirected) {
        setTestResult(prev => prev + `\nRedirect URL: ${response.url}`)
      }
    } catch (error) {
      setTestResult(`Error: ${error.message}`)
    }
  }

  const showCookies = () => {
    const cookies = document.cookie.split(';').filter(c => c.includes('supabase'))
    setTestResult(`Cookies:\n${cookies.join('\n')}`)
  }

  const testSession = async () => {
    const { data: { session } } = await supabase.auth.getSession()
    setTestResult(`Session: ${session ? 'EXISTS' : 'NULL'}\nUser: ${session?.user?.id || 'N/A'}`)
  }

  if (loading) return <div>Carregando...</div>

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">Debug Middleware</h1>
      
      <div className="space-y-4">
        <div className="bg-gray-100 p-4 rounded">
          <h2 className="font-semibold">Auth State:</h2>
          <p>User: {user ? 'EXISTS' : 'NULL'}</p>
          <p>Profile: {profile ? `Role: ${profile.role}` : 'NULL'}</p>
          <p>Loading: {loading ? 'true' : 'false'}</p>
        </div>

        <div className="space-x-2">
          <button onClick={testMiddleware} className="bg-blue-600 text-white px-4 py-2 rounded">
            Test Middleware
          </button>
          <button onClick={showCookies} className="bg-green-600 text-white px-4 py-2 rounded">
            Show Cookies
          </button>
          <button onClick={testSession} className="bg-purple-600 text-white px-4 py-2 rounded">
            Test Session
          </button>
        </div>

        {testResult && (
          <div className="bg-gray-100 p-4 rounded">
            <h3 className="font-semibold">Result:</h3>
            <pre className="whitespace-pre-wrap text-sm">{testResult}</pre>
          </div>
        )}
      </div>
    </div>
  )
}