import { redirect } from 'next/navigation'
import MaintenanceMessage from '@/components/ui/maintenance-message'
import { createClient } from '@/lib/supabase/server'

export const metadata = {
  title: 'Cadastro - EduPlatform',
  description: 'Crie sua conta na plataforma EduPlatform'
}

export default async function RegisterPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  // Se usuário já está logado, redirecionar para dashboard apropriado
  if (user) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    // Redirecionar baseado no role
    if (profile?.role === 'admin') {
      redirect('/administrador')
    } else if (profile?.role === 'teacher') {
      redirect('/professor')
    } else {
      redirect('/aluno')
    }
  }
  
  // Bloquear temporariamente cadastro durante fase de construção
  return (
    <MaintenanceMessage
      title="Cadastro Temporariamente Indisponível"
      message="A plataforma está em fase de construção e melhorias. Novos cadastros estão temporariamente suspensos. O sistema de consulta de certificados continua funcionando normalmente através da opção 'Consulta Pública'."
      showBackButton={true}
      backUrl="/"
    />
  )
}