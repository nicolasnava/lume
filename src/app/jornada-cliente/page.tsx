import { Metadata } from 'next'
import JornadaClientePage from '@/components/landing/JornadaClientePage'

export const metadata: Metadata = {
  title: 'Jornada da Cliente • Lumê',
  description:
    'Entenda como sua cliente agenda serviços pelo seu link exclusivo em 4 passos simples pelo celular, sem precisar baixar aplicativo nem trocar mensagens.',
}

export default function Page() {
  return <JornadaClientePage />
}
