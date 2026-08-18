import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import ClientListClient, { ClientData } from '@/components/dashboard/ClientListClient'

export const revalidate = 0
export const dynamic = 'force-dynamic'

export default async function ClientesPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const adminSupabase = createAdminClient()

  // Buscar todos os clientes da profissional com seus agendamentos e dados financeiros
  const { data: clientes } = await adminSupabase
    .from('clientes')
    .select('*, agendamentos(id, data_hora_inicio, data_hora_fim, status, valor_cobrado, pago, forma_pagamento, servicos(nome, preco))')
    .eq('profissional_id', user.id)
    .order('created_at', { ascending: false })

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const formattedClients = (clientes || []) as any[] as ClientData[]

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-[#4A3F5C]">
          Gestão de Clientes
        </h1>
        <p className="text-xs sm:text-sm text-[#4A3F5C]/70 mt-1">
          Consulte a lista de clientes, contatos no WhatsApp e o histórico de atendimentos
        </p>
      </div>

      <ClientListClient initialClients={formattedClients} />
    </div>
  )
}
