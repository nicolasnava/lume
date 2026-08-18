/**
 * Opções de horários padronizados em intervalos de 15 minutos (06:00 às 23:45)
 * para uso com o CustomSelect em todos os formulários do sistema.
 */
export const TIME_OPTIONS_15MIN = (() => {
  const list: { value: string; label: string }[] = []
  for (let h = 6; h <= 23; h++) {
    for (let m = 0; m < 60; m += 15) {
      const hh = String(h).padStart(2, '0')
      const mm = String(m).padStart(2, '0')
      list.push({ value: `${hh}:${mm}`, label: `${hh}:${mm}` })
    }
  }
  return list
})()

export const TIME_OPTIONS_30MIN = (() => {
  const list: { value: string; label: string }[] = []
  for (let h = 6; h <= 23; h++) {
    for (let m = 0; m < 60; m += 30) {
      const hh = String(h).padStart(2, '0')
      const mm = String(m).padStart(2, '0')
      list.push({ value: `${hh}:${mm}`, label: `${hh}:${mm}` })
    }
  }
  return list
})()
