import type { DealChat, DealChatAttachment, DealChatMessage } from '@/modules/crm/types'
import type { DealChatMessageEvent } from '@/services/websocket'
import { computed, onBeforeUnmount, ref } from 'vue'
import * as crm from '@/modules/crm/service'
import {
  leavePublicDealChat,
  leaveStaffDealChat,
  listenToPublicDealChat,
  listenToStaffDealChat,
} from '@/services/websocket'

/**
 * staff: el personal desde el detalle de la negociación (rutas privadas).
 * contact: el solicitante con la liga secreta, tenga o no cuenta.
 */
export type DealChatTarget = { mode: 'staff', dealId: number } | { mode: 'contact', token: string }

const HEARTBEAT_MS = 20_000
const FALLBACK_REFRESH_MS = 60_000

/**
 * Estado del chat de seguimiento de una negociación: carga el historial,
 * envía mensajes con adjuntos, escucha por Reverb y avisa presencia con
 * heartbeat. Si el websocket no conecta, refresca el historial cada minuto.
 */
export function useDealChat (target: DealChatTarget) {
  const chat = ref<DealChat | null>(null)
  const loading = ref(false)
  const sending = ref(false)
  const error = ref<string | null>(null)

  let heartbeatTimer: ReturnType<typeof setInterval> | null = null
  let refreshTimer: ReturnType<typeof setInterval> | null = null
  let listening = false

  const messages = computed(() => chat.value?.messages ?? [])
  const isOpen = computed(() => chat.value?.is_open ?? false)
  const otherPartyOnline = computed(() => target.mode === 'staff' ? chat.value?.contact_online ?? false : chat.value?.staff_online ?? false)

  function extractError (error_: any, fallback: string): string {
    const data = error_?.response?.data
    const validation = data?.errors ? Object.values(data.errors as Record<string, string[]>).flat()[0] : null
    return validation ?? data?.message ?? fallback
  }

  function fetchChat () {
    return target.mode === 'staff' ? crm.getDealChat(target.dealId) : crm.getPublicDealChat(target.token)
  }

  async function load (silent = false) {
    if (!silent) {
      loading.value = true
    }
    error.value = null

    try {
      chat.value = await fetchChat()
    } catch (error_: any) {
      if (!silent) {
        error.value = extractError(error_, 'No fue posible cargar el chat')
      }
    } finally {
      loading.value = false
    }
  }

  function appendMessage (message: DealChatMessage) {
    if (!chat.value || chat.value.messages.some(existing => existing.id === message.id)) {
      return
    }
    chat.value.messages.push(message)
  }

  async function send (body: string, attachments: File[] = []) {
    sending.value = true
    error.value = null

    try {
      const payload = { body: body.trim() || null, attachments }
      const message = target.mode === 'staff'
        ? await crm.sendDealChatMessage(target.dealId, payload)
        : await crm.sendPublicDealChatMessage(target.token, payload)
      appendMessage(message)
      return true
    } catch (error_: any) {
      error.value = extractError(error_, 'No fue posible enviar el mensaje')
      // 410: el ticket se cerró mientras escribía; recarga para mostrarlo como histórico
      if (error_?.response?.status === 410) {
        await load(true)
      }
      return false
    } finally {
      sending.value = false
    }
  }

  async function download (attachment: DealChatAttachment) {
    try {
      const blob = target.mode === 'staff'
        ? await crm.downloadAttachment(crm.dealChatAttachmentUrl(attachment.id))
        : await crm.downloadPublicAttachment(crm.publicDealChatAttachmentUrl(target.token, attachment.id))

      const url = URL.createObjectURL(blob)
      const anchor = document.createElement('a')
      anchor.href = url
      anchor.download = attachment.original_name
      anchor.click()
      URL.revokeObjectURL(url)
    } catch (error_: any) {
      error.value = extractError(error_, 'No fue posible descargar el archivo')
    }
  }

  function onRealtimeMessage (event: DealChatMessageEvent) {
    appendMessage(event.message)
    if (chat.value) {
      chat.value.is_open = event.is_open
    }
  }

  function heartbeat () {
    const request = target.mode === 'staff' ? crm.dealChatHeartbeat(target.dealId) : crm.publicDealChatHeartbeat(target.token)
    request.catch(() => {})
  }

  function start () {
    // El realtime es una mejora opcional: si Reverb no está disponible el refresco periódico cubre
    try {
      if (target.mode === 'staff') {
        listenToStaffDealChat(target.dealId, onRealtimeMessage)
      } else {
        listenToPublicDealChat(target.token, onRealtimeMessage)
      }
      listening = true
    } catch {
      listening = false
    }

    heartbeatTimer = setInterval(heartbeat, HEARTBEAT_MS)
    refreshTimer = setInterval(() => load(true), FALLBACK_REFRESH_MS)
  }

  function stop () {
    if (heartbeatTimer) {
      clearInterval(heartbeatTimer)
    }
    if (refreshTimer) {
      clearInterval(refreshTimer)
    }

    if (listening) {
      try {
        if (target.mode === 'staff') {
          leaveStaffDealChat(target.dealId)
        } else {
          leavePublicDealChat(target.token)
        }
      } catch {
        // sin conexión que cerrar
      }
      listening = false
    }
  }

  onBeforeUnmount(stop)

  return {
    chat,
    download,
    error,
    isOpen,
    load,
    loading,
    messages,
    otherPartyOnline,
    send,
    sending,
    start,
    stop,
  }
}
