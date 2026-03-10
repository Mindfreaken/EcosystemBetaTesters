import type { Metadata } from 'next'
import { GeistSans } from 'geist/font/sans'
import { GeistMono } from 'geist/font/mono'
import './globals.css'
import Providers from './providers'
import AuthGuard from '@/components/auth/AuthGuard'
import '../styles/scrollbar.css'
import '../styles/sidebar.css'
import WindowTitleBar from '@/components/layout/WindowTitleBar'


export const metadata: Metadata = {
  title: 'EcoSystem Testers Beta',
  description: 'A new spin on a truly social, community-driven ecosystem',
  icons: {
    icon: '/achievements/early_adopter_sticker.png',
    shortcut: '/achievements/early_adopter_sticker.png',
    apple: '/achievements/early_adopter_sticker.png',
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body suppressHydrationWarning className={`${GeistSans.className} ${GeistSans.variable} ${GeistMono.variable} antialiased`}>
        <div className="flex flex-col h-screen overflow-hidden">
          <Providers>
            <WindowTitleBar />
            <AuthGuard>
              {children}
            </AuthGuard>
          </Providers>
        </div>
      </body>
    </html>
  )
}