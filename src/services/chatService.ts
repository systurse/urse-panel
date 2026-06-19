import { publicHttpClient, httpClient } from '@/services/http'

const PUBLIC = '/api/v1/public/chat/sessions'
const SUPPORT = '/api/v1/chat/sessions'

export interface ChatMessage {
  id?: number
  sender_type: 'student' | 'support'
  sender_name: string
  body: string
  created_at: string
}

export interface ChatSession {
  id: number
  session_token: string
  status: 'waiting' | 'active' | 'closed'
  student_name?: string
  created_at: string
  last_message?: ChatMessage
  messages?: ChatMessage[]
  recoverable?: boolean
}

// ── Alumno (público) ──────────────────────────────────────

export const chatPublicService = {
  async createSession (guestName: string): Promise<ChatSession> {
    return publicHttpClient.post(PUBLIC, { guest_name: guestName })
  },

  async getSession (token: string): Promise<ChatSession> {
    return publicHttpClient.get(`${PUBLIC}/${token}`)
  },

  async sendMessage (token: string, body: string): Promise<ChatMessage> {
    return publicHttpClient.post(`${PUBLIC}/${token}/messages`, { body })
  },
}

// ── Soporte (requiere Bearer token) ──────────────────────

export const chatSupportService = {
  async getSessions (): Promise<ChatSession[]> {
    return httpClient.get(SUPPORT)
  },

  async getSession (id: number): Promise<ChatSession> {
    return httpClient.get(`${SUPPORT}/${id}`)
  },

  async sendMessage (id: number, body: string): Promise<ChatMessage> {
    return httpClient.post(`${SUPPORT}/${id}/messages`, { body })
  },

  async closeSession (id: number): Promise<void> {
    return httpClient.put(`${SUPPORT}/${id}/close`, {})
  },
}
