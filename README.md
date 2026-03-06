# @mostajs/scan

QR/barcode scanner UI components and hooks for access control systems.

Provides a ready-to-use QR scanner (via `html5-qrcode`), scan result display cards, audio feedback, and a React hook to manage the full scan lifecycle.

## Installation

```bash
npm install @mostajs/scan html5-qrcode lucide-react
```

## Quick Start

```tsx
import { ScannerView, ScanResultCard, ScanEmptyState } from '@mostajs/scan'
import { useState } from 'react'
import type { ScanResultData } from '@mostajs/scan'
import { toast } from 'sonner'

export default function ScanPage() {
  const [result, setResult] = useState<ScanResultData | null>(null)

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
      {/* Left: Scanner */}
      <ScannerView
        apiEndpoint="/api/scan"
        onResult={(data) => setResult(data)}
        onError={(msg) => toast.error(msg)}
        startLabel="Start Scanner"
        stopLabel="Stop"
      />

      {/* Right: Result */}
      {result ? (
        <ScanResultCard data={result} t={(key) => translations[key] || key} />
      ) : (
        <ScanEmptyState message="Scan a QR ticket to verify access" />
      )}
    </div>
  )
}
```

## Components

### `<ScannerView />`

Self-contained QR scanner with webcam, start/stop controls, and audio feedback.

```tsx
import { ScannerView } from '@mostajs/scan/components/ScannerView'

<ScannerView
  apiEndpoint="/api/scan"       // POST endpoint for scan validation
  onResult={(data) => { }}      // called with ScanResultData
  onError={(msg) => { }}        // called on camera errors
  startLabel="Demarrer"         // button label
  stopLabel="Arreter"           // button label
  soundFrequencies={[800, 300]} // [grantedHz, deniedHz]
/>
```

**Props:**

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `apiEndpoint` | `string` | `'/api/scan'` | POST endpoint that receives `{ qrCode, scanMethod }` |
| `onResult` | `(data: ScanResultData) => void` | — | Called when scan result is received |
| `onError` | `(message: string) => void` | — | Called on camera/scanner error |
| `startLabel` | `string` | `'Start Scanner'` | Start button text |
| `stopLabel` | `string` | `'Stop'` | Stop button text |
| `soundFrequencies` | `[number, number]` | `[800, 300]` | Beep frequencies for granted/denied |

### `<ScanResultCard />`

Displays the result of a ticket scan with client info, ticket details, and access status.

```tsx
import ScanResultCard from '@mostajs/scan/components/ScanResultCard'

<ScanResultCard
  data={scanResult}
  t={(key) => i18n.t(key)}
  renderExtra={(data) => (
    data.result === 'granted' && data.client?.faceDescriptor && (
      <FaceVerifyButton descriptor={data.client.faceDescriptor} />
    )
  )}
/>
```

**Props:**

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `data` | `ScanResultData` | **required** | The scan result object |
| `t` | `(key: string) => string` | identity | Translation function |
| `renderExtra` | `(data: ScanResultData) => ReactNode` | — | Custom content after client info |

**Translation keys used:**
- `scan.result.granted`, `scan.result.denied`, `scan.result.reentry`, `scan.result.reentryHint`
- `scan.denyReasons.invalid_ticket`, `scan.denyReasons.ticket_already_used`, etc.
- `scan.info.activity`, `scan.info.quotaRemaining`
- `tickets.types.cadeau`

### `<ScanEmptyState />`

Placeholder shown when no scan result is available yet.

```tsx
import { ScanEmptyState } from '@mostajs/scan/components/ScanResultCard'

<ScanEmptyState message="Scannez un ticket QR pour verifier l'acces" />
```

## Hooks

### `useScan(options?)`

Low-level hook for full control over the scan lifecycle. Use this when `ScannerView` is too opinionated.

```tsx
import { useScan } from '@mostajs/scan/hooks/useScan'

function CustomScanner() {
  const {
    scanning,     // boolean — is scanner active
    processing,   // boolean — is a scan being validated
    result,       // ScanResultData | null
    startScanner, // () => Promise<void>
    stopScanner,  // () => void
    resetResult,  // () => void
  } = useScan({
    apiEndpoint: '/api/scan',
    audioFeedback: true,
    soundFrequencies: [800, 300],
    onResult: (data) => console.log('Scan:', data),
    onError: (msg) => alert(msg),
  })

  return (
    <div>
      {/* This div MUST have id="qr-reader" */}
      <div id="qr-reader" style={{ width: '100%', minHeight: 300 }} />
      <button onClick={scanning ? stopScanner : startScanner}>
        {scanning ? 'Stop' : 'Scan'}
      </button>
      {result && (
        <div>
          <p>Result: {result.result}</p>
          <button onClick={resetResult}>Clear</button>
        </div>
      )}
    </div>
  )
}
```

**Options:**

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `apiEndpoint` | `string` | `'/api/scan'` | POST endpoint |
| `audioFeedback` | `boolean` | `true` | Play beep sounds |
| `soundFrequencies` | `[number, number]` | `[800, 300]` | [grantedHz, deniedHz] |
| `onResult` | `(data) => void` | — | Result callback |
| `onError` | `(msg) => void` | — | Error callback |

**Important:** The hook renders the scanner into a DOM element with `id="qr-reader"`. This element must exist before calling `startScanner()`.

## Audio Utilities

```tsx
import { playBeep, playGranted, playDenied } from '@mostajs/scan/lib/audio'

playBeep(440, 200)  // custom frequency + duration (ms)
playGranted()       // 800 Hz, 200ms
playDenied()        // 300 Hz, 400ms
playGranted(1000)   // custom frequency
```

## API Endpoint Contract

The scanner sends a POST request to `apiEndpoint` with:

```json
{ "qrCode": "12345678", "scanMethod": "webcam" }
```

Expected response:

```json
{
  "data": {
    "result": "granted",
    "isReentry": false,
    "ticket": {
      "ticketNumber": "12345678",
      "clientName": "John Doe",
      "activityName": "Pool",
      "ticketType": "normal",
      "validityMode": "day_reentry",
      "status": "used"
    },
    "client": {
      "name": "John Doe",
      "clientNumber": "C-001",
      "photo": "/uploads/photo.jpg"
    },
    "access": {
      "remainingQuota": 9,
      "totalQuota": 10,
      "endDate": "2026-12-31",
      "status": "active"
    }
  }
}
```

Use `@mostajs/ticketing`'s `createScanHandler()` to build the API route — it returns exactly this format.

## Types

```typescript
interface ScanResultData {
  result: 'granted' | 'denied'
  reason?: string
  isReentry?: boolean
  ticket?: ScanTicketInfo
  client?: ScanClientInfo
  access?: ScanAccessInfo
}

interface ScanTicketInfo {
  ticketNumber: string
  clientName: string
  activityName: string
  ticketType: string
  validityMode: string
  status: string
}

interface ScanClientInfo {
  name: string
  clientNumber: string
  photo?: string
  faceDescriptor?: number[]
}

interface ScanAccessInfo {
  remainingQuota: number | null
  totalQuota: number | null
  endDate: string | null
  status: string
}
```

## License

MIT
