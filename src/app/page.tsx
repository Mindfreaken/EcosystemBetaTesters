import { auth } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import HomeView from '@/components/landing/HomeView'

export default async function Landing() {
  const { userId } = await auth()
  if (userId) {
    redirect('/home')
  }

  return (
    <HomeView />
  )
}
