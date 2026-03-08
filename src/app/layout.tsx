import type { Metadata } from 'next'
import { ClerkProvider } from '@clerk/nextjs'
import { GeistSans } from 'geist/font/sans'
import { GeistMono } from 'geist/font/mono'
import './globals.css'
import Providers from './providers'
import AuthGuard from '@/components/auth/AuthGuard'
import '../styles/scrollbar.css'
import '../styles/sidebar.css'


export const metadata: Metadata = {
  title: 'MyEco',
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
        <ClerkProvider
          publishableKey={process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY}
          appearance={{
            variables: {
              colorPrimary: 'var(--primary)',
              colorBackground: 'var(--background)',
              colorText: 'var(--text)',
              colorTextSecondary: 'var(--textSecondary)',
              colorInputBackground: 'var(--backgroundLight, #0f0f0f)',
              colorInputText: 'var(--text)',
              fontFamily: 'var(--font-geist-sans, Inter, system-ui, sans-serif)',
              borderRadius: '12px',
            },
            elements: {
              modalBackdrop: {
                background: 'rgba(0,0,0,0.6)',
                backdropFilter: 'blur(4px)',
              },
              card: {
                background: 'linear-gradient(180deg, color-mix(in oklab, var(--background), transparent 0%), color-mix(in oklab, var(--background), transparent 10%))',
                backdropFilter: 'blur(10px)',
                WebkitBackdropFilter: 'blur(10px)',
                border: '1px solid color-mix(in oklab, var(--text), transparent 92%)',
                boxShadow: '0 10px 30px rgba(0,0,0,0.35)'
              },
              headerTitle: { color: 'var(--text)' },
              headerSubtitle: { color: 'var(--textSecondary)' },
              formFieldLabel: { color: 'var(--textSecondary)' },
              formFieldInput: {
                backgroundColor: 'var(--backgroundLight, #0f0f0f)',
                color: 'var(--text)',
                borderColor: 'var(--border, rgba(255,255,255,0.12))',
              },
              // Make OTP (verification code) squares more visible without affecting other areas
              otpInput: {
                backgroundColor: 'var(--backgroundLight, #0f0f0f)',
                color: 'var(--text)',
                borderColor: 'color-mix(in oklab, var(--text), transparent 70%)',
                boxShadow: 'inset 0 0 0 1px color-mix(in oklab, var(--text), transparent 70%)',
              },
              otpInput__selected: {
                borderColor: 'var(--primary)',
                boxShadow: '0 0 0 2px color-mix(in oklab, var(--primary), transparent 30%)',
                backgroundColor: 'color-mix(in oklab, var(--primary), var(--backgroundLight) 85%)',
              },
              formButtonPrimary: {
                backgroundColor: 'var(--primary)',
                color: 'var(--background)'
              },
              footerActionText: { color: 'var(--textSecondary)' },
              footerActionLink: { color: 'var(--primary)' },
            },
          }}
        >
          <Providers>
            <AuthGuard>
              {children}
            </AuthGuard>
          </Providers>
        </ClerkProvider>
      </body>
    </html>
  )
}