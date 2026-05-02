import type { AxiosError } from 'axios'
import { defineStore } from 'pinia'
import {
  type AuthenticatedUserResponse,
  fetchAuthenticatedUser,
  loginRequest,
  logoutRequest,
  microsoftRedirectRequest,
} from '@/services/auth'
import {
  type AuthUser,
  clearAuthPermissions,
  clearAuthRoles,
  clearAuthToken,
  clearAuthUser,
  getAuthPermissions,
  getAuthRoles,
  getAuthToken,
  getAuthUser,
  setAuthPermissions,
  setAuthRoles,
  setAuthToken,
  setAuthUser,
} from '@/services/storage'

interface AuthState {
  user: AuthUser | null
  roles: string[]
  permissions: string[]
  token: string | null
  loading: boolean
  error: string | null
}

interface SessionData {
  user: AuthUser
  roles: string[]
  permissions: string[]
}

function resolveErrorMessage (error: unknown, fallback: string) {
  const axiosError = error as AxiosError<{ message?: string }>
  return axiosError?.response?.data?.message ?? axiosError?.message ?? fallback
}

export const useAuthStore = defineStore('auth', {
  state: (): AuthState => ({
    user: getAuthUser(),
    roles: getAuthRoles(),
    permissions: getAuthPermissions(),
    token: getAuthToken(),
    loading: false,
    error: null,
  }),

  getters: {
    isAuthenticated: state => !!state.token && !!state.user,
    isAdmin: state => state.roles.includes('administrator'),
    hasPermission: state => (permission: string) => state.permissions.includes(permission),
    hasAnyPermission: state => (permissions: string[]) => permissions.some(p => state.permissions.includes(p)),
    hasRole: state => (role: string) => state.roles.includes(role),
    hasAnyRole: state => (roles: string[]) => roles.some(r => state.roles.includes(r)),
  },

  actions: {
    normalizeSessionData (response: AuthenticatedUserResponse): SessionData {
      return {
        user: response.user,
        roles: response.roles,
        permissions: response.permissions ?? [],
      }
    },

    // Punto único para establecer sesión: guarda token y resuelve el usuario
    // (si no llegó embebido en la respuesta, lo pide a /api/auth/user).
    // Ambos flujos (correo y Microsoft) convergen aquí.
    async setSession (token: string, preloadedSession?: Partial<SessionData> | null) {
      this.token = token
      setAuthToken(token)

      const sessionData = preloadedSession?.user
        && Array.isArray(preloadedSession.permissions)
        && Array.isArray(preloadedSession.roles)
        ? {
            user: preloadedSession.user,
            roles: preloadedSession.roles,
            permissions: preloadedSession.permissions,
          }
        : this.normalizeSessionData(await fetchAuthenticatedUser())

      this.user = sessionData.user
      this.roles = sessionData.roles
      this.permissions = sessionData.permissions
      setAuthUser(sessionData.user)

      if (sessionData.roles) {
        setAuthRoles(sessionData.roles)
      } else {
        clearAuthRoles()
      }

      setAuthPermissions(sessionData.permissions)

      return sessionData
    },

    clearSession () {
      this.user = null
      this.roles = []
      this.permissions = []
      this.token = null
      clearAuthToken()
      clearAuthUser()
      clearAuthRoles()
      clearAuthPermissions()
    },

    async login (email: string, password: string) {
      this.loading = true
      this.error = null

      try {
        const response = await loginRequest({ email, password })
        const token = response.access_token ?? response.token

        if (!token) {
          throw new Error('La respuesta del servidor no incluye un token válido.')
        }

        await this.setSession(token, {
          user: response.user,
          roles: response.roles ?? [],
          permissions: response.permissions ?? [],
        })
      } catch (error_) {
        this.clearSession()
        this.error = resolveErrorMessage(error_, 'Error al iniciar sesión')
        throw error_
      } finally {
        this.loading = false
      }
    },

    async loginWithMicrosoft () {
      this.loading = true
      this.error = null

      try {
        const { url } = await microsoftRedirectRequest()
        window.location.href = url
      } catch (error_) {
        this.error = resolveErrorMessage(error_, 'No se pudo iniciar sesión con Microsoft')
        this.loading = false
        throw error_
      }
    },

    async handleAuthCallback (token: string) {
      this.loading = true
      this.error = null

      try {
        await this.setSession(token)
      } catch (error_) {
        this.clearSession()
        this.error = resolveErrorMessage(error_, 'No se pudo completar el inicio de sesión')
        throw error_
      } finally {
        this.loading = false
      }
    },

    async fetchUser () {
      try {
        const sessionData = this.normalizeSessionData(await fetchAuthenticatedUser())
        this.user = sessionData.user
        this.roles = sessionData.roles
        this.permissions = sessionData.permissions
        setAuthUser(sessionData.user)

        if (sessionData.roles) {
          setAuthRoles(sessionData.roles)
        } else {
          clearAuthRoles()
        }

        setAuthPermissions(sessionData.permissions)
        return sessionData.user
      } catch (error_) {
        this.error = resolveErrorMessage(error_, 'No se pudo obtener el usuario autenticado')
        throw error_
      }
    },

    async logout () {
      try {
        if (this.token) {
          await logoutRequest()
        }
      } catch {
        // Aunque el backend falle, limpiamos la sesión local.
      } finally {
        this.clearSession()
        this.error = null
      }
    },

    clearError () {
      this.error = null
    },
  },
})
