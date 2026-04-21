import type { AxiosError } from 'axios'
import { defineStore } from 'pinia'
import { loginRequest } from '@/services/auth'
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
    async login (email: string, password: string) {
      this.loading = true
      this.error = null

      try {
        const { access_token, user } = await loginRequest({ email, password })

        this.user = user
        this.token = access_token

        setAuthToken(access_token)
        setAuthUser(user)
      } catch (error_) {
        const error = error_ as AxiosError<{ message?: string }>

        this.error = error.response?.data?.message ?? error.message ?? 'Error al iniciar sesión'
        throw error_
      } finally {
        this.loading = false
      }
    },

    logout () {
      this.user = null
      this.token = null
      this.error = null
      clearAuthToken()
      clearAuthUser()
    },

    clearError () {
      this.error = null
    },
  },
})
