import { createClient } from '@supabase/supabase-js'
import * as fs from 'fs'
import * as path from 'path'

// 1. Carregar variáveis de ambiente do .env.local
const envPath = path.resolve(process.cwd(), '.env.local')
if (fs.existsSync(envPath)) {
  const content = fs.readFileSync(envPath, 'utf8')
  content.split('\n').forEach((line) => {
    const trimmed = line.trim()
    if (trimmed && !trimmed.startsWith('#') && trimmed.includes('=')) {
      const [key, ...rest] = trimmed.split('=')
      const val = rest.join('=').replace(/^["']|["']$/g, '').trim()
      if (!process.env[key.trim()]) {
        process.env[key.trim()] = val
      }
    }
  })
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('ERRO: NEXT_PUBLIC_SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY devem estar definidos no .env.local')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function main() {
  console.log('🔄 SUBSTITUINDO CONTAS DE ADMIN...')

  const oldAdminEmails = ['slicee.on@gmail.com', 'nicolasnava.senai@gmail.com']
  const newAdminEmail = 'nicolasnavasantos@gmail.com'
  const newAdminPass = 'Nick2004@'
  const newAdminName = 'Nicolas Nava'

  // 1. Buscar todos os usuários do Auth
  const { data: authUsers, error: listError } = await supabase.auth.admin.listUsers({ perPage: 1000 })
  if (listError) {
    console.error('Erro ao listar usuários:', listError)
    process.exit(1)
  }

  // 2. Buscar admins existentes na tabela admin_users
  const { data: currentAdminUsers } = await supabase.from('admin_users').select('id, email')
  const currentAdminIds = (currentAdminUsers || []).map((a) => a.id)

  console.log('Admins encontrados na tabela admin_users:', currentAdminUsers)

  // Identificar usuários auth que devem ser removidos (as contas antigas de admin)
  const usersToRemove = authUsers.users.filter((u) => {
    const email = (u.email || '').toLowerCase()
    return (
      oldAdminEmails.includes(email) ||
      currentAdminIds.includes(u.id) ||
      email === newAdminEmail.toLowerCase() // Se já existia, remove para recriar 100% limpo
    )
  })

  console.log(`Contas para limpeza: ${usersToRemove.map((u) => u.email).join(', ')}`)

  for (const u of usersToRemove) {
    console.log(`- Removendo usuário: ${u.email} (${u.id})...`)
    try {
      // Limpar admin_otp_codes
      await supabase.from('admin_otp_codes').delete().eq('admin_id', u.id)
    } catch (e) {
      console.warn('admin_otp_codes clean error:', e)
    }

    try {
      // Limpar admin_logs
      await supabase.from('admin_logs').delete().eq('admin_id', u.id)
    } catch (e) {
      console.warn('admin_logs clean error:', e)
    }

    try {
      // Limpar tabela admin_users
      await supabase.from('admin_users').delete().eq('id', u.id)
    } catch (e) {
      console.warn('admin_users clean error:', e)
    }

    try {
      // Limpar tabela profissionais se existir
      await supabase.from('profissionais').delete().eq('id', u.id)
    } catch (e) {}

    try {
      // Deletar do Auth
      await supabase.auth.admin.deleteUser(u.id)
      console.log(`  ✓ Auth user deletado: ${u.email}`)
    } catch (e) {
      console.warn(`  Erro ao deletar auth user ${u.email}:`, e)
    }
  }

  // Também garantir que na tabela admin_users não reste nenhum dos emails antigos
  for (const oldEmail of oldAdminEmails) {
    await supabase.from('admin_users').delete().eq('email', oldEmail)
  }

  // 3. Criar a nova conta de admin
  console.log(`\n✨ Criando nova conta de admin: ${newAdminEmail}...`)
  const { data: newUser, error: createError } = await supabase.auth.admin.createUser({
    email: newAdminEmail,
    password: newAdminPass,
    email_confirm: true,
    user_metadata: {
      nome: newAdminName,
    },
  })

  if (createError || !newUser?.user) {
    console.error('Erro ao criar novo admin no Auth:', createError)
    process.exit(1)
  }

  const newAdminId = newUser.user.id
  console.log(`✓ Usuário criado no Auth com ID: ${newAdminId}`)

  // 4. Inserir na tabela admin_users
  const { error: adminInsertError } = await supabase.from('admin_users').insert({
    id: newAdminId,
    email: newAdminEmail,
    nome: newAdminName,
  })

  if (adminInsertError) {
    console.error('Erro ao inserir em admin_users:', adminInsertError)
    process.exit(1)
  }

  console.log('✓ Inserido com sucesso na tabela public.admin_users!')

  // 5. Verificação final
  const { data: finalAdmins } = await supabase.from('admin_users').select('id, email, nome')
  console.log('\n=============================================================')
  console.log('🎉 ADMIN ATUALIZADO COM SUCESSO:')
  console.log('=============================================================')
  console.log('Admins ativos no banco:', finalAdmins)
  console.log(`- Email: ${newAdminEmail}`)
  console.log(`- Senha: ${newAdminPass}`)
  console.log('=============================================================')
}

main().catch((err) => {
  console.error('Erro fatal:', err)
  process.exit(1)
})
