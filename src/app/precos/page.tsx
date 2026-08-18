import { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import PrecosPage from '@/components/landing/PrecosPage'

export const metadata: Metadata = {
  title: 'Planos e Preços • Lumê — Transparência para Profissionais da Beleza',
  description:
    'Conheça o plano oficial do Lumê: R$ 69,90/mês com 30 dias de teste grátis. Sem taxa de adesão, sem cartão de crédito prévio e cancelamento simples.',
}

export default async function Page() {
  const supabase = await createClient()

  let planPrice = 69.90
  try {
    const { data: plano } = (await supabase
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .from('saas_planos' as any)
      .select('preco')
      .eq('slug', 'mensal')
      .maybeSingle()) as { data: { preco: number } | null }

    if (plano?.preco) {
      planPrice = Number(plano.preco)
    }
  } catch {
    // Fallback padrão
  }

  return <PrecosPage planPrice={planPrice} trialDays={14} />
}
