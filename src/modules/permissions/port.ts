export interface Permission {
  description: string
  id: number | string
  module: string
  name: string
}

export interface PermissionPayload {
  description?: string
  module: string
  name: string
}

export interface PermissionsPort {
  create: (payload: PermissionPayload) => Promise<Permission>
  getById: (permissionId: number | string) => Promise<Permission>
  list: () => Promise<Permission[]>
  remove: (permissionId: number | string) => Promise<void>
  update: (permissionId: number | string, payload: Partial<PermissionPayload>) => Promise<Permission>
}
