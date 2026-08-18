import { createClient } from '@supabase/supabase-js'
import fs from 'fs'
import path from 'path'
import readline from 'readline'

// 1. Ler variáveis do .env.local
const envPath = path.resolve(process.cwd(), '.env.local')
if (!fs.existsSync(envPath)) {
  console.error('❌ Arquivo .env.local não encontrado!')
  process.exit(1)
}

const envContent = fs.readFileSync(envPath, 'utf-8')
const env = {}
envContent.split('\n').forEach((line) => {
  const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/)
  if (match) {
    const key = match[1]
    let val = (match[2] || '').trim()
    if (val.startsWith('"') && val.endsWith('"')) val = val.slice(1, -1)
    if (val.startsWith("'") && val.endsWith("'")) val = val.slice(1, -1)
    env[key] = val
  }
})

const SUPABASE_URL = env.NEXT_PUBLIC_SUPABASE_URL
const SERVICE_ROLE_KEY = env.SUPABASE_SERVICE_ROLE_KEY

if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
  console.error('❌ Chaves NEXT_PUBLIC_SUPABASE_URL ou SUPABASE_SERVICE_ROLE_KEY não encontradas no .env.local')
  process.exit(1)
}

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
})

/**
 * Função para apagar completamente um profissional e todos os seus dados relacionados
 */
async function deleteUserCascade(userId, email, nome) {
  console.log(`\n🗑️  Apagando: [${nome || 'Sem Nome'}] (ID: ${userId}${email ? ` | ${email}` : ''})...`)

  // 1. Buscar agendamentos para limpar agendamento_servicos se houver
  const { data: agendamentos } = await supabase
    .from('agendamentos')
    .select('id')
    .eq('profissional_id', userId)

  if (agendamentos && agendamentos.length > 0) {
    const agendamentoIds = agendamentos.map((a) => a.id)
    await supabase.from('agendamento_servicos').delete().in('agendamento_id', agendamentoIds)
  }

  // 2. Limpar todas as tabelas filhas
  await supabase.from('agendamentos').delete().eq('profissional_id', userId)
  await supabase.from('avaliacoes').delete().eq('profissional_id', userId)
  await supabase.from('bloqueios_disponibilidade').delete().eq('profissional_id', userId)
  await supabase.from('datas_bloqueadas').delete().eq('profissional_id', userId)
  await supabase.from('disponibilidade').delete().eq('profissional_id', userId)
  await supabase.from('servicos').delete().eq('profissional_id', userId)
  await supabase.from('clientes').delete().eq('profissional_id', userId)
  await supabase.from('slugs_antigos').delete().eq('profissional_id', userId)
  await supabase.from('profissionais_atividades').delete().eq('profissional_id', userId)
  await supabase.from('profissionais_notas_internas').delete().eq('profissional_id', userId)
  await supabase.from('saas_subscriptions').delete().eq('profissional_id', userId)

  // 3. Deletar da tabela profissionais
  const { error: profError } = await supabase.from('profissionais').delete().eq('id', userId)
  if (profError) {
    console.warn(`⚠️  Aviso ao remover da tabela profissionais: ${profError.message}`)
  }

  // 4. Deletar do auth.users se existir
  try {
    await supabase.auth.admin.deleteUser(userId)
  } catch {
    // Ignora se não existir no auth
  }

  console.log(`✅ Registro de [${nome || userId}] apagado com sucesso!`)
}

