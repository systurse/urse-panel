import type { AxiosError } from 'axios'
import { defineStore } from 'pinia'
import {
  fetchAuthenticatedUser,
  loginRequest,
  logoutRequest,
  microsoftRedirectRequest,
} from '@/services/auth'
import {
  type AuthUser,
  clearAuthToken,
  clearAuthUser,
  getAuthToken,
  getAuthUser,
  setAuthToken,
  setAuthUser,
} from '@/services/storage'

interface AuthState {
  user: AuthUser | null
  token: string | null
  loading: boolean
  error: string | null
}

function resolveErrorMessage (error: unknown, fallback: string) {
  const axiosError = error as AxiosError<{ message?: string }>
  return axiosError?.response?.data?.message ?? axiosError?.message ?? fallback
}

export const useAuthStore = defineStore('auth', {
  state: (): AuthState => ({
    user: getAuthUser(),
    token: getAuthToken(),
    loading: false,
    error: null,
  }),

  getters: {
    isAuthenticated: state => !!state.token && !!state.user,
  },

  actions: {
    // Punto único para establecer sesión: guarda token y resuelve el usuario
    // (si no llegó embebido en la respuesta, lo pide a /api/auth/user).
    // Ambos flujos (correo y Microsoft) convergen aquí.
    async setSession (token: string, preloadedUser?: AuthUser | null) {
      this.token = token
      setAuthToken(token)

      const user = preloadedUser ?? await fetchAuthenticatedUser()

      this.user = user
      setAuthUser(user)

      return user
    },

    clearSession () {
      this.user = null
      this.token = null
      clearAuthToken()
      clearAuthUser()
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

        await this.setSession(token, response.user ?? null)
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
        const user = await fetchAuthenticatedUser()
        this.user = user
        setAuthUser(user)
        return user
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
