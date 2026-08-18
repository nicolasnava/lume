import { Metadata } from 'next'
import PrivacidadePage from '@/components/landing/PrivacidadePage'

export const metadata: Metadata = {
  title: 'Política de Privacidade • Lumê — Proteção de Dados e LGPD',
  description:
    'Conheça nossa Política de Privacidade em conformidade com a LGPD (Lei nº 13.709/2018). Transparência e segurança para você e suas clientes.',
}

export default function Page() {
  return <PrivacidadePage />
}
