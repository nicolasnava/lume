import Image from 'next/image'
import { CalendarX } from 'lucide-react'

export default function PaginaIndisponivel() {
  return (
    <div className="min-h-screen bg-[#FAF7F5] flex flex-col items-center justify-center p-4 font-sans text-center">
      <div className="max-w-md w-full bg-white rounded-3xl p-8 border border-gray-200/80 shadow-xl space-y-6">
        <div className="flex justify-center">
          <Image
            src="/assets/lume_logo.webp"
            alt="Lumê"
            width={120}
            height={38}
            className="h-auto w-auto max-h-9 object-contain"
          />
        </div>

        <div className="mx-auto h-16 w-16 rounded-full bg-purple-50 flex items-center justify-center text-[#4A3F5C]">
          <CalendarX className="h-8 w-8 text-[#8675A9]" />
        </div>

        <div className="space-y-2">
          <h1 className="text-xl sm:text-2xl font-extrabold text-[#4A3F5C]">
            Página Temporariamente Indisponível
          </h1>
          <p className="text-xs sm:text-sm text-gray-500 font-medium leading-relaxed">
            Esta página de agendamentos está temporariamente indisponível no momento. Por favor, tente novamente mais tarde ou entre em contato diretamente com a profissional.
          </p>
        </div>

        <div className="pt-2 text-[11px] text-gray-400 border-t border-gray-100 font-medium">
          Lumê — Agendamento Inteligente para Profissionais de Beleza
        </div>
      </div>
    </div>
  )
}
