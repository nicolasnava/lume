import crypto from 'crypto'
import { createAdminClient } from '@/lib/supabase/admin'

function getDerivedKey(): Buffer {
  const secret = process.env.GOOGLE_CLIENT_SECRET
  if (!secret) {
    throw new Error(
      '[Google Calendar Security] GOOGLE_CLIENT_SECRET não está definida nas variáveis de ambiente. Defina esta variável para habilitar a criptografia de tokens.'
    )
  }
  return crypto.scryptSync(secret, 'lume-token-salt', 32)
}

/**
 * Criptografa o refresh_token do Google usando AES-256-GCM.
 */
export function encryptToken(token: string): string {
  const derivedKey = getDerivedKey()
  const iv = crypto.randomBytes(12)
  const cipher = crypto.createCipheriv('aes-256-gcm', derivedKey, iv)
  let encrypted = cipher.update(token, 'utf8', 'hex')
  encrypted += cipher.final('hex')
  const authTag = cipher.getAuthTag().toString('hex')
  return `${iv.toString('hex')}:${authTag}:${encrypted}`
}

/**
 * Descriptografa o refresh_token do Google.
 */
export function decryptToken(encryptedData: string): string | null {
  try {
    const parts = encryptedData.split(':')
    if (parts.length !== 3) {
      // Se por algum motivo o token estivesse em texto puro legado
      return encryptedData
    }

    const derivedKey = getDerivedKey()
    const [ivHex, authTagHex, encryptedText] = parts
    const iv = Buffer.from(ivHex, 'hex')
    const authTag = Buffer.from(authTagHex, 'hex')
    const decipher = crypto.createDecipheriv('aes-256-gcm', derivedKey, iv)
    decipher.setAuthTag(authTag)

    let decrypted = decipher.update(encryptedText, 'hex', 'utf8')
    decrypted += decipher.final('utf8')
    return decrypted
  } catch (error) {
    console.error('[Google Calendar] Erro ao descriptografar token:', error)
    return null
  }
}

/**
 * Desconecta o Google Calendar para a profissional limpando a coluna google_calendar_token.
 */
async function clearProfissionalToken(profissionalId: string) {
  try {
    const supabase = createAdminClient()
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (supabase.from('profissionais') as any)
      .update({ google_calendar_token: null })
      .eq('id', profissionalId)
    console.warn(`[Google Calendar] Token revogado ou inválido. Conexão desativada no banco para a profissional: ${profissionalId}`)
  } catch (err) {
    console.error('[Google Calendar] Erro ao limpar token no banco:', err)
  }
}

/**
 * Obtém um access_token válido utilizando o refresh_token salvo no banco.
 * Caso o token tenha sido revogado ou seja inválido, desconecta a profissional (Item 4).
 */
export async function getValidAccessToken(profissionalId: string): Promise<string | null> {
  try {
    const supabase = createAdminClient()
    const { data: prof, error } = await supabase
      .from('profissionais')
      .select('google_calendar_token')
      .eq('id', profissionalId)
      .single()

    if (error || !prof || !prof.google_calendar_token) {
      return null
    }

    const refreshToken = decryptToken(prof.google_calendar_token)
    if (!refreshToken) {
      await clearProfissionalToken(profissionalId)
      return null
    }

    const clientId = process.env.GOOGLE_CLIENT_ID
    const clientSecret = process.env.GOOGLE_CLIENT_SECRET

    if (!clientId || !clientSecret) {
      console.error('[Google Calendar] GOOGLE_CLIENT_ID ou GOOGLE_CLIENT_SECRET ausentes no .env')
      return null
    }

    const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        client_id: clientId,
        client_secret: clientSecret,
        refresh_token: refreshToken,
        grant_type: 'refresh_token',
      }),
    })

    const tokenData = await tokenResponse.json()

    if (!tokenResponse.ok) {
      console.error('[Google Calendar] Erro na resposta do token Google:', tokenData)
      // Tratamento de token expirado ou revogado (Item 4)
      if (
        tokenData.error === 'invalid_grant' ||
        tokenData.error === 'unauthorized_client' ||
        tokenResponse.status === 400 ||
        tokenResponse.status === 401
      ) {
        await clearProfissionalToken(profissionalId)
      }
      return null
    }

    return tokenData.access_token as string
  } catch (error) {
    console.error('[Google Calendar] Erro ao renovar access token:', error)
    return null
  }
}

