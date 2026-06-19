import Echo from 'laravel-echo'
import Pusher from 'pusher-js'
import { getAuthToken } from '@/services/storage'

let echoInstance: Echo<any> | null = null

export function initEcho () {
  if (echoInstance) return echoInstance

  ;(window as any).Pusher = Pusher

  const token = getAuthToken()

  echoInstance = new Echo({
    broadcaster: 'reverb',
    key: import.meta.env.VITE_REVERB_APP_KEY,
    wsHost: import.meta.env.VITE_REVERB_HOST,
    wsPort: import.meta.env.VITE_REVERB_PORT,
    forceTLS: false,
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

export function leaveChatSession (sessionToken: string) {
  const echo = getEcho()
  echo.leave(`chat.${sessionToken}`)
}

export function listenToSupportChats (callback: (event: ChatMessageEvent) => void) {
  const echo = getEcho()
  return echo.private('support.chats').listen('.chat.message', callback)
}

export function leaveSupportChats () {
  const echo = getEcho()
  echo.leave('private-support.chats')
}
