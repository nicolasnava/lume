import { notFound } from 'next/navigation'
import Image from 'next/image'
import { createAdminClient } from '@/lib/supabase/admin'
import AvaliacaoFormClient from '@/components/reviews/AvaliacaoFormClient'

interface PageProps {
  params: Promise<{
    id: string
  }>
}

export const revalidate = 0
export const dynamic = 'force-dynamic'

export default async function AvaliarPage({ params }: PageProps) {
  const { id } = await params
  const adminSupabase = createAdminClient()

  // 1. Buscar agendamento com dados do profissional, serviço e cliente
  const { data: agendamento } = await adminSupabase
    .from('agendamentos')
    .select('*, profissionais(id, nome, foto_url, cor_primaria, cor_secundaria), servicos(*), clientes(*)')
    .eq('id', id)
    .maybeSingle()

  if (!agendamento) {
    return notFound()
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const prof = agendamento.profissionais as any
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const servico = agendamento.servicos as any
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const cliente = agendamento.clientes as any

  // 2. Buscar avaliação existente para este agendamento (se houver)
  const { data: avaliacaoExistente } = await adminSupabase
    .from('avaliacoes')
    .select('*')
    .eq('agendamento_id', id)
    .maybeSingle()

  const corPrimaria = prof?.cor_primaria || '#B8A9D9'

  // 3. Verificar expiração do prazo de avaliação (60 dias)
  const AVALIACAO_EXPIRACAO_DIAS = 60
  const dataFimMs = new Date(agendamento.data_hora_fim || agendamento.data_hora_inicio).getTime()
  const isExpirado = Date.now() - dataFimMs > AVALIACAO_EXPIRACAO_DIAS * 24 * 60 * 60 * 1000

  return (
    <div className="min-h-screen bg-[#FAF7F5] flex flex-col justify-between py-12 px-4 sm:px-6">
      <div className="mx-auto w-full max-w-md space-y-6">
        {/* Topo do Header Branding Lumê */}
        <div className="text-center space-y-3">
          <div className="flex justify-center">
            <Image
              src="/assets/lume_logo.webp"
              alt="Lumê"
              width={180}
              height={60}
              className="h-11 sm:h-12 w-auto object-contain"
              priority
            />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-[#4A3F5C]">
            Como foi seu atendimento?
          </h1>
          <p className="text-xs text-gray-500">
            Sua opinião é fundamental para mantermos a excelência do serviço.
          </p>
        </div>

        {/* Card de Detalhes do Profissional & Serviço */}
        <div className="rounded-2xl bg-white p-5 border border-gray-100 shadow-sm space-y-4">
          <div className="flex items-center gap-3 border-b border-gray-100 pb-3">
            {prof?.foto_url ? (
              <div
                className="relative h-12 w-12 shrink-0 rounded-full overflow-hidden border-2 shadow-2xs"
                style={{ borderColor: corPrimaria }}
              >
                <Image
                  src={prof.foto_url}
                  alt={prof.nome || 'Profissional'}
                  fill
                  className="object-cover"
                  unoptimized
                />
              </div>
            ) : (
              <div
                className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full font-bold text-white shadow-2xs"
                style={{ backgroundColor: corPrimaria }}
              >
                {prof?.nome?.substring(0, 2)?.toUpperCase() || 'PRO'}
              </div>
            )}
            <div>
              <h2 className="text-sm font-bold text-[#4A3F5C]">{prof?.nome || 'Profissional'}</h2>
              <p className="text-xs text-gray-500 font-medium">
                Serviço: <span className="text-[#4A3F5C] font-semibold">{servico?.nome || 'Atendimento'}</span>
              </p>
            </div>
          </div>

          <div className="text-xs text-gray-500 space-y-1">
            <p>
              Cliente: <strong className="text-[#4A3F5C]">{cliente?.nome || 'Cliente'}</strong>
            </p>
            <p>
              Data:{' '}
              <strong className="text-[#4A3F5C]">
                {new Date(agendamento.data_hora_inicio).toLocaleDateString('pt-BR', {
                  day: '2-digit',
                  month: '2-digit',
                  year: 'numeric',
                })}
              </strong>
            </p>
          </div>
        </div>

        {/* Formulário Interativo de Avaliação ou Mensagem de Expiração */}
        {isExpirado && !avaliacaoExistente ? (
          <div className="rounded-2xl bg-white p-6 border border-amber-200 shadow-xs text-center space-y-3">
            <div className="mx-auto w-12 h-12 rounded-full bg-amber-50 text-amber-600 flex items-center justify-center">
              <span className="text-xl">⏱️</span>
            </div>
            <h3 className="text-sm font-bold text-slate-800">Prazo de avaliação expirado</h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              O período para avaliar este atendimento expirou (limite de 60 dias após a conclusão do serviço). Agradecemos imensamente pela preferência!
            </p>
          </div>
        ) : (
          <AvaliacaoFormClient
            agendamentoId={id}
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            avaliacaoExistente={avaliacaoExistente as any}
            corPrimaria={corPrimaria}
          />
        )}
      </div>

      {/* Footer Branding com Logo Lumê */}
      <footer className="mt-8 flex items-center justify-center gap-1.5 text-xs text-gray-400">
        <span>Desenvolvido por</span>
        <Image
          src="/assets/lume_logo.webp"
          alt="Lumê"
          width={64}
          height={22}
          className="h-4 w-auto object-contain opacity-75 grayscale hover:grayscale-0 transition"
        />
      </footer>
    </div>
  )
}
