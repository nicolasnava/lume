import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { Star, MessageSquare } from 'lucide-react'
import AvaliacoesListClient from '@/components/dashboard/AvaliacoesListClient'

export const revalidate = 0
export const dynamic = 'force-dynamic'

export default async function AvaliacoesDashboardPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const adminSupabase = createAdminClient()

  // Buscar todas as avaliações do profissional com informações do agendamento, cliente e serviço
  const { data: avaliacoesData } = await adminSupabase
    .from('avaliacoes')
    .select('*, agendamentos(id, data_hora_inicio, clientes(nome, telefone), servicos(nome))')
    .eq('profissional_id', user.id)
    .order('created_at', { ascending: false })

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const avaliacoes = (avaliacoesData || []) as any[]

  const total = avaliacoes.length
  const soma = avaliacoes.reduce((acc, curr) => acc + Number(curr.nota), 0)
  const media = total > 0 ? (soma / total).toFixed(1) : '0.0'

  // Contagem por estrela (1 a 5)
  const distribution = [5, 4, 3, 2, 1].map((n) => ({
    nota: n,
    count: avaliacoes.filter((a) => Number(a.nota) === n).length,
    percentage: total > 0 ? (avaliacoes.filter((a) => Number(a.nota) === n).length / total) * 100 : 0,
  }))

  // Estatísticas avançadas
  const positivasCount = avaliacoes.filter((a) => Number(a.nota) >= 4).length
  const taxaAprovacao = total > 0 ? Math.round((positivasCount / total) * 100) : 100
  const cincoEstrelasCount = avaliacoes.filter((a) => Number(a.nota) === 5).length
  const cincoEstrelasPercent = total > 0 ? Math.round((cincoEstrelasCount / total) * 100) : 100

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-[#4A3F5C]">
          Avaliações das Clientes
        </h1>
        <p className="text-xs sm:text-sm text-[#4A3F5C]/70 mt-1">
          Acompanhe os depoimentos, notas e opiniões recebidas pós-atendimento
        </p>
      </div>

      {/* Grid de Resumo e Estatísticas */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Card Média Geral com Elementos Ampliados e Sem Sub-Badges */}
        <div className="rounded-3xl bg-white p-6 sm:p-7 border border-gray-100 shadow-xs flex flex-col justify-between space-y-4">
          <div className="flex items-center justify-between gap-2 border-b border-gray-100 pb-3">
            <span className="text-xs font-bold uppercase tracking-wider text-gray-400">
              Média de Satisfação
            </span>
            {total > 0 && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200/80 shadow-2xs">
                <Star className="h-3.5 w-3.5 fill-emerald-600 text-emerald-600" />
                <span>{Number(media) >= 4.8 ? 'Excelente' : Number(media) >= 4.0 ? 'Muito Boa' : 'Regular'}</span>
              </span>
            )}
          </div>

          <div className="py-2 space-y-3">
            <div className="flex items-baseline gap-4">
              <span className="text-6xl sm:text-7xl font-black text-[#4A3F5C] leading-none tracking-tight">
                {media}
              </span>
              <div className="space-y-1.5">
                <div className="flex items-center gap-1">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Star
                      key={star}
                      className={`h-5 w-5 sm:h-6 sm:w-6 ${
                        star <= Math.round(Number(media))
                          ? 'fill-amber-400 text-amber-400 drop-shadow-2xs'
                          : 'text-gray-200'
                      }`}
                    />
                  ))}
                </div>
                <span className="text-sm font-bold text-gray-600 block">
                  {total} {total === 1 ? 'avaliação recebida' : 'avaliações recebidas'}
                </span>
              </div>
            </div>
          </div>

          <div className="pt-3 border-t border-gray-100 text-xs text-gray-400 font-medium">
            <span>Nota calculada com base nos atendimentos concluídos</span>
          </div>
        </div>

        {/* Card Distribuição de Estrelas */}
        <div className="md:col-span-2 rounded-3xl bg-white p-6 border border-gray-100 shadow-xs space-y-2.5">
          <span className="text-xs font-bold uppercase tracking-wider text-gray-400 block mb-1">
            Distribuição por Nota
          </span>
          {distribution.map((item) => (
            <div key={item.nota} className="flex items-center gap-3 text-xs">
              <div className="flex items-center gap-1 w-12 font-bold text-[#4A3F5C]">
                <span>{item.nota}</span>
                <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
              </div>
              <div className="flex-1 h-2.5 rounded-full bg-gray-100 overflow-hidden">
                <div
                  className="h-full bg-amber-400 rounded-full transition-all duration-500"
                  style={{ width: `${item.percentage}%` }}
                />
              </div>
              <span className="w-8 text-right font-medium text-gray-500">{item.count}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Lista de Depoimentos Recebidos */}
      <div className="space-y-4">
        <h2 className="text-lg font-bold text-[#4A3F5C] flex items-center gap-2">
          <MessageSquare className="h-5 w-5 text-[#B8A9D9]" />
          <span>Feedbacks Recebidos</span>
        </h2>

        <AvaliacoesListClient initialAvaliacoes={avaliacoes} />
      </div>
    </div>
  )
}
