import { Metadata } from 'next'
import TermosPage from '@/components/landing/TermosPage'

export const metadata: Metadata = {
  title: 'Termos de Serviço • Lumê — Condições Gerais de Uso',
  description:
    'Leia os Termos de Serviço do Lumê. Conheça as condições do plano, 30 dias de teste grátis e suporte para profissionais da beleza.',
}

export default function Page() {
  return <TermosPage />
}
