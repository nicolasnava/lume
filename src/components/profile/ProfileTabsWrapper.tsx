'use client'

import { useState } from 'react'
import ProfileForm from '@/components/profile/ProfileForm'
import SubscriptionSection from '@/components/profile/SubscriptionSection'
import { Database } from '@/lib/supabase/database.types'
import { SubscriptionData } from '@/app/actions/subscription'
import { User, CreditCard, Sparkles, Store } from 'lucide-react'

type ProfissionalRow = Database['public']['Tables']['profissionais']['Row']

interface ProfileTabsWrapperProps {
  profissional: ProfissionalRow
  subscriptionData: SubscriptionData
}

export default function ProfileTabsWrapper({
  profissional,
  subscriptionData,
}: ProfileTabsWrapperProps) {
  const [activeTab, setActiveTab] = useState<'perfil' | 'vitrine' | 'assinatura'>('perfil')

  return (
    <div className="space-y-6">
      {/* Abas de Navegação (Igualmente distribuídas preenchendo o espaço) */}
      <div className="grid grid-cols-3 border-b border-gray-200/80 pb-px w-full">
        <button
          type="button"
          onClick={() => setActiveTab('perfil')}
          className={`flex items-center justify-center gap-1.5 sm:gap-2 py-3 px-1 text-xs sm:text-sm font-bold border-b-2 transition cursor-pointer text-center w-full ${
            activeTab === 'perfil'
              ? 'border-purple-600 text-[#4A3F5C]'
              : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
          }`}
        >
          <User className={`h-4 w-4 shrink-0 ${activeTab === 'perfil' ? 'text-purple-600' : 'text-gray-400'}`} />
          <span className="truncate">Perfil</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('vitrine')}
          className={`flex items-center justify-center gap-1.5 sm:gap-2 py-3 px-1 text-xs sm:text-sm font-bold border-b-2 transition cursor-pointer text-center w-full ${
            activeTab === 'vitrine'
              ? 'border-purple-600 text-[#4A3F5C]'
              : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
          }`}
        >
          <Store className={`h-4 w-4 shrink-0 ${activeTab === 'vitrine' ? 'text-purple-600' : 'text-gray-400'}`} />
          <span className="truncate">Vitrine</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('assinatura')}
          className={`flex items-center justify-center gap-1.5 sm:gap-2 py-3 px-1 text-xs sm:text-sm font-bold border-b-2 transition cursor-pointer text-center w-full relative ${
            activeTab === 'assinatura'
              ? 'border-purple-600 text-[#4A3F5C]'
              : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
          }`}
        >
          <CreditCard className={`h-4 w-4 shrink-0 ${activeTab === 'assinatura' ? 'text-purple-600' : 'text-gray-400'}`} />
          <span className="truncate">Assinatura</span>

          {subscriptionData.statusConta === 'trial' && subscriptionData.diasRestantesTrial > 0 && (
            <span className="hidden md:inline-flex items-center gap-1 ml-1 px-1.5 py-0.5 rounded-full text-[9px] font-extrabold bg-amber-100 text-amber-800 shrink-0">
              <Sparkles className="h-2.5 w-2.5" />
              <span>Trial ({subscriptionData.diasRestantesTrial}d)</span>
            </span>
          )}

          {subscriptionData.statusConta === 'atrasada' && (
            <span className="hidden md:inline-flex items-center gap-1 ml-1 px-1.5 py-0.5 rounded-full text-[9px] font-extrabold bg-rose-100 text-rose-800 animate-pulse shrink-0">
              <span>Pendente</span>
            </span>
          )}
        </button>
      </div>

      {/* Conteúdo da Aba Ativa */}
      {activeTab === 'assinatura' ? (
        <SubscriptionSection initialData={subscriptionData} />
      ) : (
        <ProfileForm initialData={profissional} activeTab={activeTab} />
      )}
    </div>
  )
}
