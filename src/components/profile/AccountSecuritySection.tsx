'use client'

import { useState } from 'react'
import type { FormEvent } from 'react'
import { KeyRound, Loader2, LockKeyhole, Mail, ShieldCheck } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

interface AccountSecuritySectionProps {
  email: string
}

export default function AccountSecuritySection({ email }: AccountSecuritySectionProps) {
  const [editingEmail, setEditingEmail] = useState(false)
  const [nextEmail, setNextEmail] = useState('')
  const [editingPassword, setEditingPassword] = useState(false)
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [passwordConfirmation, setPasswordConfirmation] = useState('')
  const [pendingAction, setPendingAction] = useState<'email' | 'password' | null>(null)
  const [notice, setNotice] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  const requestEmailChange = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const normalizedEmail = nextEmail.trim().toLowerCase()
    if (!normalizedEmail || normalizedEmail === email.toLowerCase()) {
      setNotice({ type: 'error', text: 'Informe um endereço diferente do atual.' })
      return
    }

    setPendingAction('email')
    setNotice(null)
    const supabase = createClient()
    const { error } = await supabase.auth.updateUser(
      { email: normalizedEmail },
      { emailRedirectTo: `${window.location.origin}/perfil` }
    )
    setPendingAction(null)

    if (error) {
      setNotice({ type: 'error', text: 'Não foi possível solicitar a troca. Confira o endereço e tente novamente.' })
      return
    }
    setEditingEmail(false)
    setNextEmail('')
    setNotice({ type: 'success', text: 'Enviamos as confirmações para validar a alteração do e-mail.' })
  }

  const changePassword = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (newPassword.length < 8) {
      setNotice({ type: 'error', text: 'A nova senha precisa ter pelo menos 8 caracteres.' })
      return
    }
    if (newPassword !== passwordConfirmation) {
      setNotice({ type: 'error', text: 'As novas senhas não coincidem.' })
      return
    }

    setPendingAction('password')
    setNotice(null)
    const supabase = createClient()
    const { error: reauthError } = await supabase.auth.signInWithPassword({
      email,
      password: currentPassword,
    })
    if (reauthError) {
      setPendingAction(null)
      setNotice({ type: 'error', text: 'A senha atual não confere. Nenhuma alteração foi feita.' })
      return
    }

    const { error } = await supabase.auth.updateUser({ password: newPassword })
    setPendingAction(null)
    if (error) {
      setNotice({ type: 'error', text: 'Não foi possível atualizar a senha. Tente novamente.' })
      return
    }

    setEditingPassword(false)
    setCurrentPassword('')
    setNewPassword('')
    setPasswordConfirmation('')
    setNotice({ type: 'success', text: 'Senha atualizada com segurança.' })
  }

  return (
    <section className="space-y-6">
      <div className="flex items-start gap-3 border-b border-gray-200/70 pb-5">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-[#B8A9D9]/20 text-[#4A3F5C]"><ShieldCheck className="h-5 w-5" /></div>
        <div>
          <h2 className="text-base font-extrabold text-[#4A3F5C]">Segurança da conta</h2>
          <p className="mt-1 text-xs text-gray-500">Gerencie seu acesso sem expor sua senha.</p>
        </div>
      </div>

      {notice && <p role="status" className={`rounded-xl border px-3.5 py-3 text-xs font-semibold ${notice.type === 'success' ? 'border-emerald-200 bg-emerald-50 text-emerald-800' : 'border-rose-200 bg-rose-50 text-rose-800'}`}>{notice.text}</p>}

      <div className="grid gap-6 lg:grid-cols-2">
        <section className="space-y-4 rounded-2xl border border-gray-200/80 bg-white p-4 sm:p-5">
          <div className="flex items-center gap-2 text-sm font-bold text-[#4A3F5C]"><Mail className="h-4 w-4 text-[#8675A9]" /> E-mail de acesso</div>
          <div className="flex min-w-0 items-center justify-between gap-3">
            <p className="min-w-0 truncate text-sm font-semibold text-gray-700">{email}</p>
            {!editingEmail && <button type="button" onClick={() => { setNotice(null); setEditingEmail(true) }} className="shrink-0 rounded-xl border border-gray-200 px-3 py-2 text-xs font-bold text-[#4A3F5C] transition-[transform,background-color] duration-150 ease-out hover:bg-[#FAF7F5] active:scale-[0.97]">Editar</button>}
          </div>
          {editingEmail && <form onSubmit={requestEmailChange} className="space-y-3 border-t border-gray-100 pt-4">
            <label className="block space-y-1.5 text-xs font-semibold text-gray-600">Novo e-mail
              <input autoComplete="email" type="email" required value={nextEmail} onChange={(event) => setNextEmail(event.target.value)} className="w-full rounded-xl border border-gray-200 bg-[#FAF7F5] px-3 py-2.5 text-sm text-[#4A3F5C] outline-none focus:border-[#B8A9D9]" />
            </label>
            <p className="text-[11px] leading-relaxed text-gray-500">A alteração só será concluída depois da confirmação enviada pelo provedor de acesso.</p>
            <div className="flex justify-end gap-2">
              <button type="button" onClick={() => { setEditingEmail(false); setNextEmail('') }} disabled={pendingAction === 'email'} className="rounded-xl px-3 py-2 text-xs font-bold text-gray-600 hover:bg-gray-50">Cancelar</button>
              <button type="submit" disabled={pendingAction === 'email'} className="inline-flex items-center gap-2 rounded-xl bg-[#4A3F5C] px-3.5 py-2 text-xs font-bold text-white transition-transform duration-150 ease-out active:scale-[0.97] disabled:opacity-60">{pendingAction === 'email' && <Loader2 className="h-3.5 w-3.5 animate-spin" />}Enviar confirmação</button>
            </div>
          </form>}
        </section>

        <section className="space-y-4 rounded-2xl border border-gray-200/80 bg-white p-4 sm:p-5">
          <div className="flex items-center gap-2 text-sm font-bold text-[#4A3F5C]"><LockKeyhole className="h-4 w-4 text-[#8675A9]" /> Senha</div>
          <div className="flex items-center justify-between gap-3">
            <p aria-label="Senha oculta por segurança" className="select-none tracking-[0.25em] text-sm text-gray-500">••••••••••••</p>
            {!editingPassword && <button type="button" onClick={() => { setNotice(null); setEditingPassword(true) }} className="shrink-0 rounded-xl border border-gray-200 px-3 py-2 text-xs font-bold text-[#4A3F5C] transition-[transform,background-color] duration-150 ease-out hover:bg-[#FAF7F5] active:scale-[0.97]">Alterar</button>}
          </div>
          {editingPassword && <form onSubmit={changePassword} className="space-y-3 border-t border-gray-100 pt-4">
            <label className="block space-y-1.5 text-xs font-semibold text-gray-600">Senha atual
              <input autoComplete="current-password" type="password" required value={currentPassword} onChange={(event) => setCurrentPassword(event.target.value)} className="w-full rounded-xl border border-gray-200 bg-[#FAF7F5] px-3 py-2.5 text-sm text-[#4A3F5C] outline-none focus:border-[#B8A9D9]" />
            </label>
            <label className="block space-y-1.5 text-xs font-semibold text-gray-600">Nova senha
              <input autoComplete="new-password" type="password" minLength={8} required value={newPassword} onChange={(event) => setNewPassword(event.target.value)} className="w-full rounded-xl border border-gray-200 bg-[#FAF7F5] px-3 py-2.5 text-sm text-[#4A3F5C] outline-none focus:border-[#B8A9D9]" />
            </label>
            <label className="block space-y-1.5 text-xs font-semibold text-gray-600">Confirme a nova senha
              <input autoComplete="new-password" type="password" minLength={8} required value={passwordConfirmation} onChange={(event) => setPasswordConfirmation(event.target.value)} className="w-full rounded-xl border border-gray-200 bg-[#FAF7F5] px-3 py-2.5 text-sm text-[#4A3F5C] outline-none focus:border-[#B8A9D9]" />
            </label>
            <p className="flex items-start gap-2 text-[11px] leading-relaxed text-gray-500"><KeyRound className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[#8675A9]" />Confirmamos sua senha atual antes de gravar a nova. A senha nunca é exibida ou armazenada pelo Lumê.</p>
            <div className="flex justify-end gap-2">
              <button type="button" onClick={() => { setEditingPassword(false); setCurrentPassword(''); setNewPassword(''); setPasswordConfirmation('') }} disabled={pendingAction === 'password'} className="rounded-xl px-3 py-2 text-xs font-bold text-gray-600 hover:bg-gray-50">Cancelar</button>
              <button type="submit" disabled={pendingAction === 'password'} className="inline-flex items-center gap-2 rounded-xl bg-[#4A3F5C] px-3.5 py-2 text-xs font-bold text-white transition-transform duration-150 ease-out active:scale-[0.97] disabled:opacity-60">{pendingAction === 'password' && <Loader2 className="h-3.5 w-3.5 animate-spin" />}Salvar senha</button>
            </div>
          </form>}
        </section>
      </div>
    </section>
  )
}
