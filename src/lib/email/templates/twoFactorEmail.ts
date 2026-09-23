import { EMAIL_BRAND } from '../brand'

interface TwoFactorEmailProps {
  nome?: string
  codigo: string
  linkVerificacao?: string
  email?: string
}

function escapeHtml(value: string): string {
  return value.replace(/[&<>"']/g, (character) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
  }[character] || character))
}

function maskEmail(email?: string): string {
  if (!email || !email.includes('@')) return 'seu e-mail administrativo'
  const [user, domain] = email.split('@')
  return `${user.slice(0, 2)}***@${domain}`
}

export function renderTwoFactorEmailHtml({ codigo, linkVerificacao, email }: TwoFactorEmailProps): string {
  const safeCode = escapeHtml(codigo.replace(/\D/g, '').slice(0, 6))
  const safeEmail = escapeHtml(maskEmail(email))
  const safeLink = linkVerificacao && /^https:\/\//i.test(linkVerificacao)
    ? escapeHtml(linkVerificacao)
    : null

  return `<!doctype html>
<html lang="pt-BR">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <title>Código de verificação | Lumê</title>
  <style>@media(max-width:600px){.frame{padding:20px 12px!important}.content{padding:32px 24px!important}.heading{font-size:28px!important}.brand{padding:25px 24px!important}.code{font-size:32px!important;letter-spacing:5px!important}}</style>
</head>
<body style="margin:0;background:#FAF7F5;color:#4A3F5C;font-family:Arial,Helvetica,sans-serif">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#FAF7F5"><tr><td align="center" class="frame" style="padding:48px 16px">
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:560px;background:#fff;border:1px solid #E8E1EA;border-radius:24px;overflow:hidden">
      <tr><td height="5" style="background:#B8A9D9;font-size:1px;line-height:1px">&nbsp;</td></tr>
      <tr><td class="brand" style="padding:30px 44px;border-bottom:1px solid #F0EAF2">
        <img src="${EMAIL_BRAND.logoUrl}" width="108" alt="Lumê" style="display:block;width:108px;height:auto;border:0">
      </td></tr>
      <tr><td class="content" style="padding:48px 44px 44px">
        <p style="margin:0 0 20px;color:#8675A9;font-size:11px;font-weight:700;letter-spacing:2.5px;text-transform:uppercase">Verificação de acesso</p>
        <h1 class="heading" style="margin:0;color:#4A3F5C;font-family:Georgia,serif;font-size:34px;font-weight:normal;line-height:1.18;letter-spacing:-1px">Sua conta,<br>bem protegida.</h1>
        <p style="margin:24px 0 8px;color:#665C70;font-size:15px;line-height:1.75">Use este código para confirmar o acesso ao painel Lumê.</p>
        <p style="margin:0 0 25px;color:#867B90;font-size:12px">Enviado para ${safeEmail}</p>
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="border:1px solid #DED5EA;border-radius:16px;background:#FAF7F5"><tr><td align="center" class="code" style="padding:20px 12px;color:#4A3F5C;font-size:38px;font-weight:700;letter-spacing:8px;line-height:1.3">${safeCode}</td></tr></table>
        ${safeLink ? `<table role="presentation" cellspacing="0" cellpadding="0" style="margin-top:26px"><tr><td bgcolor="#4A3F5C" style="border-radius:12px"><a href="${safeLink}" style="display:inline-block;padding:16px 27px;color:#fff;font-size:14px;font-weight:bold;text-decoration:none">Confirmar acesso</a></td></tr></table>` : ''}
        <p style="margin:30px 0 0;padding-top:22px;border-top:1px solid #F0EAF2;color:#6B6075;font-size:12px;line-height:1.7">O código expira em 10 minutos. Nunca o compartilhe. Se você não tentou entrar, ignore esta mensagem.</p>
      </td></tr>
      <tr><td style="padding:22px 44px;background:#FAF7F5;border-top:1px solid #F0EAF2;color:#82778B;font-size:11px;line-height:1.7">Este e-mail foi enviado para proteger o acesso ao painel administrativo.</td></tr>
    </table>
    <p style="margin:22px 0 0;color:#9A8FA4;font-size:11px">Lumê · Organização e leveza para o seu atendimento</p>
  </td></tr></table>
</body>
</html>`
}
