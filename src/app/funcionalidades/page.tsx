import { Metadata } from 'next'
import FuncionalidadesPage from '@/components/landing/FuncionalidadesPage'

export const metadata: Metadata = {
  title: 'Funcionalidades • Lumê — Agenda e Gestão para a Beleza',
  description:
    'Conheça todos os recursos do Lumê: agendamento online 24h, histórico e lembretes de clientes, controle financeiro e sincronização em 2 vias com Google Agenda.',
}

export default function Page() {
  return <FuncionalidadesPage />
}
