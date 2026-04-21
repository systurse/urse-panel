export interface Role {
  description: string
  id: number | string
  name: string
}

export interface RolePayload {
  description?: string
  name: string
}

export interface RolesPort {
  create: (payload: RolePayload) => Promise<Role>
  getById: (roleId: number | string) => Promise<Role>
  list: () => Promise<Role[]>
  remove: (roleId: number | string) => Promise<void>
  update: (roleId: number | string, payload: Partial<RolePayload>) => Promise<Role>
}
