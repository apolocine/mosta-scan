// @mostajs/scan — Menu contribution
// Author: Dr Hamid MADANI drmdh@msn.com

import { ScanLine } from 'lucide-react'
import type { ModuleMenuContribution } from '@mostajs/menu'

export const scanMenuContribution: ModuleMenuContribution = {
  moduleKey: 'scan',
  mergeIntoGroup: 'Actions',
  order: 40,
  items: [
    {
      label: 'scan.title',
      href: '/dashboard/scan',
      icon: ScanLine,
      permission: 'scan:validate',
    },
  ],
}
