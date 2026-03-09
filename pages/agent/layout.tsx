// Author: Dr Hamid MADANI drmdh@msn.com
import { redirect } from 'next/navigation'
import { auth } from '@/lib/auth'

export default async function AgentLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await auth()

  if (!session?.user) {
    redirect('/login')
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {children}
    </div>
  )
}
