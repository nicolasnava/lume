/**
 * Utilitário para tradução e normalização de mensagens de erro do Supabase e do sistema Lumê.
 * Garante que nenhuma mensagem técnica ou em inglês chegue ao usuário final.
 */

export function translateAuthError(
  error: { message?: string; status?: number; code?: string } | string | null | undefined
): string {
  if (!error) {
    return 'Ocorreu um erro inesperado. Por favor, tente novamente.'
  }

  const rawMsg = typeof error === 'string' ? error : error.message || ''
  const msg = rawMsg.toLowerCase()

  // 1. Credenciais e Login
  if (
    msg.includes('invalid login credentials') ||
    msg.includes('invalid_grant') ||
    msg.includes('invalid credentials')
  ) {
    return 'E-mail ou senha incorretos. Verifique os dados digitados e tente novamente.'
  }

  if (msg.includes('email not confirmed') || msg.includes('email_not_confirmed')) {
    return 'Seu e-mail ainda não foi confirmado. Por favor, verifique sua caixa de entrada e clique no link de ativação.'
  }

  if (msg.includes('user not found') || msg.includes('user_not_found')) {
    return 'Nenhuma conta foi encontrada com este endereço de e-mail.'
  }

  // 2. Cadastro / Duplicidade
  if (
    msg.includes('already registered') ||
    msg.includes('user already exists') ||
    msg.includes('already exists') ||
    msg.includes('user_already_exists') ||
    msg.includes('unique constraint') ||
    msg.includes('duplicate key')
  ) {
    return 'Este e-mail já está cadastrado no Lumê. Faça login ou recupere sua senha se já possui uma conta.'
  }

  // 3. E-mail / Envio de Confirmação e SMTP
  if (
    msg.includes('confirmation email') ||
    msg.includes('error sending') ||
    msg.includes('sending email') ||
    msg.includes('smtp') ||
    msg.includes('error sending confirmation email')
  ) {
    return 'Houve uma instabilidade temporária no envio do e-mail de confirmação. Por favor, tente novamente em instantes.'
  }

  // 4. Senha
  if (
    msg.includes('password') &&
    (msg.includes('least') ||
      msg.includes('short') ||
      msg.includes('weak') ||
      msg.includes('characters') ||
      msg.includes('length'))
  ) {
    return 'A senha precisa ter no mínimo 6 caracteres.'
  }

  // 5. Validação de formato de E-mail
  if (
    msg.includes('valid email') ||
    msg.includes('invalid email') ||
    msg.includes('malformed') ||
    msg.includes('validate email') ||
    msg.includes('unable to validate email')
  ) {
    return 'O formato do endereço de e-mail informado não é válido. Verifique se digitou corretamente.'
  }

  // 6. Rate Limit / Muitas solicitações
  if (
    msg.includes('rate limit') ||
    msg.includes('too many requests') ||
    msg.includes('over_email_send_rate_limit') ||
    msg.includes('for security purposes, you can only request this once')
  ) {
    return 'Muitas tentativas em pouco tempo. Por segurança, aguarde alguns instantes antes de tentar novamente.'
  }

  // 7. Cadastros desativados
  if (msg.includes('signup is disabled') || msg.includes('signups not allowed')) {
    return 'Novos cadastros estão temporariamente desativados no sistema. Tente novamente mais tarde.'
  }

  // 8. Sessão e Tokens
  if (
    msg.includes('token has expired') ||
    msg.includes('token expired') ||
    msg.includes('jwt expired') ||
    msg.includes('otp_expired')
  ) {
    return 'O link de acesso ou código expirou. Solicite um novo link para continuar.'
  }

  if (
    msg.includes('invalid token') ||
    msg.includes('token is invalid') ||
    msg.includes('otp is invalid')
  ) {
    return 'O código ou link informado é inválido.'
  }

  if (msg.includes('session expired') || msg.includes('auth session missing')) {
    return 'Sua sessão expirou. Faça login novamente para continuar.'
  }

  // 9. Conexão / Rede / Banco
  if (
    msg.includes('failed to fetch') ||
    msg.includes('network') ||
    msg.includes('timeout') ||
    msg.includes('connection refused')
  ) {
    return 'Não foi possível conectar aos nossos servidores. Verifique sua conexão com a internet.'
  }

  if (
    msg.includes('database error') ||
    msg.includes('unexpected_failure') ||
    msg.includes('internal server error') ||
    msg.includes('pgrst')
  ) {
    return 'Ocorreu uma instabilidade temporária em nossos servidores. Por favor, tente novamente em alguns instantes.'
  }

  // Se for qualquer outra mensagem em inglês ou técnica, não exibir jargão cru
  if (/[a-zA-Z]/.test(rawMsg) && (rawMsg.includes('Error') || rawMsg.includes('failed') || rawMsg.includes('exception'))) {
    return 'Não foi possível concluir a operação com os dados informados. Por favor, revise as informações e tente novamente.'
  }

  return rawMsg || 'Ocorreu um erro ao processar sua solicitação.'
}
