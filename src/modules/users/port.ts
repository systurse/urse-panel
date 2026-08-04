export interface UserRoleRef {
  id: number | string
  name: string
}

export interface User {
  active: boolean
  email: string
  id: number | string
  initials: string
  name: string
  role: string
  roles: UserRoleRef[]
}

export interface UserPayload {
  active?: boolean
  email: string
  name: string
  password?: string
}

export interface UsersPort {
  create: (payload: UserPayload) => Promise<User>
  getById: (userId: number | string) => Promise<User>
  list: () => Promise<User[]>
  remove: (userId: number | string) => Promise<void>
  update: (userId: number | string, payload: Partial<UserPayload>) => Promise<User>
}
