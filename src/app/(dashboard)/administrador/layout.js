import AdminRouteGuard from '@/components/admin/admin-route-guard'

export const metadata = {
  title: 'Administrador - EduPlatform',
  description: 'Painel administrativo da plataforma EduPlatform'
}

export default function AdminLayout({ children }) {
  return (
    <AdminRouteGuard>
      {children}
    </AdminRouteGuard>
  )
}