'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import Button from '@/components/ui/button'
import { createClient } from '@/lib/supabase/client'

const supabase = createClient()

export default function CallToAction() {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Verificar usuário atual
    const getUser = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser()
        setUser(user)
      } catch (error) {
        console.error('Error loading user:', error)
      } finally {
        setLoading(false)
      }
    }

    getUser()

    // Escutar mudanças no estado de autenticação
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_IN') {
        setUser(session?.user || null)
      } else if (event === 'SIGNED_OUT') {
        setUser(null)
      }
    })

    return () => subscription.unsubscribe()
  }, [])

  // Não mostrar a seção se o usuário estiver logado
  if (loading || user) {
    return null
  }

  return (
    <div className="bg-gray-50 rounded-xl p-8 text-center">
      <h2 className="text-2xl font-bold text-gray-900 mb-4">
        Pronto para começar sua jornada?
      </h2>
      <p className="text-gray-600 mb-6">
        Cadastre-se agora e tenha acesso a todos os nossos cursos
      </p>
      <Link href="/register">
        <Button size="lg">
          Criar Conta Gratuita
        </Button>
      </Link>
    </div>
  )
}