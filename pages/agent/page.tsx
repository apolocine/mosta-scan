// Author: Dr Hamid MADANI drmdh@msn.com
'use client'

import { useSession, signOut } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { Shield, ScanLine, LogOut } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { t } from '@/i18n'

export default function AgentHomePage() {
  const { data: session } = useSession()
  const router = useRouter()

  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-6">
      <div className="w-full max-w-sm space-y-8 text-center">
        <div>
          <Shield className="mx-auto h-16 w-16 text-sky-600" />
          <h1 className="mt-4 text-2xl font-bold text-gray-900">
            {t('common.app.name')}
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            {t('common.app.description')}
          </p>
        </div>

        {session?.user && (
          <div className="rounded-lg bg-white p-4 shadow-sm">
            <p className="text-sm text-gray-500">Connecté en tant que</p>
            <p className="font-semibold text-gray-900">{session.user.name}</p>
            <p className="text-xs text-gray-400">
              {t(`auth.roles.${(session.user as any).role}`)}
            </p>
          </div>
        )}

        <Button
          size="lg"
          className="h-24 w-full bg-sky-600 text-xl hover:bg-sky-700"
          onClick={() => router.push('/agent/scan')}
        >
          <ScanLine className="mr-3 h-8 w-8" />
          Scanner un ticket
        </Button>

        <Button
          variant="ghost"
          className="text-red-600 hover:bg-red-50 hover:text-red-700"
          onClick={() => signOut({ callbackUrl: '/login' })}
        >
          <LogOut className="mr-2 h-4 w-4" />
          {t('auth.logout.button')}
        </Button>
      </div>
    </div>
  )
}
