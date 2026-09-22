'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { Crop, Loader2, X } from 'lucide-react'

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
  const [processing, setProcessing] = useState(false)
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

      const sourceRatio = image.naturalWidth / image.naturalHeight
      let cropWidth = image.naturalWidth
      let cropHeight = image.naturalHeight
      if (sourceRatio > aspectRatio) cropWidth = cropHeight * aspectRatio
      else cropHeight = cropWidth / aspectRatio

      cropWidth /= zoom
      cropHeight /= zoom
      const maxX = image.naturalWidth - cropWidth
      const maxY = image.naturalHeight - cropHeight
      const sourceX = maxX * (positionX / 100)
      const sourceY = maxY * (positionY / 100)
      context.drawImage(image, sourceX, sourceY, cropWidth, cropHeight, 0, 0, outputWidth, outputHeight)

      const blob = await new Promise<Blob>((resolve, reject) => {
        canvas.toBlob((result) => result ? resolve(result) : reject(new Error('Falha ao converter a imagem.')), 'image/webp', 0.88)
      })
      const baseName = file.name.replace(/\.[^.]+$/, '') || 'imagem'
      await onConfirm(new File([blob], `${baseName}.webp`, { type: 'image/webp' }))
    } finally {
      setProcessing(false)
    }
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

        <div className="mt-5 overflow-hidden rounded-2xl bg-[#241C2E]" style={{ aspectRatio }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img ref={imageRef} src={objectUrl} alt="Prévia para recorte" className="h-full w-full select-none object-cover transition-transform duration-200 ease-out" style={{ objectPosition: `${positionX}% ${positionY}%`, transform: `scale(${zoom})` }} />
        </div>

        <div className="mt-5 grid gap-3 sm:grid-cols-3">
          {[['Zoom', zoom, 1, 2, 0.01, setZoom], ['Horizontal', positionX, 0, 100, 1, setPositionX], ['Vertical', positionY, 0, 100, 1, setPositionY]].map(([label, value, min, max, step, setter]) => (
            <label key={String(label)} className="space-y-1.5 text-[11px] font-bold text-[#4A3F5C]">
              <span>{String(label)}</span>
              <input type="range" min={Number(min)} max={Number(max)} step={Number(step)} value={Number(value)} onChange={(event) => (setter as (value: number) => void)(Number(event.target.value))} className="w-full accent-[#4A3F5C]" />
            </label>
          ))}
        </div>

        <div className="mt-6 flex justify-end gap-2 border-t border-gray-100 pt-4">
          <button type="button" onClick={onCancel} disabled={processing} className="rounded-xl border border-gray-200 px-4 py-2.5 text-xs font-bold text-gray-600 transition-transform duration-150 ease-out active:scale-[0.97] disabled:opacity-50">Cancelar</button>
          <button type="button" onClick={createCroppedFile} disabled={processing} className="inline-flex items-center gap-2 rounded-xl bg-[#4A3F5C] px-5 py-2.5 text-xs font-bold text-white transition-[transform,background-color] duration-150 ease-out hover:bg-[#393047] active:scale-[0.97] disabled:opacity-50">
            {processing && <Loader2 className="h-4 w-4 animate-spin" />} Usar imagem
          </button>
        </div>
      </div>
    </div>
  )
}
