export function getDashboardQueryState(error: unknown): 'ready' | 'error' {
  return error ? 'error' : 'ready'
}
