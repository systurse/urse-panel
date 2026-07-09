<template>
  <!-- Botón flotante -->
  <div class="chat-fab-wrapper">
    <v-btn
      class="chat-fab"
      :color="open ? 'grey-darken-2' : '#1e3a5f'"
      icon
      size="56"
      elevation="6"
      @click="toggleChat"
    >
      <v-icon size="28">{{ open ? 'mdi-close' : 'mdi-chat-outline' }}</v-icon>
      <v-badge
        v-if="!open && unread > 0"
        :content="unread"
        color="error"
        floating
      />
    </v-btn>

    <!-- Ventana del chat -->
    <Transition name="chat-slide">
      <div v-if="open" class="chat-window">
        <!-- Header -->
        <div class="chat-header">
          <div class="chat-header-info">
            <v-icon color="white" size="20">mdi-headset</v-icon>
            <div>
              <div class="chat-header-title">Soporte URSE</div>
              <div class="chat-header-sub">{{ statusLabel }}</div>
            </div>
          </div>
        </div>

        <!-- Mensajes -->
        <div ref="messagesEl" class="chat-messages">
          <div v-if="!session" class="chat-start">
            <v-icon size="48" color="#1e3a5f" class="mb-3">mdi-chat-question-outline</v-icon>
            <p class="mb-4">¿Tienes dudas? Escribe tus datos e inicia el chat.</p>
            <v-text-field
              v-model="guestName"
              label="Tu nombre"
              placeholder="Ej: Juan Pérez"
              variant="outlined"
              density="compact"
              hide-details
              class="mb-3"
              style="width: 100%"
            />
            <v-text-field
              v-model="contactValue"
              label="Correo o teléfono"
              placeholder="Ej: juan@gmail.com o 9511234567"
              variant="outlined"
              density="compact"
              hide-details
              class="mb-2"
              style="width: 100%"
            />
            <v-checkbox
              v-if="isPhone"
              v-model="contactWhatsapp"
              label="Prefiero contacto por WhatsApp"
              density="compact"
              hide-details
              color="#1e3a5f"
              class="mb-2"
            />
            <v-btn
              color="#1e3a5f"
              variant="flat"
              rounded="lg"
              :loading="starting"
              :disabled="!canStart"
              block
              @click="startSession"
            >
              Iniciar chat
            </v-btn>
          </div>

          <template v-else>
            <div
              v-for="(msg, i) in messages"
              :key="i"
              class="chat-bubble-row"
              :class="msg.sender_type === 'student' ? 'row-student' : 'row-support'"
            >
              <div
                class="chat-bubble"
                :class="msg.sender_type === 'student' ? 'bubble-student' : 'bubble-support'"
              >
                <div class="bubble-body">{{ msg.body }}</div>
                <div class="bubble-time">{{ formatTime(msg.created_at) }}</div>
              </div>
            </div>

            <div v-if="session.status === 'closed'" class="chat-closed-notice">
              Esta conversación fue cerrada.
            </div>
          </template>
        </div>

        <!-- Input -->
        <div v-if="session && session.status !== 'closed'" class="chat-input">
          <v-text-field
            v-model="inputText"
            placeholder="Escribe un mensaje..."
            variant="outlined"
            density="compact"
            hide-details
            :disabled="sending"
            @keyup.enter="sendMessage"
          />
          <v-btn
            icon="mdi-send"
            color="#1e3a5f"
            variant="flat"
            size="40"
            :loading="sending"
            :disabled="!inputText.trim()"
            @click="sendMessage"
          />
        </div>
      </div>
    </Transition>
  </div>
</template>

