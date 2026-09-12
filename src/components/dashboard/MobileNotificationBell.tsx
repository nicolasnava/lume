'use client'

import { useState } from 'react'
import { Bell, X, Megaphone, ShieldAlert, CheckCircle2, Info } from 'lucide-react'

interface MobileNotificationBellProps {
  aviso: {
    id: string
    mensagem: string
    tipo: 'info' | 'alerta' | 'manutencao'
  } | null
  statusConta?: string
}

export default function MobileNotificationBell({ aviso, statusConta }: MobileNotificationBellProps) {
  const [isOpen, setIsOpen] = useState(false)

  const hasImportantNotice = !!aviso || statusConta === 'suspensa'

  return (
    <>
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className="relative inline-flex items-center justify-center rounded-lg bg-[#FAF7F5] p-2 text-[#4A3F5C] border border-[#B8A9D9]/40 hover:bg-[#B8A9D9]/15 transition cursor-pointer"
        title="Avisos e Notificações"
        aria-label="Avisos e Notificações"
      >
        <Bell className="h-4 w-4 text-[#4A3F5C]" />
        {hasImportantNotice && (
          <span className="absolute -top-0.5 -right-0.5 h-2.5 w-2.5 rounded-full bg-[#B8A9D9] ring-2 ring-white animate-pulse" />
        )}
      </button>

      {/* Modal / Painel de Avisos */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/50 p-4 pt-16 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="w-full max-w-sm rounded-3xl bg-white p-5 shadow-2xl border border-gray-100 space-y-4 animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <div className="flex items-center gap-2">
                <div className="h-8 w-8 rounded-xl bg-purple-50 text-[#4A3F5C] flex items-center justify-center">
                  <Bell className="h-4 w-4 text-[#B8A9D9]" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-[#4A3F5C]">Principais Avisos</h3>
                  <p className="text-[10px] text-gray-500 font-medium">Comunicados e atualizações do sistema</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="p-1 rounded-full text-gray-400 hover:bg-gray-100 hover:text-gray-700 transition cursor-pointer"
                title="Fechar"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="space-y-3 max-h-[60vh] overflow-y-auto">
              {/* 1. Aviso Ativo da Plataforma */}
              {aviso ? (
                <div
                  className={`p-3 rounded-2xl border text-xs font-semibold space-y-1.5 ${
                    aviso.tipo === 'manutencao'
                      ? 'bg-rose-50 border-rose-200 text-rose-900'
                      : aviso.tipo === 'alerta'
                      ? 'bg-amber-50 border-amber-200 text-amber-900'
                      : 'bg-purple-50 border-purple-200 text-purple-900'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <Megaphone className="h-4 w-4 shrink-0 text-[#B8A9D9]" />
                    <span className="font-extrabold uppercase text-[10px] tracking-wider">
                      {aviso.tipo === 'manutencao'
                        ? 'Manutenção Programada'
                        : aviso.tipo === 'alerta'
                        ? 'Alerta Importante'
                        : 'Comunicado Oficial'}
                    </span>
                  </div>
                  <p className="text-xs font-medium leading-relaxed">{aviso.mensagem}</p>
                </div>
              ) : null}

              {/* 2. Status da Conta */}
              {statusConta === 'suspensa' ? (
                <div className="p-3 rounded-2xl bg-rose-50 border border-rose-200 text-xs text-rose-900 space-y-1">
                  <div className="flex items-center gap-1.5 font-bold">
                    <ShieldAlert className="h-4 w-4 text-rose-600 shrink-0" />
                    <span>Conta Suspensa</span>
                  </div>
                  <p className="text-[11px] leading-relaxed font-normal">
                    Sua vitrine pública está pausada. Entre em contato com o suporte para reativação.
                  </p>
                </div>
              ) : (
                <div className="p-3 rounded-2xl bg-[#FAF7F5] border border-gray-200/80 text-xs text-[#4A3F5C] space-y-1">
                  <div className="flex items-center gap-1.5 font-bold">
                    <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                    <span>Conta Ativa & Regular</span>
                  </div>
                  <p className="text-[11px] text-gray-500 leading-relaxed">
                    Seus serviços e agendamentos estão operando normalmente.
                  </p>
                </div>
              )}

              {/* 3. Dica de Produtividade Lumê */}
              <div className="p-3 rounded-2xl bg-purple-50/50 border border-purple-100 text-xs text-[#4A3F5C] space-y-1">
                <div className="flex items-center gap-1.5 font-bold">
                  <Info className="h-4 w-4 text-[#B8A9D9] shrink-0" />
                  <span>Dica de Divulgação</span>
                </div>
                <p className="text-[11px] text-gray-500 leading-relaxed">
                  Use o recurso de Story Oficial em seu Perfil para atrair mais agendamentos com QR Code direto nas suas redes sociais.
                </p>
              </div>
            </div>

            <div className="pt-2">
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="w-full py-2.5 rounded-xl bg-[#4A3F5C] text-white text-xs font-bold hover:bg-[#3d334d] transition cursor-pointer shadow-xs"
              >
                Entendido
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