export interface CreateEventInput {
  profissionalId: string
  clienteNome: string
  clienteTelefone: string
  servicoNome: string
  dataHoraInicio: string
  dataHoraFim: string
}

/**
 * Cria um evento no calendário primário do Google da profissional.
 */
export async function createGoogleCalendarEvent(
  input: CreateEventInput
): Promise<{ eventId: string } | null> {
  try {
    const accessToken = await getValidAccessToken(input.profissionalId)
    if (!accessToken) {
      // Profissional não conectou o Google Calendar ou token expirado
      return null
    }

    const eventPayload = {
      summary: `Atendimento: ${input.clienteNome} - ${input.servicoNome}`,
      description: `Agendamento via Lumê\n\nCliente: ${input.clienteNome}\nTelefone: ${input.clienteTelefone}\nServiço: ${input.servicoNome}`,
      start: {
        dateTime: new Date(input.dataHoraInicio).toISOString(),
      },
      end: {
        dateTime: new Date(input.dataHoraFim).toISOString(),
      },
    }

    const res = await fetch('https://www.googleapis.com/calendar/v3/calendars/primary/events', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(eventPayload),
    })

    const responseData = await res.json()

    if (!res.ok) {
      console.error('[Google Calendar] Erro ao criar evento:', responseData)
      return null
    }

    return { eventId: responseData.id }
  } catch (error) {
    console.error('[Google Calendar] Erro inesperado ao criar evento:', error)
    return null
  }
}

export interface UpdateEventInput extends CreateEventInput {
  googleEventId: string
}

/**
 * Atualiza um evento existente no Google Calendar.
 */
export async function updateGoogleCalendarEvent(
  input: UpdateEventInput
): Promise<boolean> {
  try {
    if (!input.googleEventId) return false

    const accessToken = await getValidAccessToken(input.profissionalId)
    if (!accessToken) return false

    const eventPayload = {
      summary: `Atendimento: ${input.clienteNome} - ${input.servicoNome}`,
      description: `Agendamento via Lumê\n\nCliente: ${input.clienteNome}\nTelefone: ${input.clienteTelefone}\nServiço: ${input.servicoNome}`,
      start: {
        dateTime: new Date(input.dataHoraInicio).toISOString(),
      },
      end: {
        dateTime: new Date(input.dataHoraFim).toISOString(),
      },
    }

    const res = await fetch(
      `https://www.googleapis.com/calendar/v3/calendars/primary/events/${encodeURIComponent(
        input.googleEventId
      )}`,
      {
        method: 'PATCH',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(eventPayload),
      }
    )

    if (!res.ok) {
      const errData = await res.json()
      console.error('[Google Calendar] Erro ao atualizar evento:', errData)
      return false
    }

    return true
  } catch (error) {
    console.error('[Google Calendar] Erro inesperado ao atualizar evento:', error)
    return false
  }
}

/**
 * Deleta um evento do Google Calendar.
 */
export async function deleteGoogleCalendarEvent(input: {
  profissionalId: string
  googleEventId: string
}): Promise<boolean> {
  try {
    if (!input.googleEventId) return false

    const accessToken = await getValidAccessToken(input.profissionalId)
    if (!accessToken) return false

    const res = await fetch(
      `https://www.googleapis.com/calendar/v3/calendars/primary/events/${encodeURIComponent(
        input.googleEventId
      )}`,
      {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      }
    )

    // 204 No Content ou 410 Gone significam sucesso ou já deletado
    if (res.ok || res.status === 404 || res.status === 410) {
      return true
    }

    const errData = await res.json()
    console.error('[Google Calendar] Erro ao deletar evento:', errData)
    return false
  } catch (error) {
    console.error('[Google Calendar] Erro inesperado ao deletar evento:', error)
    return false
  }
}
