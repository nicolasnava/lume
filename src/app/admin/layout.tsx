import { notFound } from 'next/navigation'
import { getAuthenticatedAdmin } from '@/lib/admin/checkAdmin'
import { isAdmin2faVerified } from '@/lib/admin/twoFactor'
import AdminSidebarLayoutClient from '@/components/admin/AdminSidebarLayoutClient'

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  // Confirmar se o usuário autenticado está na tabela admin_users (sem bloquear ainda pelo 2FA)
  const admin = await getAuthenticatedAdmin(false)

  if (!admin) {
    notFound()
  }

  // Verificar se a sessão atual possui 2FA ativo
  const is2faActive = await isAdmin2faVerified(admin.id)

  // Se não estiver com 2FA validado, renderiza o componente limpo (para a tela de verificação /admin/verificar)
  if (!is2faActive) {
    return <>{children}</>
  }

  return (
    <AdminSidebarLayoutClient admin={admin}>
      {children}
    </AdminSidebarLayoutClient>
  )
}
