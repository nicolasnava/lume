import { AggregatedAdminContext } from './aiContext'

const GEMINI_API_KEY = process.env.GEMINI_API_KEY || ''
const CANDIDATE_MODELS = [
  'gemini-flash-lite-latest',
  'gemini-flash-latest',
  'gemini-2.5-flash-lite',
  'gemini-2.5-flash',
]

const SYSTEM_INSTRUCTION = `Você é o "Assistente do Chefe", a inteligência artificial consultiva exclusiva da gestão executiva da plataforma Lumê (SaaS completo de agendamento e gestão para profissionais e estúdios de beleza no Brasil).

SUAS DIRETRIZES ESTRITAS:
1. PAPEL CONSULTIVO EXECUTIVO: Você analisa métricas reais, identifica gargalos operacionais e propõe planos de ação práticos para crescimento, retenção (churn) e aumento de conversão.
2. BASE FACTUAL PURA: Utilize única e exclusivamente os números, estatísticas e indicadores presentes no contexto JSON fornecido. NUNCA invente números, clientes, profissionais ou tendências inexistentes.
3. SEM EXECUÇÃO DE AÇÕES: Você é 100% consultivo e não executa alterações no banco. Não afirme ou simule que executou ações técnicas. Recomende o que a gestão pode fazer pelo painel.
4. QUALIDADE GRAMATICAL E FORMATAÇÃO:
   - Responda em Português Brasileiro (PT-BR) formal, direto, claro e impecável.
   - Formate suas respostas de maneira limpa e organizada: use títulos de seção curtos, listas com marcadores simples (* item) e destaques em negrito (**destaque**) de forma moderada e legível.
   - NUNCA empilhe asteriscos triplos desnecessários (evite ***palavra***).
5. ESTABILIDADE: Se os indicadores estiverem saudáveis ou dentro da normalidade, informe com clareza que a operação está estável, sem criar falsos alarmes.`

/**
 * Formata o contexto em texto JSON limpo para a IA
 */
function formatContextForPrompt(context: AggregatedAdminContext): string {
  return `=== DADOS AGREGADOS ATUAIS DA PLATAFORMA LUMÊ ===\n${JSON.stringify(context, null, 2)}`
}

/**
 * Faz a chamada HTTP direta para a API do Google Gemini com fallback automático entre modelos
 */
async function callGeminiApi(
  contents: { role: string; parts: { text: string }[] }[],
  systemPrompt: string = SYSTEM_INSTRUCTION
): Promise<{ text: string; error?: string }> {
  if (!GEMINI_API_KEY) {
    return {
      text: '',
      error: 'A chave da API do Gemini (GEMINI_API_KEY) não está configurada no servidor (.env.local).',
    }
  }

  let lastError = ''

  for (const model of CANDIDATE_MODELS) {
    const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${GEMINI_API_KEY}`

    const requestBody = {
      system_instruction: {
        parts: [{ text: systemPrompt }],
      },
      contents,
      generationConfig: {
        temperature: 0.3,
        maxOutputTokens: 900,
      },
    }

    try {
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      })

      if (res.ok) {
        const data = await res.json()
        const responseText = data?.candidates?.[0]?.content?.parts?.[0]?.text || ''
        if (responseText) {
          return { text: responseText.trim() }
        }
      } else {
        const errorText = await res.text()
        console.warn(`[Gemini API] Tentativa com modelo ${model} retornou ${res.status}:`, errorText)
        lastError = `Status ${res.status}`
      }
    } catch (err) {
      console.warn(`[Gemini API] Exceção na conexão com modelo ${model}:`, err)
      lastError = 'Erro de conexão'
    }
  }

  return {
    text: '',
    error: `Não foi possível obter resposta dos modelos do Gemini (${lastError}).`,
  }
}

/**
 * 1. Gera o comentário / insight conciso ao entrar em /admin
 */
export async function generateAdminInsight(
  context: AggregatedAdminContext
): Promise<{ insight: string; error?: string }> {
  if (!GEMINI_API_KEY) {
    // Fallback inteligente caso a chave ainda não tenha sido colocada
    const inativas = context.profissionais.inativas_mais_14_dias.quantidade
    const total = context.profissionais.total_cadastradas
    if (inativas > 0) {
      return {
        insight: `Você tem ${inativas} de ${total} profissionais sem login há mais de 14 dias — vale conferir a lista para reengajamento. (Configure GEMINI_API_KEY para insights com IA completa).`,
      }
    }
    return {
      insight: `Plataforma com ${total} profissionais cadastradas e operação estável. (Configure GEMINI_API_KEY no .env.local para análises preditivas via Gemini).`,
    }
  }

  const userPrompt = `Analise o resumo agregado dos dados reais da plataforma abaixo e gere UM ÚNICO insight executivo conciso (no máximo 2 frases curtas).
Destaque o ponto mais relevante do momento (por exemplo: inatividade recente, variação de faturamento, novos feedbacks ou taxa de conclusão). Se tudo estiver normal e sem desvios, dê um feedback positivo e factual de estabilidade.

${formatContextForPrompt(context)}`

  const contents = [
    {
      role: 'user',
      parts: [{ text: userPrompt }],
    },
  ]

  const result = await callGeminiApi(contents)

  if (result.error || !result.text) {
    return {
      insight: `Operação estável com ${context.profissionais.total_cadastradas} profissionais cadastradas.`,
      error: result.error,
    }
  }

  return { insight: result.text }
}

export interface ChatMessageItem {
  role: 'user' | 'model'
  content: string
}

/**
 * 2. Processa uma pergunta livre no chat consultivo com o histórico
 */
export async function chatWithAdminAssistant({
  messages,
  context,
}: {
  messages: ChatMessageItem[]
  context: AggregatedAdminContext
}): Promise<{ response: string; error?: string }> {
  if (!GEMINI_API_KEY) {
    return {
      response:
        'A chave da API do Gemini (GEMINI_API_KEY) não foi encontrada nas variáveis de ambiente. Por favor, adicione sua chave do Google AI Studio no arquivo .env.local para conversar com a IA.',
    }
  }

  // Prepara as mensagens no formato da API Gemini
  const contents = messages.map((m) => ({
    role: m.role === 'user' ? 'user' : 'model',
    parts: [{ text: m.content }],
  }))

  // Anexa o contexto atualizado antes da última mensagem do usuário
  const promptContext = `[Contexto dos dados reais atualizados do Lumê]:\n${formatContextForPrompt(context)}`
  
  // Inclui o contexto no system prompt ou na primeira mensagem
  const fullSystemPrompt = `${SYSTEM_INSTRUCTION}\n\n${promptContext}`

  const result = await callGeminiApi(contents, fullSystemPrompt)

  if (result.error || !result.text) {
    return {
      response:
        result.error ||
        'Desculpe, não consegui processar a análise no momento. Tente novamente em instantes.',
      error: result.error,
    }
  }

  return { response: result.text }
}
