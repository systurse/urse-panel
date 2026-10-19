import Echo from 'laravel-echo'
import Pusher from 'pusher-js'
import { getAuthToken } from '@/services/storage'

let echoInstance: Echo<any> | null = null

export function initEcho () {
  if (echoInstance) return echoInstance

  ;(window as any).Pusher = Pusher

  const token = getAuthToken()

  const wsPort = Number(import.meta.env.VITE_REVERB_PORT)
  const wssPort = Number(import.meta.env.VITE_REVERB_WSS_PORT ?? import.meta.env.VITE_REVERB_PORT)
  const forceTLS = wssPort === 443

  echoInstance = new Echo({
    broadcaster: 'reverb',
    key: import.meta.env.VITE_REVERB_APP_KEY,
    wsHost: import.meta.env.VITE_REVERB_HOST,
    wsPort,
    wssPort,
    forceTLS,
    enabledTransports: ['ws', 'wss'],
    authEndpoint: `${import.meta.env.VITE_API_URL}/broadcasting/auth`,
    auth: {
      headers: {
        Authorization: token ? `Bearer ${token}` : '',
      },
    },
  } as any)

  ;(window as any).Echo = echoInstance

  return echoInstance
}

export function getEcho () {
  if (!echoInstance) {
    return initEcho()
  }
  return echoInstance
}

export function resetEcho () {
  if (echoInstance) {
    echoInstance.disconnect()
    echoInstance = null
  }
}

export interface StudentRegisteredEvent {
  student: {
    id: number
    matricula: string
    name: string
    career: string
    status: 'pending' | 'active' | 'suspended'
  }
  stats: {
    total: number
    by_status: {
      pending: number
      active: number
      suspended: number
    }
    by_career: Record<string, number>
  }
}

export function listenToStudentRegistered (callback: (event: StudentRegisteredEvent) => void) {
  const echo = getEcho()
  return echo.channel('students').listen('.student.registered', callback)
}

export interface ChatMessageEvent {
  session_token: string
  message: {
    sender_type: 'student' | 'support'
    sender_name: string
    body: string
    created_at: string
  }
}

export function listenToChatSession (sessionToken: string, callback: (event: ChatMessageEvent) => void) {
  const echo = getEcho()
  return echo.channel(`chat.${sessionToken}`).listen('.chat.message', callback)
}

export interface ChatMessagesReadEvent {
  session_id: number
  session_token: string
  read_by: 'student' | 'support'
  read_at: string
}

export function listenToChatSessionRead (sessionToken: string, callback: (event: ChatMessagesReadEvent) => void) {
  const echo = getEcho()
  return echo.channel(`chat.${sessionToken}`).listen('.chat.messages.read', callback)
}

export function leaveChatSession (sessionToken: string) {
  const echo = getEcho()
  echo.leave(`chat.${sessionToken}`)
}

export function listenToSupportChats (callback: (event: ChatMessageEvent) => void) {
  const echo = getEcho()
  return echo.private('support.chats').listen('.chat.message', callback)
}

export function listenToSupportChatsRead (callback: (event: ChatMessagesReadEvent) => void) {
  const echo = getEcho()
  return echo.private('support.chats').listen('.chat.messages.read', callback)
}

export function leaveSupportChats () {
  const echo = getEcho()
  echo.leave('private-support.chats')
}

export interface DealChatMessageEvent {
  deal_id: number
  is_open: boolean
  message: {
    id: number
    sender_type: 'contact' | 'staff' | 'system'
    sender_name: string
    body: string | null
    created_at: string
    attachments: Array<{ id: number, original_name: string, mime_type: string, size: number }>
  }
}

/** Solicitante: canal público, el token secreto de la liga hace de llave. */
export function listenToPublicDealChat (token: string, callback: (event: DealChatMessageEvent) => void) {
  const echo = getEcho()
  return echo.channel(`crm.deal-chat.${token}`).listen('.deal-chat.message', callback)
}

export function leavePublicDealChat (token: string) {
  const echo = getEcho()
  echo.leave(`crm.deal-chat.${token}`)
}

/** Personal: canal privado autorizado por la visibilidad de la negociación. */
export function listenToStaffDealChat (dealId: number, callback: (event: DealChatMessageEvent) => void) {
  const echo = getEcho()
  return echo.private(`crm.deals.${dealId}.chat`).listen('.deal-chat.message', callback)
}

export function leaveStaffDealChat (dealId: number) {
  const echo = getEcho()
  echo.leave(`private-crm.deals.${dealId}.chat`)
}
