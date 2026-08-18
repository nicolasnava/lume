import { Metadata } from 'next'
import SobrePage from '@/components/landing/SobrePage'

export const metadata: Metadata = {
  title: 'Sobre o Lumê • Nossa História e Propósito na Beleza',
  description:
    'Conheça a história e os valores do Lumê: simplicidade, tecnologia feita para a rotina real da beleza e mais autonomia para profissionais autônomas.',
}

export default function Page() {
  return <SobrePage />
}
