'use client'

import { useState } from 'react'
import ProfileForm from '@/components/profile/ProfileForm'
import SubscriptionSection from '@/components/profile/SubscriptionSection'
import { Database } from '@/lib/supabase/database.types'
import { SubscriptionData } from '@/app/actions/subscription'
import { User, CreditCard, Sparkles } from 'lucide-react'

type ProfissionalRow = Database['public']['Tables']['profissionais']['Row']

interface ProfileTabsWrapperProps {
  profissional: ProfissionalRow
  subscriptionData: SubscriptionData
}

export default function ProfileTabsWrapper({
  profissional,
  subscriptionData,
}: ProfileTabsWrapperProps) {
  const [activeTab, setActiveTab] = useState<'perfil' | 'assinatura'>('perfil')

  return (
    <div className="space-y-6">
      {/* Abas de Navegação */}
      <div className="flex items-center gap-2 border-b border-gray-200/80 pb-px">
        <button
          type="button"
          onClick={() => setActiveTab('perfil')}
          className={`flex items-center gap-2 px-4 py-3 text-xs sm:text-sm font-bold border-b-2 transition cursor-pointer ${
            activeTab === 'perfil'
              ? 'border-purple-600 text-[#4A3F5C]'
              : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
          }`}
        >
          <User className={`h-4 w-4 ${activeTab === 'perfil' ? 'text-purple-600' : 'text-gray-400'}`} />
          <span>Perfil & Vitrine</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('assinatura')}
          className={`flex items-center gap-2 px-4 py-3 text-xs sm:text-sm font-bold border-b-2 transition cursor-pointer relative ${
            activeTab === 'assinatura'
              ? 'border-purple-600 text-[#4A3F5C]'
              : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
          }`}
        >
          <CreditCard className={`h-4 w-4 ${activeTab === 'assinatura' ? 'text-purple-600' : 'text-gray-400'}`} />
          <span>Meu Plano & Assinatura</span>

          {subscriptionData.statusConta === 'trial' && subscriptionData.diasRestantesTrial > 0 && (
            <span className="hidden sm:inline-flex items-center gap-1 ml-1 px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-amber-100 text-amber-800">
              <Sparkles className="h-2.5 w-2.5" />
              <span>Trial ({subscriptionData.diasRestantesTrial}d)</span>
            </span>
          )}

          {subscriptionData.statusConta === 'atrasada' && (
            <span className="hidden sm:inline-flex items-center gap-1 ml-1 px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-rose-100 text-rose-800 animate-pulse">
              <span>Pendente</span>
            </span>
          )}
        </button>
      </div>

      {/* Conteúdo da Aba Ativa */}
      {activeTab === 'perfil' ? (
        <ProfileForm initialData={profissional} />
      ) : (
        <SubscriptionSection initialData={subscriptionData} />
      )}
    </div>
  )
}
