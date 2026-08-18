import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import LandingPage from '@/components/landing/LandingPage'

export default async function HomePage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (user) {
    redirect('/dashboard/geral')
  }

  // Buscar valor do plano mensal configurado no banco de dados (admin)
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
    // Fallback padrão se não houver registros
  }

  return <LandingPage planPrice={planPrice} />
}
