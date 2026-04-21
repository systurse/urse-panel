import axios, { type AxiosRequestConfig, type AxiosResponse } from 'axios'
import { getAuthToken } from '@/services/storage'

export const http = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  headers: {
    'Accept': 'application/json',
    'Content-Type': 'application/json',
  },
})

http.interceptors.request.use(config => {
  const token = getAuthToken()

  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  } else if (config.headers?.Authorization) {
    delete config.headers.Authorization
  }

  return config
})

export interface HttpClient {
  delete: <TResponse>(url: string, config?: AxiosRequestConfig) => Promise<TResponse>
  get: <TResponse>(url: string, config?: AxiosRequestConfig) => Promise<TResponse>
  patch: <TResponse, TPayload = unknown>(url: string, payload?: TPayload, config?: AxiosRequestConfig) => Promise<TResponse>
  post: <TResponse, TPayload = unknown>(url: string, payload?: TPayload, config?: AxiosRequestConfig) => Promise<TResponse>
  put: <TResponse, TPayload = unknown>(url: string, payload?: TPayload, config?: AxiosRequestConfig) => Promise<TResponse>
}

function unwrapData<TResponse> (request: Promise<AxiosResponse<TResponse>>) {
  return request.then(({ data }) => data)
}

export const httpClient: HttpClient = {
  delete<TResponse> (url: string, config?: AxiosRequestConfig) {
    return unwrapData(http.delete<TResponse>(url, config))
  },
  get<TResponse> (url: string, config?: AxiosRequestConfig) {
    return unwrapData(http.get<TResponse>(url, config))
  },
  patch<TResponse, TPayload = unknown> (url: string, payload?: TPayload, config?: AxiosRequestConfig) {
    return unwrapData(http.patch<TResponse, AxiosResponse<TResponse>, TPayload>(url, payload, config))
  },
  post<TResponse, TPayload = unknown> (url: string, payload?: TPayload, config?: AxiosRequestConfig) {
    return unwrapData(http.post<TResponse, AxiosResponse<TResponse>, TPayload>(url, payload, config))
  },
  put<TResponse, TPayload = unknown> (url: string, payload?: TPayload, config?: AxiosRequestConfig) {
    return unwrapData(http.put<TResponse, AxiosResponse<TResponse>, TPayload>(url, payload, config))
  },
}
