import { httpClient } from '@/services/http'

const SACC_API = '/api/sacc'

export const saccService = {
  async getReservations () {
    const response = await httpClient.get(`${SACC_API}/reservaciones`)
    return response
  },

  async createReservation (data: any) {
    const response = await httpClient.post(`${SACC_API}/reservaciones`, data)
    return response
  },

  async updateReservation (id: string, data: any) {
    const response = await httpClient.put(`${SACC_API}/reservaciones/${id}`, data)
    return response
  },

  async deleteReservation (id: string) {
    await httpClient.delete(`${SACC_API}/reservaciones/${id}`)
  },

  async getEquipment () {
    const response = await httpClient.get(`${SACC_API}/equipos`)
    return response
  },
}
