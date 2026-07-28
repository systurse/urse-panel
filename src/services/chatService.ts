import { publicHttpClient, httpClient } from '@/services/http'

const PUBLIC = '/api/v1/public/chat/sessions'
const SUPPORT = '/api/v1/chat/sessions'

export interface ChatMessage {
  id?: number
  sender_type: 'student' | 'support'
  sender_name: string
  body: string
  created_at: string
  read_at?: string | null
}

export interface ChatSession {
  id: number
  session_token: string
  status: 'waiting' | 'active' | 'closed'
  guest_name?: string
  student_name?: string
  contact_value?: string
  contact_whatsapp?: boolean
  created_at: string
  last_message?: ChatMessage
  messages?: ChatMessage[]
  recoverable?: boolean
  guest_online?: boolean
}

export interface CreateSessionPayload {
  guest_name: string
  contact_value: string
  contact_whatsapp?: boolean
  student_id?: number | null
}

// ── Alumno (público) ──────────────────────────────────────

export const chatPublicService = {
  async createSession (payload: CreateSessionPayload): Promise<ChatSession> {
    return publicHttpClient.post(PUBLIC, payload)
  },

  async getSession (token: string): Promise<ChatSession> {
    return publicHttpClient.get(`${PUBLIC}/${token}`)
  },

  async sendMessage (token: string, body: string): Promise<ChatMessage> {
    return publicHttpClient.post(`${PUBLIC}/${token}/messages`, { body })
  },

  async heartbeat (token: string): Promise<void> {
    return publicHttpClient.post(`${PUBLIC}/${token}/heartbeat`, {})
  },

  async markRead (token: string): Promise<void> {
    return publicHttpClient.post(`${PUBLIC}/${token}/read`, {})
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

  async markRead (id: number): Promise<void> {
    return httpClient.post(`${SUPPORT}/${id}/read`, {})
  },
}
