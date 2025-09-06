'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import Button from '@/components/ui/button'
import { createClient } from '@/lib/supabase/client'


// Componente de animação de digitação
function TypewriterText({ text, speed = 100 }) {
  const [displayedText, setDisplayedText] = useState('')
  const [currentIndex, setCurrentIndex] = useState(0)
  const [showCursor, setShowCursor] = useState(true)

  useEffect(() => {
    if (currentIndex < text.length) {
      const timeout = setTimeout(() => {
        setDisplayedText(prev => prev + text[currentIndex])
        setCurrentIndex(prev => prev + 1)
      }, speed)
      return () => clearTimeout(timeout)
    }
  }, [currentIndex, text, speed])

  // Cursor piscando
  useEffect(() => {
    const cursorInterval = setInterval(() => {
      setShowCursor(prev => !prev)
    }, 530)
    return () => clearInterval(cursorInterval)
  }, [])

  return (
    <span>
      {displayedText}
      {showCursor && <span className="animate-pulse">|</span>}
    </span>
  )
}

const supabase = createClient()

export default function HeroSection() {
  const [user, setUser] = useState(null)
  const [userProfile, setUserProfile] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Verificar usuário atual
    const getUser = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser()
        setUser(user)
        
        if (user) {
          // Buscar perfil do usuário para obter role
          const { data: profile } = await supabase
            .from('profiles')
            .select('role, full_name')
            .eq('id', user.id)
            .single()
          
          setUserProfile(profile)
        }
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
        getUser()
      } else if (event === 'SIGNED_OUT') {
        setUser(null)
        setUserProfile(null)
      }
    })

    return () => subscription.unsubscribe()
  }, [])

  const getDashboardLink = (role) => {
    switch (role) {
      case 'admin':
        return '/admin'
      case 'teacher':
        return '/teacher'
      case 'student':
        return '/student'
      default:
        return '/dashboard/student'
    }
  }

  return (
    <div className="text-center mb-16 animate-slide-in-from-bottom">
      <h1 className="text-4xl font-bold text-gray-900 mb-4 min-h-[3rem] flex items-center justify-center">
        {user && userProfile ? (
          <TypewriterText 
            text={`Bem-vindo de volta, ${userProfile.full_name?.split(' ')[0] || 'Usuário'}!`}
            speed={80}
          />
        ) : (
          <TypewriterText 
            text="Bem-vindo ao EduPlatform"
            speed={120}
          />
        )}
      </h1>
      <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
        {user ? (
          'Continue sua jornada de aprendizado com nossos cursos de alta qualidade.'
        ) : (
          'Plataforma de ensino à distância com cursos de pós-graduação, capacitação e cursos técnicos reconhecidos pelo MEC.'
        )}
      </p>
      
      {!loading && (
        <div className={`flex flex-col gap-4 ${user ? 'sm:flex-row sm:flex-wrap justify-center max-w-2xl mx-auto' : 'sm:flex-row justify-center'}`}>
          {user ? (
            // Usuário logado - mostrar botões do dashboard
            <>
              <Link href={getDashboardLink(userProfile?.role)}>
                <Button 
                  size="lg" 
                  className="w-full sm:w-auto hover:scale-105 hover:-translate-y-1 transition-all duration-300"
                >
                  Ir para Dashboard
                </Button>
              </Link>
              <Link href="/courses">
                <Button 
                  variant="outline" 
                  size="lg" 
                  className="w-full sm:w-auto hover:scale-105 hover:-translate-y-1 transition-all duration-300"
                >
                  Explorar Cursos
                </Button>
              </Link>
              <Link href="/consulta-certificados">
                <Button 
                  variant="outline" 
                  size="lg" 
                  className="w-full sm:w-auto hover:scale-105 hover:-translate-y-1 transition-all duration-300"
                >
                  Consultar Certificados
                </Button>
              </Link>
            </>
          ) : (
            // Usuário não logado - mostrar botões originais
            <>
              <Link href="/register">
                <Button 
                  size="lg" 
                  className="w-full sm:w-auto hover:scale-105 hover:-translate-y-1 transition-all duration-300"
                >
                  Começar Agora
                </Button>
              </Link>
              <Link href="/consulta-certificados">
                <Button 
                  variant="outline" 
                  size="lg" 
                  className="w-full sm:w-auto hover:scale-105 hover:-translate-y-1 transition-all duration-300"
                >
                  Consultar Certificados
                </Button>
              </Link>
            </>
          )}
        </div>
      )}
    </div>
  )
}