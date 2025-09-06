'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useAuth, useRole } from '@/hooks/use-auth'
import LogoutButton from '@/components/logout-button'
import Logo from '@/components/ui/logo'
import { Menu, X, User, BookOpen, Shield, Award, GraduationCap } from 'lucide-react'
import { UserAvatar } from '@/components/ui/user-avatar'
import NotificationsPanel from '@/components/student/notifications-panel'
import { cn } from '@/lib/utils'

export default function Navigation() {
  const { user, profile, loading } = useAuth()
  const { isAdmin, isTeacher, isStudent } = useRole()
  const pathname = usePathname()
  const router = useRouter()
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [isSticky, setIsSticky] = useState(false)

  useEffect(() => {
    const handleScroll = () => {
      const isScrolled = window.scrollY > 64
      setIsSticky(isScrolled)
    }
    window.addEventListener('scroll', handleScroll)
    return () => {
      window.removeEventListener('scroll', handleScroll)
    }
  }, [])

  const getDashboardLink = () => {
    if (isAdmin()) return '/administrador'
    if (isTeacher()) return '/professor'
    if (isStudent()) return '/aluno'
    return '/aluno'
  }

  const getRoleLabel = () => {
    if (isAdmin()) return 'Administrador'
    if (isTeacher()) return 'Professor'
    if (isStudent()) return 'Estudante'
    return 'Usuário'
  }

  const getRoleIcon = () => {
    if (isAdmin()) return <Shield className="w-4 h-4" />
    if (isTeacher()) return <BookOpen className="w-4 h-4" />
    return <User className="w-4 h-4" />
  }

  const handleCoursesClick = () => {
    if (pathname === '/') {
      // Se está na homepage, fazer scroll com offset para mostrar o título
      setTimeout(() => {
        const catalogoElement = document.getElementById('catalogo-cursos')
        if (catalogoElement) {
          const yOffset = -200 // Offset negativo para mostrar o título acima do menu fixo
          const y = catalogoElement.getBoundingClientRect().top + window.pageYOffset + yOffset
          window.scrollTo({ top: y, behavior: 'smooth' })
        }
      }, 100)
    } else {
      // Se está em outra página, navegar para home e depois fazer scroll
      router.push('/')
      setTimeout(() => {
        const catalogoElement = document.getElementById('catalogo-cursos')
        if (catalogoElement) {
          const yOffset = -200
          const y = catalogoElement.getBoundingClientRect().top + window.pageYOffset + yOffset
          window.scrollTo({ top: y, behavior: 'smooth' })
        }
      }, 500)
    }
  }

  return (
    <nav 
      className={cn(
        "bg-white border-b border-gray-200 transition-all duration-300 ease-in-out w-full",
        isSticky ? "fixed top-0 left-0 right-0 z-50 shadow-lg" : "relative shadow-md"
      )}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <div className="flex items-center">
            <Link href="/" className="flex items-center space-x-3">
              <Logo size={32} />
              <span className="text-3xl font-bold text-gray-900" style={{ fontSize: '32px', lineHeight: '32px' }}>EduPlatform</span>
            </Link>
          </div>

          {/* Links de navegação - Desktop e Tablet */}
          <div className="hidden lg:flex items-center gap-2 xl:gap-3">
            <Link 
              href="/" 
              className="text-gray-700 hover:text-blue-600 transition-colors whitespace-nowrap flex-shrink-0"
            >
              Início
            </Link>
            
            <button 
              onClick={handleCoursesClick}
              className="flex items-center gap-1 text-gray-700 hover:text-blue-600 transition-colors whitespace-nowrap flex-shrink-0 cursor-pointer"
            >
              <GraduationCap className="w-4 h-4" />
              <span>Cursos</span>
            </button>
            
            <Link 
              href="/consulta-certificados" 
              className="text-blue-600 hover:text-blue-700 font-bold transition-colors whitespace-nowrap flex-shrink-0 hidden xl:block"
            >
              Consulta Pública
            </Link>
            <Link 
              href="/consulta-certificados" 
              className="text-blue-600 hover:text-blue-700 font-bold transition-colors whitespace-nowrap flex-shrink-0 xl:hidden"
            >
              Consulta Pública
            </Link>

            {user ? (
              <>
                {/* Link para Dashboard baseado no role */}
                <Link 
                  href={getDashboardLink()}
                  className="flex items-center gap-1 px-3 py-2 rounded-md bg-blue-50 text-blue-700 hover:bg-blue-100 transition-colors whitespace-nowrap flex-shrink-0 min-h-[44px]"
                >
                  {getRoleIcon()}
                  <span>Dashboard</span>
                </Link>

                {/* Link para Certificados (apenas estudantes) - Visível em telas grandes */}
                {isStudent() && (
                  <Link 
                    href="/certificados"
                    className="flex items-center gap-1 text-gray-700 hover:text-blue-600 transition-colors whitespace-nowrap flex-shrink-0 hidden 2xl:flex"
                  >
                    <Award className="w-4 h-4" />
                    <span>Certificados</span>
                  </Link>
                )}

                {/* Botão Perfil */}
                <Link 
                  href="/perfil"
                  className="flex items-center gap-1 px-3 py-2 rounded-md text-gray-700 hover:bg-gray-100 transition-colors whitespace-nowrap flex-shrink-0 hidden lg:flex min-h-[44px]"
                >
                  <User className="w-4 h-4" />
                  <span className="text-sm">Perfil</span>
                </Link>

                {/* Divisor */}
                <div className="h-8 w-px bg-gray-300 hidden lg:block"></div>

                {/* Painel de notificações (apenas para estudantes) */}
                {isStudent() && (
                  <div className="flex-shrink-0">
                    <NotificationsPanel />
                  </div>
                )}

                {/* Grupo direito - Informações do usuário + Logout */}
                <div className="flex items-center gap-1.5">
                  <div className="text-right min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {profile?.full_name || user.email}
                    </p>
                    <p className="text-xs text-blue-600 font-medium truncate">
                      {getRoleLabel()}
                    </p>
                  </div>
                  
                  <UserAvatar
                    avatarUrl={profile?.avatar_url}
                    userName={profile?.full_name}
                    size="sm"
                    showBorder={true}
                  />
                  
                  <div className="h-8 w-px bg-gray-300"></div>
                  
                  <LogoutButton />
                </div>
              </>
            ) : (
              <>
                {loading ? (
                  <div className="animate-pulse flex gap-4">
                    <div className="h-8 w-16 bg-gray-300 rounded"></div>
                    <div className="h-8 w-20 bg-gray-300 rounded"></div>
                  </div>
                ) : (
                  <>
                    <Link 
                      href="/entrar" 
                      className="text-gray-700 hover:text-blue-600 transition-colors whitespace-nowrap flex-shrink-0 min-h-[44px] flex items-center"
                    >
                      Entrar
                    </Link>
                    <Link 
                      href="/cadastrar" 
                      className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors whitespace-nowrap flex-shrink-0 min-h-[44px] flex items-center"
                    >
                      Cadastrar
                    </Link>
                  </>
                )}
              </>
            )}
          </div>

          {/* Menu Mobile/Tablet - Aparece até lg (1024px) */}
          <div className="lg:hidden">
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="text-gray-700 hover:text-blue-600 focus:outline-none min-h-[44px] min-w-[44px] flex items-center justify-center"
            >
              {isMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>

        {/* Menu mobile e tablet */}
        {isMenuOpen && (
          <div className="lg:hidden border-t border-gray-200 py-4">
            <div className="space-y-2">
              <Link 
                href="/" 
                className="block px-4 py-2 text-gray-700 hover:bg-gray-50 hover:text-blue-600 transition-colors"
                onClick={() => setIsMenuOpen(false)}
              >
                Início
              </Link>
              
              <button 
                onClick={() => {
                  handleCoursesClick()
                  setIsMenuOpen(false)
                }}
                className="flex items-center space-x-2 px-4 py-2 text-gray-700 hover:bg-gray-50 hover:text-blue-600 transition-colors w-full text-left cursor-pointer"
              >
                <GraduationCap className="w-4 h-4" />
                <span>Cursos</span>
              </button>
              
              <Link 
                href="/consulta-certificados" 
                className="block px-4 py-2 text-blue-600 hover:bg-blue-50 hover:text-blue-700 font-bold transition-colors"
                onClick={() => setIsMenuOpen(false)}
              >
                Consulta Pública
              </Link>

              {user ? (
                <>
                  <Link 
                    href={getDashboardLink()}
                    className="flex items-center space-x-2 px-4 py-2 text-blue-700 bg-blue-50 hover:bg-blue-100 transition-colors"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    {getRoleIcon()}
                    <span>Dashboard</span>
                  </Link>

                  {/* Link para Certificados (mobile) */}
                  {isStudent() && (
                    <Link 
                      href="/certificados"
                      className="flex items-center space-x-2 px-4 py-2 text-gray-700 hover:bg-gray-50 hover:text-blue-600 transition-colors"
                      onClick={() => setIsMenuOpen(false)}
                    >
                      <Award className="w-4 h-4" />
                      <span>Certificados</span>
                    </Link>
                  )}

                  <Link 
                    href="/perfil"
                    className="block px-4 py-2 text-gray-700 hover:bg-gray-50 hover:text-blue-600 transition-colors"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    Perfil
                  </Link>

                  <div className="px-4 py-2 border-t border-gray-200">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center space-x-3">
                        {profile?.avatar_url ? (
                          <img
                            src={profile.avatar_url}
                            alt="Avatar"
                            className="w-10 h-10 rounded-full border-2 border-gray-200"
                          />
                        ) : (
                          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center">
                            <User className="w-5 h-5 text-white" />
                          </div>
                        )}
                        <div>
                          <p className="text-sm font-medium text-gray-900">
                            {profile?.full_name || user.email}
                          </p>
                          <p className="text-xs text-gray-500">
                            {getRoleLabel()}
                          </p>
                        </div>
                      </div>
                      
                      {/* Notificações no menu mobile (apenas para estudantes) */}
                      {isStudent() && (
                        <div className="flex-shrink-0">
                          <NotificationsPanel />
                        </div>
                      )}
                    </div>
                    <LogoutButton />
                  </div>
                </>
              ) : (
                <>
                  {loading ? (
                    <div className="px-4 py-2">
                      <div className="animate-pulse space-y-2">
                        <div className="h-8 bg-gray-300 rounded"></div>
                        <div className="h-8 bg-gray-300 rounded"></div>
                      </div>
                    </div>
                  ) : (
                    <>
                      <Link 
                        href="/entrar" 
                        className="block px-4 py-2 text-gray-700 hover:bg-gray-50 hover:text-blue-600 transition-colors"
                        onClick={() => setIsMenuOpen(false)}
                      >
                        Entrar
                      </Link>
                      <Link 
                        href="/cadastrar" 
                        className="block mx-4 my-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors text-center"
                        onClick={() => setIsMenuOpen(false)}
                      >
                        Cadastrar
                      </Link>
                    </>
                  )}
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </nav>
  )
}