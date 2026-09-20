import { getAuthenticatedAdmin } from '@/lib/admin/checkAdmin'
import { redirect } from 'next/navigation'
import AdminFinanceiroClient from '@/components/admin/AdminFinanceiroClient'
import { getSaaSPlansAndCoupons } from '@/app/actions/adminSaasFinance'

export const dynamic = 'force-dynamic'

export const metadata = {
  title: 'Financeiro | Lumê Admin',
  description: 'Gestão de receita recorrente, cobranças e gateway Asaas.',
}

export default async function AdminFinanceiroPage() {
  const admin = await getAuthenticatedAdmin()
  if (!admin) {
    redirect('/login')
  }

  const plansAndCoupons = await getSaaSPlansAndCoupons()

  return <AdminFinanceiroClient initialPlansAndCoupons={plansAndCoupons} />
}
