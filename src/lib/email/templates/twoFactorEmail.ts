import { EMAIL_BRAND } from '../brand'

interface TwoFactorEmailProps {
  nome?: string
  codigo: string
  linkVerificacao?: string
  email?: string
}

function maskEmail(email?: string): string {
  if (!email || !email.includes('@')) return 'seu e-mail administrativo'
  const [user, domain] = email.split('@')
  if (user.length <= 2) return `${user[0]}***@${domain}`
  return `${user.slice(0, 2)}***${user.slice(-1)}@${domain}`
}

export function renderTwoFactorEmailHtml({
  codigo,
  linkVerificacao,
  email,
}: TwoFactorEmailProps): string {
  const digits = codigo.replace(/\D/g, '').padEnd(6, '•').slice(0, 6).split('')
  const maskedEmail = maskEmail(email)

  return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Verificação em Duas Etapas • Lumê</title>
</head>
<body style="margin: 0; padding: 0; background-color: #FAF7F5; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; -webkit-font-smoothing: antialiased; color: #4A3F5C;">
  <table width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color: #FAF7F5; padding: 48px 16px;">
    <tr>
      <td align="center">
        <!-- Card Central Idêntico à tela /admin/verificar -->
        <table width="100%" border="0" cellspacing="0" cellpadding="0" style="max-width: 440px; background-color: #FFFFFF; border-radius: 24px; border: 1px solid #E5E7EB; overflow: hidden; box-shadow: 0 12px 36px rgba(74, 63, 92, 0.06);">
          <tr>
            <td align="center" style="padding: 40px 32px 36px 32px; text-align: center;">
              
              <!-- Logo Lumê Centralizado -->
              <div style="margin-bottom: 24px; text-align: center;">
                <img 
                  src="${EMAIL_BRAND.logoUrl}" 
                  alt="Lumê" 
                  height="30" 
                  style="display: inline-block; height: 30px; width: auto; max-height: 32px; border: 0; outline: none; text-decoration: none;"
                />
              </div>

              <!-- Título & Subtítulo -->
              <h1 style="margin: 0 0 8px 0; font-size: 22px; font-weight: 700; color: #4A3F5C; letter-spacing: -0.4px; line-height: 1.25;">
                Verificação em Duas Etapas
              </h1>
              
              <p style="margin: 0 0 12px 0; font-size: 13px; line-height: 1.5; color: #6B5E7A; font-weight: 400;">
                Por segurança, enviamos um código de <strong style="color: #4A3F5C; font-weight: 700;">6 dígitos</strong> para:
              </p>

              <!-- Badge com Email Mascarado -->
              <div style="margin-bottom: 28px;">
                <span style="display: inline-block; padding: 4px 14px; border-radius: 9999px; background-color: #FAF7F5; border: 1px solid #E5E7EB; font-family: monospace, -apple-system, sans-serif; font-size: 12px; font-weight: 700; color: #4A3F5C;">
                  ${maskedEmail}
                </span>
              </div>

              <!-- 6 Caixas de Dígitos (Idêntico aos Inputs do /admin/verificar) -->
              <table border="0" cellspacing="0" cellpadding="0" align="center" style="margin: 0 auto 28px auto;">
                <tr>
                  ${digits
                    .map(
                      (d) => `
                    <td style="padding: 0 4px;">
                      <div style="width: 44px; height: 56px; line-height: 56px; text-align: center; font-size: 24px; font-weight: 800; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, monospace; color: #4A3F5C; background-color: #FAF7F5; border: 2px solid #E5E7EB; border-radius: 12px; box-sizing: border-box;">
                        ${d}
                      </div>
                    </td>
                  `
                    )
                    .join('')}
                </tr>
              </table>

              <!-- Botão Confirmar e Entrar (Lilás Lumê) -->
              ${
                linkVerificacao
                  ? `
              <table width="100%" border="0" cellspacing="0" cellpadding="0" style="margin-bottom: 24px;">
                <tr>
                  <td align="center">
                    <a href="${linkVerificacao}" style="display: block; width: 100%; box-sizing: border-box; background-color: #B8A9D9; color: #18141F; font-size: 14px; font-weight: 700; text-decoration: none; padding: 14px 24px; border-radius: 12px; text-align: center; letter-spacing: -0.2px;">
                      Confirmar e Entrar &rarr;
                    </a>
                  </td>
                </tr>
              </table>`
                  : ''
              }

              <!-- Divisor Suave -->
              <div style="border-top: 1px solid #F0EAE4; margin: 20px 0 16px 0;"></div>

              <!-- Nota de Segurança no Rodapé -->
              <p style="margin: 0; font-size: 11px; color: #9E92A8; line-height: 1.4; text-align: center;">
                O código expira em 10 minutos. Nunca compartilhe seu código.
              </p>

            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`
}

