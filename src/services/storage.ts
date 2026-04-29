const AUTH_TOKEN_KEY = 'auth_token'
const AUTH_USER_KEY = 'auth_user'
const AUTH_ROLE_KEY = 'auth_role'
const AUTH_PERMISSIONS_KEY = 'auth_permissions'

export interface AuthUser {
  id: number
  name: string
  email: string
  email_verified_at: string | null
  bckey_id?: number | null
  is_active?: boolean
  created_at: string
  updated_at: string
  microsoft_id?: string | null
  avatar?: string | null
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

export function getAuthRole () {
  return localStorage.getItem(AUTH_ROLE_KEY)
}

export function setAuthRole (role: string) {
  localStorage.setItem(AUTH_ROLE_KEY, role)
}

export function clearAuthRole () {
  localStorage.removeItem(AUTH_ROLE_KEY)
}

export function getAuthPermissions () {
  const permissions = localStorage.getItem(AUTH_PERMISSIONS_KEY)

  if (!permissions) {
    return []
  }

  try {
    const parsed = JSON.parse(permissions)
    return Array.isArray(parsed) ? parsed.filter(item => typeof item === 'string') : []
  } catch {
    localStorage.removeItem(AUTH_PERMISSIONS_KEY)
    return []
  }
}

export function setAuthPermissions (permissions: string[]) {
  localStorage.setItem(AUTH_PERMISSIONS_KEY, JSON.stringify(permissions))
}

export function clearAuthPermissions () {
  localStorage.removeItem(AUTH_PERMISSIONS_KEY)
}
