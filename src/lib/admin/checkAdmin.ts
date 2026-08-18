import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { Database } from '@/lib/supabase/database.types'
import { isAdmin2faVerified } from './twoFactor'

export type AdminUserRow = Database['public']['Tables']['admin_users']['Row']

/**
 * Verifica no lado do servidor se o usuário atual autenticado tem permissão de super admin.
 * Por padrão exige que a sessão tenha passado pela verificação 2FA.
 * Se require2fa = false, apenas confirma a presença na tabela admin_users (útil para a tela de verificação).
 */
export async function getAuthenticatedAdmin(require2fa: boolean = true): Promise<AdminUserRow | null> {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return null
    }

    const adminSupabase = createAdminClient()
    const { data: adminRecord } = await adminSupabase
      .from('admin_users')
      .select('*')
      .eq('id', user.id)
      .maybeSingle()

    if (!adminRecord) {
      return null
    }

    if (require2fa) {
      const is2faValid = await isAdmin2faVerified(adminRecord.id)
      if (!is2faValid) {
        return null
      }
    }

    return (adminRecord as AdminUserRow) || null
  } catch (error) {
    console.error('[checkAdmin] Erro ao verificar privilégios de admin:', error)
    return null
  }
}
