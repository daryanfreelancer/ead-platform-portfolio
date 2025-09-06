import { createServerClient } from '@supabase/ssr'
import { NextResponse } from 'next/server'

export async function createMiddlewareClient(request) {
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      cookies: {
        get(name) {
          const cookie = request.cookies.get(name)?.value
          console.log(`Middleware - Getting cookie ${name}:`, cookie ? 'Present' : 'Absent')
          return cookie
        },
        set(name, value, options) {
          console.log(`Middleware - Setting cookie ${name}`)
          request.cookies.set({
            name,
            value,
            ...options,
          })
          response = NextResponse.next({
            request: {
              headers: request.headers,
            },
          })
          response.cookies.set({
            name,
            value,
            ...options,
          })
        },
        remove(name, options) {
          console.log(`Middleware - Removing cookie ${name}`)
          request.cookies.set({
            name,
            value: '',
            ...options,
          })
          response = NextResponse.next({
            request: {
              headers: request.headers,
            },
          })
          response.cookies.set({
            name,
            value: '',
            ...options,
          })
        },
      },
    }
  )

  // Tentar obter e atualizar a sessão
  const { data: { session } } = await supabase.auth.getSession()
  console.log('Middleware - Session status:', session ? 'Active' : 'None')

  return { supabase, response }
}

export async function getUserWithProfile(supabase) {
  try {
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    
    if (userError || !user) {
      console.log('Middleware getUserWithProfile - No user found:', userError?.message)
      return { user: null, profile: null, error: userError }
    }

    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('role, full_name')
      .eq('id', user.id)
      .single()

    console.log('🔒 MIDDLEWARE - User ID:', user.id.substring(0, 8) + '...')
    console.log('🔒 MIDDLEWARE - Profile Role:', profile?.role)
    if (profileError) {
      console.log('🔒 MIDDLEWARE - Profile Error:', profileError.message || 'Erro desconhecido')
    }

    return { 
      user, 
      profile: profile || { role: 'student' }, // fallback role
      error: profileError 
    }
  } catch (error) {
    console.error('Middleware getUserWithProfile - Error:', error)
    return { user: null, profile: null, error }
  }
}

// Definir rotas protegidas e seus roles necessários
export const PROTECTED_ROUTES = {
  // URLs traduzidas (novas)
  '/administrador': ['admin'],
  '/professor': ['teacher', 'admin'],
  '/aluno': ['student', 'teacher', 'admin'],
  '/perfil': ['student', 'teacher', 'admin'], // qualquer usuário logado
  // '/cursos': ['student', 'teacher', 'admin'], // Agora é público
  '/certificados': ['student', 'teacher', 'admin'],
  // URLs antigas (serão redirecionadas pelo middleware)
  '/admin': ['admin'],
  '/teacher': ['teacher', 'admin'],
  '/student': ['student', 'teacher', 'admin'],
  '/profile': ['student', 'teacher', 'admin'],
  // '/courses': ['student', 'teacher', 'admin'], // Agora é público
  '/certificates': ['student', 'teacher', 'admin'],
}

// Rotas públicas que não precisam de autenticação
export const PUBLIC_ROUTES = [
  '/',
  // URLs traduzidas (novas)
  '/entrar',
  '/cadastrar',
  '/esqueci-senha',
  '/redefinir-senha',
  '/consulta-certificados',
  '/consulta',
  '/pagamento',
  '/cursos',  // Catálogo público de cursos
  '/courses', // Versão em inglês do catálogo
  // URLs antigas (serão redirecionadas pelo middleware)
  '/login',
  '/register',
  '/forgot-password',
  '/reset-password',
  '/payment',
  // URLs de debug
  '/debug-auth',
  '/test-dashboard', 
  '/test-admin',
  '/fix-admin',
  '/debug-policies',
  '/debug-query',
  '/test-redirect',  // TEMPORÁRIO para debug
  '/session-debug',  // TEMPORÁRIO - página pública de debug
  '/deploy-test',  // TESTE de deploy
  '/test-fetchProfile.html',  // TESTE fetchProfile
  '/debug-middleware'  // TESTE middleware
]

export function isPublicRoute(pathname) {
  return PUBLIC_ROUTES.some(route => {
    if (route === pathname) return true
    return false
  }) || pathname.startsWith('/api/') || 
     pathname.startsWith('/verify/') || 
     pathname.startsWith('/cursos/') ||  // Páginas individuais de cursos em português
     pathname.startsWith('/courses/') // Páginas individuais de cursos em inglês
}

export function getRequiredRoles(pathname) {
  // Verificar rotas exatas primeiro
  if (PROTECTED_ROUTES[pathname]) {
    return PROTECTED_ROUTES[pathname]
  }

  // Verificar rotas que começam com um padrão
  for (const [route, roles] of Object.entries(PROTECTED_ROUTES)) {
    if (pathname.startsWith(route + '/')) {
      return roles
    }
  }

  return null
}

export function hasRequiredRole(userRole, requiredRoles) {
  if (!requiredRoles || requiredRoles.length === 0) return true
  if (!userRole) return false
  
  return requiredRoles.includes(userRole)
}

export function getRedirectPath(userRole, requestedPath) {
  // Se não tem role, redirecionar para login
  if (!userRole) {
    return `/entrar?redirect=${encodeURIComponent(requestedPath)}`
  }

  // Redirecionar para dashboard apropriado baseado no role
  const dashboardMap = {
    'admin': '/administrador',
    'teacher': '/professor', 
    'student': '/aluno'
  }

  return dashboardMap[userRole] || '/aluno'
}