import type { AuthUser } from '@/services/storage'
import { http } from '@/services/http'

interface LoginPayload {
  email: string
  password: string
}

export interface LoginResponse {
  access_token: string
  token_type: string
  user: AuthUser
}

export async function loginRequest (payload: LoginPayload) {
  const { data } = await http.post<LoginResponse>('/api/v1/login', payload)
  return data
}
