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

export const publicHttp = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  headers: {
    'Accept': 'application/json',
    'Content-Type': 'application/json',
  },
})

// Requests with responseType 'blob' (e.g. file downloads) also receive error bodies as a
// Blob, so JSON validation errors (message/errors) are otherwise unreadable in the catch block.
async function parseBlobErrorResponse (error: any) {
  const data = error?.response?.data
  if (data instanceof Blob && data.type.includes('json')) {
    try {
      error.response.data = JSON.parse(await data.text())
    } catch {
      // Leave the raw Blob if it can't be parsed as JSON
    }
  }
  return Promise.reject(error)
}

http.interceptors.response.use(response => response, parseBlobErrorResponse)
publicHttp.interceptors.response.use(response => response, parseBlobErrorResponse)

export const publicHttpClient: HttpClient = {
  delete<TResponse> (url: string, config?: AxiosRequestConfig) {
    return unwrapData(publicHttp.delete<TResponse>(url, config))
  },
  get<TResponse> (url: string, config?: AxiosRequestConfig) {
    return unwrapData(publicHttp.get<TResponse>(url, config))
  },
  patch<TResponse, TPayload = unknown> (url: string, payload?: TPayload, config?: AxiosRequestConfig) {
    return unwrapData(publicHttp.patch<TResponse, AxiosResponse<TResponse>, TPayload>(url, payload, config))
  },
  post<TResponse, TPayload = unknown> (url: string, payload?: TPayload, config?: AxiosRequestConfig) {
    return unwrapData(publicHttp.post<TResponse, AxiosResponse<TResponse>, TPayload>(url, payload, config))
  },
  put<TResponse, TPayload = unknown> (url: string, payload?: TPayload, config?: AxiosRequestConfig) {
    return unwrapData(publicHttp.put<TResponse, AxiosResponse<TResponse>, TPayload>(url, payload, config))
  },
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
