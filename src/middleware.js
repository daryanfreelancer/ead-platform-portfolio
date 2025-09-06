import { NextResponse } from 'next/server'
import { 
  createMiddlewareClient, 
  getUserWithProfile,
  isPublicRoute,
  getRequiredRoles,
  hasRequiredRole,
  getRedirectPath
} from '@/lib/auth/middleware'

// Mapeamento de URLs em inglês para português (redirects 301)
const URL_REDIRECTS = {
  '/login': '/entrar',
  '/register': '/cadastrar',
  '/forgot-password': '/esqueci-senha',
  '/reset-password': '/redefinir-senha',
  '/admin': '/administrador',
  '/teacher': '/professor',
  '/student': '/aluno',
  // '/courses': '/cursos', // Agora ambas são rotas públicas válidas
  '/profile': '/perfil',
  '/certificates': '/certificados',
  '/payment/success': '/pagamento/sucesso',
  '/payment/failure': '/pagamento/falha',
  '/payment/pending': '/pagamento/pendente',
  // Admin URLs
  '/admin/users': '/administrador/usuarios',
  '/admin/courses': '/administrador/cursos',
  '/admin/enrollments': '/administrador/matriculas',
  '/admin/payments': '/administrador/pagamentos',
  '/admin/reports': '/administrador/relatorios',
  '/admin/storage': '/administrador/armazenamento',
  '/admin/audit': '/administrador/auditoria',
  '/admin/hubs': '/administrador/polos',
  // Teacher URLs
  '/teacher/courses': '/professor/cursos',
  '/teacher/courses/create': '/professor/cursos/criar',
  // Student URLs
  '/student/purchases': '/aluno/compras'
}

