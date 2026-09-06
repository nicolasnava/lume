'use client'

import { useEffect, useState } from 'react'
import QRCode from 'qrcode'
import { QrCode, Download, Copy, Check, X, ExternalLink } from 'lucide-react'

interface QrCodeModalProps {
  isOpen: boolean
  onClose: () => void
  url: string
  nomeProfissional: string
  corPrimaria?: string
}

export default function QrCodeModal({
  isOpen,
  onClose,
  url,
  nomeProfissional,
  corPrimaria = '#B8A9D9',
}: QrCodeModalProps) {
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)
  const [generating, setGenerating] = useState(true)

  useEffect(() => {
    if (!isOpen || !url) return

    let isMounted = true
    setGenerating(true)

    const generateQrWithLogo = async () => {
      try {
        const canvas = document.createElement('canvas')
        canvas.width = 1024
        canvas.height = 1024

        await QRCode.toCanvas(canvas, url, {
          width: 1024,
          margin: 2,
          color: {
            dark: '#4A3F5C',
            light: '#FFFFFF',
          },
          errorCorrectionLevel: 'H',
        })

        const ctx = canvas.getContext('2d')
        if (ctx) {
          // Carregar logo oficial do Lumê (/assets/lume_icon.webp)
          try {
            const logo = new Image()
            logo.crossOrigin = 'anonymous'
            await new Promise<void>((resolve, reject) => {
              logo.onload = () => resolve()
              logo.onerror = () => reject()
              logo.src = '/assets/lume_icon.webp'
            })

            const center = 1024 / 2
            const badgeSize = 220
            const badgeRadius = 42
            const badgeX = center - badgeSize / 2
            const badgeY = center - badgeSize / 2

            // Sombra suave do badge
            ctx.save()
            ctx.shadowColor = 'rgba(74, 63, 92, 0.2)'
            ctx.shadowBlur = 24
            ctx.shadowOffsetY = 6

            // Fundo branco do badge
            ctx.fillStyle = '#FFFFFF'
            ctx.beginPath()
            ctx.roundRect(badgeX, badgeY, badgeSize, badgeSize, badgeRadius)
            ctx.fill()
            ctx.restore()

            // Borda sutil
            ctx.save()
            ctx.strokeStyle = '#F3EFF8'
            ctx.lineWidth = 4
            ctx.beginPath()
            ctx.roundRect(badgeX, badgeY, badgeSize, badgeSize, badgeRadius)
            ctx.stroke()
            ctx.restore()

            // Desenhar ícone da Lumê centralizado no badge
            const padding = 26
            const iconSize = badgeSize - padding * 2
            const iconX = badgeX + padding
            const iconY = badgeY + padding

            ctx.save()
            ctx.beginPath()
            ctx.roundRect(iconX, iconY, iconSize, iconSize, 28)
            ctx.clip()
            ctx.drawImage(logo, iconX, iconY, iconSize, iconSize)
            ctx.restore()
          } catch (logoErr) {
            console.warn('Ícone da Lumê não carregado para o QR Code:', logoErr)
          }
        }

        if (isMounted) {
          setQrDataUrl(canvas.toDataURL('image/png'))
          setGenerating(false)
        }
      } catch (err) {
        console.error('Erro ao gerar QR Code:', err)
        if (isMounted) setGenerating(false)
      }
    }

    generateQrWithLogo()

    return () => {
      isMounted = false
    }
  }, [isOpen, url])

  if (!isOpen) return null

  const handleDownload = () => {
    if (!qrDataUrl) return
    const link = document.createElement('a')
    const cleanName = nomeProfissional.toLowerCase().replace(/[^a-z0-9]/g, '-')
    link.download = `qrcode-lume-${cleanName || 'vitrine'}.png`
    link.href = qrDataUrl
    link.click()
  }

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(url)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // Fallback
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="w-full max-w-sm rounded-3xl bg-white p-6 shadow-2xl space-y-5 relative text-center">
        {/* Fechar */}
        <button
          onClick={onClose}
          className="absolute right-4 top-4 rounded-full p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-700 transition cursor-pointer"
        >
          <X className="h-5 w-5" />
        </button>

        {/* Título */}
        <div className="space-y-1">
          <div
            className="mx-auto flex h-11 w-11 items-center justify-center rounded-2xl text-white shadow-xs"
            style={{ backgroundColor: corPrimaria }}
          >
            <QrCode className="h-6 w-6" />
          </div>
          <h3 className="text-lg font-bold text-[#4A3F5C]">QR Code da Vitrine</h3>
          <p className="text-xs text-gray-500 font-medium">
            Imprima ou exiba em seu balcão para suas clientes agendarem na hora
          </p>
        </div>

        {/* Preview do QR Code */}
        <div className="mx-auto flex w-60 h-60 items-center justify-center rounded-2xl border border-gray-200 bg-[#FAF7F5] p-3 shadow-inner">
          {generating || !qrDataUrl ? (
            <div className="flex flex-col items-center gap-2 text-xs text-gray-400 font-semibold">
              <div className="h-8 w-8 animate-spin rounded-full border-2 border-[#4A3F5C] border-t-transparent" />
              <span>Gerando QR Code...</span>
            </div>
          ) : (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={qrDataUrl}
              alt={`QR Code de ${nomeProfissional}`}
              className="h-full w-full rounded-xl object-contain shadow-xs bg-white p-1"
            />
          )}
        </div>

        {/* URL legível */}
        <div className="rounded-xl bg-gray-50 p-2.5 border border-gray-100 flex items-center justify-between text-[11px] text-gray-600 font-mono break-all text-left">
          <span className="truncate mr-2">{url}</span>
          <a
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-[#4A3F5C] hover:text-purple-900 shrink-0"
            title="Abrir página"
          >
            <ExternalLink className="h-3.5 w-3.5" />
          </a>
        </div>

        {/* Botões de Ação */}
        <div className="space-y-2 pt-1">
          <button
            type="button"
            onClick={handleDownload}
            disabled={generating || !qrDataUrl}
            className="w-full flex items-center justify-center gap-2 rounded-2xl py-3 text-xs font-bold text-white shadow-sm transition hover:opacity-90 disabled:opacity-50 cursor-pointer"
            style={{ backgroundColor: '#4A3F5C' }}
          >
            <Download className="h-4 w-4" />
            <span>Baixar QR Code (PNG de Alta Resolução)</span>
          </button>

          <button
            type="button"
            onClick={handleCopyLink}
            className="w-full flex items-center justify-center gap-2 rounded-2xl py-2.5 border border-gray-200 bg-white text-xs font-semibold text-[#4A3F5C] hover:bg-gray-50 transition cursor-pointer"
          >
            {copied ? (
              <>
                <Check className="h-4 w-4 text-emerald-600" />
                <span className="text-emerald-700 font-bold">Link Copiado!</span>
              </>
            ) : (
              <>
                <Copy className="h-4 w-4 text-gray-500" />
                <span>Copiar Link da Vitrine</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}
