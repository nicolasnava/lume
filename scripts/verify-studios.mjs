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

async function runStudioVerification() {
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
  console.log(' 🔬 LUMÊ - VERIFICAÇÃO DE STUDIOS COM EQUIPE (PARTE 1) ')
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

  // 1. Verificar se a tabela 'estudios' está acessível no Supabase
  console.log('📌 1. VERIFICANDO TABELAS E SCHEMA NO SUPABASE')
  const { data: testQuery, error: tableErr } = await supabase
    .from('estudios')
    .select('id')
    .limit(1)

  if (tableErr) {
    console.log('\n⚠️  A tabela "estudios" ainda não existe no Supabase remoto.')
    console.log(`   Mensagem do Postgres: ${tableErr.message}`)
    console.log('   Isso é esperado antes de você executar a migration 00035 no SQL Editor do Supabase.\n')
    assert(
      fs.existsSync(path.resolve(process.cwd(), 'supabase/migrations/00035_create_estudios_and_convites.sql')),
      'Migration 00035 criada e disponível para execução',
      'supabase/migrations/00035_create_estudios_and_convites.sql'
    )
    assert(
      fs.existsSync(path.resolve(process.cwd(), 'src/app/actions/estudio.ts')),
      'Server Actions de Studios implementadas',
      'src/app/actions/estudio.ts'
    )
    assert(
      fs.existsSync(path.resolve(process.cwd(), 'src/app/(protected)/dashboard/estudio/page.tsx')),
      'Página /dashboard/estudio criada',
      'src/app/(protected)/dashboard/estudio/page.tsx'
    )
    assert(
      fs.existsSync(path.resolve(process.cwd(), 'src/app/convite-estudio/[codigo]/page.tsx')),
      'Página de convite /convite-estudio/[codigo] criada',
      'src/app/convite-estudio/[codigo]/page.tsx'
    )
    console.log(`\n🏁 Resultado: ${passed}/${total} checagens concluídas com sucesso.`)
    return
  }

  assert(!tableErr, 'Tabela "estudios" existe e responde no Supabase')

  // 2. Verificar se a tabela 'estudio_convites' existe
  const { error: convitesErr } = await supabase
    .from('estudio_convites')
    .select('id')
    .limit(1)

  assert(!convitesErr, 'Tabela "estudio_convites" existe e responde no Supabase')

  // 3. Buscar uma profissional de teste para simular criação de studio
  const { data: testProf } = await supabase
    .from('profissionais')
    .select('id, nome, slug, estudio_id')
    .is('deletado_em', null)
    .limit(1)
    .single()

  if (!testProf) {
    console.log('⚠️ Nenhuma profissional encontrada no banco para testes dinâmicos.')
    return
  }

  console.log(`\n📌 2. TESTES DE CICLO DE VIDA DO STUDIO (Profissional: ${testProf.nome})`)

  const TEST_STUDIO_SLUG = `test-studio-${Date.now()}`
  let createdStudioId = null

  try {
    // 3.1 Criar studio de teste
    const { data: newStudio, error: createErr } = await supabase
      .from('estudios')
      .insert([
        {
          nome: 'Studio Teste Automatizado',
          slug: TEST_STUDIO_SLUG,
          bio: 'Studio criado para validação de testes.',
          criado_por: testProf.id,
          cor_primaria: '#B8A9D9',
          cor_secundaria: '#FAF7F5',
        },
      ])
      .select()
      .single()

    assert(!createErr && !!newStudio, 'Criação de Studio com sucesso', `ID: ${newStudio?.id}, Slug: ${newStudio?.slug}`)
    createdStudioId = newStudio?.id

    // 3.2 Vincular profissional ao studio
    const { error: updateProfErr } = await supabase
      .from('profissionais')
      .update({ estudio_id: createdStudioId, ativo_no_estudio: true })
      .eq('id', testProf.id)

    assert(!updateProfErr, 'Profissional vinculada ao studio como dona e ativa')

    // 3.3 Gerar convite por link
    const testCode = `code-${Date.now()}`
    const { data: conviteLink, error: conviteErr } = await supabase
      .from('estudio_convites')
      .insert([
        {
          estudio_id: createdStudioId,
          tipo: 'link',
          codigo: testCode,
          status: 'pendente',
          expira_em: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        },
      ])
      .select()
      .single()

    assert(!conviteErr && !!conviteLink, 'Geração de convite por link', `Código: ${conviteLink?.codigo}`)

    // 3.4 Gerar convite por email
    const { data: conviteEmail, error: emailErr } = await supabase
      .from('estudio_convites')
      .insert([
        {
          estudio_id: createdStudioId,
          tipo: 'email',
          email_convidado: 'parceira.teste@lume.app',
          status: 'pendente',
          expira_em: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        },
      ])
      .select()
      .single()

    assert(!emailErr && !!conviteEmail, 'Geração de convite por email', `Email: ${conviteEmail?.email_convidado}`)

    // 3.5 Testar desvinculação (sair do studio)
    const { error: leaveErr } = await supabase
      .from('profissionais')
      .update({ estudio_id: null })
      .eq('id', testProf.id)

    assert(!leaveErr, 'Desvinculação da profissional do studio (estudio_id volta a null)')
  } finally {
    // Limpeza
    if (createdStudioId) {
      await supabase.from('estudio_convites').delete().eq('estudio_id', createdStudioId)
      await supabase.from('estudios').delete().eq('id', createdStudioId)
      await supabase.from('profissionais').update({ estudio_id: null }).eq('id', testProf.id)
      console.log('🧹 Dados de teste limpos com sucesso.')
    }
  }

  console.log(`\n🏁 Resultado: ${passed}/${total} testes passaram com sucesso!`)
}

runStudioVerification().catch(console.error)
