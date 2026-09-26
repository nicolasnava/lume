import assert from 'node:assert/strict'
import { buildPwaSilkRibbonGeometry } from '../src/lib/pwa-silk-geometry.ts'

const longitudinalSegments = 12
const crossSegments = 5
const geometry = buildPwaSilkRibbonGeometry({ longitudinalSegments, crossSegments })
const vertexCount = (longitudinalSegments + 1) * (crossSegments + 1)

assert.equal(geometry.positions.length, vertexCount * 3)
assert.equal(geometry.uvs.length, vertexCount * 2)
assert.equal(geometry.indices.length, longitudinalSegments * crossSegments * 6)
assert.ok(geometry.positions.every(Number.isFinite), 'the ribbon must not contain invalid vertices')
assert.ok(geometry.uvs.every(Number.isFinite), 'the ribbon UV map must be finite')
assert.ok(geometry.indices.every((index) => index >= 0 && index < vertexCount))

const firstVertex = geometry.positions.slice(0, 3)
const seamVertex = geometry.positions.slice(longitudinalSegments * (crossSegments + 1) * 3, longitudinalSegments * (crossSegments + 1) * 3 + 3)
firstVertex.forEach((coordinate, index) => {
  assert.ok(Math.abs(coordinate - seamVertex[index]) < 1e-5, 'the ribbon loop must close without a visible seam')
})

console.log('PWA silk ribbon geometry checks passed.')
