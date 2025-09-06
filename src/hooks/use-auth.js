'use client'

import { useState, useEffect, createContext, useContext, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

const supabase = createClient()

// Context para compartilhar estado de autenticação
const AuthContext = createContext({})

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)
  const [initialized, setInitialized] = useState(false)
  const fetchingRef = useRef(false)
  const lastFetchTime = useRef(0)
  const profileRef = useRef(null) // Cache persistente do perfil

  const fetchProfile = async (userId, caller = 'unknown') => {
    const now = Date.now()
    
    // Prevenir chamadas múltiplas simultâneas
    if (fetchingRef.current) {
      console.log(`fetchProfile: Já está buscando perfil, ignorando chamada duplicada de: ${caller}`)
      return
    }
    
    // Para eventos críticos (getInitialSession), ignorar throttling
    const criticalCallers = ['getInitialSession']
    const isCritical = criticalCallers.some(critical => caller.includes(critical))
    
    // Prevenir spam - mínimo 3 segundos entre chamadas (reduzido, mas com exceções)
    if (!isCritical && now - lastFetchTime.current < 3000) {
      console.log(`fetchProfile: Muito cedo para nova chamada (${now - lastFetchTime.current}ms), ignorando: ${caller}`)
      return
    }
    
    lastFetchTime.current = now
    
    fetchingRef.current = true
    console.log(`fetchProfile: Iniciando busca de perfil para userId: ${userId.substring(0, 8)}... - Chamado por: ${caller}`)
    try {
      console.log('fetchProfile: Executando query no Supabase...')
      
      // Timeout de 10 segundos para detectar queries travadas
      const queryPromise = supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single()
      
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Query timeout - 20 segundos')), 20000)
      })
      
      const { data, error } = await Promise.race([queryPromise, timeoutPromise])
      if (error && error.code !== 'PGRST116') { // PGRST116 = not found
        console.error('fetchProfile: Erro ao buscar perfil do Supabase:', error.message || error.code || 'Erro desconhecido')
        throw error
      }

      const newProfile = data || { role: 'student', id: userId, full_name: 'Usuário Padrão' }
      if (!data) {
        console.warn('fetchProfile: Perfil não encontrado, usando fallback')
      }
      console.log(`fetchProfile: Sucesso - Role: ${newProfile.role} - Caller: ${caller}`)
      
      setProfile(newProfile)
      profileRef.current = newProfile // Atualizar cache persistente
      setLoading(false)
    } catch (error) {
      console.error('fetchProfile: Erro geral ao buscar perfil:', error.message || 'Erro desconhecido')
      setProfile({ role: 'student', id: userId, full_name: 'Usuário Padrão' }) // fallback role
      setLoading(false)
    } finally {
      fetchingRef.current = false
    }
  }

  useEffect(() => {
    console.log('AuthProvider useEffect: Iniciado')
    // Buscar usuário inicial
    const getInitialSession = async () => {
      console.log('getInitialSession: Buscando sessão inicial...')
      try {
        const { data: { session } } = await supabase.auth.getSession()
        console.log('getInitialSession: Sessão inicial obtida:', session ? 'Autenticado' : 'Não autenticado')
        
        if (session?.user) {
          setUser(session.user)
          console.log('getInitialSession: Usuário encontrado, buscando perfil...')
          // Buscar perfil em background
          fetchProfile(session.user.id, 'getInitialSession')
        } else {
          console.log('getInitialSession: Nenhum usuário na sessão inicial.')
          setLoading(false)
        }
      } catch (error) {
        console.error('getInitialSession: Erro ao buscar sessão inicial:', error)
        setLoading(false)
      } finally {
        setInitialized(true)
        console.log('getInitialSession: Inicialização concluída.')
      }
    }

    getInitialSession()

    // Escutar mudanças de autenticação
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        // Ignorar INITIAL_SESSION pois já tratamos em getInitialSession
        if (event === 'INITIAL_SESSION') {
          console.log('onAuthStateChange: Ignorando INITIAL_SESSION (já tratado)')
          return
        }
        
        console.log('onAuthStateChange: Evento de autenticação:', event)
        console.log('onAuthStateChange: Sessão:', session ? 'Autenticado' : 'Não autenticado')
        
        if (event === 'SIGNED_OUT') {
          console.log('onAuthStateChange: Usuário deslogado.')
          setUser(null)
          setProfile(null)
          setLoading(false)
          return
        }
        
        if (session?.user) {
          console.log('onAuthStateChange: Usuário logado, atualizando perfil...')
          setUser(session.user)
          
          // Para eventos de refresh (SIGNED_IN, TOKEN_REFRESHED), preservar perfil existente se já existe
          // Usar profileRef.current pois o estado profile pode não estar atualizado ainda
          const refreshEvents = ['SIGNED_IN', 'TOKEN_REFRESHED']
          if (refreshEvents.includes(event) && profileRef.current && profileRef.current.id === session.user.id) {
            console.log(`onAuthStateChange: ${event} com perfil em cache, preservando perfil atual:`, profileRef.current.role)
            setProfile(profileRef.current) // Garantir que o state está sincronizado
            setLoading(false)
            return
          }
          
          // Para SIGNED_IN, aguardar getInitialSession resolver primeiro (evitar race condition)
          if (event === 'SIGNED_IN') {
            console.log('onAuthStateChange: SIGNED_IN detectado, aguardando getInitialSession resolver...')
            setTimeout(() => {
              if (!profileRef.current || profileRef.current.id !== session.user.id) {
                fetchProfile(session.user.id, `onAuthStateChange-${event}-delayed`)
              } else {
                console.log('onAuthStateChange: Perfil já resolvido por getInitialSession, ignorando')
              }
            }, 1000)
            return
          }
          
          await fetchProfile(session.user.id, `onAuthStateChange-${event}`)
        } else {
          console.log('onAuthStateChange: Nenhum usuário na sessão.')
          setUser(null)
          setProfile(null)
          profileRef.current = null // Limpar cache
          setLoading(false)
        }
      }
    )

    return () => {
      console.log('AuthProvider useEffect: Limpeza da assinatura.')
      subscription.unsubscribe()
    }
  }, []) // Removido dependências circulares

  const value = {
    user,
    profile,
    loading,
    initialized,
    refreshProfile: () => user ? fetchProfile(user.id, 'refreshProfile') : null
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}

