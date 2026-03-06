// @mostajs/scan — Types
// Author: Dr Hamid MADANI drmdh@msn.com

export interface ScanTicketInfo {
  ticketNumber: string
  clientName: string
  activityName: string
  ticketType: string
  validityMode: string
  status: string
}

export interface ScanClientInfo {
  name: string
  clientNumber: string
  photo?: string
  faceDescriptor?: number[]
}

export interface ScanAccessInfo {
  remainingQuota: number | null
  totalQuota: number | null
  endDate: string | null
  status: string
}

export interface ScanResultData {
  result: 'granted' | 'denied'
  reason?: string
  isReentry?: boolean
  ticket?: ScanTicketInfo
  client?: ScanClientInfo
  access?: ScanAccessInfo
}

export interface ScannerViewProps {
  /** API endpoint for scan validation (default: '/api/scan') */
  apiEndpoint?: string
  /** Called when a scan result is received */
  onResult?: (data: ScanResultData) => void
  /** Called on scanner error */
  onError?: (message: string) => void
  /** Translate function (default: identity) */
  t?: (key: string) => string
  /** Labels for start/stop buttons */
  startLabel?: string
  stopLabel?: string
  /** Sound frequencies: [grantedHz, deniedHz] */
  soundFrequencies?: [number, number]
}

export interface ScanResultCardProps {
  /** The scan result data */
  data: ScanResultData
  /** Translate function (default: identity) */
  t?: (key: string) => string
  /** Render custom content after client info (e.g., face verification) */
  renderExtra?: (data: ScanResultData) => React.ReactNode
}

export interface UseScanOptions {
  /** API endpoint for scan validation (default: '/api/scan') */
  apiEndpoint?: string
  /** Play audio feedback on result (default: true) */
  audioFeedback?: boolean
  /** Sound frequencies: [grantedHz, deniedHz] (default: [800, 300]) */
  soundFrequencies?: [number, number]
  /** Called when a scan result is received */
  onResult?: (data: ScanResultData) => void
  /** Called on error */
  onError?: (message: string) => void
}

export interface UseScanReturn {
  /** Whether the scanner is actively scanning */
  scanning: boolean
  /** Whether a scan is being processed */
  processing: boolean
  /** The latest scan result */
  result: ScanResultData | null
  /** Start the QR scanner */
  startScanner: () => Promise<void>
  /** Stop the QR scanner */
  stopScanner: () => void
  /** Reset the result */
  resetResult: () => void
}
