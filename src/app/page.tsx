'use client'

import { useAuth } from '@clerk/clerk-react'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'
import HomeView from '@/components/landing/HomeView'

export default function Landing() {
  const { isLoaded, userId } = useAuth()

  // AuthGuard handles the loading state for the entire app.
  // RedirectOnAuth handles redirection to /home if signed in.
  
  if (!isLoaded || userId) {
    return null
  }

  return (
    <HomeView />
  )
}


