import type { AuthUser } from '@/services/storage'
import { http } from '@/services/http'

interface LoginPayload {
  email: string
  password: string
}

// Aceptamos varios nombres comunes: token / access_token,
// con o sin user embebido. Ambos flujos (correo y Microsoft)
// terminan llamando a /api/auth/user para resolver el usuario.
export interface LoginResponse {
  access_token?: string
  token?: string
  token_type?: string
  user?: AuthUser
}

export interface MicrosoftRedirectResponse {
  url: string
}

export async function loginRequest (payload: LoginPayload) {
  const { data } = await http.post<LoginResponse>('/api/auth/login', payload)
  return data
}

export async function microsoftRedirectRequest () {
  const { data } = await http.get<MicrosoftRedirectResponse>('/api/auth/microsoft/redirect')
  return data
}

export async function fetchAuthenticatedUser () {
  const { data } = await http.get<AuthUser>('/api/auth/user')
  return data
}

export async function logoutRequest () {
  await http.post('/api/auth/logout')
}