<script setup lang="ts">
  import { ref, computed, nextTick, onMounted, onBeforeUnmount } from 'vue'
  import { chatPublicService, type ChatSession, type ChatMessage } from '@/services/chatService'
  import { listenToChatSession, leaveChatSession } from '@/services/websocket'

  const SESSION_KEY = 'chat_session_token'

  const open = ref(false)
  const starting = ref(false)
  const guestName = ref('')
  const contactValue = ref('')
  const contactWhatsapp = ref(false)
  const sending = ref(false)
  const unread = ref(0)
  const inputText = ref('')
  const session = ref<ChatSession | null>(null)
  const messages = ref<ChatMessage[]>([])
  const messagesEl = ref<HTMLElement | null>(null)

  const isPhone = computed(() => /^\d+$/.test(contactValue.value.trim()))
  const canStart = computed(() => !!guestName.value.trim() && !!contactValue.value.trim())

  const statusLabel = computed(() => {
    if (!session.value) return 'En línea'
    if (session.value.status === 'closed') return 'Sesión cerrada'
    if (session.value.status === 'waiting') return 'Esperando soporte...'
    return 'Conectado con soporte'
  })

  async function restoreSession () {
    const token = localStorage.getItem(SESSION_KEY)
    if (!token) return
    try {
      const s = await chatPublicService.getSession(token)
      if (s.recoverable === false) {
        localStorage.removeItem(SESSION_KEY)
        return
      }
      session.value = s
      messages.value = s.messages ?? []
      subscribeToChannel(token)
    } catch {
      localStorage.removeItem(SESSION_KEY)
    }
  }

  async function startSession () {
    if (!canStart.value) return
    starting.value = true
    try {
      const payload: Parameters<typeof chatPublicService.createSession>[0] = {
        guest_name: guestName.value.trim(),
        contact_value: contactValue.value.trim(),
      }
      if (isPhone.value) payload.contact_whatsapp = contactWhatsapp.value
      const s = await chatPublicService.createSession(payload)
      session.value = s
      messages.value = []
      localStorage.setItem(SESSION_KEY, s.session_token)
      subscribeToChannel(s.session_token)
    } finally {
      starting.value = false
    }
  }

  async function sendMessage () {
    if (!inputText.value.trim() || !session.value) return
    const body = inputText.value.trim()
    inputText.value = ''
    sending.value = true
    try {
      const msg = await chatPublicService.sendMessage(session.value.session_token, body)
      messages.value.push(msg)
      scrollToBottom()
    } catch (err: any) {
      const status = err?.response?.status
      if (status === 404 || status === 422 || status === 403) {
        localStorage.removeItem(SESSION_KEY)
        if (session.value) leaveChatSession(session.value.session_token)
        session.value = null
        messages.value = []
        guestName.value = ''
        contactValue.value = ''
        contactWhatsapp.value = false
      }
    } finally {
      sending.value = false
    }
  }

  function subscribeToChannel (token: string) {
    listenToChatSession(token, (event) => {
      if (event.message.sender_type === 'support') {
        messages.value.push({
          sender_type: event.message.sender_type,
          sender_name: event.message.sender_name,
          body: event.message.body,
          created_at: event.message.created_at,
        })
        if (!open.value) unread.value++
        scrollToBottom()
      }
    })
  }

  function toggleChat () {
    open.value = !open.value
    if (open.value) {
      unread.value = 0
      nextTick(scrollToBottom)
    }
  }

  function scrollToBottom () {
    nextTick(() => {
      if (messagesEl.value) {
        messagesEl.value.scrollTop = messagesEl.value.scrollHeight
      }
    })
  }

  function formatTime (dateStr: string) {
    return new Date(dateStr).toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' })
  }

  onMounted(restoreSession)

  onBeforeUnmount(() => {
    if (session.value) leaveChatSession(session.value.session_token)
  })
</script>

<style scoped>
.chat-fab-wrapper {
  position: fixed;
  bottom: 28px;
  right: 28px;
  z-index: 9999;
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 12px;
}

.chat-fab {
  border-radius: 50% !important;
}

/* Ventana */
.chat-window {
  position: absolute;
  bottom: 68px;
  right: 0;
  width: 340px;
  height: 480px;
  background: #ffffff;
  border-radius: 16px;
  box-shadow: 0 8px 32px rgb(0 0 0 / 0.18);
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

/* Header */
.chat-header {
  background: #1e3a5f;
  padding: 14px 16px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-shrink: 0;
}
.chat-header-info {
  display: flex;
  align-items: center;
  gap: 10px;
  color: #fff;
}
.chat-header-title {
  font-weight: 700;
  font-size: 0.95rem;
}
.chat-header-sub {
  font-size: 0.75rem;
  opacity: 0.8;
}

/* Mensajes */
.chat-messages {
  flex: 1;
  overflow-y: auto;
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 8px;
  background: #f7f8fa;
}

.chat-start {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
  color: #5e5e5e;
  font-size: 0.9rem;
  gap: 8px;
}

.chat-bubble-row {
  display: flex;
}
.row-student { justify-content: flex-end; }
.row-support { justify-content: flex-start; }

.chat-bubble {
  max-width: 75%;
  padding: 8px 12px;
  border-radius: 12px;
  font-size: 0.88rem;
  line-height: 1.4;
}
.bubble-student {
  background: #1e3a5f;
  color: #fff;
  border-bottom-right-radius: 4px;
}
.bubble-support {
  background: #fff;
  color: #111;
  border: 1px solid #e0e0e0;
  border-bottom-left-radius: 4px;
}
.bubble-time {
  font-size: 0.7rem;
  opacity: 0.6;
  margin-top: 4px;
  text-align: right;
}

.chat-closed-notice {
  text-align: center;
  font-size: 0.8rem;
  color: #9e9e9e;
  padding: 8px;
  background: #f0f0f0;
  border-radius: 8px;
}

/* Input */
.chat-input {
  padding: 10px 12px;
  display: flex;
  align-items: center;
  gap: 8px;
  border-top: 1px solid #e0e0e0;
  background: #fff;
  flex-shrink: 0;
}

/* Animación */
.chat-slide-enter-active,
.chat-slide-leave-active {
  transition: all 0.25s ease;
}
.chat-slide-enter-from,
.chat-slide-leave-to {
  opacity: 0;
  transform: translateY(16px) scale(0.97);
}

@media (max-width: 480px) {
  .chat-window {
    width: calc(100vw - 32px);
    right: -12px;
  }
}
</style>
