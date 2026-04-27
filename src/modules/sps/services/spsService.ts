import httpClient from '@/services/http'

const SPS_API = '/api/sps'

export const spsService = {
  async getExitPermissions () {
    const response = await httpClient.get(`${SPS_API}/permisos-salida`)
    return response.data
  },

  async createExitPermission (data: any) {
    const response = await httpClient.post(`${SPS_API}/permisos-salida`, data)
    return response.data
  },

  async updateExitPermission (id: string, data: any) {
    const response = await httpClient.put(`${SPS_API}/permisos-salida/${id}`, data)
    return response.data
  },

  async deleteExitPermission (id: string) {
    await httpClient.delete(`${SPS_API}/permisos-salida/${id}`)
  },

  async getPendingApprovals () {
    const response = await httpClient.get(`${SPS_API}/pendientes-aprobacion`)
    return response.data
  },

  async approvePermission (id: string, data: any) {
    const response = await httpClient.post(`${SPS_API}/permisos-salida/${id}/aprobar`, data)
    return response.data
  },

  async rejectPermission (id: string, data: any) {
    const response = await httpClient.post(`${SPS_API}/permisos-salida/${id}/rechazar`, data)
    return response.data
  },
}
