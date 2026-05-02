import type { LocalDeal } from '@/modules/tickets/port'

export type { LocalDeal }

export interface ApprovalsPort {
  list: () => Promise<LocalDeal[]>
  sign: (dealId: number, password: string) => Promise<void>
}
