export type StudioDashboardView = 'create' | 'member' | 'upgrade' | 'owner'

export function getStudioDashboardView(
  role: 'dona' | 'membro' | 'nenhum',
  planType: string,
): StudioDashboardView {
  if (role === 'membro') return 'member'
  if (role === 'dona') return 'owner'
  return planType === 'studio' || planType === 'cortesia' ? 'create' : 'upgrade'
}
