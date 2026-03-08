'use client'

import { ReactNode } from 'react'
import { ConvexReactClient } from 'convex/react'
import { ConvexProviderWithClerk } from 'convex/react-clerk'
import { useAuth } from '@clerk/clerk-react'

export default function ConvexClientProvider({ children }: { children: ReactNode }) {
  // Use a fallback URL during build if NEXT_PUBLIC_CONVEX_URL is missing
  // This ensures the ConvexProvider is always present, preventing useQuery crashes.
  const convexUrl = process.env.NEXT_PUBLIC_CONVEX_URL || "http://localhost"

  // Lazily create the client inside the component to avoid module-level side effects
  const client = new ConvexReactClient(convexUrl)

  return (
    <ConvexProviderWithClerk client={client} useAuth={useAuth}>
      {children}
    </ConvexProviderWithClerk>
  )
}