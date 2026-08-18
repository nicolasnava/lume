import { Metadata } from 'next'
import ContatoPage from '@/components/landing/ContatoPage'

export const metadata: Metadata = {
  title: 'Contato e Suporte • Lumê — Estamos ao Seu Lado',
  description:
    'Fale com o time do Lumê via WhatsApp ou e-mail para tirar dúvidas, configurar sua agenda de atendimentos e receber suporte personalizado.',
}

export default function Page() {
  return <ContatoPage />
}
