import type { Metadata } from 'next'
import { DM_Sans, DM_Serif_Display, JetBrains_Mono } from 'next/font/google'
import { Analytics } from '@vercel/analytics/next'
import { Toaster } from '@/components/ui/sonner'
import { Providers } from '@/components/providers'
import './globals.css'

const dmSans = DM_Sans({ 
  subsets: ['latin'],
  variable: '--font-sans',
})

const dmSerif = DM_Serif_Display({ 
  weight: '400',
  subsets: ['latin'],
  variable: '--font-serif',
})

const jetBrainsMono = JetBrains_Mono({ 
  subsets: ['latin'],
  variable: '--font-mono',
})

export const metadata: Metadata = {
  title: 'EventOS - Event Organisation System',
  description: 'Internal event management system for organizing weddings, birthdays, poojas, and corporate functions.',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body className={`${dmSans.variable} ${dmSerif.variable} ${jetBrainsMono.variable} font-sans antialiased`}>
        <Providers>
          {children}
          <Toaster position="bottom-right" />
        </Providers>
        {process.env.NODE_ENV === 'production' && <Analytics />}
      </body>
    </html>
  )
}
