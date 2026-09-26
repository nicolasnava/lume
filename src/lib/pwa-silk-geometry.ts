export type PwaSilkRibbonGeometry = {
  positions: Float32Array
  uvs: Float32Array
  indices: Uint32Array
}

export function buildPwaSilkRibbonGeometry(options: {
  longitudinalSegments?: number
  crossSegments?: number
  phase?: number
  width?: number
  orbitX?: number
  orbitZ?: number
} = {}): PwaSilkRibbonGeometry {
  const longitudinalSegments = Math.max(8, Math.floor(options.longitudinalSegments ?? 288))
  const crossSegments = Math.max(2, Math.floor(options.crossSegments ?? 18))
  const phase = options.phase ?? 0
  const width = options.width ?? 0.34
  const orbitX = options.orbitX ?? 1.54
  const orbitZ = options.orbitZ ?? 0.86
  const vertexCount = (longitudinalSegments + 1) * (crossSegments + 1)
  const positions = new Float32Array(vertexCount * 3)
  const uvs = new Float32Array(vertexCount * 2)
  const indices = new Uint32Array(longitudinalSegments * crossSegments * 6)

  let vertex = 0
  for (let longitudinal = 0; longitudinal <= longitudinalSegments; longitudinal += 1) {
    const u = longitudinal / longitudinalSegments
    const angle = u * Math.PI * 2
    const x = orbitX * Math.sin(angle)
    const y = 0.3 * Math.sin(angle * 2 + phase)
    const z = orbitZ * Math.cos(angle) + 0.16 * Math.sin(angle * 3 + phase)

    let tangentX = orbitX * Math.cos(angle)
    let tangentY = 0.6 * Math.cos(angle * 2 + phase)
    let tangentZ = -orbitZ * Math.sin(angle) + 0.48 * Math.cos(angle * 3 + phase)
    const tangentLength = Math.hypot(tangentX, tangentY, tangentZ) || 1
    tangentX /= tangentLength
    tangentY /= tangentLength
    tangentZ /= tangentLength

    let sideX = -tangentZ
    let sideZ = tangentX
    const sideLength = Math.hypot(sideX, sideZ) || 1
    sideX /= sideLength
    sideZ /= sideLength

    let normalX = tangentY * sideZ
    let normalY = tangentZ * sideX - tangentX * sideZ
    let normalZ = -tangentY * sideX
    const normalLength = Math.hypot(normalX, normalY, normalZ) || 1
    normalX /= normalLength
    normalY /= normalLength
    normalZ /= normalLength

    const twist = 0.48 * Math.sin(angle * 2 + phase)
    const cosTwist = Math.cos(twist)
    const sinTwist = Math.sin(twist)
    const acrossX = sideX * cosTwist + normalX * sinTwist
    const acrossY = normalY * sinTwist
    const acrossZ = sideZ * cosTwist + normalZ * sinTwist
    const waveX = normalX * cosTwist - sideX * sinTwist
    const waveY = normalY * cosTwist
    const waveZ = normalZ * cosTwist - sideZ * sinTwist
    const widthAtAngle = width * (0.88 + 0.12 * Math.cos(angle * 3 + phase))

    for (let cross = 0; cross <= crossSegments; cross += 1) {
      const v = cross / crossSegments
      const across = (v - 0.5) * widthAtAngle
      const fold = Math.sin(v * Math.PI * 8 + angle * 3 + phase) * 0.018
      const positionIndex = vertex * 3
      positions[positionIndex] = x + acrossX * across + waveX * fold
      positions[positionIndex + 1] = y + acrossY * across + waveY * fold
      positions[positionIndex + 2] = z + acrossZ * across + waveZ * fold

      const uvIndex = vertex * 2
      uvs[uvIndex] = u
      uvs[uvIndex + 1] = v
      vertex += 1
    }
  }

  let index = 0
  for (let longitudinal = 0; longitudinal < longitudinalSegments; longitudinal += 1) {
    for (let cross = 0; cross < crossSegments; cross += 1) {
      const first = longitudinal * (crossSegments + 1) + cross
      const nextRow = first + crossSegments + 1
      indices[index++] = first
      indices[index++] = nextRow
      indices[index++] = first + 1
      indices[index++] = first + 1
      indices[index++] = nextRow
      indices[index++] = nextRow + 1
    }
  }

  return { positions, uvs, indices }
}
