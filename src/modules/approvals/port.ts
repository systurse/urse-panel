import type { LocalDeal } from '@/modules/tickets/port'

export type { LocalDeal }

export interface ApprovalsPort {
  list: (includeSigned?: boolean) => Promise<LocalDeal[]>
  sign: (dealId: number) => Promise<void>
  requestModifications: (dealId: number, notes: string) => Promise<void>
}
