import * as THREE from 'three'
import { buildPwaSilkRibbonGeometry } from '@/lib/pwa-silk-geometry'

function createRibbon(phase: number, width: number) {
  const data = buildPwaSilkRibbonGeometry({ phase, width })
  const geometry = new THREE.BufferGeometry()
  geometry.setAttribute('position', new THREE.BufferAttribute(data.positions, 3))
  geometry.setAttribute('uv', new THREE.BufferAttribute(data.uvs, 2))
  geometry.setIndex(new THREE.BufferAttribute(data.indices, 1))
  geometry.computeVertexNormals()
  return geometry
}

function createConstellation() {
  const positions = new Float32Array(36 * 3)
  let seed = 9317
  const random = () => {
    seed = (seed * 16807) % 2147483647
    return (seed - 1) / 2147483646
  }

  for (let index = 0; index < positions.length; index += 3) {
    const angle = random() * Math.PI * 2
    const radius = 2.1 + random() * 1.2
    positions[index] = Math.cos(angle) * radius
    positions[index + 1] = (random() - 0.5) * 3
    positions[index + 2] = Math.sin(angle) * radius * 0.52 - 0.7
  }

  const geometry = new THREE.BufferGeometry()
  geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3))
  const material = new THREE.PointsMaterial({
    color: '#9C85B7',
    size: 0.014,
    transparent: true,
    opacity: 0.3,
    depthWrite: false,
    sizeAttenuation: true,
  })
  return new THREE.Points(geometry, material)
}

/** Mounts and owns the lightweight Three.js scene used only by installed PWA launches. */
export function mountPwaSilkScene(canvas: HTMLCanvasElement): () => void {
  const renderer = new THREE.WebGLRenderer({
    canvas,
    alpha: true,
    antialias: true,
    powerPreference: 'low-power',
  })
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.3))
  renderer.setClearColor(0x000000, 0)
  renderer.outputColorSpace = THREE.SRGBColorSpace
  renderer.toneMapping = THREE.ACESFilmicToneMapping
  renderer.toneMappingExposure = 0.88

  const scene = new THREE.Scene()
  const camera = new THREE.PerspectiveCamera(34, 1, 0.1, 30)
  camera.position.set(0, 0, 7.4)

  const hemisphere = new THREE.HemisphereLight(0xFAF7F5, 0x4A3F5C, 1.35)
  scene.add(hemisphere)

  const keyLight = new THREE.DirectionalLight(0xFFF9FF, 1.8)
  keyLight.position.set(-2.6, 3.2, 4.6)
  scene.add(keyLight)

  const lavenderLight = new THREE.PointLight(0xB8A9D9, 5.5, 10, 2)
  lavenderLight.position.set(2.3, 1.4, 2.2)
  scene.add(lavenderLight)

  const roseLight = new THREE.PointLight(0xD49BA8, 3, 8, 2)
  roseLight.position.set(-2.2, -1.1, 1.6)
  scene.add(roseLight)

  const sculpture = new THREE.Group()
  scene.add(sculpture)

  const primaryRibbon = new THREE.Mesh(
    createRibbon(0.24, 0.38),
    new THREE.MeshPhysicalMaterial({
      color: '#B8A9D9',
      metalness: 0.16,
      roughness: 0.2,
      clearcoat: 1,
      clearcoatRoughness: 0.14,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.48,
      depthWrite: false,
    })
  )
  primaryRibbon.rotation.set(0.12, -0.18, 0.08)
  sculpture.add(primaryRibbon)

  const veilRibbon = new THREE.Mesh(
    createRibbon(2.12, 0.21),
    new THREE.MeshPhysicalMaterial({
      color: '#F0DDE7',
      metalness: 0.1,
      roughness: 0.25,
      clearcoat: 0.92,
      clearcoatRoughness: 0.18,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.28,
      depthWrite: false,
    })
  )
  veilRibbon.scale.set(0.84, 1.06, 0.86)
  veilRibbon.rotation.set(-0.18, 0.22, -0.12)
  sculpture.add(veilRibbon)

  const heart = new THREE.Mesh(
    new THREE.SphereGeometry(0.115, 28, 20),
    new THREE.MeshBasicMaterial({ color: 0xFFF9FF, transparent: true, opacity: 0.52 })
  )
  heart.position.set(0, 0, 0.24)
  sculpture.add(heart)

  const constellation = createConstellation()
  scene.add(constellation)

  let isPortrait = false
  const resize = () => {
    const { width, height } = canvas.getBoundingClientRect()
    if (!width || !height) return
    camera.aspect = width / height
    isPortrait = camera.aspect < 0.82
    camera.position.z = isPortrait ? 8.1 : 7.4
    camera.updateProjectionMatrix()
    renderer.setSize(Math.round(width), Math.round(height), false)
    sculpture.scale.setScalar(isPortrait ? 0.68 : camera.aspect < 1 ? 0.82 : 0.96)
  }

  resize()
  const observer = typeof ResizeObserver === 'undefined' ? undefined : new ResizeObserver(resize)
  observer?.observe(canvas)

  let stopped = false
  let requestId = 0
  let firstFrame: number | undefined
  const render = (now: number) => {
    if (stopped) return
    firstFrame ??= now
    const elapsed = (now - firstFrame) / 1000
    const entrance = Math.min(1, elapsed / 2.2)
    const easedEntrance = 1 - (1 - entrance) ** 3

    const viewportScale = isPortrait ? 0.68 : camera.aspect < 1 ? 0.82 : 0.96
    sculpture.scale.setScalar(viewportScale * (0.72 + easedEntrance * 0.28))
    sculpture.position.y = isPortrait ? -0.26 : 0
    sculpture.rotation.y = Math.sin(elapsed * 0.16) * 0.09
    sculpture.rotation.x = Math.sin(elapsed * 0.12) * 0.04
    sculpture.rotation.z = (isPortrait ? -Math.PI / 2 : 0) + Math.cos(elapsed * 0.1) * 0.025
    primaryRibbon.rotation.y = -0.18 + Math.sin(elapsed * 0.15) * 0.045
    veilRibbon.rotation.x = -0.18 + Math.cos(elapsed * 0.13) * 0.04
    constellation.rotation.y = -elapsed * 0.012
    camera.position.x = Math.sin(elapsed * 0.09) * 0.045
    camera.position.y = (isPortrait ? -0.18 : 0) + Math.cos(elapsed * 0.08) * 0.03
    camera.lookAt(0, 0, 0)
    lavenderLight.position.x = 2.3 + Math.sin(elapsed * 0.14) * 0.18

    renderer.render(scene, camera)
    requestId = window.requestAnimationFrame(render)
  }

  requestId = window.requestAnimationFrame(render)

  return () => {
    if (stopped) return
    stopped = true
    window.cancelAnimationFrame(requestId)
    observer?.disconnect()
    primaryRibbon.geometry.dispose()
    veilRibbon.geometry.dispose()
    heart.geometry.dispose()
    constellation.geometry.dispose()
    scene.traverse((object) => {
      const mesh = object as THREE.Mesh
      if (mesh.material) {
        const materials = Array.isArray(mesh.material) ? mesh.material : [mesh.material]
        materials.forEach((material) => material.dispose())
      }
    })
    renderer.dispose()
  }
}
