'use client'

import { useLayoutEffect, useRef } from 'react'
import Image from 'next/image'
import { isStandalonePwa } from '@/lib/pwa-launch'

export default function PwaLaunchTransition() {
  const overlayRef = useRef<HTMLDivElement>(null)

  useLayoutEffect(() => {
    const overlay = overlayRef.current
    if (!overlay) return

    const safariStandalone = Boolean((navigator as Navigator & { standalone?: boolean }).standalone)
    const displayModeStandalone = window.matchMedia('(display-mode: standalone)').matches
    if (!isStandalonePwa(displayModeStandalone, safariStandalone)) return

    const documentRoot = document.documentElement
    documentRoot.dataset.lumePwaLaunch = 'true'

    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (reduceMotion) {
      documentRoot.removeAttribute('data-lume-pwa-launch')
      return
    }

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

    let finished = false
    let cancelled = false
    let cancelAnimation = () => {}
    let revertContext = () => {}

    const dismiss = () => {
      if (finished) return
      finished = true
      if (failsafe) clearTimeout(failsafe)
      cancelAnimation()
      overlay.style.opacity = '0'
      overlay.style.visibility = 'hidden'
      documentRoot.removeAttribute('data-lume-pwa-launch')
      restoreBackground()
    }

    const failsafe = setTimeout(dismiss, 3000)

    const runReveal = async () => {
      try {
        const { gsap } = await import('gsap')
        if (cancelled || finished) return

        const context = gsap.context(() => {
          const ambient = overlay.querySelector('.lume-launch-ambient')
          const orbit = overlay.querySelector('.lume-launch-orbit')
          const emblem = overlay.querySelector('.lume-launch-emblem')
          const eyebrow = overlay.querySelector('.lume-launch-eyebrow')
          const wordmark = overlay.querySelector('.lume-launch-wordmark')
          const tagline = overlay.querySelector('.lume-launch-tagline')
          const glint = overlay.querySelector('.lume-launch-glint')

          gsap.set(overlay, { autoAlpha: 1 })
          gsap.set([ambient, orbit, emblem, eyebrow, wordmark, tagline], { autoAlpha: 0 })
          gsap.set(orbit, { scale: 0.78, rotate: -18, transformOrigin: '50% 50%' })
          gsap.set(emblem, { scale: 0.76, y: 14, rotate: -7, transformOrigin: '50% 50%' })
          gsap.set([eyebrow, wordmark, tagline], { y: 12 })
          gsap.set(glint, { scaleX: 0, transformOrigin: 'left center' })

          const timeline = gsap.timeline({
            defaults: { ease: 'power3.out' },
            onComplete: () => {
              finished = true
              if (failsafe) clearTimeout(failsafe)
              documentRoot.removeAttribute('data-lume-pwa-launch')
              restoreBackground()
            },
          })

          timeline
            .to(ambient, { autoAlpha: 1, scale: 1, duration: 0.72 }, 0)
            .to(orbit, { autoAlpha: 1, scale: 1, rotate: 0, duration: 1.08 }, 0.08)
            .to(emblem, { autoAlpha: 1, scale: 1, y: 0, rotate: 0, duration: 0.88 }, 0.28)
            .to(eyebrow, { autoAlpha: 1, y: 0, duration: 0.48 }, 0.72)
            .to(wordmark, { autoAlpha: 1, y: 0, duration: 0.62 }, 0.82)
            .to(tagline, { autoAlpha: 1, y: 0, duration: 0.54 }, 1.02)
            .to(glint, { scaleX: 1, duration: 0.72, ease: 'power2.inOut' }, 1.12)
            .to(overlay, { autoAlpha: 0, duration: 0.48, ease: 'power2.inOut' }, 1.92)

          cancelAnimation = () => timeline.kill()
        }, overlay)

        revertContext = () => context.revert()
      } catch {
        dismiss()
      }
    }

    void runReveal()

    return () => {
      cancelled = true
      if (failsafe) clearTimeout(failsafe)
      cancelAnimation()
      revertContext()
      restoreBackground()
      documentRoot.removeAttribute('data-lume-pwa-launch')
    }
  }, [])

  return (
    <div ref={overlayRef} className="lume-launch-screen" aria-hidden="true">
      <div className="lume-launch-ambient" />
      <div className="lume-launch-grain" />

      <div className="lume-launch-composition">
        <div className="lume-launch-orbit">
          <span className="lume-launch-ring lume-launch-ring--outer" />
          <span className="lume-launch-ring lume-launch-ring--inner" />
          <span className="lume-launch-orbit-point lume-launch-orbit-point--top" />
          <span className="lume-launch-orbit-point lume-launch-orbit-point--side" />
          <div className="lume-launch-emblem">
            <Image src="/assets/lume_icon.webp" alt="" width={84} height={84} priority />
          </div>
        </div>

        <p className="lume-launch-eyebrow">SEU ESPAÇO DE CUIDADO</p>
        <p className="lume-launch-wordmark">Lumê</p>
        <span className="lume-launch-glint" />
        <p className="lume-launch-tagline">Sua rotina, em harmonia.</p>
      </div>

      <span className="lume-launch-edge lume-launch-edge--top" />
      <span className="lume-launch-edge lume-launch-edge--bottom" />
    </div>
  )
}
