import {
  getSaaSFinancialDashboardData,
  getSaaSInvoices,
  getSaaSPlansAndCoupons,
} from '@/app/actions/adminSaasFinance'
import AdminSaasFinanceClient from '@/components/admin/AdminSaasFinanceClient'

export const dynamic = 'force-dynamic'

export default async function AdminFinanceiroPage() {
  const [initialDashboard, initialInvoices, initialPlansAndCoupons] = await Promise.all([
    getSaaSFinancialDashboardData(),
    getSaaSInvoices('', 'todos'),
    getSaaSPlansAndCoupons(),
  ])

  return (
    <AdminSaasFinanceClient
      initialDashboard={initialDashboard}
      initialInvoices={initialInvoices}
      initialPlansAndCoupons={initialPlansAndCoupons}
    />
  )
}
