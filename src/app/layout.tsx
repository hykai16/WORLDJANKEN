import type { Metadata } from 'next'
import { Geist } from 'next/font/google'
import './globals.css'
import { I18nProvider } from '@/lib/i18n'

const geist = Geist({ subsets: ['latin'], variable: '--font-geist' })

export const metadata: Metadata = {
  title: 'World Janken League',
  description: '運だけなのに、本気になる。',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ja" className={`${geist.variable} h-full`}>
      <body className="min-h-full bg-zinc-950 text-white antialiased">
        <I18nProvider>{children}</I18nProvider>
      </body>
    </html>
  )
}
