import httpClient from '@/services/http'

const SSM_API = '/api/ssm'

export const ssmService = {
  async getWorkOrders () {
    const response = await httpClient.get(`${SSM_API}/ordenes-trabajo`)
    return response.data
  },

  async createWorkOrder (data: any) {
    const response = await httpClient.post(`${SSM_API}/ordenes-trabajo`, data)
    return response.data
  },

  async updateWorkOrder (id: string, data: any) {
    const response = await httpClient.put(`${SSM_API}/ordenes-trabajo/${id}`, data)
    return response.data
  },

  async deleteWorkOrder (id: string) {
    await httpClient.delete(`${SSM_API}/ordenes-trabajo/${id}`)
  },

  async getServices () {
    const response = await httpClient.get(`${SSM_API}/servicios`)
    return response.data
  },

  async getMaintenanceSchedule () {
    const response = await httpClient.get(`${SSM_API}/mantenimiento/cronograma`)
    return response.data
  },
}
