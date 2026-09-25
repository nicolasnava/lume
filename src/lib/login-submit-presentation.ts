export type LoginSubmitStatus = 'idle' | 'checking' | 'success'

export function getLoginSubmitPresentation(status: LoginSubmitStatus) {
  return {
    label:
      status === 'checking'
        ? 'Verificando acesso'
        : status === 'success'
        ? 'Acesso confirmado'
        : 'Entrar na conta',
    disabled: status !== 'idle',
    busy: status === 'checking',
  }
}