export async function middleware(request) {
  const requestUrl = new URL(request.url)
  const pathname = requestUrl.pathname

  // Log IMEDIATO para debug
  console.log('=== MIDDLEWARE START ===')
  console.log('Middleware - Path:', pathname)
  console.log('Middleware - Full URL:', request.url)
  
  // VERIFICAR ROTAS PÚBLICAS PRIMEIRO (antes de criar cliente)
  const publicRoutes = ['/deploy-test', '/session-debug', '/test-redirect']
  if (publicRoutes.includes(pathname)) {
    console.log('Middleware - PUBLIC ROUTE DETECTED, allowing access')
    const response = NextResponse.next()
    // Adicionar headers anti-cache para rotas de debug
    response.headers.set('Cache-Control', 'no-store, must-revalidate')
    response.headers.set('X-Middleware-Cache', 'no-cache')
    return response
  }
  
  const { supabase, response } = await createMiddlewareClient(request)
  
  // 1. PRIMEIRA PRIORIDADE: Verificar redirects de URLs em inglês
  if (URL_REDIRECTS[pathname]) {
    console.log(`Middleware - Redirecting ${pathname} to ${URL_REDIRECTS[pathname]}`)
    const redirectUrl = new URL(URL_REDIRECTS[pathname], request.url)
    
    // Preservar query params
    requestUrl.searchParams.forEach((value, key) => {
      redirectUrl.searchParams.set(key, value)
    })
    
    // Preservar hash
    if (requestUrl.hash) {
      redirectUrl.hash = requestUrl.hash
    }
    
    return NextResponse.redirect(redirectUrl, { status: 301 })
  }
  
  // Verificar redirects dinâmicos com IDs
  const dynamicRedirects = [
    { pattern: /^\/courses\/([^\/]+)$/, replacement: '/cursos/$1' },
    { pattern: /^\/courses\/([^\/]+)\/learn$/, replacement: '/cursos/$1/aprender' },
    { pattern: /^\/teacher\/courses\/([^\/]+)$/, replacement: '/professor/cursos/$1' },
    { pattern: /^\/teacher\/courses\/([^\/]+)\/edit$/, replacement: '/professor/cursos/$1/editar' }
  ]
  
  for (const redirect of dynamicRedirects) {
    const match = pathname.match(redirect.pattern)
    if (match) {
      const newPath = redirect.replacement.replace('$1', match[1])
      console.log(`Middleware - Dynamic redirect ${pathname} to ${newPath}`)
      const redirectUrl = new URL(newPath, request.url)
      
      // Preservar query params e hash
      requestUrl.searchParams.forEach((value, key) => {
        redirectUrl.searchParams.set(key, value)
      })
      if (requestUrl.hash) {
        redirectUrl.hash = requestUrl.hash
      }
      
      return NextResponse.redirect(redirectUrl, { status: 301 })
    }
  }
  
  // 2. SEGUNDA PRIORIDADE: Interceptar tokens de recuperação de senha
  if (requestUrl.searchParams.get('type') === 'recovery' || 
      requestUrl.searchParams.get('token_hash')) {
    
    console.log('Middleware - Recovery token detected, redirecting to /redefinir-senha')
    
    const redirectUrl = new URL('/redefinir-senha', request.url)
    requestUrl.searchParams.forEach((value, key) => {
      redirectUrl.searchParams.set(key, value)
    })
    
    if (requestUrl.hash) {
      redirectUrl.hash = requestUrl.hash
    }
    
    return NextResponse.redirect(redirectUrl)
  }

  // 3. TERCEIRA PRIORIDADE: Verificar autenticação e roles
  try {
    const { user, profile } = await getUserWithProfile(supabase)

    // IMPORTANTE: Sempre tentar refresh da sessão, mas apenas se não for login recente
    // Isso mantém a sessão viva durante navegação sem interferir no processo de login
    if (user) {
      const { data: { session }, error } = await supabase.auth.getSession()
      if (session) {
        // Verificar se está próximo de expirar (menos de 10 minutos)
        const expiresAt = session.expires_at ? session.expires_at * 1000 : 0
        const timeUntilExpiry = expiresAt - Date.now()
        const sessionAge = Date.now() - (session.created_at ? new Date(session.created_at).getTime() : 0)
        
        // Só fazer refresh se sessão não é muito nova (> 5 segundos) e está expirando (20 min)
        if (timeUntilExpiry < 1200000 && timeUntilExpiry > 0 && sessionAge > 5000) {
          console.log('Middleware - Session expiring soon, refreshing...')
          await supabase.auth.refreshSession()
        }
      }
    }

    // Se a rota é pública, permitir acesso
    if (isPublicRoute(pathname)) {
      return response
    }

    // Se não está logado, redirecionar para login
    if (!user) {
      console.log('Middleware - User not authenticated, redirecting to login')
      const loginUrl = new URL('/entrar', request.url)
      loginUrl.searchParams.set('redirect', pathname)
      return NextResponse.redirect(loginUrl)
    }

    // Verificar se a rota requer roles específicos
    const requiredRoles = getRequiredRoles(pathname)
    console.log(`🔒 MIDDLEWARE AUTHORIZATION CHECK:`)
    console.log(`🔒 - Path: ${pathname}`)
    console.log(`🔒 - User Role: ${profile?.role}`)
    console.log(`🔒 - Required Roles: ${requiredRoles ? JSON.stringify(requiredRoles) : 'None'}`)
    console.log(`🔒 - Has Required Role: ${requiredRoles ? hasRequiredRole(profile?.role, requiredRoles) : 'N/A'}`)
    
    if (requiredRoles && !hasRequiredRole(profile?.role, requiredRoles)) {
      console.log(`🔒 MIDDLEWARE - BLOCKED: User role '${profile?.role}' not authorized for '${pathname}'`)
      const redirectPath = getRedirectPath(profile?.role, pathname)
      console.log(`🔒 MIDDLEWARE - Redirecting to: ${redirectPath}`)
      return NextResponse.redirect(new URL(redirectPath, request.url))
    }

    console.log(`🔒 MIDDLEWARE - ACCESS GRANTED to '${pathname}' for role '${profile?.role}'`)
    return response

  } catch (error) {
    console.error('Middleware - Error:', error)
    // Em caso de erro, redirecionar para login
    const loginUrl = new URL('/entrar', request.url)
    loginUrl.searchParams.set('redirect', pathname)
    return NextResponse.redirect(loginUrl)
  }
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico|.*\\.png|.*\\.jpg|.*\\.jpeg|.*\\.gif|.*\\.svg|.*\\.webp|manifest.json).*)']
}