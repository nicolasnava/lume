'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import type { PointerEvent as ReactPointerEvent } from 'react'
import { Crop, FlipHorizontal2, Loader2, RotateCw, X } from 'lucide-react'

interface ImageCropperModalProps {
  file: File | null
  aspectRatio?: number
  outputWidth?: number
  title?: string
  onCancel: () => void
  onConfirm: (file: File) => void | Promise<void>
}

export default function ImageCropperModal({
  file,
  aspectRatio = 1,
  outputWidth = 1200,
  title = 'Ajustar imagem',
  onCancel,
  onConfirm,
}: ImageCropperModalProps) {
  const imageRef = useRef<HTMLImageElement>(null)
  const [zoom, setZoom] = useState(1)
  const [positionX, setPositionX] = useState(50)
  const [positionY, setPositionY] = useState(50)
  const [rotation, setRotation] = useState(0)
  const [flipped, setFlipped] = useState(false)
  const [processing, setProcessing] = useState(false)
  const dragPosition = useRef<{ x: number; y: number } | null>(null)
  const objectUrl = useMemo(() => (file ? URL.createObjectURL(file) : ''), [file])

  useEffect(() => () => {
    if (objectUrl) URL.revokeObjectURL(objectUrl)
  }, [objectUrl])

  if (!file) return null

  const createCroppedFile = async () => {
    const image = imageRef.current
    if (!image) return
    setProcessing(true)
    try {
      const outputHeight = Math.round(outputWidth / aspectRatio)
      const canvas = document.createElement('canvas')
      canvas.width = outputWidth
      canvas.height = outputHeight
      const context = canvas.getContext('2d')
      if (!context) throw new Error('Não foi possível preparar a imagem.')

      const orientationCanvas = document.createElement('canvas')
      const quarterTurn = rotation % 180 !== 0
      const orientedWidth = quarterTurn ? image.naturalHeight : image.naturalWidth
      const orientedHeight = quarterTurn ? image.naturalWidth : image.naturalHeight
      orientationCanvas.width = orientedWidth
      orientationCanvas.height = orientedHeight
      const orientationContext = orientationCanvas.getContext('2d')
      if (!orientationContext) throw new Error('Não foi possível preparar a imagem.')
      orientationContext.save()
      if (rotation === 90) {
        orientationContext.translate(orientedWidth, 0)
        orientationContext.rotate(Math.PI / 2)
      } else if (rotation === 180) {
        orientationContext.translate(orientedWidth, orientedHeight)
        orientationContext.rotate(Math.PI)
      } else if (rotation === 270) {
        orientationContext.translate(0, orientedHeight)
        orientationContext.rotate(-Math.PI / 2)
      }
      if (flipped) {
        orientationContext.translate(orientedWidth, 0)
        orientationContext.scale(-1, 1)
      }
      orientationContext.drawImage(image, 0, 0)
      orientationContext.restore()

      const sourceRatio = orientedWidth / orientedHeight
      let cropWidth = orientedWidth
      let cropHeight = orientedHeight
      if (sourceRatio > aspectRatio) cropWidth = cropHeight * aspectRatio
      else cropHeight = cropWidth / aspectRatio

      cropWidth /= zoom
      cropHeight /= zoom
      const maxX = orientedWidth - cropWidth
      const maxY = orientedHeight - cropHeight
      const sourceX = maxX * (positionX / 100)
      const sourceY = maxY * (positionY / 100)
      context.drawImage(orientationCanvas, sourceX, sourceY, cropWidth, cropHeight, 0, 0, outputWidth, outputHeight)

      const blob = await new Promise<Blob>((resolve, reject) => {
        canvas.toBlob((result) => result ? resolve(result) : reject(new Error('Falha ao converter a imagem.')), 'image/webp', 0.88)
      })
      const baseName = file.name.replace(/\.[^.]+$/, '') || 'imagem'
      await onConfirm(new File([blob], `${baseName}.webp`, { type: 'image/webp' }))
    } finally {
      setProcessing(false)
    }
  }

  const moveCrop = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (!dragPosition.current) return
    const bounds = event.currentTarget.getBoundingClientRect()
    const deltaX = event.clientX - dragPosition.current.x
    const deltaY = event.clientY - dragPosition.current.y
    dragPosition.current = { x: event.clientX, y: event.clientY }
    setPositionX((current) => Math.max(0, Math.min(100, current - (deltaX / bounds.width) * 100)))
    setPositionY((current) => Math.max(0, Math.min(100, current - (deltaY / bounds.height) * 100)))
  }

  return (
    <div className="fixed inset-0 z-[90] flex items-center justify-center bg-[#241C2E]/55 p-4 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="w-full max-w-xl origin-center rounded-3xl border border-white/70 bg-white p-5 shadow-2xl animate-in zoom-in-95 fade-in duration-200 sm:p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[#B8A9D9]/20 text-[#4A3F5C]"><Crop className="h-5 w-5" /></div>
            <div><h3 className="text-sm font-extrabold text-[#4A3F5C]">{title}</h3><p className="text-[11px] text-gray-500">Reposicione e ajuste antes de enviar em WebP.</p></div>
          </div>
          <button type="button" onClick={onCancel} className="rounded-full p-2 text-gray-400 transition-[transform,color,background-color] duration-150 ease-out hover:bg-gray-100 hover:text-[#4A3F5C] active:scale-[0.97]"><X className="h-5 w-5" /></button>
        </div>

        <div
          className="mt-5 touch-none cursor-grab overflow-hidden rounded-2xl bg-[#241C2E] active:cursor-grabbing"
          style={{ aspectRatio }}
          onPointerDown={(event) => {
            dragPosition.current = { x: event.clientX, y: event.clientY }
            event.currentTarget.setPointerCapture(event.pointerId)
          }}
          onPointerMove={moveCrop}
          onPointerUp={() => { dragPosition.current = null }}
          onPointerCancel={() => { dragPosition.current = null }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img ref={imageRef} src={objectUrl} alt="Prévia para recorte" className="pointer-events-none h-full w-full select-none object-cover transition-transform duration-200 ease-out" style={{ objectPosition: `${positionX}% ${positionY}%`, transform: `rotate(${rotation}deg) scale(${zoom}) scaleX(${flipped ? -1 : 1})` }} />
        </div>

        <div className="mt-4">
          <label className="flex items-center gap-3 text-[11px] font-bold text-[#4A3F5C]">
            <span className="shrink-0">Aproximar</span>
            <input type="range" min={1} max={2} step={0.01} value={zoom} onChange={(event) => setZoom(Number(event.target.value))} className="w-full accent-[#4A3F5C]" />
          </label>
          <p className="mt-1 text-[10px] text-gray-500">Arraste a foto para ajustar o enquadramento.</p>
        </div>

        <div className="mt-5 flex items-center justify-between gap-3 border-t border-gray-100 pt-4">
          <div className="flex items-center gap-1.5">
            <button type="button" onClick={() => setRotation((current) => (current + 90) % 360)} disabled={processing} aria-label="Girar foto 90 graus" title="Girar 90°" className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-gray-200 text-[#4A3F5C] transition-[transform,background-color] duration-150 ease-out hover:bg-[#FAF7F5] active:scale-[0.97] disabled:opacity-50"><RotateCw className="h-4 w-4" /></button>
            <button type="button" onClick={() => setFlipped((current) => !current)} disabled={processing} aria-label="Inverter foto" title="Inverter" className={`inline-flex h-10 w-10 items-center justify-center rounded-xl border transition-[transform,background-color] duration-150 ease-out active:scale-[0.97] disabled:opacity-50 ${flipped ? 'border-[#B8A9D9] bg-[#B8A9D9]/15 text-[#4A3F5C]' : 'border-gray-200 text-[#4A3F5C] hover:bg-[#FAF7F5]'}`}><FlipHorizontal2 className="h-4 w-4" /></button>
          </div>
          <div className="flex justify-end gap-2">
            <button type="button" onClick={onCancel} disabled={processing} className="rounded-xl border border-gray-200 px-4 py-2.5 text-xs font-bold text-gray-600 transition-transform duration-150 ease-out active:scale-[0.97] disabled:opacity-50">Cancelar</button>
            <button type="button" onClick={createCroppedFile} disabled={processing} className="inline-flex items-center gap-2 rounded-xl bg-[#4A3F5C] px-5 py-2.5 text-xs font-bold text-white transition-[transform,background-color] duration-150 ease-out hover:bg-[#393047] active:scale-[0.97] disabled:opacity-50">
              {processing && <Loader2 className="h-4 w-4 animate-spin" />} Usar imagem
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
