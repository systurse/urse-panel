import Echo from 'laravel-echo'
import Pusher from 'pusher-js'

let echoInstance: Echo | null = null

export function initEcho () {
  if (echoInstance) return echoInstance

  window.Pusher = Pusher

  echoInstance = new Echo({
    broadcaster: 'reverb',
    key: import.meta.env.VITE_REVERB_APP_KEY,
    wsHost: import.meta.env.VITE_REVERB_HOST,
    wsPort: import.meta.env.VITE_REVERB_PORT,
    wssPort: import.meta.env.VITE_REVERB_WSS_PORT,
    forceTLS: false,
    enabledTransports: ['ws', 'wss'],
  } as any)

  return echoInstance
}

export function getEcho () {
  if (!echoInstance) {
    return initEcho()
  }
  return echoInstance
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
