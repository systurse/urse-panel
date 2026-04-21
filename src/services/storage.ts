const AUTH_TOKEN_KEY = 'auth_token'
const AUTH_USER_KEY = 'auth_user'

export interface AuthUser {
  id: number
  name: string
  email: string
  email_verified_at: string | null
  bckey_id: number | null
  is_active: boolean
  created_at: string
  updated_at: string
}

export function getAuthToken () {
  return localStorage.getItem(AUTH_TOKEN_KEY)
}

export function setAuthToken (token: string) {
  localStorage.setItem(AUTH_TOKEN_KEY, token)
}

export function clearAuthToken () {
  localStorage.removeItem(AUTH_TOKEN_KEY)
}

export function getAuthUser () {
  const user = localStorage.getItem(AUTH_USER_KEY)

  if (!user) {
    return null
  }

  try {
    return JSON.parse(user) as AuthUser
  } catch {
    localStorage.removeItem(AUTH_USER_KEY)
    return null
  }
}

export function setAuthUser (user: AuthUser) {
  localStorage.setItem(AUTH_USER_KEY, JSON.stringify(user))
}

export function clearAuthUser () {
  localStorage.removeItem(AUTH_USER_KEY)
}
