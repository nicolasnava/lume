export interface CropRect {
  x: number
  y: number
  width: number
  height: number
}

export interface CropImageSize {
  width: number
  height: number
}

export type CropHandle = 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right'

export function createInitialCropRect(image: CropImageSize, aspectRatio: number): CropRect {
  const maxWidth = Math.min(image.width, image.height * aspectRatio)
  const maxHeight = maxWidth / aspectRatio
  const width = maxWidth * 0.92
  const height = maxHeight * 0.92

  return {
    x: ((image.width - width) / 2 / image.width) * 100,
    y: ((image.height - height) / 2 / image.height) * 100,
    width: (width / image.width) * 100,
    height: (height / image.height) * 100,
  }
}

export function moveCropRect(rect: CropRect, deltaXPercent: number, deltaYPercent: number): CropRect {
  return {
    ...rect,
    x: Math.max(0, Math.min(100 - rect.width, rect.x + deltaXPercent)),
    y: Math.max(0, Math.min(100 - rect.height, rect.y + deltaYPercent)),
  }
}

export function resizeCropRect(
  rect: CropRect,
  deltaX: number,
  deltaY: number,
  image: CropImageSize,
  aspectRatio: number,
  handle: CropHandle,
): CropRect {
  const x = (rect.x / 100) * image.width
  const y = (rect.y / 100) * image.height
  const width = (rect.width / 100) * image.width
  const height = (rect.height / 100) * image.height
  const isLeft = handle.endsWith('left')
  const isTop = handle.startsWith('top')
  const horizontalWidth = width + (isLeft ? -deltaX : deltaX)
  const verticalWidth = width + (isTop ? -deltaY : deltaY) * aspectRatio
  const requestedWidth = Math.abs(horizontalWidth - width) >= Math.abs(verticalWidth - width)
    ? horizontalWidth
    : verticalWidth
  const anchorX = isLeft ? x + width : x
  const anchorY = isTop ? y + height : y
  const maxWidth = Math.min(
    isLeft ? anchorX : image.width - anchorX,
    (isTop ? anchorY : image.height - anchorY) * aspectRatio,
  )
  const minWidth = Math.min(maxWidth, Math.max(32, Math.min(image.width, image.height * aspectRatio) * 0.08))
  const nextWidth = Math.max(minWidth, Math.min(maxWidth, requestedWidth))
  const nextHeight = nextWidth / aspectRatio
  const nextX = isLeft ? anchorX - nextWidth : anchorX
  const nextY = isTop ? anchorY - nextHeight : anchorY

  return {
    x: (nextX / image.width) * 100,
    y: (nextY / image.height) * 100,
    width: (nextWidth / image.width) * 100,
    height: (nextHeight / image.height) * 100,
  }
}
