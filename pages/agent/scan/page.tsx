// Author: Dr Hamid MADANI drmdh@msn.com
'use client'

import { useState, useRef, useCallback, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import dynamic from 'next/dynamic'
import { Button } from '@/components/ui/button'
import { ArrowLeft, Camera, RefreshCw, ScanFace, ShieldCheck, ShieldAlert, X, CameraOff } from 'lucide-react'
import { t } from '@/i18n'
import { toast } from 'sonner'
import { useSettings } from '@mostajs/settings/hooks/useSettings'

const FaceDetector = dynamic(
  () => import('@/components/clients/FaceDetector'),
  { ssr: false }
)

interface ScanResult {
  result: 'granted' | 'denied'
  reason?: string
  isReentry?: boolean
  ticket?: {
    ticketNumber: string
    clientName: string
    activityName: string
    ticketType: string
    validityMode: string
    status: string
  }
  client?: {
    name: string
    clientNumber: string
    photo?: string
    faceDescriptor?: number[]
  }
  access?: {
    remainingQuota: number | null
    totalQuota: number | null
    endDate: string | null
    status: string
  }
}

export default function AgentScanPage() {
  const router = useRouter()
  const { settings } = useSettings()
  const [scanning, setScanning] = useState(false)
  const [result, setResult] = useState<ScanResult | null>(null)
  const [processing, setProcessing] = useState(false)
  const scannerRef = useRef<any>(null)

  // Face verification state
  const [showFaceVerify, setShowFaceVerify] = useState(false)
  const [faceVerifyResult, setFaceVerifyResult] = useState<{
    match: boolean
    distance: number
  } | null>(null)

  const startScanner = useCallback(async () => {
    setResult(null)
    setShowFaceVerify(false)
    setFaceVerifyResult(null)
    try {
      const { Html5Qrcode } = await import('html5-qrcode')
      const scanner = new Html5Qrcode('agent-qr-reader')
      scannerRef.current = scanner

      await scanner.start(
        { facingMode: 'environment' },
        { fps: 10, qrbox: { width: 250, height: 250 } },
        async (decodedText) => {
          if (processing) return
          setProcessing(true)
          await scanner.stop()
          setScanning(false)
          await handleScan(decodedText)
          setProcessing(false)
        },
        () => {}
      )
      setScanning(true)
    } catch (err: any) {
      console.error('Scanner error:', err)
      const msg = String(err?.message || err || '')
      if (msg.includes('NotFound') || msg.includes('Requested device not found') || msg.includes('no camera')) {
        toast.error('Caméra non trouvée. Vérifiez la connexion de votre caméra.')
      } else if (msg.includes('NotAllowed') || msg.includes('Permission')) {
        toast.error('Accès caméra refusé. Autorisez l\'accès dans les paramètres du navigateur.')
      } else {
        toast.error(`Erreur caméra : ${msg || 'impossible de démarrer le scanner'}`)
      }
    }
  }, [processing])

  async function handleScan(qrCode: string) {
    try {
      const res = await fetch('/api/scan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ qrCode, scanMethod: 'pwa_camera' }),
      })

      if (!res.ok) {
        const err = await res.json().catch(() => null)
        const msg = err?.error?.message || `Erreur serveur (${res.status})`
        setResult({ result: 'denied', reason: msg })
        playSound(300, 400)
        return
      }

      const data = await res.json()
      setResult(data.data)

      // Audio feedback
      if (data.data.result === 'granted') {
        playSound(800, 200)
      } else {
        playSound(300, 400)
      }
    } catch {
      setResult({ result: 'denied', reason: 'Erreur de connexion' })
      playSound(300, 400)
    }
  }

  function playSound(freq: number, duration: number) {
    try {
      const ctx = new AudioContext()
      const osc = ctx.createOscillator()
      osc.type = 'sine'
      osc.frequency.value = freq
      osc.connect(ctx.destination)
      osc.start()
      setTimeout(() => { osc.stop(); ctx.close() }, duration)
    } catch {}
  }

  useEffect(() => {
    // Auto-start scanner on mount
    startScanner()
    return () => {
      if (scannerRef.current) {
        scannerRef.current.stop().catch(() => {})
      }
    }
  }, [])

  const canVerifyFace =
    settings.faceRecognitionEnabled &&
    result?.result === 'granted' &&
    result.client?.faceDescriptor &&
    result.client.faceDescriptor.length === 128

  return (
    <div className="flex min-h-screen flex-col bg-gray-900">
      {/* Header */}
      <div className="flex items-center justify-between bg-gray-800 px-4 py-3">
        <Button
          variant="ghost"
          size="icon"
          className="text-white hover:bg-gray-700"
          onClick={() => router.push('/agent')}
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <span className="font-semibold text-white">Scanner Ticket</span>
        <div className="w-10" />
      </div>

      {/* Scanner area */}
      {!result && (
        <div className="flex-1 flex flex-col items-center justify-center p-4">
          <div
            id="agent-qr-reader"
            className="w-full max-w-sm aspect-square rounded-lg overflow-hidden bg-black"
          />
          {!scanning && (
            <Button
              onClick={startScanner}
              className="mt-4 bg-sky-600 hover:bg-sky-700"
              size="lg"
            >
              <Camera className="mr-2 h-5 w-5" />
              Démarrer la caméra
            </Button>
          )}
        </div>
      )}

      {/* Result */}
      {result && (
        <div className="flex-1 flex flex-col items-center justify-center p-6">
          <div
            className={`w-full max-w-sm rounded-2xl p-8 text-center ${
              result.result === 'granted'
                ? result.isReentry ? 'bg-blue-500' : 'bg-green-500'
                : 'bg-red-500'
            }`}
          >
            <div className="text-6xl mb-4">
              {result.result === 'granted' ? (result.isReentry ? '🔄' : '✅') : '❌'}
            </div>
            <div className="text-3xl font-bold text-white mb-2">
              {result.result === 'granted'
                ? (result.isReentry ? 'RÉENTRÉE' : 'ACCÈS ACCORDÉ')
                : 'ACCÈS REFUSÉ'}
            </div>
            {result.isReentry && (
              <div className="text-white/90 text-sm mb-4">
                Ticket déjà validé — réentrée journée
              </div>
            )}

            {result.reason && (
              <div className="text-white/90 text-sm mb-4">
                {result.reason.startsWith('ticket_') || result.reason.startsWith('quota_') || result.reason.startsWith('access_') || result.reason.startsWith('client_') || result.reason === 'invalid_ticket'
                  ? t(`scan.denyReasons.${result.reason}`)
                  : result.reason}
              </div>
            )}

            {result.client && (
              <div className="mt-6 rounded-xl bg-white/20 p-4 text-white text-left">
                <div className="flex items-center gap-3 mb-3">
                  {result.client.photo ? (
                    <img
                      src={result.client.photo}
                      alt=""
                      className="h-12 w-12 rounded-full object-cover border-2 border-white"
                    />
                  ) : (
                    <div className="h-12 w-12 rounded-full bg-white/30 flex items-center justify-center text-xl font-bold">
                      {result.client.name.charAt(0)}
                    </div>
                  )}
                  <div>
                    <div className="font-bold text-lg">{result.client.name}</div>
                    <div className="text-sm opacity-80">{result.client.clientNumber}</div>
                  </div>
                </div>

                {result.ticket && (
                  <div className="space-y-2 border-t border-white/30 pt-3">
                    <div className="flex justify-between">
                      <span className="opacity-80">Activité</span>
                      <span className="font-semibold">{result.ticket.activityName}</span>
                    </div>
                    {result.access && result.access.remainingQuota != null && (
                      <div className="flex justify-between">
                        <span className="opacity-80">Quota restant</span>
                        <span className="font-bold text-2xl">{result.access.remainingQuota}</span>
                      </div>
                    )}
                    {result.ticket.ticketType === 'cadeau' && (
                      <div className="mt-2 inline-block rounded-full bg-amber-400 px-3 py-1 text-xs font-bold text-amber-900">
                        Ticket Cadeau
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Face verification button */}
            {canVerifyFace && !faceVerifyResult && (
              <Button
                onClick={() => setShowFaceVerify(true)}
                className="mt-4 bg-white/20 hover:bg-white/30 text-white border border-white/40"
                size="lg"
              >
                <ScanFace className="mr-2 h-5 w-5" />
                Vérifier visage
              </Button>
            )}

            {/* Face verification result badge */}
            {faceVerifyResult && (
              <div
                className={`mt-4 inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold ${
                  faceVerifyResult.match
                    ? 'bg-green-200 text-green-900'
                    : 'bg-red-200 text-red-900'
                }`}
              >
                {faceVerifyResult.match ? (
                  <ShieldCheck className="h-5 w-5" />
                ) : (
                  <ShieldAlert className="h-5 w-5" />
                )}
                {faceVerifyResult.match
                  ? `Identité confirmée (${Math.round((1 - faceVerifyResult.distance) * 100)}%)`
                  : `Visage non reconnu (${Math.round(faceVerifyResult.distance * 100)}%)`
                }
              </div>
            )}
          </div>

          <Button
            onClick={startScanner}
            size="lg"
            className="mt-6 bg-sky-600 hover:bg-sky-700"
          >
            <RefreshCw className="mr-2 h-5 w-5" />
            Scanner un autre ticket
          </Button>
        </div>
      )}

      {/* Face verification overlay */}
      {showFaceVerify && result?.client?.faceDescriptor && (
        <div className="fixed inset-0 z-50 flex flex-col bg-gray-900/95">
          <div className="flex items-center justify-between px-4 py-3">
            <span className="font-semibold text-white">Vérification faciale</span>
            <Button
              variant="ghost"
              size="icon"
              className="text-white hover:bg-gray-700"
              onClick={() => setShowFaceVerify(false)}
            >
              <X className="h-5 w-5" />
            </Button>
          </div>
          <div className="flex-1 flex items-center justify-center p-4">
            <div className="w-full max-w-sm">
              <FaceDetector
                photo=""
                onCapture={() => {}}
                onClear={() => {}}
                verifyDescriptor={result.client.faceDescriptor}
                onVerifyResult={(res) => {
                  if (res) {
                    setFaceVerifyResult(res)
                    setShowFaceVerify(false)
                  }
                }}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
