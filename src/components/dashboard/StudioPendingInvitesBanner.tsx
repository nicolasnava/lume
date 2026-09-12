'use client'

import { useState } from 'react'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { Building2, Check, X, Loader2, Mail } from 'lucide-react'
import { aceitarConviteEmail, recusarConviteEmail } from '@/app/actions/estudio'

export interface PendingInviteItem {
  id: string
  estudioId: string
  estudioNome: string
  estudioSlug: string
  estudioCapa: string | null
  estudioCorPrimaria: string
  donaNome: string
  donaFoto: string | null
  expiraEm: string
}

interface StudioPendingInvitesBannerProps {
  initialInvites: PendingInviteItem[]
}

export default function StudioPendingInvitesBanner({
  initialInvites,
}: StudioPendingInvitesBannerProps) {
  const router = useRouter()
  const [invites, setInvites] = useState<PendingInviteItem[]>(initialInvites)
  const [processingId, setProcessingId] = useState<string | null>(null)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  if (!invites || invites.length === 0) {
    return null
  }

  const handleAccept = async (invite: PendingInviteItem) => {
    setProcessingId(invite.id)
    setErrorMessage(null)
    try {
      await aceitarConviteEmail(invite.id)
      setInvites((prev) => prev.filter((i) => i.id !== invite.id))
      router.refresh()
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Erro ao aceitar o convite.'
      setErrorMessage(msg)
    } finally {
      setProcessingId(null)
    }
  }

  const handleReject = async (invite: PendingInviteItem) => {
    if (!confirm(`Deseja recusar o convite para o studio ${invite.estudioNome}?`)) {
      return
    }

    setProcessingId(invite.id)
    setErrorMessage(null)
    try {
      await recusarConviteEmail(invite.id)
      setInvites((prev) => prev.filter((i) => i.id !== invite.id))
      router.refresh()
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Erro ao recusar o convite.'
      setErrorMessage(msg)
    } finally {
      setProcessingId(null)
    }
  }

  return (
    <div className="space-y-3 mb-6">
      {errorMessage && (
        <div className="rounded-xl bg-rose-50 border border-rose-200 p-3 text-xs font-semibold text-rose-800 animate-in fade-in">
          {errorMessage}
        </div>
      )}

      {invites.map((invite) => (
        <div
          key={invite.id}
          className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-purple-50 via-white to-purple-50/40 border border-[#B8A9D9]/50 p-4 sm:p-5 shadow-xs transition-all duration-300"
        >
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            {/* Lado Esquerdo: Identificação do Studio */}
            <div className="flex items-start sm:items-center gap-3.5">
              <div className="relative h-12 w-12 shrink-0 rounded-2xl bg-[#B8A9D9]/20 border border-[#B8A9D9]/40 flex items-center justify-center text-[#4A3F5C] overflow-hidden shadow-2xs">
                {invite.estudioCapa ? (
                  <Image
                    src={invite.estudioCapa}
                    alt={invite.estudioNome}
                    fill
                    className="object-cover"
                  />
                ) : (
                  <Building2 className="h-6 w-6 text-[#4A3F5C]" />
                )}
              </div>

              <div>
                <div className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-purple-700">
                  <Mail className="h-3 w-3" />
                  <span>Convite para Equipe de Studio</span>
                </div>
                <h3 className="text-sm sm:text-base font-extrabold text-[#4A3F5C]">
                  {invite.estudioNome}
                </h3>
                <p className="text-xs text-gray-600 mt-0.5">
                  Convidada por <strong className="text-gray-900">{invite.donaNome}</strong>
                </p>
              </div>
            </div>

            {/* Lado Direito: Ações */}
            <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
              <button
                type="button"
                disabled={processingId === invite.id}
                onClick={() => handleReject(invite)}
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-gray-200 bg-white text-xs font-bold text-gray-600 hover:bg-gray-50 hover:text-gray-900 transition disabled:opacity-50 cursor-pointer"
              >
                <X className="h-3.5 w-3.5" />
                <span>Recusar</span>
              </button>

              <button
                type="button"
                disabled={processingId === invite.id}
                onClick={() => handleAccept(invite)}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#4A3F5C] text-xs font-bold text-white shadow-xs hover:bg-[#3d334d] transition disabled:opacity-50 cursor-pointer"
              >
                {processingId === invite.id ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <Check className="h-3.5 w-3.5" />
                )}
                <span>Aceitar Convite</span>
              </button>
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}
