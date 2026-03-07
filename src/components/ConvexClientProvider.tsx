'use client'

import { ReactNode } from 'react'
import { ConvexReactClient } from 'convex/react'
import { ConvexProviderWithClerk } from 'convex/react-clerk'
import { useAuth } from '@clerk/nextjs'

export default function ConvexClientProvider({ children }: { children: ReactNode }) {
  const convexUrl = process.env.NEXT_PUBLIC_CONVEX_URL
  // If Convex URL isn't configured, render children without provider to avoid crashing during import
  if (!convexUrl) {
    if (process.env.NODE_ENV !== 'production') {
      // eslint-disable-next-line no-console
      console.warn('NEXT_PUBLIC_CONVEX_URL is not set; rendering without ConvexProvider')
    }
    return <>{children}</>
  }

  // Lazily create the client inside the component to avoid module-level side effects
  const client = new ConvexReactClient(convexUrl)

  return (
    <ConvexProviderWithClerk client={client} useAuth={useAuth}>
      {children}
    </ConvexProviderWithClerk>
  )
}