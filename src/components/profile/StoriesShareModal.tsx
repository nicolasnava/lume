'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import QRCode from 'qrcode'
import { Instagram, Download, Share2, X, Loader2, Check } from 'lucide-react'

interface StoriesShareModalProps {
  isOpen: boolean
  onClose: () => void
  url: string
  nomeProfissional: string
  fotoUrl: string | null
  tagline?: string | null
  corPrimaria?: string
  corSecundaria?: string
  mode?: 'vitrine' | 'indicacao'
}

export default function StoriesShareModal({
  isOpen,
  onClose,
  url,
  nomeProfissional,
  fotoUrl,
  tagline,
  mode = 'vitrine',
}: StoriesShareModalProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [generating, setGenerating] = useState(true)
  const [sharing, setSharing] = useState(false)
  const [shareFeedback, setShareFeedback] = useState<string | null>(null)

  const generateStoryCanvas = useCallback(async () => {
    setGenerating(true)
    const canvas = document.createElement('canvas')
    canvas.width = 1080
    canvas.height = 1920
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    // 1. Fundo de uma só cor no tom lavanda/pastel (#EDE8F7)
    ctx.fillStyle = '#EDE8F7'
    ctx.fillRect(0, 0, 1080, 1920)

    // 2. Avatar da Profissional (com sombra elegante e anel branco)
    const avatarY = 360
    const avatarRadius = 130

    // Sombra do Avatar
    ctx.save()
    ctx.shadowColor = 'rgba(74, 63, 92, 0.18)'
    ctx.shadowBlur = 35
    ctx.shadowOffsetY = 12

    // Anel externo branco
    ctx.beginPath()
    ctx.arc(540, avatarY, avatarRadius + 6, 0, Math.PI * 2)
    ctx.fillStyle = '#FFFFFF'
    ctx.fill()
    ctx.restore()

    let avatarLoaded = false
    if (fotoUrl) {
      try {
        const img = new Image()
        img.crossOrigin = 'anonymous'
        await new Promise<void>((resolve, reject) => {
          img.onload = () => resolve()
          img.onerror = () => reject()
          img.src = fotoUrl
        })

        ctx.save()
        ctx.beginPath()
        ctx.arc(540, avatarY, avatarRadius, 0, Math.PI * 2)
        ctx.clip()
        ctx.drawImage(img, 540 - avatarRadius, avatarY - avatarRadius, avatarRadius * 2, avatarRadius * 2)
        ctx.restore()
        avatarLoaded = true
      } catch {
        avatarLoaded = false
      }
    }

    if (!avatarLoaded) {
      // Iniciais estilizadas com a cor da Lumê
      ctx.save()
      ctx.beginPath()
      ctx.arc(540, avatarY, avatarRadius, 0, Math.PI * 2)
      ctx.fillStyle = '#E8E2EE'
      ctx.fill()

      ctx.fillStyle = '#4A3F5C'
      ctx.font = 'bold 88px sans-serif'
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      const initials = nomeProfissional
        .split(' ')
        .slice(0, 2)
        .map((p) => p[0]?.toUpperCase())
        .join('')
      ctx.fillText(initials || 'L', 540, avatarY)
      ctx.restore()
    }

    // 3. Nome da Profissional e Frase de Destaque
    ctx.save()
    ctx.textAlign = 'center'
    ctx.font = '800 54px sans-serif'
    ctx.fillStyle = '#4A3F5C'
    ctx.fillText(nomeProfissional, 540, 560)

    ctx.font = '500 25px sans-serif'
    ctx.fillStyle = '#7A6E89'
    const subText = mode === 'indicacao'
      ? 'Convite especial para o Lumê'
      : tagline?.trim() || 'Reserve seu horário online com facilidade'
    ctx.fillText(subText, 540, 615)
    ctx.restore()

    // 4. Textos de Chamada para Agendamento / Indicação (Direto na tela lisa pastel)
    ctx.save()
    ctx.textAlign = 'center'
    ctx.font = '700 32px sans-serif'
    ctx.fillStyle = '#4A3F5C'
    const callTitle = mode === 'indicacao' ? 'Aponte a câmera e cadastre-se' : 'Aponte a câmera e agende'
    ctx.fillText(callTitle, 540, 740)

    ctx.font = '500 22px sans-serif'
    ctx.fillStyle = '#8E8299'
    const callSub = mode === 'indicacao'
      ? 'Gerencie sua agenda de beleza com inteligência'
      : 'Escolha o serviço e horário desejado em instantes'
    ctx.fillText(callSub, 540, 785)
    ctx.restore()

    // 5. Base Branca Delicada para o QR Code (Garante escaneamento perfeito em qualquer ângulo)
    const qrPlateSize = 560
    const qrPlateX = 540 - qrPlateSize / 2
    const qrPlateY = 840
    const qrPlateRadius = 40

    ctx.save()
    ctx.shadowColor = 'rgba(74, 63, 92, 0.12)'
    ctx.shadowBlur = 40
    ctx.shadowOffsetY = 14
    ctx.beginPath()
    ctx.roundRect(qrPlateX, qrPlateY, qrPlateSize, qrPlateSize, qrPlateRadius)
    ctx.fillStyle = '#FFFFFF'
    ctx.fill()
    ctx.restore()

    ctx.save()
    ctx.strokeStyle = 'rgba(232, 223, 238, 0.8)'
    ctx.lineWidth = 1.5
    ctx.beginPath()
    ctx.roundRect(qrPlateX, qrPlateY, qrPlateSize, qrPlateSize, qrPlateRadius)
    ctx.stroke()
    ctx.restore()

    // 6. Gerar QR Code com Logo Oficial no Centro
    try {
      const qrCanvas = document.createElement('canvas')
      qrCanvas.width = 600
      qrCanvas.height = 600

      await QRCode.toCanvas(qrCanvas, url, {
        width: 600,
        margin: 1,
        color: {
          dark: '#4A3F5C',
          light: '#FFFFFF',
        },
        errorCorrectionLevel: 'H',
      })

      const qrCtx = qrCanvas.getContext('2d')
      if (qrCtx) {
        try {
          const lumeIcon = new Image()
          lumeIcon.crossOrigin = 'anonymous'
          await new Promise<void>((resolve, reject) => {
            lumeIcon.onload = () => resolve()
            lumeIcon.onerror = () => reject()
            lumeIcon.src = '/assets/lume_icon.webp'
          })

          const qrCenter = 300
          const badgeSize = 130
          const badgeRadius = 26
          const badgeX = qrCenter - badgeSize / 2
          const badgeY = qrCenter - badgeSize / 2

          // Badge branco central
          qrCtx.save()
          qrCtx.shadowColor = 'rgba(74, 63, 92, 0.2)'
          qrCtx.shadowBlur = 12
          qrCtx.fillStyle = '#FFFFFF'
          qrCtx.beginPath()
          qrCtx.roundRect(badgeX, badgeY, badgeSize, badgeSize, badgeRadius)
          qrCtx.fill()
          qrCtx.restore()

          // Borda do badge
          qrCtx.save()
          qrCtx.strokeStyle = '#F0ECF5'
          qrCtx.lineWidth = 3
          qrCtx.beginPath()
          qrCtx.roundRect(badgeX, badgeY, badgeSize, badgeSize, badgeRadius)
          qrCtx.stroke()
          qrCtx.restore()

          // Ícone Lume no centro
          const pad = 16
          const iconSize = badgeSize - pad * 2
          const iconX = badgeX + pad
          const iconY = badgeY + pad

          qrCtx.save()
          qrCtx.beginPath()
          qrCtx.roundRect(iconX, iconY, iconSize, iconSize, 18)
          qrCtx.clip()
          qrCtx.drawImage(lumeIcon, iconX, iconY, iconSize, iconSize)
          qrCtx.restore()
        } catch (iconErr) {
          console.warn('Não foi possível carregar o ícone no QR Code do Story:', iconErr)
        }
      }

      // Desenha o QR Code sobre a base branca
      const qrDisplaySize = 480
      ctx.drawImage(qrCanvas, 540 - qrDisplaySize / 2, qrPlateY + (qrPlateSize - qrDisplaySize) / 2, qrDisplaySize, qrDisplaySize)
    } catch (qrErr) {
      console.error('Erro ao renderizar QR code no Story:', qrErr)
    }

    // 7. Pílula com o Link (Direto na tela pastel)
    ctx.save()
    ctx.textAlign = 'center'
    const cleanUrl = url.replace(/^https?:\/\//, '')
    const pillY = 1460
    ctx.font = '700 23px sans-serif'
    const textWidth = ctx.measureText(cleanUrl).width
    const pillWidth = Math.min(Math.max(textWidth + 70, 420), 640)
    const pillX = 540 - pillWidth / 2

    ctx.save()
    ctx.shadowColor = 'rgba(74, 63, 92, 0.08)'
    ctx.shadowBlur = 20
    ctx.shadowOffsetY = 6
    ctx.fillStyle = '#FFFFFF'
    ctx.beginPath()
    ctx.roundRect(pillX, pillY, pillWidth, 58, 29)
    ctx.fill()
    ctx.restore()

    ctx.strokeStyle = '#E8DFEE'
    ctx.lineWidth = 1.5
    ctx.beginPath()
    ctx.roundRect(pillX, pillY, pillWidth, 58, 29)
    ctx.stroke()

    ctx.fillStyle = '#4A3F5C'
    ctx.textBaseline = 'middle'
    ctx.fillText(cleanUrl, 540, pillY + 29)
    ctx.restore()

    // 8. Chamada de Agilidade
    ctx.save()
    ctx.textAlign = 'center'
    ctx.font = '600 20px sans-serif'
    ctx.fillStyle = '#8E8299'
    ctx.fillText('Disponibilidade e confirmação instantânea', 540, 1550)
    ctx.restore()

    // 7. Rodapé com Logo Oficial da Lumê (/assets/lume_logo.webp)
    try {
      const lumeLogo = new Image()
      lumeLogo.crossOrigin = 'anonymous'
      await new Promise<void>((resolve, reject) => {
        lumeLogo.onload = () => resolve()
        lumeLogo.onerror = () => reject()
        lumeLogo.src = '/assets/lume_logo.webp'
      })

      // Proporção do logo
      const logoTargetWidth = 230
      const logoAspectRatio = lumeLogo.naturalHeight / (lumeLogo.naturalWidth || 1)
      const logoTargetHeight = logoTargetWidth * logoAspectRatio
      const logoY = 1630

      ctx.save()
      ctx.drawImage(
        lumeLogo,
        540 - logoTargetWidth / 2,
        logoY,
        logoTargetWidth,
        logoTargetHeight
      )
      ctx.restore()

      // Subtítulo do rodapé
      ctx.save()
      ctx.textAlign = 'center'
      ctx.font = '500 19px sans-serif'
      ctx.fillStyle = '#8E8299'
      ctx.fillText('Plataforma de Gestão & Agendamento Exclusivo', 540, logoY + logoTargetHeight + 35)
      ctx.restore()
    } catch {
      // Fallback textual elegante caso logo falhe
      ctx.save()
      ctx.textAlign = 'center'
      ctx.font = '700 32px sans-serif'
      ctx.fillStyle = '#4A3F5C'
      ctx.fillText('L U M Ê', 540, 1680)
      ctx.font = '500 20px sans-serif'
      ctx.fillStyle = '#8E8299'
      ctx.fillText('Plataforma de Gestão & Agendamento Exclusivo', 540, 1720)
      ctx.restore()
    }

    const dataUrl = canvas.toDataURL('image/png', 0.95)
    setPreviewUrl(dataUrl)
    setGenerating(false)
  }, [url, nomeProfissional, fotoUrl, tagline])

  useEffect(() => {
    if (isOpen) {
      generateStoryCanvas()
      setShareFeedback(null)
    }
  }, [isOpen, generateStoryCanvas])

  if (!isOpen) return null

  const handleDownload = () => {
    if (!previewUrl) return
    const link = document.createElement('a')
    const cleanName = nomeProfissional.toLowerCase().replace(/[^a-z0-9]/g, '-')
    link.download = `story-lume-${cleanName || 'agendamento'}.png`
    link.href = previewUrl
    link.click()
  }

  // Ação Direta para Compartilhar no Instagram Stories
  const handleShareToInstagramStories = async () => {
    if (!previewUrl) return
    try {
      setSharing(true)
      setShareFeedback(null)

      // 1. Gera Blob da imagem
      const res = await fetch(previewUrl)
      const blob = await res.blob()
      const cleanName = nomeProfissional.toLowerCase().replace(/[^a-z0-9]/g, '-')
      const file = new File([blob], `story-${cleanName}.png`, { type: 'image/png' })

      // Se o navegador suporta Web Share com arquivos (iOS Safari, Android Chrome):
      if (typeof navigator !== 'undefined' && navigator.canShare && navigator.canShare({ files: [file] })) {
        await navigator.share({
          files: [file],
          title: `Agende com ${nomeProfissional}`,
          text: `Agende seu horário comigo pelo Lumê! Link: ${url}`,
        })
        return
      }

      // Fallback em desktop ou sem suporte a compartilhamento direto de arquivos:
      // Baixa a imagem automaticamente no rolo/downloads
      handleDownload()

      // Tenta abrir o Instagram Stories pelo deep link do app mobile
      const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent)
      if (isMobile) {
        setShareFeedback('Imagem baixada! Abrindo o Instagram para você postar nos Stories...')
        // Deep link do Instagram Stories
        window.location.href = 'instagram-stories://share'
        setTimeout(() => {
          window.location.href = 'https://www.instagram.com/'
        }, 1500)
      } else {
        setShareFeedback('Imagem baixada! Abrindo o Instagram...')
        window.open('https://www.instagram.com/', '_blank')
      }
    } catch (err: unknown) {
      const errorObj = err as { name?: string }
      if (errorObj?.name !== 'AbortError') {
        console.error('Erro ao compartilhar no Instagram Stories:', err)
        handleDownload()
        setShareFeedback('Imagem baixada! Abra o Instagram e selecione-a no rolo de fotos.')
      }
    } finally {
      setSharing(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="w-full max-w-md rounded-3xl bg-white p-5 sm:p-6 shadow-2xl space-y-4 relative text-center max-h-[95vh] flex flex-col">
        {/* Botão Fechar */}
        <button
          onClick={onClose}
          className="absolute right-4 top-4 rounded-full p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-700 transition cursor-pointer z-10"
        >
          <X className="h-5 w-5" />
        </button>

        {/* Cabeçalho */}
        <div className="space-y-1 shrink-0">
          <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-tr from-amber-500 via-rose-500 to-purple-600 text-white shadow-xs">
            <Instagram className="h-5 w-5" />
          </div>
          <h3 className="text-base font-bold text-[#4A3F5C]">
            {mode === 'indicacao' ? 'Divulgar Indicação nos Stories' : 'Divulgar no Instagram Stories'}
          </h3>
          <p className="text-xs text-gray-500 font-medium">
            Imagem em 1080x1920 com a identidade Lumê, QR Code oficial e pronta para postar
          </p>
        </div>

        {/* Preview do Story (9:16) */}
        <div className="flex-1 min-h-0 flex items-center justify-center py-1">
          <div className="relative aspect-[9/16] h-[50vh] max-h-[440px] rounded-2xl overflow-hidden shadow-lg border border-gray-100 bg-[#FAF7F5] flex items-center justify-center">
            {generating || !previewUrl ? (
              <div className="flex flex-col items-center gap-2 text-xs text-gray-500 font-semibold p-4">
                <Loader2 className="h-7 w-7 animate-spin text-[#4A3F5C]" />
                <span>Gerando Story Oficial da Lumê...</span>
              </div>
            ) : (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={previewUrl}
                alt="Story Preview"
                className="h-full w-full object-contain"
              />
            )}
          </div>
        </div>

        {/* Feedback visual se houver */}
        {shareFeedback && (
          <div className="p-2.5 rounded-xl bg-purple-50 border border-purple-200 text-xs text-[#4A3F5C] font-semibold animate-in fade-in flex items-center justify-center gap-1.5">
            <Check className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
            <span>{shareFeedback}</span>
          </div>
        )}

        {/* Canvas oculto para referência */}
        <canvas ref={canvasRef} className="hidden" />

        {/* Ações */}
        <div className="space-y-2 shrink-0 pt-1">
          <div className="flex flex-col sm:flex-row gap-2">
            {/* Botão Direto para Compartilhar nos Stories */}
            <button
              type="button"
              onClick={handleShareToInstagramStories}
              disabled={generating || !previewUrl || sharing}
              className="flex-1 flex items-center justify-center gap-2 rounded-2xl py-3 px-4 text-xs font-bold text-white shadow-xs bg-gradient-to-r from-purple-600 via-rose-600 to-amber-500 hover:opacity-95 transition disabled:opacity-50 cursor-pointer"
            >
              {sharing ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Share2 className="h-4 w-4" />
              )}
              <span>Compartilhar nos Stories</span>
            </button>

            {/* Botão Baixar Imagem */}
            <button
              type="button"
              onClick={handleDownload}
              disabled={generating || !previewUrl}
              className="flex items-center justify-center gap-2 rounded-2xl py-3 px-4 text-xs font-bold text-[#4A3F5C] border border-gray-200 bg-white hover:bg-gray-50 transition disabled:opacity-50 cursor-pointer shadow-2xs"
            >
              <Download className="h-4 w-4 text-gray-500" />
              <span>Baixar (PNG)</span>
            </button>
          </div>

          <p className="text-[11px] text-gray-400">
            Dica: no Instagram Stories, adicione a figurinha de link com a sua URL da vitrine!
          </p>
        </div>
      </div>
    </div>
  )
}