// Hook principal de autenticação
export function useAuth() {
  const context = useContext(AuthContext)
  
  if (!context) {
    throw new Error('useAuth deve ser usado dentro de AuthProvider')
  }
  
  return context
}

// Hook para verificação de roles
export function useRole() {
  const { profile, loading } = useAuth()
  
  const hasRole = (roles) => {
    if (loading || !profile) {
      return false
    }
    
    if (typeof roles === 'string') {
      return profile.role === roles
    }
    
    if (Array.isArray(roles)) {
      return roles.includes(profile.role)
    }
    
    return false
  }

  const isAdmin = () => hasRole('admin')
  const isTeacher = () => hasRole(['teacher', 'admin'])
  const isStudent = () => hasRole(['student', 'teacher', 'admin'])
  
  return {
    role: profile?.role,
    hasRole,
    isAdmin,
    isTeacher,
    isStudent,
    loading
  }
}

// Hook para proteção de rotas no cliente
export function useRouteProtection(requiredRoles, redirectTo = '/login') {
  const { user, profile, loading, initialized } = useAuth()
  const { hasRole } = useRole()
  const router = useRouter()
  const [isAuthorized, setIsAuthorized] = useState(false)

  useEffect(() => {
    if (!initialized) return

    // Se não está logado
    if (!user) {
      router.push(`${redirectTo}?redirect=${encodeURIComponent(window.location.pathname)}`)
      return
    }

    // Se não tem o role necessário
    if (requiredRoles && !hasRole(requiredRoles)) {
      const dashboardMap = {
        'admin': '/administrador',
        'teacher': '/professor',
        'student': '/aluno'
      }
      const fallbackPath = dashboardMap[profile?.role] || '/aluno'
      router.push(fallbackPath)
      return
    }

    setIsAuthorized(true)
  }, [user, profile, initialized, requiredRoles, hasRole, router, redirectTo])

  return {
    isAuthorized: isAuthorized && !loading,
    loading: loading || !initialized,
    user,
    profile
  }
}

// Hook para logout
export function useLogout() {
  const router = useRouter()
  
  const logout = async () => {
    try {
      await supabase.auth.signOut()
      router.push('/login')
    } catch (error) {
      console.error('Erro ao fazer logout:', error)
    }
  }

  return logout
}