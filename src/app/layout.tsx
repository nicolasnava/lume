import type { Metadata } from 'next'
import { Fraunces, Manrope } from 'next/font/google'
import './globals.css'

const fraunces = Fraunces({
  subsets: ['latin'],
  variable: '--font-fraunces',
  display: 'swap',
})

const manrope = Manrope({
  subsets: ['latin'],
  variable: '--font-manrope',
  display: 'swap',
})

export const metadata: Metadata = {
  metadataBase: new URL('https://lumebr.app'),
  title: 'Lumê',
  description: 'SaaS de agendamento online e gestão para profissionais e estúdios de beleza.',
  icons: {
    icon: [
      {
        url: '/assets/lume_icon.webp',
        type: 'image/webp',
        media: '(prefers-color-scheme: light)',
      },
      {
        url: '/assets/lume_icon_white.webp',
        type: 'image/webp',
        media: '(prefers-color-scheme: dark)',
      },
      { url: '/favicon.ico', sizes: 'any' },
    ],
    shortcut: [
      {
        url: '/assets/lume_icon.webp',
        media: '(prefers-color-scheme: light)',
      },
      {
        url: '/assets/lume_icon_white.webp',
        media: '(prefers-color-scheme: dark)',
      },
    ],
    apple: [
      { url: '/apple-touch-icon.png', sizes: '180x180', type: 'image/png' },
      { url: '/assets/lume_icon.webp', type: 'image/webp' },
    ],
  },
  openGraph: {
    title: 'Lumê',
    description: 'SaaS de agendamento online e gestão para profissionais e estúdios de beleza.',
    url: 'https://lumebr.app',
    siteName: 'Lumê',
    images: [
      {
        url: '/assets/capa_app.webp',
        width: 1200,
        height: 630,
        alt: 'Lumê',
      },
    ],
    locale: 'pt_BR',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Lumê',
    description: 'SaaS de agendamento online e gestão para profissionais e estúdios de beleza.',
    images: ['/assets/capa_app.webp'],
  },
}

import CookieConsentBanner from '@/components/common/CookieConsentBanner'
import PwaLaunchTransition from '@/components/common/PwaLaunchTransition'

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="pt-BR" className={`${fraunces.variable} ${manrope.variable}`} suppressHydrationWarning>
      <head>
        <link rel="manifest" href="/manifest.json" />
        <link
          id="lume-dynamic-favicon"
          rel="icon"
          href="/assets/lume_icon.webp"
          type="image/webp"
        />
        <link
          rel="icon"
          href="/assets/lume_icon.webp"
          type="image/webp"
          media="(prefers-color-scheme: light)"
        />
        <link
          rel="icon"
          href="/assets/lume_icon_white.webp"
          type="image/webp"
          media="(prefers-color-scheme: dark)"
        />
        <link rel="icon" href="/favicon.ico" sizes="any" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
        <meta name="theme-color" content="#3D2E4D" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-touch-fullscreen" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="Lumê" />
        <script
          dangerouslySetInnerHTML={{
            __html: `
              try {
                var lumeStandalone = (window.matchMedia && window.matchMedia('(display-mode: standalone)').matches) || window.navigator.standalone === true;
                if (lumeStandalone) document.documentElement.dataset.lumePwaLaunch = 'true';
              } catch (e) {}

              try {
                if (!window.location.pathname.startsWith('/admin')) {
                  document.documentElement.classList.remove('dark');
                }
              } catch (e) {}

              function updateLumeFavicon() {
                try {
                  var isDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
                  var iconUrl = isDark ? '/assets/lume_icon_white.webp' : '/assets/lume_icon.webp';
                  var dynamicIcon = document.getElementById('lume-dynamic-favicon');
                  if (dynamicIcon && dynamicIcon.getAttribute('href') !== iconUrl) {
                    dynamicIcon.href = iconUrl;
                  }
                } catch (e) {}
              }

              updateLumeFavicon();

              try {
                if (window.matchMedia) {
                  var mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
                  if (mediaQuery.addEventListener) {
                    mediaQuery.addEventListener('change', updateLumeFavicon);
                  } else if (mediaQuery.addListener) {
                    mediaQuery.addListener(updateLumeFavicon);
                  }
                }
              } catch (e) {}

              if ('serviceWorker' in navigator && typeof window !== 'undefined') {
                window.addEventListener('load', function() {
                  navigator.serviceWorker.register('/sw.js').catch(function() {});
                });
              }
            `,
          }}
        />
      </head>
      <body className="min-h-screen bg-[#FAF8F5] text-[#3D2E4D] antialiased font-sans">
        <PwaLaunchTransition />
        {children}
        <CookieConsentBanner />
      </body>
    </html>
  )
}
