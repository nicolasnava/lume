import { Metadata } from 'next'
import InstalarPage from '@/components/landing/InstalarPage'

export const metadata: Metadata = {
  title: 'Instalar no Celular • Lumê — Sua Agenda com 1 Toque',
  description:
    'Aprenda como adicionar o Lumê à tela inicial do seu iPhone ou Android em menos de 20 segundos para acessar sua agenda com 1 toque.',
}

export default function Page() {
  return <InstalarPage />
}
