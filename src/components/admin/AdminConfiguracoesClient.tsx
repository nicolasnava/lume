'use client'

import { useState, useRef } from 'react'
import {
  Settings,
  Save,
  CheckCircle2,
  CreditCard,
  Calendar,
  Sparkles,
  Bell,
  Sliders,
  ShieldCheck,
  Camera,
  User,
} from 'lucide-react'

export default function AdminConfiguracoesClient() {
  const [diasTrial, setDiasTrial] = useState('30')
  const [precoSolo, setPrecoSolo] = useState('89.00')
  const [precoEstudio, setPrecoEstudio] = useState('189.00')
  const [modoManutencao, setModoManutencao] = useState(false)
  const [savedSuccess, setSavedSuccess] = useState<string | null>(null)
  const [adminAvatar, setAdminAvatar] = useState<string | null>(null)
  const avatarInputRef = useRef<HTMLInputElement>(null)

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = (ev) => setAdminAvatar(ev.target?.result as string)
    reader.readAsDataURL(file)
  }

  const integracoes = [
    {
      id: 'int_1',
      nome: 'Gateway de Pagamento Asaas',
      tipo: 'Cobrança PIX e Cartão de Crédito',
      status: 'Conectado e operacional',
      statusColor: 'text-[#34D399]',
      ambiente: 'Produção (API v3)',
    },
    {
      id: 'int_2',
      nome: 'Google Calendar API',
      tipo: 'Sincronização bidirecional OAuth2',
      status: 'Conectado e operacional',
      statusColor: 'text-[#34D399]',
      ambiente: 'Google Cloud SP',
    },
    {
      id: 'int_3',
      nome: 'Google Gemini AI',
      tipo: 'Assistente consultivo executivo',
      status: 'Ativo',
      statusColor: 'text-[#34D399]',
      ambiente: 'API Key configurada',
    },
    {
      id: 'int_4',
      nome: 'Serviço Web Push VAPID',
      tipo: 'Notificações nativas no celular e navegador',
      status: 'Ativo',
      statusColor: 'text-[#34D399]',
      ambiente: 'Chaves VAPID ativas',
    },
  ]

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault()
    setSavedSuccess('Configurações da plataforma salvas com sucesso.')
    setTimeout(() => setSavedSuccess(null), 3500)
  }

  return (
    <div className="space-y-6 text-[#F8F5FA] font-sans antialiased tracking-tight pb-12">
      {/* 1. CABEÇALHO */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 pb-3 border-b border-white/[0.08]">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-[#F8F5FA] tracking-tight">
            Configurações
          </h1>
          <p className="text-xs sm:text-sm text-[#A9A1B5] font-normal mt-1 tracking-tight">
            Parâmetros globais da plataforma, planos e integrações.
          </p>
        </div>

        <span className="text-xs text-[#A9A1B5]">
          Ambiente: Produção (v2.4)
        </span>
      </div>

      {/* FEEDBACK DE SUCESSO */}
      {savedSuccess && (
        <div className="p-3 rounded-xl bg-[#34D399]/10 border border-[#34D399]/20 text-[#34D399] text-xs font-semibold flex items-center gap-2">
          <CheckCircle2 className="h-4 w-4" />
          <span>{savedSuccess}</span>
        </div>
      )}

      {/* PERFIL DO ADMIN */}
      <div className="bg-[#18141F] p-5 sm:p-6 rounded-2xl border border-[#B8A9D9]/30 shadow-xs relative overflow-hidden">
        <div className="absolute -top-12 -right-12 w-32 h-32 bg-[#B8A9D9]/10 rounded-full blur-2xl pointer-events-none" />
        <div className="flex items-center gap-5">
          {/* Avatar */}
          <div className="relative shrink-0">
            <div className="h-16 w-16 rounded-2xl bg-[#15111F] border border-white/[0.08] flex items-center justify-center overflow-hidden">
              {adminAvatar ? (
                <img src={adminAvatar} alt="Foto do admin" className="h-full w-full object-cover" />
              ) : (
                <User className="h-7 w-7 text-[#746C80]" />
              )}
            </div>
            <button
              type="button"
              onClick={() => avatarInputRef.current?.click()}
              className="absolute -bottom-1.5 -right-1.5 h-6 w-6 rounded-lg bg-[#B8A9D9] text-[#15111F] flex items-center justify-center cursor-pointer hover:bg-[#c4b6e3] transition active:scale-[0.97] shadow-xs"
              title="Alterar foto de perfil"
            >
              <Camera className="h-3.5 w-3.5" />
            </button>
            <input
              ref={avatarInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleAvatarChange}
            />
          </div>

          <div className="min-w-0">
            <span className="text-sm font-bold text-[#F8F5FA] block">Foto de perfil do administrador</span>
            <span className="text-xs text-[#A9A1B5] mt-0.5 block">Visível nos logs e acessos do painel interno Lumê.</span>
            <button
              type="button"
              onClick={() => avatarInputRef.current?.click()}
              className="mt-2 text-xs font-semibold text-[#B8A9D9] hover:text-[#F8F5FA] cursor-pointer transition"
            >
              {adminAvatar ? 'Alterar foto' : 'Escolher foto'}
            </button>
          </div>
        </div>
      </div>

      {/* 2. CARDS DE KPIS DO SISTEMA (PADRÃO VISÃO GERAL) */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Card 1: Versão da Plataforma */}
        <div className="bg-[#18141F] p-5 rounded-2xl border border-[#B8A9D9]/30 shadow-xs flex flex-col justify-between h-full min-h-[160px] relative overflow-hidden">
          <div className="absolute -top-12 -right-12 w-32 h-32 bg-[#B8A9D9]/10 rounded-full blur-2xl pointer-events-none" />
          <div>
            <span className="text-[11px] font-semibold text-[#A9A1B5] uppercase tracking-wider block">
              Plataforma Lumê
            </span>
            <div className="mt-2.5 flex items-baseline gap-2">
              <span className="text-3xl font-extrabold text-[#F8F5FA] tracking-tight">
                v2.4
              </span>
              <span className="text-xs text-[#34D399] font-bold">Produção</span>
            </div>
            <div className="mt-1 text-xs font-medium text-[#A9A1B5]">
              Ambiente de alta disponibilidade
            </div>
          </div>

          <div className="pt-3 border-t border-white/[0.08] mt-3 flex items-center justify-between text-[11px] text-[#A9A1B5]">
            <span>Status operacional: Online</span>
            <span className="text-[#34D399] font-medium">99,9% Uptime</span>
          </div>
        </div>

        {/* Card 2: Período de Teste Vigente */}
        <div className="bg-[#18141F] p-5 sm:p-6 rounded-2xl border border-[#B8A9D9]/30 shadow-xs flex flex-col justify-between h-full min-h-[160px] relative overflow-hidden">
          <div className="absolute -top-12 -right-12 w-32 h-32 bg-[#B8A9D9]/10 rounded-full blur-2xl pointer-events-none" />
          <div>
            <span className="text-[11px] font-semibold text-[#A9A1B5] uppercase tracking-wider block">
              Período de teste vigente
            </span>
            <div className="mt-2.5 flex items-baseline gap-2">
              <span className="text-3xl font-extrabold text-[#F8F5FA] tracking-tight">
                {diasTrial}
              </span>
              <span className="text-xs text-[#A9A1B5] font-normal">dias corridos</span>
            </div>
            <div className="mt-1 text-xs font-medium text-[#A9A1B5]">
              Tempo de degustação para novas profissionais
            </div>
          </div>

          <div className="flex items-end justify-between pt-3 border-t border-white/[0.08] mt-3">
            <span className="text-[11px] text-[#A9A1B5]">
              Conversão média: <strong className="text-[#34D399] font-semibold">68,4%</strong>
            </span>
            <svg className="w-16 h-6 overflow-visible shrink-0" viewBox="0 0 64 24" fill="none">
              <path
                d="M2 18 C 14 16, 24 13, 34 9 C 44 8, 54 5, 64 3"
                stroke="#B8A9D9"
                strokeWidth="2.5"
                strokeLinecap="round"
              />
            </svg>
          </div>
        </div>

        {/* Card 3: Mensalidade Base Solo */}
        <div className="bg-[#18141F] p-5 sm:p-6 rounded-2xl border border-[#B8A9D9]/30 shadow-xs flex flex-col justify-between h-full min-h-[160px] relative overflow-hidden">
          <div className="absolute -top-12 -right-12 w-32 h-32 bg-[#B8A9D9]/10 rounded-full blur-2xl pointer-events-none" />
          <div>
            <span className="text-[11px] font-semibold text-[#A9A1B5] uppercase tracking-wider block">
              Mensalidade Plano Solo
            </span>
            <div className="mt-2.5 flex items-baseline gap-1">
              <span className="text-3xl font-extrabold text-[#34D399] tracking-tight">
                R$ {precoSolo}
              </span>
              <span className="text-xs text-[#A9A1B5] font-normal">/ mês</span>
            </div>
            <div className="mt-1 text-xs font-medium text-[#A9A1B5]">
              Plano individual para profissionais
            </div>
          </div>

          <div className="flex items-end justify-between pt-3 border-t border-white/[0.08] mt-3">
            <span className="text-[11px] text-[#A9A1B5]">
              Estúdios: <strong className="text-[#F8F5FA] font-semibold">R$ {precoEstudio}/mês</strong>
            </span>
            <svg className="w-16 h-6 overflow-visible shrink-0" viewBox="0 0 64 24" fill="none">
              <path
                d="M2 20 C 12 18, 22 14, 32 12 C 42 10, 52 7, 64 2"
                stroke="#34D399"
                strokeWidth="2.5"
                strokeLinecap="round"
              />
            </svg>
          </div>
        </div>
      </div>

      {/* 3. PARÂMETROS DE PLANOS & TESTE */}
      <div className="bg-[#18141F] p-5 sm:p-6 rounded-2xl border border-[#B8A9D9]/30 shadow-xs space-y-4 relative overflow-hidden">
        <div className="absolute -top-12 -right-12 w-32 h-32 bg-[#B8A9D9]/10 rounded-full blur-2xl pointer-events-none" />
        
        <div className="flex items-center gap-2 pb-2 border-b border-white/[0.08]">
          <Sliders className="h-4 w-4 text-[#B8A9D9]" />
          <h2 className="text-sm sm:text-base font-bold text-[#F8F5FA] tracking-tight">
            Parâmetros de planos e novos cadastros
          </h2>
        </div>

        <form onSubmit={handleSave} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="text-[11px] font-semibold text-[#A9A1B5] uppercase tracking-wider block mb-1.5">
                Duração do período de teste
              </label>
              <div className="relative">
                <input
                  type="number"
                  value={diasTrial}
                  onChange={(e) => setDiasTrial(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl bg-[#15111F] border border-white/[0.08] text-xs text-[#F8F5FA] focus:outline-hidden focus:border-[#B8A9D9] font-mono"
                />
                <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs text-[#A9A1B5]">
                  dias
                </span>
              </div>
            </div>

            <div>
              <label className="text-[11px] font-semibold text-[#A9A1B5] uppercase tracking-wider block mb-1.5">
                Preço mensal Plano Solo
              </label>
              <div className="relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-xs text-[#A9A1B5]">
                  R$
                </span>
                <input
                  type="text"
                  value={precoSolo}
                  onChange={(e) => setPrecoSolo(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 rounded-xl bg-[#15111F] border border-white/[0.08] text-xs text-[#F8F5FA] focus:outline-hidden focus:border-[#B8A9D9] font-mono"
                />
              </div>
            </div>

            <div>
              <label className="text-[11px] font-semibold text-[#A9A1B5] uppercase tracking-wider block mb-1.5">
                Preço mensal Plano Estúdios
              </label>
              <div className="relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-xs text-[#A9A1B5]">
                  R$
                </span>
                <input
                  type="text"
                  value={precoEstudio}
                  onChange={(e) => setPrecoEstudio(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 rounded-xl bg-[#15111F] border border-white/[0.08] text-xs text-[#F8F5FA] focus:outline-hidden focus:border-[#B8A9D9] font-mono"
                />
              </div>
            </div>
          </div>

          <div className="p-3.5 rounded-xl bg-[#15111F] border border-white/[0.05] flex items-center justify-between gap-3">
            <div>
              <span className="text-xs font-bold text-[#F8F5FA] block">
                Modo de manutenção da plataforma
              </span>
              <span className="text-[11px] text-[#A9A1B5] block mt-0.5">
                Quando ativo, apenas administradores autenticados conseguem acessar a plataforma.
              </span>
            </div>

            <button
              type="button"
              onClick={() => setModoManutencao(!modoManutencao)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition cursor-pointer active:scale-[0.97] ${
                modoManutencao
                  ? 'bg-[#F87171] text-white'
                  : 'bg-[#18141F] text-[#A9A1B5] border border-white/10 hover:text-[#F8F5FA]'
              }`}
            >
              {modoManutencao ? 'Modo manutenção ativo' : 'Desativado'}
            </button>
          </div>

          <div className="flex justify-end pt-1">
            <button
              type="submit"
              className="px-4 py-2 rounded-xl bg-[#B8A9D9] hover:bg-[#a695cf] text-[#15111F] text-xs font-bold transition flex items-center gap-2 cursor-pointer shadow-xs active:scale-[0.97]"
            >
              <Save className="h-3.5 w-3.5" />
              <span>Salvar alterações</span>
            </button>
          </div>
        </form>
      </div>

      {/* 4. INTEGRAÇÕES DO SISTEMA (SEM BADGES) */}
      <div className="bg-[#18141F] p-5 sm:p-6 rounded-2xl border border-[#B8A9D9]/30 shadow-xs space-y-4 relative overflow-hidden">
        <div className="absolute -top-12 -right-12 w-32 h-32 bg-[#B8A9D9]/10 rounded-full blur-2xl pointer-events-none" />
        
        <div className="flex items-center justify-between pb-2 border-b border-white/[0.08]">
          <div className="flex items-center gap-2">
            <ShieldCheck className="h-4 w-4 text-[#B8A9D9]" />
            <h2 className="text-sm sm:text-base font-bold text-[#F8F5FA] tracking-tight">
              Status das integrações e APIs externas
            </h2>
          </div>
          <span className="text-[11px] text-[#A9A1B5]">
            Saúde dos serviços
          </span>
        </div>

        <div className="space-y-3">
          {integracoes.map((item) => (
            <div
              key={item.id}
              className="p-3 rounded-xl bg-[#15111F] border border-white/[0.05] hover:border-white/[0.12] transition flex items-center justify-between gap-3 min-h-[64px]"
            >
              <div className="flex items-center gap-3 min-w-0 flex-1">
                {/* Caixa de Ícone 40x40 px */}
                <div className="h-10 w-10 rounded-xl bg-[#B8A9D9]/15 text-[#B8A9D9] border border-[#B8A9D9]/25 flex items-center justify-center shrink-0">
                  <Settings className="h-4.5 w-4.5" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-baseline gap-1.5 truncate">
                    <span className="text-xs sm:text-sm font-bold text-[#F8F5FA] truncate">
                      {item.nome}
                    </span>
                    <span className="text-xs text-[#A9A1B5]">·</span>
                    <span className="text-xs text-[#A9A1B5]">{item.tipo}</span>
                    <span className="text-xs text-[#A9A1B5]">·</span>
                    <span className={`text-xs font-medium ${item.statusColor}`}>{item.status}</span>
                  </div>
                  <p className="text-xs text-[#A9A1B5] mt-0.5 truncate leading-tight">
                    Ambiente: {item.ambiente}
                  </p>
                </div>
              </div>

              <span className="text-xs text-[#34D399] font-medium shrink-0">
                100% online
              </span>
            </div>
          ))}
        </div>

        <div className="pt-2 border-t border-white/[0.06] flex items-center justify-between text-[11px] text-[#A9A1B5]">
          <span>Monitoramento contínuo da infraestrutura</span>
          <span>Latência média: 42ms</span>
        </div>
      </div>
    </div>
  )
}
