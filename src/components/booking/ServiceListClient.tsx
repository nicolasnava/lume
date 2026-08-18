'use client'

import { useState } from 'react'
import Image from 'next/image'
import { Database } from '@/lib/supabase/database.types'
import BookingWizardModal from './BookingWizardModal'
import ClientBookingsModal from './ClientBookingsModal'
import { getContrastingTextColor } from '@/lib/utils/contrast'
import { Clock, Scissors, CalendarCheck } from 'lucide-react'

type ProfissionalRow = Database['public']['Views']['profissionais_publico']['Row']
type ServicoRow = Database['public']['Tables']['servicos']['Row']

interface ServiceListClientProps {
  profissional: ProfissionalRow
  servicos: ServicoRow[]
  corPrimaria: string
}

export default function ServiceListClient({
  profissional,
  servicos,
  corPrimaria,
}: ServiceListClientProps) {
  const [selectedServico, setSelectedServico] = useState<ServicoRow | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isClientBookingsOpen, setIsClientBookingsOpen] = useState(false)

  const textColorOnPrimary = getContrastingTextColor(corPrimaria)

  const handleSelectService = (servico: ServicoRow) => {
    setSelectedServico(servico)
    setIsModalOpen(true)
  }

  return (
    <>
      {/* Botão de Atalho Discreto para Consultar Agendamentos Próprios */}
      <div className="mb-6 text-center">
        <button
          type="button"
          onClick={() => setIsClientBookingsOpen(true)}
          className="inline-flex items-center gap-2 rounded-full border border-gray-200 bg-white px-4 py-2 text-xs font-semibold text-[#4A3F5C] shadow-2xs hover:bg-gray-50 transition cursor-pointer"
        >
          <CalendarCheck className="h-4 w-4 text-[#B8A9D9]" />
          <span>Já agendou? Ver meus horários</span>
        </button>
      </div>

      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-bold tracking-tight text-[#4A3F5C] flex items-center gap-2">
          <Scissors className="h-5 w-5" style={{ color: corPrimaria }} />
          <span>Serviços Disponíveis</span>
        </h2>
        <span className="text-xs font-medium text-[#4A3F5C]/60">
          {servicos.length} {servicos.length === 1 ? 'serviço' : 'serviços'}
        </span>
      </div>

      {servicos.length > 0 ? (
        <div className="space-y-4">
          {servicos.map((servico) => (
            <div
              key={servico.id}
              className="group relative flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-2xl bg-white p-5 shadow-sm border border-black/5 transition hover:shadow-md hover:border-black/10"
            >
              <div className="flex items-start gap-4">
                {servico.foto_url && (
                  <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-xl bg-gray-100">
                    <Image
                      src={servico.foto_url}
                      alt={servico.nome}
                      fill
                      className="object-cover"
                    />
                  </div>
                )}
                <div>
                  <h3 className="text-base font-bold text-[#4A3F5C] group-hover:text-[#2d2639]">
                    {servico.nome}
                  </h3>
                  {servico.descricao && (
                    <p className="mt-1 text-xs text-[#4A3F5C]/80 leading-relaxed font-normal">
                      {servico.descricao}
                    </p>
                  )}
                  <div className="mt-1.5 flex items-center gap-3 text-xs text-[#4A3F5C]/70">
                    <span className="flex items-center gap-1">
                      <Clock className="h-3.5 w-3.5" />
                      {servico.duracao_minutos} min
                    </span>
                    {servico.intervalo_manutencao_dias && (
                      <span className="rounded-md bg-purple-50 px-2 py-0.5 text-[10px] font-medium text-purple-700">
                        Manutenção em {servico.intervalo_manutencao_dias}d
                      </span>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between sm:flex-col sm:items-end gap-3 pt-2 sm:pt-0 border-t sm:border-t-0 border-gray-100">
                <span className="text-lg font-extrabold text-[#4A3F5C]">
                  {new Intl.NumberFormat('pt-BR', {
                    style: 'currency',
                    currency: 'BRL',
                  }).format(servico.preco)}
                </span>

                <button
                  type="button"
                  onClick={() => handleSelectService(servico)}
                  className="inline-flex items-center gap-1.5 rounded-xl px-4 py-2 text-xs font-semibold shadow-xs transition hover:opacity-90 active:scale-95 cursor-pointer"
                  style={{ backgroundColor: corPrimaria, color: textColorOnPrimary }}
                >
                  <CalendarCheck className="h-4 w-4" />
                  <span>Agendar</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="rounded-2xl bg-white/80 p-8 text-center shadow-xs border border-black/5">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-gray-100 text-[#4A3F5C]/40">
            <Scissors className="h-6 w-6" />
          </div>
          <h3 className="mt-3 text-sm font-semibold text-[#4A3F5C]">Nenhum serviço cadastrado</h3>
          <p className="mt-1 text-xs text-[#4A3F5C]/70">
            Esta profissional ainda não adicionou a lista de serviços ao catálogo público.
          </p>
        </div>
      )}

      <BookingWizardModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        profissional={profissional}
        initialServico={selectedServico}
        allServicos={servicos}
      />

      <ClientBookingsModal
        isOpen={isClientBookingsOpen}
        onClose={() => setIsClientBookingsOpen(false)}
        profissionalSlug={profissional.slug}
        corPrimaria={corPrimaria}
      />
    </>
  )
}
