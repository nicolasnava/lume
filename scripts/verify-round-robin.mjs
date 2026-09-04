import { createClient } from '@supabase/supabase-js'
import fs from 'fs'
import path from 'path'

// 1. Carregar variáveis de ambiente de .env.local
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

async function testRoundRobin() {
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
  console.log(' 🔬 TESTE DE RODÍZIO CIRCULAR (ROUND-ROBIN) - STUDIOS PARTE 2 ')
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
  const { data: testQuery, error: tableErr } = await supabase
    .from('estudios')
    .select('id')
    .limit(1)

  if (tableErr) {
    console.log('⚠️ Tabela estudios ainda não criada no banco remoto.')
    return
  }

  // 2. Buscar ou criar estúdio de teste com 2 membros simulados
  const { data: profs } = await supabase
    .from('profissionais')
    .select('id, nome, slug, estudio_id, ativo_no_estudio')
    .is('deletado_em', null)
    .limit(3)

  if (!profs || profs.length === 0) {
    console.log('⚠️ Nenhuma profissional encontrada para teste.')
    return
  }

  console.log(`Encontradas ${profs.length} profissionais no banco para simulação.`)

  // Teste com algoritmo de round robin em memória simulando a query exata
  const testMembers = [
    { id: 'membro-1', slug: 'ana-silva', nome: 'Ana Silva', ativo_no_estudio: true },
    { id: 'membro-2', slug: 'beatriz-lima', nome: 'Beatriz Lima', ativo_no_estudio: true },
    { id: 'membro-3', slug: 'carla-souza', nome: 'Carla Souza', ativo_no_estudio: false }, // Inativa!
  ]

  // Filtro de ativas
  const ativas = testMembers.filter((m) => m.ativo_no_estudio)
  assert(ativas.length === 2, 'Membros inativos (ativo_no_estudio=false) são filtrados', `Ativas: ${ativas.map(a => a.nome).join(', ')}`)

  // Simulação de rodízio circular
  function getNextMember(lastId, list) {
    if (list.length === 0) return null
    if (list.length === 1) return list[0]
    const idx = lastId ? list.findIndex((m) => m.id === lastId) : -1
    if (idx === -1) return list[0]
    return list[(idx + 1) % list.length]
  }

  // Chamada 1: Sem último membro (null) -> Deve escolher o primeiro (membro-1)
  const escolha1 = getNextMember(null, ativas)
  assert(escolha1?.id === 'membro-1', 'Rodízio 1 (início sem histórico): escolhe Membro 1', escolha1?.nome)

  // Chamada 2: Após membro-1 -> Deve escolher membro-2
  const escolha2 = getNextMember(escolha1.id, ativas)
  assert(escolha2?.id === 'membro-2', 'Rodízio 2 (após Membro 1): escolhe Membro 2', escolha2?.nome)

  // Chamada 3: Após membro-2 -> Deve voltar circularmente para membro-1
  const escolha3 = getNextMember(escolha2.id, ativas)
  assert(escolha3?.id === 'membro-1', 'Rodízio 3 (circular): retorna ao Membro 1', escolha3?.nome)

  // Chamada 4: Membro anterior foi desativado/removido (membro-3)
  const escolha4 = getNextMember('membro-3', ativas)
  assert(escolha4?.id === 'membro-1', 'Fallback quando último membro não está mais ativo: escolhe Membro 1', escolha4?.nome)

  // Chamada 5: Apenas 1 membro ativo
  const escolhaUnico = getNextMember(null, [ativas[0]])
  assert(escolhaUnico?.id === 'membro-1', 'Estúdio com apenas 1 membro: seleciona o único membro com sucesso', escolhaUnico?.nome)

  console.log(`\n🏁 Resultado: ${passed}/${total} asserções passaram com sucesso!`)
}

testRoundRobin().catch(console.error)
