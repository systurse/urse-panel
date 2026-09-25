import { ref } from 'vue'

const STORAGE_KEY = 'crm_sound_enabled'

/**
 * El tono se sintetiza con Web Audio en vez de cargar un archivo: así el
 * aviso funciona sin agregar binarios al bundle ni depender de la caché.
 */
const CHIME_NOTES: Array<{ frequency: number, startsAt: number, duration: number }> = [
  { frequency: 880, startsAt: 0, duration: 0.18 },
  { frequency: 1318.51, startsAt: 0.16, duration: 0.32 },
]

function readPreference () {
  try {
    return localStorage.getItem(STORAGE_KEY) !== 'false'
  } catch {
    return true
  }
}

const soundEnabled = ref(readPreference())

let audioContext: AudioContext | null = null

function getAudioContext () {
  const AudioContextClass = window.AudioContext ?? (window as any).webkitAudioContext

  if (!AudioContextClass) {
    return null
  }

  audioContext ??= new AudioContextClass()

  return audioContext
}

/**
 * Aviso sonoro para eventos entrantes del CRM (leads nuevos).
 */
export function useNotificationSound () {
  function setSoundEnabled (enabled: boolean) {
    soundEnabled.value = enabled

    try {
      localStorage.setItem(STORAGE_KEY, String(enabled))
    } catch {
      // Modo privado sin almacenamiento: la preferencia dura la sesión
    }
  }

  function toggleSound () {
    setSoundEnabled(!soundEnabled.value)

    if (soundEnabled.value) {
      // Confirma al usuario cómo suena y, de paso, desbloquea el audio con su clic
      playNotification()
    }
  }

  function playNotification () {
    if (!soundEnabled.value) {
      return
    }

    const context = getAudioContext()

    if (!context) {
      return
    }

    // Los navegadores suspenden el contexto hasta que hay interacción del usuario
    if (context.state === 'suspended') {
      context.resume().catch(() => {})
    }

    for (const note of CHIME_NOTES) {
      const oscillator = context.createOscillator()
      const gain = context.createGain()
      const startsAt = context.currentTime + note.startsAt
      const endsAt = startsAt + note.duration

      oscillator.type = 'sine'
      oscillator.frequency.setValueAtTime(note.frequency, startsAt)

      gain.gain.setValueAtTime(0, startsAt)
      gain.gain.linearRampToValueAtTime(0.18, startsAt + 0.02)
      gain.gain.exponentialRampToValueAtTime(0.0001, endsAt)

      oscillator.connect(gain).connect(context.destination)
      oscillator.start(startsAt)
      oscillator.stop(endsAt)
    }
  }

  return {
    playNotification,
    setSoundEnabled,
    soundEnabled,
    toggleSound,
  }
}
