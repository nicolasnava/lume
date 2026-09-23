'use client'

import { useEffect, useRef } from 'react'
import { Check, X } from 'lucide-react'

const groups: { title: string; rows: [string, boolean | string, boolean | string][] }[] = [
  { title: 'Sua rotina', rows: [
    ['Vitrine individual com link próprio', true, true],
    ['Agendamentos online', true, true],
    ['Catálogo de serviços e pacotes', true, true],
    ['Histórico de clientes', true, true],
    ['Controle financeiro e relatórios', true, true],
    ['Integração com Google Agenda', true, true],
    ['Lembretes por WhatsApp', true, true],
    ['Controle de disponibilidade', true, true],
    ['Suporte por WhatsApp', true, true],
  ] },
  { title: 'Seu espaço e sua equipe', rows: [
    ['Profissionais incluídas', '1 profissional', 'Até 6 profissionais'],
    ['Vitrine coletiva do espaço', false, true],
    ['Agenda da equipe em um só lugar', false, true],
    ['Comissões e repasses', false, true],
    ['Aluguel de cadeira ou espaço', false, true],
    ['Acesso individual para cada parceira', false, true],
    ['Agendamento pela recepção', false, true],
    ['Extrato de repasse por WhatsApp', false, true],
    ['Suporte prioritário', false, true],
  ] },
]

export default function PlanComparisonDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const section = useRef<HTMLElement>(null)
  useEffect(() => {
    if (open) section.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }, [open])

  if (!open) return null

  const cell = (value: boolean | string) => typeof value === 'string' ? value : value
    ? <><Check aria-hidden="true" className="mx-auto h-5 w-5 text-[#D8CCEA]" /><span className="sr-only">Incluído</span></>
    : <><X aria-hidden="true" className="mx-auto h-4 w-4 text-white/35" /><span className="sr-only">Não incluído</span></>

  return (
    <section ref={section} aria-labelledby="plan-comparison-title" className="mx-auto mt-8 w-full max-w-5xl scroll-mt-24 overflow-hidden rounded-3xl border border-[#B8A9D9]/30 bg-[#241C2E] text-[#FAF7F5] shadow-xl animate-in fade-in duration-200 motion-reduce:animate-none">
      <div className="relative px-5 pb-7 pt-9 text-center sm:px-10 sm:pt-12">
        <button type="button" onClick={onClose} aria-label="Fechar comparação" className="absolute right-4 top-4 rounded-full p-2 text-white/70 transition-transform duration-150 ease-out hover:bg-[#B8A9D9]/20 active:scale-[.97]"><X className="h-5 w-5" /></button>
        <p className="text-[10px] font-bold uppercase tracking-[.24em] text-[#B8A9D9]">Cada detalhe, lado a lado</p>
        <h2 id="plan-comparison-title" className="mt-3 text-2xl font-extrabold tracking-tight sm:text-3xl">Compare os planos Lumê</h2>
        <p className="mt-2 text-xs text-[#D5CBDD] sm:text-sm">Encontre o plano que acompanha seu jeito de trabalhar.</p>
      </div>
      <div className="overflow-x-auto px-3 pb-7 sm:px-8 sm:pb-10">
        <table className="w-full min-w-[540px] border-collapse text-xs sm:text-sm">
          <caption className="sr-only">Comparação de recursos entre Lumê Individual e Lumê Studio</caption>
          <thead className="sticky top-0 z-10">
            <tr><th scope="col" className="w-[46%] rounded-tl-2xl bg-[#342940] px-3 py-5 text-left sm:px-6">Recursos</th><th scope="col" className="w-[27%] bg-[#342940] px-2 py-5 font-bold">Lumê Individual</th><th scope="col" className="w-[27%] rounded-tr-2xl bg-[#4A3F5C] px-2 py-5 font-bold">Lumê Studio</th></tr>
          </thead>
          {groups.map((group) => <tbody key={group.title}>
            <tr><th colSpan={3} scope="colgroup" className="border-b border-white/10 px-3 pb-3 pt-6 text-left text-[10px] font-bold uppercase tracking-[.16em] text-[#B8A9D9] sm:px-6">{group.title}</th></tr>
            {group.rows.map(([label, individual, studio]) => <tr key={label} className="border-b border-white/10">
              <th scope="row" className="px-3 py-4 text-left font-medium leading-relaxed sm:px-6">{label}</th>
              <td className="px-2 py-4 text-center text-[11px] sm:text-sm">{cell(individual)}</td>
              <td className="bg-[#B8A9D9]/10 px-2 py-4 text-center text-[11px] font-semibold sm:text-sm">{cell(studio)}</td>
            </tr>)}
          </tbody>)}
        </table>
      </div>
    </section>
  )
}
