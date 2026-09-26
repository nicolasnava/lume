'use client'

import { useLayoutEffect, useRef } from 'react'
import Image from 'next/image'
import { isStandalonePwa } from '@/lib/pwa-launch'
import { getPwaLaunchExperienceMode } from '@/lib/pwa-launch-experience'

export default function PwaLaunchTransition() {
  const overlayRef = useRef<HTMLDivElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const skipActionRef = useRef<() => void>(() => {})

  useLayoutEffect(() => {
    const overlay = overlayRef.current
    const canvas = canvasRef.current
    if (!overlay || !canvas) return

    const safariStandalone = Boolean((navigator as Navigator & { standalone?: boolean }).standalone)
    const standalone = isStandalonePwa(
      window.matchMedia('(display-mode: standalone)').matches,
      safariStandalone
    )
    const mode = getPwaLaunchExperienceMode({
      standalone,
      prefersReducedMotion: window.matchMedia('(prefers-reduced-motion: reduce)').matches,
      webglAvailable: typeof window.WebGL2RenderingContext !== 'undefined',
    })

    if (mode === 'skip') {
      document.documentElement.removeAttribute('data-lume-pwa-launch')
      return
    }

    const documentRoot = document.documentElement
    documentRoot.dataset.lumePwaLaunch = 'true'
    documentRoot.dataset.lumePwaLaunchMode = mode

    const inertBackground = Array.from(document.body.children).filter(
      (node): node is HTMLElement => node instanceof HTMLElement && node !== overlay
    )
    const previousInertState = inertBackground.map((node) => [node, node.inert] as const)
    inertBackground.forEach((node) => {
      node.inert = true
    })

    const restoreBackground = () => {
      previousInertState.forEach(([node, wasInert]) => {
        node.inert = wasInert
      })
    }

    let released = false
    let closing = false
    let cancelled = false
    let stopScene = () => {}
    let stopAnime = () => {}
    let killTimeline = () => {}
    let revertGsapContext = () => {}
    let closeTimeout: number | undefined

    const release = () => {
      if (released) return
      released = true
      clearTimeout(failsafe)
      stopAnime()
      stopScene()
      restoreBackground()
      documentRoot.removeAttribute('data-lume-pwa-launch')
      documentRoot.removeAttribute('data-lume-pwa-launch-mode')
    }

    const dismiss = () => {
      if (released || closing) return
      closing = true
      killTimeline()
      stopAnime()
      stopScene()
      overlay.classList.add('lume-launch-closing')
      closeTimeout = window.setTimeout(release, 380)
    }

    skipActionRef.current = dismiss
    const failsafe = window.setTimeout(dismiss, 9000)

    const runReveal = async () => {
      try {
        const [gsapModule, animeModule] = await Promise.all([import('gsap'), import('animejs')])
        if (cancelled || released || closing) return

        let actualMode = mode
        if (actualMode === 'immersive') {
          try {
            const { mountPwaSilkScene } = await import('./PwaSilkScene')
            if (cancelled || released || closing) return
            stopScene = mountPwaSilkScene(canvas)
          } catch {
            actualMode = 'cinematic-fallback'
            documentRoot.dataset.lumePwaLaunchMode = actualMode
          }
        }

        if (cancelled || released || closing) return

        const { gsap } = gsapModule
        const portrait = window.matchMedia('(orientation: portrait)').matches
        const traces = overlay.querySelectorAll<SVGPathElement>('.lume-launch-trace-path')
        const animeAnimation = animeModule.animate(traces, {
          strokeDashoffset: [1, 0],
          opacity: [0, 0.24],
          duration: 4200,
          delay: animeModule.stagger(260, { from: 'center' }),
          ease: 'inOutSine',
        })
        stopAnime = () => animeAnimation.pause()

        const context = gsap.context(() => {
          const ambient = overlay.querySelector('.lume-launch-ambient')
          const wordmark = overlay.querySelector('.lume-launch-wordmark')
          const eyebrow = overlay.querySelector('.lume-launch-eyebrow')
          const tagline = overlay.querySelector('.lume-launch-tagline')
          const lightSweep = overlay.querySelector('.lume-launch-sweep')
          const skip = overlay.querySelector('.lume-launch-skip')

          gsap.set(overlay, { autoAlpha: 1 })
          gsap.set(ambient, { autoAlpha: 0, scale: 0.86 })
          gsap.set(wordmark, { autoAlpha: 0, y: 24, scale: 0.94, transformOrigin: '50% 50%' })
          gsap.set(eyebrow, { autoAlpha: 0, y: 12 })
          gsap.set(tagline, { autoAlpha: 0, y: 14 })
          gsap.set(lightSweep, { autoAlpha: 0, xPercent: portrait ? 0 : -165, yPercent: portrait ? -175 : 0 })
          gsap.set(skip, { autoAlpha: 0, y: 5 })
          if (actualMode === 'immersive') {
            gsap.set(canvas, { autoAlpha: 0, scale: 1.015, transformOrigin: '50% 50%' })
          }

          const timeline = gsap.timeline({
            defaults: { ease: 'power3.out' },
            onComplete: release,
          })

          timeline
            .to(ambient, { autoAlpha: 1, scale: 1, duration: 1.9, ease: 'power2.out' }, 0)
            .to(eyebrow, { autoAlpha: 1, y: 0, duration: 1.15 }, 0.7)
            .to(wordmark, { autoAlpha: 1, y: 0, scale: 1, duration: 1.75, ease: 'power3.out' }, 0.95)
            .to(tagline, { autoAlpha: 1, y: 0, duration: 1.3 }, 2.0)
            .to(skip, { autoAlpha: 0.74, y: 0, duration: 0.8 }, 2.45)
            .to(lightSweep, {
              autoAlpha: 0.68,
              ...(portrait ? { yPercent: 230 } : { xPercent: 220 }),
              duration: 2.5,
              ease: 'power2.inOut',
            }, 3.35)
            .to(overlay, { autoAlpha: 0, duration: 0.86, ease: 'power2.out' }, 5.94)

          if (actualMode === 'immersive') {
            timeline.to(canvas, { autoAlpha: 0.3, scale: 1, duration: 2.4, ease: 'power2.out' }, 0.28)
          }

          killTimeline = () => timeline.kill()
        }, overlay)

        revertGsapContext = () => context.revert()
      } catch {
        dismiss()
      }
    }

    void runReveal()

    return () => {
      cancelled = true
      clearTimeout(failsafe)
      if (closeTimeout) clearTimeout(closeTimeout)
      killTimeline()
      stopAnime()
      stopScene()
      revertGsapContext()
      restoreBackground()
      skipActionRef.current = () => {}
      documentRoot.removeAttribute('data-lume-pwa-launch')
      documentRoot.removeAttribute('data-lume-pwa-launch-mode')
    }
  }, [])

  return (
    <div
      ref={overlayRef}
      className="lume-launch-screen"
      role="dialog"
      aria-modal="true"
      aria-label="Abertura do Lumê"
    >
      <div className="lume-launch-ambient" />
      <canvas ref={canvasRef} className="lume-launch-canvas" />

      <svg className="lume-launch-traces" viewBox="0 0 720 620" aria-hidden="true">
        <path className="lume-launch-trace-path" pathLength="1" d="M110 348C164 201 263 160 349 224c68 51 116 129 183 126 38-2 64-36 78-83" />
        <path className="lume-launch-trace-path" pathLength="1" d="M123 285c74 131 146 174 236 125 79-43 118-133 190-142 31-4 59 9 83 37" />
        <path className="lume-launch-trace-path" pathLength="1" d="M200 154c45-35 101-51 154-43 74 12 109 68 155 105" />
      </svg>

      <div className="lume-launch-lockup">
        <p className="lume-launch-eyebrow">BELEZA EM MOVIMENTO</p>
        <Image
          src="/assets/lume_logo.webp"
          alt=""
          width={700}
          height={250}
          priority
          className="lume-launch-wordmark"
        />
        <p className="lume-launch-tagline">Sua rotina, em harmonia.</p>
      </div>

      <div className="lume-launch-sweep" />
      <button
        type="button"
        className="lume-launch-skip"
        onClick={() => skipActionRef.current()}
      >
        Pular abertura
      </button>
    </div>
  )
}
