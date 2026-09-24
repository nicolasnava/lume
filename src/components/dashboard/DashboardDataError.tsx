'use client'

import { useRouter } from 'next/navigation'
import { RotateCw } from 'lucide-react'

export default function DashboardDataError({ message = 'Não foi possível carregar os dados do painel.' }: { message?: string }) {
  const router = useRouter()

  return (
    <section role="alert" className="mx-auto flex min-h-48 max-w-2xl flex-col items-start justify-center gap-3 rounded-2xl border border-[#B8A9D9]/40 bg-white p-6 text-[#4A3F5C] shadow-sm">
      <h2 className="text-base font-semibold">Os dados não puderam ser consultados</h2>
      <p className="text-sm leading-6 text-[#6D6478]">{message} Tente atualizar. Se persistir, pode haver uma divergência entre o banco e as consultas desta versão.</p>
      <button type="button" onClick={() => router.refresh()} className="inline-flex min-h-10 items-center gap-2 rounded-full bg-[#4A3F5C] px-4 text-sm font-semibold text-white transition duration-200 ease-out hover:bg-[#392F49] active:scale-[0.98]">
        <RotateCw className="h-4 w-4" />
        Tentar novamente
      </button>
    </section>
  )
}
