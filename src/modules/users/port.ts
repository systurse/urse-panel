export interface User {
  active: boolean
  email: string
  id: number | string
  initials: string
  name: string
  role: string
}

export interface UserPayload {
  active?: boolean
  email: string
  name: string
  password?: string
  role?: string
}

export interface UsersPort {
  create: (payload: UserPayload) => Promise<User>
  getById: (userId: number | string) => Promise<User>
  list: () => Promise<User[]>
  remove: (userId: number | string) => Promise<void>
  update: (userId: number | string, payload: Partial<UserPayload>) => Promise<User>
}
