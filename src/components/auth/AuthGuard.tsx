'use client'

import { useAuth } from '@clerk/clerk-react'
import { useRouter, usePathname } from 'next/navigation'
import { useEffect } from 'react'
import { Spinner } from '@/components/ui/Spinner'
import Image from 'next/image'

const publicRoutes = ['/', '/sign-in', '/sign-up']

export default function AuthGuard({ children }: { children: React.ReactNode }) {
    const { isLoaded, userId } = useAuth()
    const router = useRouter()
    const pathname = usePathname()

    useEffect(() => {
        if (isLoaded) {
            const isPublicRoute = publicRoutes.some(route =>
                pathname === route || pathname?.startsWith(route + '/')
            )

            if (!isPublicRoute && !userId) {
                router.push('/')
            }
        }
    }, [isLoaded, userId, pathname, router])

    // Show a loading state while auth is loading to give visual feedback
    if (!isLoaded) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center gap-4 text-center bg-[var(--background)]">
                <Image
                    src="/achievements/early_adopter_sticker.png"
                    alt="Ecosystem logo"
                    width={120}
                    height={120}
                    priority
                    className="drop-shadow-sm select-none motion-safe:animate-pulse"
                />
                <Spinner size="large" />
                <div>
                    <p className="text-sm text-gray-400">Loading Ecosystem...</p>
                </div>
            </div>
        )
    }

    return <>{children}</>
}


