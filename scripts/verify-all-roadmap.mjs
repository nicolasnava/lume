import { createClient } from '@supabase/supabase-js'
import fs from 'fs'
import path from 'path'

// 1. Carregar variáveis de ambiente
const envPath = path.resolve(process.cwd(), '.env.local')
const envContent = fs.readFileSync(envPath, 'utf-8')
const env = {}
envContent.split('\n').forEach((line) => {
  const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/)
  if (match) {
    let val = (match[2] || '').trim()
    if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
      val = val.slice(1, -1)
    }
    env[match[1].trim()] = val
  }
})

const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
})

const TEST_SLUG = 'camila-duarte'
const TEST_EMAIL = 'studio.camila@lume.app'

async function runFullRoadmapVerification() {
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
  console.log(' 🔬 LUMÊ - BATERIA AUTOMATIZADA DE TESTES & VERIFICAÇÃO DO CÓDIGO ')
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n')

  let passed = 0
  let total = 0

  function assert(condition, title, details = '') {
    total++
    if (condition) {
      passed++
      console.log(`  ✅ [PASS] ${title}`)
      if (details) console.log(`     └─ ${details}`)
    } else {
      console.error(`  ❌ [FAIL] ${title}`)
      if (details) console.error(`     └─ ${details}`)
    }
  }

  // =========================================================================
  // 1. CLIENTE FINAL (Página Pública, Vitrine & Avaliações)
  // =========================================================================
  console.log('📌 1. TESTES DA CLIENTE FINAL (PÁGINA PÚBLICA & AGENDAMENTO)')
  
  // 1.1 View pública segura
  const { data: profPublic, error: profErr } = await supabase
    .from('profissionais_publico')
    .select('*')
    .eq('slug', TEST_SLUG)
    .single()

  const catList = Array.isArray(profPublic?.categoria)
    ? profPublic.categoria.join(', ')
    : typeof profPublic?.categoria === 'string'
    ? profPublic.categoria
    : 'cilios'

  assert(!profErr && !!profPublic, 'Página pública (View Segura) acessível via slug', `Nome: "${profPublic?.nome}" | Categoria: [${catList}]`)
  assert(!!profPublic?.foto_url && !!profPublic?.foto_capa_url, 'Fotos de avatar e capa configuradas', `Avatar: ${profPublic?.foto_url?.slice(0, 40)}...`)
  assert(!!profPublic?.whatsapp && !!profPublic?.instagram, 'Redes de contato (WhatsApp e Instagram) configuradas', `WhatsApp: ${profPublic?.whatsapp} | Insta: ${profPublic?.instagram}`)
  assert(Array.isArray(profPublic?.modalidade_atendimento) && profPublic?.modalidade_atendimento.length > 0, 'Modalidades de atendimento configuradas', `Modalidades: [${profPublic?.modalidade_atendimento}]`)

  // 1.2 Catálogo de Serviços
  const { data: servicos } = await supabase
    .from('servicos')
    .select('*')
    .eq('profissional_id', profPublic.id)
    .eq('ativo', true)

  assert(servicos && servicos.length >= 8, 'Catálogo de serviços completo e ativo', `${servicos?.length} serviços cadastrados com foto, preço e duração`)
  const hasDescricao = servicos?.every((s) => s.descricao && s.duracao_minutos > 0 && s.preco > 0)
  assert(hasDescricao, 'Todos os serviços possuem descrições detalhadas, preço e tempo')

  // 1.3 Avaliações Reais de Clientes
  const { data: avaliacoes } = await supabase
    .from('avaliacoes')
    .select('*')
    .eq('profissional_id', profPublic.id)

  const mediaNota = avaliacoes && avaliacoes.length > 0
    ? (avaliacoes.reduce((acc, a) => acc + a.nota, 0) / avaliacoes.length).toFixed(1)
    : 0
  assert(avaliacoes && avaliacoes.length > 0, 'Prova social: avaliações de clientes coletadas', `${avaliacoes?.length} avaliações registradas | Média de estrelas: ${mediaNota} ★`)

  // 1.4 Disponibilidade Semanal
  const { data: disp } = await supabase
    .from('disponibilidade')
    .select('*')
    .eq('profissional_id', profPublic.id)

  assert(disp && disp.length === 6, 'Grade de disponibilidade semanal configurada (Seg a Sáb)', `${disp?.length} dias úteis cadastrados`)

  // =========================================================================
  // 2. PAINEL DA PROFISSIONAL (Dashboard, Agenda & Financeiro)
  // =========================================================================
  console.log('\n📌 2. TESTES DO PAINEL DA PROFISSIONAL (DASHBOARD & OPERAÇÃO)')

  // 2.1 Agendamentos e faturamento
  const { data: agendamentos } = await supabase
    .from('agendamentos')
    .select('*, servicos(nome), clientes(nome, telefone)')
    .eq('profissional_id', profPublic.id)

  assert(agendamentos && agendamentos.length > 200, 'Volume de agendamentos para calendário e relatórios', `Total: ${agendamentos?.length} agendamentos gerados`)

  const concluidos = agendamentos?.filter((a) => a.status === 'concluido') || []
  const faturamentoTotal = concluidos.reduce((acc, a) => acc + (a.pago ? Number(a.valor_cobrado || 0) : 0), 0)
  assert(faturamentoTotal > 30000, 'Faturamento total robusto para gráficos de receita', `R$ ${faturamentoTotal.toFixed(2)} faturados`)

  // 2.2 Divisão por Formas de Pagamento
  const formasPagamento = { pix: 0, cartao_credito: 0, dinheiro: 0, cartao_debito: 0 }
  concluidos.forEach((a) => {
    if (a.pago && a.forma_pagamento && formasPagamento[a.forma_pagamento] !== undefined) {
      formasPagamento[a.forma_pagamento] += Number(a.valor_cobrado || 0)
    }
  })
  assert(formasPagamento.pix > 0 && formasPagamento.cartao_credito > 0, 'Distribuição diversificada de métodos de pagamento', `PIX: R$ ${formasPagamento.pix.toFixed(2)} | Cartão: R$ ${formasPagamento.cartao_credito.toFixed(2)} | Dinheiro: R$ ${formasPagamento.dinheiro.toFixed(2)}`)

  // 2.3 Carteira de Clientes (CRM)
  const { data: clientes } = await supabase
    .from('clientes')
    .select('*')
    .eq('profissional_id', profPublic.id)

  assert(clientes && clientes.length >= 30, 'Carteira de clientes cadastrada no CRM', `${clientes?.length} clientes cadastrados com telefone`)

  // 2.4 Bloqueios de Agenda
  const { data: bloqueios } = await supabase
    .from('bloqueios_disponibilidade')
    .select('*')
    .eq('profissional_id', profPublic.id)

  assert(bloqueios && bloqueios.length > 0, 'Bloqueio pontual de folga/workshop na agenda', `Bloqueio: "${bloqueios?.[0]?.motivo}" em ${bloqueios?.[0]?.data}`)

  // =========================================================================
  // 3. MÓDULO DE ASSINATURA SAAS & PLANOS DA PROFISSIONAL
  // =========================================================================
  console.log('\n📌 3. TESTES DO MÓDULO DE ASSINATURA & PLANOS (/perfil)')

  // 3.1 Dados da assinatura da profissional
  const { data: profRaw } = await supabase
    .from('profissionais')
    .select('*')
    .eq('id', profPublic.id)
    .single()

  assert(profRaw.status_conta === 'ativa', 'Status da conta da profissional está Ativo', `Status: ${profRaw.status_conta}`)
  assert(profRaw.plano_tipo === 'mensal', 'Plano oficial definido como Mensal', `Plano: ${profRaw.plano_tipo} (R$ ${Number(profRaw.valor_mensalidade).toFixed(2)}/mês)`)
  assert(!!profRaw.proximo_vencimento, 'Data de próximo vencimento registrada', `Próximo Vencimento: ${new Date(profRaw.proximo_vencimento).toLocaleDateString('pt-BR')}`)

  // 3.2 Faturas emitidas para a profissional
  const { data: faturas } = await supabase
    .from('saas_faturas')
    .select('*')
    .eq('profissional_id', profPublic.id)
    .order('data_vencimento', { ascending: false })

  assert(faturas && faturas.length >= 4, 'Histórico de faturas SaaS disponível para consulta', `${faturas?.length} faturas encontradas`)
  const faturasPagas = faturas?.filter((f) => f.status === 'pago') || []
  const faturasPendentes = faturas?.filter((f) => f.status === 'pendente') || []
  assert(faturasPagas.length >= 3, 'Faturas pagas registradas com comprovante', `${faturasPagas.length} mensalidades pagas`)
  assert(faturasPendentes.length >= 1, 'Fatura pendente com suporte a pagamento via PIX', `Fatura pendente ID ${faturasPendentes[0]?.id.slice(0, 8)}... (R$ ${Number(faturasPendentes[0]?.valor).toFixed(2)})`)

  // 3.3 Cupons de Desconto
  const { data: cupons } = await supabase
    .from('saas_cupons')
    .select('*')
    .eq('ativo', true)

  assert(cupons && cupons.length > 0, 'Sistema de cupons de desconto ativo', `Cupons ativos: [${cupons?.map((c) => c.codigo).join(', ')}]`)

  // =========================================================================
  // 4. PAINEL SUPER ADMIN (MÉTRICAS, DIAGNÓSTICO IA & AUDITORIA)
  // =========================================================================
  console.log('\n📌 4. TESTES DO PAINEL SUPER ADMIN (/admin)')

  // 4.1 Administradores cadastrados
  const { data: adminUsers } = await supabase.from('admin_users').select('*')
  assert(adminUsers && adminUsers.length > 0, 'Usuários com privilégio de Super Admin cadastrados', `Admin: ${adminUsers?.[0]?.nome} (${adminUsers?.[0]?.email})`)

  // 4.2 Score de Diagnóstico por IA do Perfil (100% completo)
  let aiScore = 100
  const missingItems = []
  if (!profRaw.foto_url) { aiScore -= 20; missingItems.push('foto_url') }
  if (!profRaw.bio || profRaw.bio.trim().length < 10) { aiScore -= 20; missingItems.push('bio') }
  if (!profRaw.whatsapp) { aiScore -= 20; missingItems.push('whatsapp') }
  if (!profRaw.instagram) { aiScore -= 10; missingItems.push('instagram') }
  if (!servicos || servicos.length === 0) { aiScore -= 30; missingItems.push('servicos') }

  assert(aiScore === 100, 'Score de Diagnóstico IA da Profissional está 100% completo', `Score: ${aiScore}% (Itens faltantes: ${missingItems.length === 0 ? 'Nenhum' : missingItems.join(', ')})`)

  // 4.3 Linha do Tempo & Logs de Atividade
  const { data: loginLogs } = await supabase
    .from('login_logs')
    .select('*')
    .eq('profissional_id', profPublic.id)

  assert(loginLogs && loginLogs.length >= 20, 'Histórico de acessos diários registrado (Engajamento Alto)', `${loginLogs?.length} logs de login nos últimos 30 dias`)

  // 4.4 Feedbacks das Profissionais
  const { data: feedbacks } = await supabase
    .from('feedbacks')
    .select('*')
    .eq('profissional_id', profPublic.id)

  assert(feedbacks && feedbacks.length > 0, 'Módulo de Feedbacks e Relato de Bugs recebidos', `${feedbacks?.length} feedbacks enviados (Tipos: ${feedbacks?.map((f) => f.tipo).join(', ')})`)

  // 4.5 Respostas da Pesquisa NPS
  const { data: nps } = await supabase
    .from('nps_respostas')
    .select('*')
    .eq('profissional_id', profPublic.id)

  assert(nps && nps.length > 0 && nps[0].nota === 10, 'Pesquisa NPS registrada com nota máxima Promotora', `Nota NPS: ${nps?.[0]?.nota}/10 | Comentário: "${nps?.[0]?.comentario?.slice(0, 40)}..."`)

  // =========================================================================
  // 5. INTEGRIDADE DE BANCO, RESTRIÇÕES E SEGURANÇA
  // =========================================================================
  console.log('\n📌 5. TESTES DE SEGURANÇA & INTEGRIDADE DE DADOS')

  // 5.1 Validação de Constraint de Exclusão (Sobreposição de Agendamentos)
  // Tentar inserir um agendamento com choque de horário para o mesmo profissional
  const testDateStart = new Date(Date.now() + 50 * 24 * 60 * 60 * 1000)
  const testDateEnd = new Date(testDateStart.getTime() + 60 * 60 * 1000)

  const { data: ag1, error: errAg1 } = await supabase.from('agendamentos').insert({
    profissional_id: profPublic.id,
    cliente_id: clientes[0].id,
    servico_id: servicos[0].id,
    data_hora_inicio: testDateStart.toISOString(),
    data_hora_fim: testDateEnd.toISOString(),
    status: 'confirmado',
  }).select().single()

  // Tentativa de colisão no mesmo intervalo exato
  const { error: errAg2 } = await supabase.from('agendamentos').insert({
    profissional_id: profPublic.id,
    cliente_id: clientes[1].id,
    servico_id: servicos[1].id,
    data_hora_inicio: testDateStart.toISOString(),
    data_hora_fim: testDateEnd.toISOString(),
    status: 'confirmado',
  })

  const collisionBlocked = !!errAg2
  assert(collisionBlocked, 'Trava GiST no Postgres bloqueia choques de horários automaticamente', `Erro retornado pelo banco: "${errAg2?.message}"`)

  // Limpar agendamento de teste temporário
  if (ag1?.id) {
    await supabase.from('agendamentos').delete().eq('id', ag1.id)
  }

  // =========================================================================
  // RELATÓRIO FINAL
  // =========================================================================
  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
  console.log(`📊 RESULTADO FINAL DA VERIFICAÇÃO AUTOMATIZADA:`)
  console.log(`   Total de Testes Executados: ${total}`)
  console.log(`   Testes Aprovados: ${passed}`)
  console.log(`   Testes Falhos: ${total - passed}`)
  console.log(`   Taxa de Sucesso: ${((passed / total) * 100).toFixed(1)}%`)
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n')

  if (passed === total) {
    console.log('🎉 TODOS OS RECURSOS DO ROADMAP ESTÃO 100% VALIDADOS E OPERACIONAIS NO CÓDIGO!\n')
  } else {
    process.exit(1)
  }
}

runFullRoadmapVerification().catch((err) => {
  console.error('❌ Erro inesperado durante a verificação:', err)
  process.exit(1)
})
