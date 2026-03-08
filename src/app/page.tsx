'use client'

import { useAuth } from '@clerk/nextjs'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'
import HomeView from '@/components/landing/HomeView'

export default function Landing() {
  const { isLoaded, userId } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (isLoaded && userId) {
      router.push('/home')
    }
  }, [isLoaded, userId, router])

  if (!isLoaded || userId) {
    return null
  }

  return (
    <HomeView />
  )
}
