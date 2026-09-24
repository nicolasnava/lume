'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import type { PointerEvent as ReactPointerEvent } from 'react'
import { Crop, FlipHorizontal2, Loader2, RotateCw, X } from 'lucide-react'
import {
  createInitialCropRect,
  moveCropRect,
  resizeCropRect,
  type CropHandle,
  type CropImageSize,
  type CropRect,
} from '@/lib/crop-selection'

interface ImageCropperModalProps {
  file: File | null
  aspectRatio?: number
  outputWidth?: number
  title?: string
  onCancel: () => void
  onConfirm: (file: File) => void | Promise<void>
}

const CROP_HANDLES: { id: CropHandle; className: string }[] = [
  { id: 'top-left', className: '-left-2 -top-2 cursor-nwse-resize' },
  { id: 'top-right', className: '-right-2 -top-2 cursor-nesw-resize' },
  { id: 'bottom-left', className: '-bottom-2 -left-2 cursor-nesw-resize' },
  { id: 'bottom-right', className: '-bottom-2 -right-2 cursor-nwse-resize' },
]

export default function ImageCropperModal({
  file,
  aspectRatio = 1,
  outputWidth = 1200,
  title = 'Ajustar imagem',
  onCancel,
  onConfirm,
}: ImageCropperModalProps) {
  const imageRef = useRef<HTMLImageElement>(null)
  const dragRef = useRef<{ x: number; y: number; crop: CropRect; handle: CropHandle | null } | null>(null)
  const [imageSize, setImageSize] = useState<CropImageSize | null>(null)
  const [crop, setCrop] = useState<CropRect | null>(null)
  const [rotation, setRotation] = useState(0)
  const [flipped, setFlipped] = useState(false)
  const [processing, setProcessing] = useState(false)
  const objectUrl = useMemo(() => (file ? URL.createObjectURL(file) : ''), [file])

  useEffect(() => () => {
    if (objectUrl) URL.revokeObjectURL(objectUrl)
  }, [objectUrl])

  useEffect(() => {
    setImageSize(null)
    setCrop(null)
    setRotation(0)
    setFlipped(false)
  }, [file])

  if (!file) return null

  const quarterTurn = rotation % 180 !== 0
  const orientedSize = imageSize
    ? quarterTurn
      ? { width: imageSize.height, height: imageSize.width }
      : imageSize
    : null
  const orientedRatio = orientedSize ? orientedSize.width / orientedSize.height : aspectRatio

  const handleImageLoad = (image: HTMLImageElement) => {
    const dimensions = { width: image.naturalWidth, height: image.naturalHeight }
    setImageSize(dimensions)
    const oriented = rotation % 180 !== 0
      ? { width: dimensions.height, height: dimensions.width }
      : dimensions
    setCrop(createInitialCropRect(oriented, aspectRatio))
  }

  const moveCrop = (event: ReactPointerEvent<HTMLDivElement>) => {
    const drag = dragRef.current
    const size = orientedSize
    if (!drag || !size) return
    event.preventDefault()
    const bounds = event.currentTarget.getBoundingClientRect()
    const deltaX = event.clientX - drag.x
    const deltaY = event.clientY - drag.y
    if (drag.handle) {
      setCrop(resizeCropRect(
        drag.crop,
        (deltaX / bounds.width) * size.width,
        (deltaY / bounds.height) * size.height,
        size,
        aspectRatio,
        drag.handle,
      ))
      return
    }
    setCrop(moveCropRect(drag.crop, (deltaX / bounds.width) * 100, (deltaY / bounds.height) * 100))
  }

  const startCropInteraction = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (!crop) return
    if (!(event.target as HTMLElement).closest('[data-crop-frame]')) return
    const handle = (event.target as HTMLElement).closest<HTMLElement>('[data-crop-handle]')?.dataset.cropHandle as CropHandle | undefined
    dragRef.current = { x: event.clientX, y: event.clientY, crop, handle: handle || null }
    event.currentTarget.setPointerCapture(event.pointerId)
  }

  const handleRotate = () => {
    const nextRotation = (rotation + 90) % 360
    setRotation(nextRotation)
    if (imageSize) {
      const oriented = nextRotation % 180 !== 0
        ? { width: imageSize.height, height: imageSize.width }
        : imageSize
      setCrop(createInitialCropRect(oriented, aspectRatio))
    }
  }

  const createCroppedFile = async () => {
    const image = imageRef.current
    const selection = crop
    const size = orientedSize
    if (!image || !selection || !size) return
    setProcessing(true)
    try {
      const outputHeight = Math.round(outputWidth / aspectRatio)
      const canvas = document.createElement('canvas')
      canvas.width = outputWidth
      canvas.height = outputHeight
      const context = canvas.getContext('2d')
      if (!context) throw new Error('Não foi possível preparar a imagem.')

      const orientationCanvas = document.createElement('canvas')
      orientationCanvas.width = size.width
      orientationCanvas.height = size.height
      const orientationContext = orientationCanvas.getContext('2d')
      if (!orientationContext) throw new Error('Não foi possível preparar a imagem.')
      orientationContext.save()
      if (rotation === 90) {
        orientationContext.translate(size.width, 0)
        orientationContext.rotate(Math.PI / 2)
      } else if (rotation === 180) {
        orientationContext.translate(size.width, size.height)
        orientationContext.rotate(Math.PI)
      } else if (rotation === 270) {
        orientationContext.translate(0, size.height)
        orientationContext.rotate(-Math.PI / 2)
      }
      if (flipped) {
        orientationContext.translate(size.width, 0)
        orientationContext.scale(-1, 1)
      }
      orientationContext.drawImage(image, 0, 0)
      orientationContext.restore()

      const sourceX = (selection.x / 100) * size.width
      const sourceY = (selection.y / 100) * size.height
      const sourceWidth = (selection.width / 100) * size.width
      const sourceHeight = (selection.height / 100) * size.height
      context.drawImage(orientationCanvas, sourceX, sourceY, sourceWidth, sourceHeight, 0, 0, outputWidth, outputHeight)

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
            <div><h3 className="text-sm font-extrabold text-[#4A3F5C]">{title}</h3><p className="text-[11px] text-gray-500">Mova e ajuste o quadro para escolher o enquadramento.</p></div>
          </div>
          <button type="button" onClick={onCancel} aria-label="Fechar" className="rounded-full p-2 text-gray-400 transition-[transform,color,background-color] duration-150 ease-out hover:bg-gray-100 hover:text-[#4A3F5C] active:scale-[0.97]"><X className="h-5 w-5" /></button>
        </div>

        <div className="mt-5 flex min-h-40 items-center justify-center overflow-hidden rounded-2xl bg-[#241C2E]/5 p-2">
          <div
            className="relative max-h-[55vh] max-w-full touch-none select-none"
            style={{ width: `min(100%, ${55 * orientedRatio}vh)`, aspectRatio: orientedRatio }}
            onPointerDown={startCropInteraction}
            onPointerMove={moveCrop}
            onPointerUp={() => { dragRef.current = null }}
            onPointerCancel={() => { dragRef.current = null }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              ref={imageRef}
              src={objectUrl}
              alt="Prévia para recorte"
              onLoad={(event) => handleImageLoad(event.currentTarget)}
              className="pointer-events-none absolute left-1/2 top-1/2 select-none"
              style={{
                width: quarterTurn ? `${100 / orientedRatio}%` : '100%',
                height: quarterTurn ? `${orientedRatio * 100}%` : '100%',
                transform: `translate(-50%, -50%) rotate(${rotation}deg) scaleX(${flipped ? -1 : 1})`,
              }}
              draggable={false}
            />
            {crop && (
              <div
                role="group"
                data-crop-frame
                aria-label="Área selecionada para recorte"
                className="absolute cursor-move border-2 border-white shadow-[0_0_0_9999px_rgba(36,28,46,0.58)]"
                style={{ left: `${crop.x}%`, top: `${crop.y}%`, width: `${crop.width}%`, height: `${crop.height}%` }}
              >
                <span className="pointer-events-none absolute inset-0 border border-white/40" />
                {CROP_HANDLES.map((handle) => (
                  <span
                    key={handle.id}
                    data-crop-handle={handle.id}
                    aria-hidden="true"
                    className={`absolute z-10 h-4 w-4 rounded-full border-2 border-[#4A3F5C] bg-white shadow-sm ${handle.className}`}
                  />
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="mt-5 flex items-center justify-between gap-3 border-t border-gray-100 pt-4">
          <div className="flex items-center gap-1.5">
            <button type="button" onClick={handleRotate} disabled={processing || !imageSize} aria-label="Girar foto 90 graus" title="Girar 90°" className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-gray-200 text-[#4A3F5C] transition-[transform,background-color] duration-150 ease-out hover:bg-[#FAF7F5] active:scale-[0.97] disabled:opacity-50"><RotateCw className="h-4 w-4" /></button>
            <button type="button" onClick={() => setFlipped((current) => !current)} disabled={processing || !imageSize} aria-label="Inverter foto" title="Inverter" className={`inline-flex h-10 w-10 items-center justify-center rounded-xl border transition-[transform,background-color] duration-150 ease-out active:scale-[0.97] disabled:opacity-50 ${flipped ? 'border-[#B8A9D9] bg-[#B8A9D9]/15 text-[#4A3F5C]' : 'border-gray-200 text-[#4A3F5C] hover:bg-[#FAF7F5]'}`}><FlipHorizontal2 className="h-4 w-4" /></button>
          </div>
          <div className="flex justify-end gap-2">
            <button type="button" onClick={onCancel} disabled={processing} className="rounded-xl border border-gray-200 px-4 py-2.5 text-xs font-bold text-gray-600 transition-transform duration-150 ease-out active:scale-[0.97] disabled:opacity-50">Cancelar</button>
            <button type="button" onClick={createCroppedFile} disabled={processing || !crop} className="inline-flex items-center gap-2 rounded-xl bg-[#4A3F5C] px-5 py-2.5 text-xs font-bold text-white transition-[transform,background-color] duration-150 ease-out hover:bg-[#393047] active:scale-[0.97] disabled:opacity-50">
              {processing && <Loader2 className="h-4 w-4 animate-spin" />} Usar imagem
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
