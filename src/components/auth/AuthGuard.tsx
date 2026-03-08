'use client'

import { useAuth } from '@clerk/clerk-react'
import { useRouter, usePathname } from 'next/navigation'
import { useEffect } from 'react'

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

    // Show nothing while loading auth state to avoid flashes
    if (!isLoaded) return null

    return <>{children}</>
}
