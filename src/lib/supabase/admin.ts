import { createClient } from '@supabase/supabase-js'
import { Database } from './database.types'

/**
 * Supabase Admin Client utilizando a Service Role Key.
 * Usado exclusivamente em Server Actions e Server Components para operações administrativas
 * de agendamentos públicos (como gerenciamento de clientes e verificação de horários sem bloqueio de RLS).
 */
export function createAdminClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceRoleKey =
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error('Supabase URL ou Service Role Key não configurados no ambiente.')
  }

  return createClient<Database>(supabaseUrl, serviceRoleKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  })
}
