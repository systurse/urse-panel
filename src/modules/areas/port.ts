export interface AreaManagerRef {
  id: number | string
  name: string
}

export interface Area {
  id: number | string
  name: string
  type: string | null
  parent_id: number | string | null
  manager_employee_id: number | string | null
  parent: Area | null
  manager: AreaManagerRef | null
}

export interface AreaPayload {
  name: string
  type?: string | null
  parent_id?: number | string | null
  manager_employee_id?: number | string | null
}

export interface AreasPort {
  create: (payload: AreaPayload) => Promise<Area>
  getById: (areaId: number | string) => Promise<Area>
  list: () => Promise<Area[]>
  remove: (areaId: number | string) => Promise<void>
  update: (areaId: number | string, payload: Partial<AreaPayload>) => Promise<Area>
}
