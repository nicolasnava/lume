import assert from 'node:assert/strict'
import { createInitialCropRect, moveCropRect, resizeCropRect } from '../src/lib/crop-selection.ts'

const image = { width: 1600, height: 900 }
const initial = createInitialCropRect(image, 3)
assert.ok(initial.width > 0 && initial.height > 0)
assert.ok(Math.abs((initial.width * image.width) / (initial.height * image.height) - 3) < 0.001)
assert.ok(initial.x > 0 && initial.y > 0)

const moved = moveCropRect(initial, 80, -80)
assert.ok(moved.x >= 0 && moved.y >= 0)
assert.ok(moved.x + moved.width <= 100 && moved.y + moved.height <= 100)
assert.equal(moveCropRect(initial, 1000, 1000).x + initial.width, 100)

const resized = resizeCropRect(initial, 120, 60, image, 3, 'bottom-right')
assert.ok(resized.width > initial.width)
assert.ok(Math.abs((resized.width * image.width) / (resized.height * image.height) - 3) < 0.001)
assert.ok(resized.x + resized.width <= 100 && resized.y + resized.height <= 100)

for (const [handle, dx, dy] of [
  ['top-left', -40, -20],
  ['top-right', 40, -20],
  ['bottom-left', -40, 20],
  ['bottom-right', 40, 20],
]) {
  const next = resizeCropRect(initial, dx, dy, image, 3, handle)
  assert.ok(Math.abs((next.width * image.width) / (next.height * image.height) - 3) < 0.001)
  assert.ok(next.x >= 0 && next.y >= 0 && next.x + next.width <= 100 && next.y + next.height <= 100)
}
console.log('Crop selection geometry checks passed.')
