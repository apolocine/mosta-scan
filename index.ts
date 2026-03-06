// @mostajs/scan — Barrel exports
// Author: Dr Hamid MADANI drmdh@msn.com

export { default as ScannerView } from './components/ScannerView'
export { default as ScanResultCard, ScanEmptyState } from './components/ScanResultCard'
export { useScan } from './hooks/useScan'
export { playBeep, playGranted, playDenied } from './lib/audio'
// Menu contribution
export { scanMenuContribution } from './lib/menu'

export type {
  ScanResultData,
  ScanTicketInfo,
  ScanClientInfo,
  ScanAccessInfo,
  ScannerViewProps,
  ScanResultCardProps,
  UseScanOptions,
  UseScanReturn,
} from './types/index'
