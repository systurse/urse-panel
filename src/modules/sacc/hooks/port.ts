export interface AssignedUser {
  id: number | string | null
  name: string
}

export interface Contact {
  id: number | string | null
  name: string
}

export interface Deal {
  id: number | string
  title: string
  created_at: string | null
  assigned_user: AssignedUser | null
  contact: Contact | null
}

export interface DealsPort {
  list: () => Promise<Deal[]>
  downloadServiceOrder: (dealId: number | string) => Promise<Blob>
}