async function main() {
  const args = process.argv.slice(2)
  const flag = args[0]?.toLowerCase()

  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
  console.log(' ✨ LUMÊ - FERRAMENTA DE LIMPEZA DE DADOS DE TESTE ')
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')

  // 1. Obter lista de admins para NUNCA deletá-los
  const { data: adminUsers } = await supabase.from('admin_users').select('id, email')
  const adminIds = new Set((adminUsers || []).map((a) => a.id))
  const adminEmails = new Set((adminUsers || []).map((a) => a.email.toLowerCase()))

  // 2. Buscar usuários do Auth
  const {
    data: { users },
  } = await supabase.auth.admin.listUsers()

  const authUsersMap = new Map((users || []).map((u) => [u.id, u]))

  // 3. Buscar todos os profissionais no banco
  const { data: profs } = await supabase
    .from('profissionais')
    .select('id, nome, slug, created_at')

  // Combinar registros encontrados (Auth + Tabela profissionais) excluindo Admins
  const allTargetsMap = new Map()

  // Adicionar profissionais que não são admin
  for (const p of profs || []) {
    if (!adminIds.has(p.id)) {
      const authUser = authUsersMap.get(p.id)
      allTargetsMap.set(p.id, {
        id: p.id,
        email: authUser?.email || 'Sem e-mail vinculado',
        nome: p.nome || 'Profissional de Teste',
        slug: p.slug || 'sem-slug',
        createdAt: new Date(p.created_at || Date.now()).toLocaleString('pt-BR'),
        rawDate: new Date(p.created_at || Date.now()).getTime(),
      })
    }
  }

  // Adicionar usuários do Auth que não são admin e não estavam na tabela profissionais
  for (const u of users || []) {
    if (!adminIds.has(u.id) && !adminEmails.has((u.email || '').toLowerCase()) && !allTargetsMap.has(u.id)) {
      allTargetsMap.set(u.id, {
        id: u.id,
        email: u.email || 'Sem email',
        nome: u.user_metadata?.nome || 'Usuário Auth',
        slug: 'sem-slug',
        createdAt: new Date(u.created_at).toLocaleString('pt-BR'),
        rawDate: new Date(u.created_at).getTime(),
      })
    }
  }

  const userList = Array.from(allTargetsMap.values())
  userList.sort((a, b) => b.rawDate - a.rawDate)

  if (userList.length === 0) {
    console.log('\n🟢 O banco de dados já está 100% limpo! Nenhum dado de teste encontrado.')
    process.exit(0)
  }

  // Modo: Apagar o mais recente (--last)
  if (flag === '--last' || flag === '-l') {
    const target = userList[0]
    await deleteUserCascade(target.id, target.email, target.nome)
    process.exit(0)
  }

  // Modo: Apagar todos (--all)
  if (flag === '--all' || flag === '-a') {
    console.log(`\n🔥 Apagando TODOS os ${userList.length} cadastros/testes antigos...`)
    for (const u of userList) {
      await deleteUserCascade(u.id, u.email, u.nome)
    }
    console.log('\n🎉 Banco de dados 100% zerado e pronto para novos testes!')
    process.exit(0)
  }

  // Modo: E-mail ou slug específico
  if (flag) {
    const target = userList.find(
      (u) =>
        u.email.toLowerCase() === flag.toLowerCase() ||
        u.slug.toLowerCase() === flag.toLowerCase() ||
        u.nome.toLowerCase().includes(flag.toLowerCase())
    )
    if (!target) {
      console.log(`❌ Registro correspondente a "${flag}" não foi encontrado.`)
      process.exit(1)
    }
    await deleteUserCascade(target.id, target.email, target.nome)
    process.exit(0)
  }

  // Modo Interativo
  console.log(`\n📋 Encontrados ${userList.length} registro(s) de teste no banco:\n`)
  userList.forEach((u, i) => {
    console.log(`  [${i + 1}] ${u.nome} | ${u.email} | slug: /p/${u.slug} (${u.createdAt})`)
  })

  console.log('\nOpções rápidas:')
  console.log('  [A] Apagar TODOS os cadastros de teste para começar do zero')
  console.log('  [L] Apagar apenas o ÚLTIMO cadastrado')
  console.log('  [1 a ' + userList.length + '] Digite o número correspondente')
  console.log('  [Q] Sair sem alterar nada')

  const rl = readline.createInterface({ input: process.stdin, output: process.stdout })

  rl.question('\n👉 Escolha uma opção: ', async (answer) => {
    const choice = answer.trim().toUpperCase()
    rl.close()

    if (choice === 'Q' || !choice) {
      console.log('Operação cancelada.')
      process.exit(0)
    }

    if (choice === 'A') {
      console.log(`\n🔥 Zerando o banco... Apagando ${userList.length} cadastros...`)
      for (const u of userList) {
        await deleteUserCascade(u.id, u.email, u.nome)
      }
      console.log('\n🎉 Banco de dados 100% zerado e limpo com sucesso!')
      process.exit(0)
    }

    if (choice === 'L' || choice === '1') {
      const target = userList[0]
      await deleteUserCascade(target.id, target.email, target.nome)
      process.exit(0)
    }

    const index = parseInt(choice, 10) - 1
    if (!isNaN(index) && index >= 0 && index < userList.length) {
      const target = userList[index]
      await deleteUserCascade(target.id, target.email, target.nome)
      process.exit(0)
    }

    console.log('Opção inválida.')
    process.exit(1)
  })
}

main().catch((err) => {
  console.error('❌ Erro inesperado:', err)
  process.exit(1)
})
