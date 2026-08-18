'use client'

import React from 'react'

interface FormattedAiContentProps {
  content: string
}

interface InlineToken {
  bold: boolean
  italic: boolean
  text: string
}

/**
 * Tokenizador hierárquico robusto de Markdown
 * Elimina 100% dos asteriscos soltos e converte corretamente **negrito** e *itálico*
 */
function parseInlineMarkdown(rawText: string): InlineToken[] {
  // 1. Divide em pedaços por **negrito**
  const boldRegex = /\*\*(.+?)\*\*/g
  const chunks: { type: 'bold' | 'text'; content: string }[] = []
  let lastIndex = 0
  let match: RegExpExecArray | null

  while ((match = boldRegex.exec(rawText)) !== null) {
    if (match.index > lastIndex) {
      chunks.push({ type: 'text', content: rawText.slice(lastIndex, match.index) })
    }
    chunks.push({ type: 'bold', content: match[1] })
    lastIndex = boldRegex.lastIndex
  }

  if (lastIndex < rawText.length) {
    chunks.push({ type: 'text', content: rawText.slice(lastIndex) })
  }

  // 2. Para cada pedaço, processa *itálico* e limpa asteriscos residuais
  const finalTokens: InlineToken[] = []
  for (const chunk of chunks) {
    const isBold = chunk.type === 'bold'
    const italicRegex = /\*([^*]+)\*/g
    let subLast = 0
    let subMatch: RegExpExecArray | null

    while ((subMatch = italicRegex.exec(chunk.content)) !== null) {
      if (subMatch.index > subLast) {
        finalTokens.push({
          bold: isBold,
          italic: false,
          text: chunk.content.slice(subLast, subMatch.index).replace(/\*/g, ''),
        })
      }
      finalTokens.push({
        bold: isBold,
        italic: true,
        text: subMatch[1].replace(/\*/g, ''),
      })
      subLast = italicRegex.lastIndex
    }

    if (subLast < chunk.content.length) {
      finalTokens.push({
        bold: isBold,
        italic: false,
        text: chunk.content.slice(subLast).replace(/\*/g, ''),
      })
    }
  }

  return finalTokens.filter((t) => t.text.length > 0)
}

/**
 * Renderizador de formatação rica para mensagens da IA
 */
export default function FormattedAiContent({ content }: FormattedAiContentProps) {
  if (!content) return null

  const lines = content.split('\n')

  const renderTokens = (tokens: InlineToken[]) => {
    return tokens.map((token, idx) => {
      if (token.bold && token.italic) {
        return (
          <strong key={idx} className="font-bold text-white tracking-wide underline decoration-[#8C5383]/50">
            {token.text}
          </strong>
        )
      }
      if (token.bold) {
        return (
          <strong key={idx} className="font-bold text-white tracking-wide">
            {token.text}
          </strong>
        )
      }
      if (token.italic) {
        return (
          <span key={idx} className="text-[#D8B4E2] font-medium">
            {token.text}
          </span>
        )
      }
      return <span key={idx}>{token.text}</span>
    })
  }

  const renderedElements: React.ReactNode[] = []
  let currentListItems: React.ReactNode[] = []

  const flushList = () => {
    if (currentListItems.length > 0) {
      renderedElements.push(
        <ul key={`list-${renderedElements.length}`} className="space-y-1.5 my-2 pl-1">
          {currentListItems}
        </ul>
      )
      currentListItems = []
    }
  }

  lines.forEach((line, lineIdx) => {
    const trimmed = line.trim()

    if (!trimmed) {
      flushList()
      return
    }

    // Itens de lista com marcador: * item, - item ou • item
    if (trimmed.startsWith('* ') || trimmed.startsWith('- ') || trimmed.startsWith('• ')) {
      const itemText = trimmed.replace(/^[\*\-•]\s+/, '')
      const tokens = parseInlineMarkdown(itemText)
      currentListItems.push(
        <li key={lineIdx} className="flex items-start gap-2 text-zinc-200">
          <span className="h-1.5 w-1.5 rounded-full bg-[#8C5383] mt-2 shrink-0" />
          <span className="leading-relaxed">{renderTokens(tokens)}</span>
        </li>
      )
      return
    }

    flushList()

    // Cabeçalhos de seção: ex "### Título" ou "**1. Alerta...**"
    if (trimmed.startsWith('### ') || trimmed.startsWith('## ') || (/^\*\*\d+\./.test(trimmed) && trimmed.endsWith('**'))) {
      const headingText = trimmed.replace(/^#+\s+/, '').replace(/^\*\*|\*\*$/g, '')
      const tokens = parseInlineMarkdown(headingText)
      renderedElements.push(
        <div key={lineIdx} className="pt-2.5 pb-1 text-sm font-bold text-white flex items-center gap-2 border-b border-zinc-800/80 mb-2">
          <span className="text-[#E9C3F0]">{renderTokens(tokens)}</span>
        </div>
      )
      return
    }

    // Parágrafo regular
    const tokens = parseInlineMarkdown(trimmed)
    renderedElements.push(
      <p key={lineIdx} className="leading-relaxed text-zinc-200 mb-2">
        {renderTokens(tokens)}
      </p>
    )
  })

  flushList()

  return <div className="space-y-1 text-xs sm:text-sm">{renderedElements}</div>
}
