<template>
  <div class="support-page">
    <!-- Lista de sesiones -->
    <div class="sessions-panel">
      <div class="sessions-header">
        <h3 class="sessions-title">Chats</h3>
        <v-chip :color="activeSessions.length ? 'warning' : 'default'" size="small">
          {{ activeSessions.length }} activos
        </v-chip>
      </div>

      <div v-if="loadingSessions" class="sessions-loading">
        <v-progress-circular indeterminate color="primary" size="32" />
      </div>

      <div v-else-if="sessions.length === 0" class="sessions-empty">
        <v-icon size="40" color="#bdbdbd">mdi-chat-sleep-outline</v-icon>
        <p>Sin sesiones activas</p>
      </div>

      <div v-else class="sessions-list">
        <div
          v-for="s in sessions"
          :key="s.id"
          class="session-item"
          :class="{ 'session-active': selectedId === s.id }"
          @click="selectSession(s.id)"
        >
          <div class="session-item-header">
            <span class="session-name">{{ s.guest_name || s.student_name || 'Sin nombre' }}</span>
            <v-chip :color="statusColor(s.status)" size="x-small" label>
              {{ statusLabel(s.status) }}
            </v-chip>
          </div>
          <div class="session-contact">
            <v-icon v-if="s.contact_whatsapp" size="13" color="#25D366">mdi-whatsapp</v-icon>
            <v-icon v-else-if="s.contact_value?.includes('@')" size="13" color="#666">mdi-email-outline</v-icon>
            <v-icon v-else-if="s.contact_value" size="13" color="#666">mdi-phone-outline</v-icon>
            <span>{{ s.contact_value || '—' }}</span>
          </div>
          <div class="session-last-msg">
            {{ s.last_message?.body || 'Sin mensajes' }}
          </div>
          <div class="session-time">{{ formatTime(s.created_at) }}</div>
        </div>
      </div>
    </div>

    <!-- Panel de conversación -->
    <div class="conversation-panel">
      <div v-if="!selectedSession" class="conversation-empty">
        <v-icon size="64" color="#bdbdbd">mdi-chat-outline</v-icon>
        <p>Selecciona una sesión para ver la conversación</p>
      </div>

      <template v-else>
        <!-- Header de la conversación -->
        <div class="conversation-header">
          <div>
            <div class="conv-title">{{ selectedSession.guest_name || selectedSession.student_name || 'Sin nombre' }}</div>
            <div class="conv-sub">
              <v-chip :color="statusColor(selectedSession.status)" size="x-small" label class="mr-2">
                {{ statusLabel(selectedSession.status) }}
              </v-chip>
              <span v-if="selectedSession.contact_value" class="conv-contact">
                <v-icon v-if="selectedSession.contact_whatsapp" size="14" color="#25D366">mdi-whatsapp</v-icon>
                <v-icon v-else-if="selectedSession.contact_value.includes('@')" size="14" color="#666">mdi-email-outline</v-icon>
                <v-icon v-else size="14" color="#666">mdi-phone-outline</v-icon>
                {{ selectedSession.contact_value }}
              </span>
            </div>
          </div>
          <v-btn
            v-if="selectedSession.status !== 'closed'"
            variant="outlined"
            color="error"
            size="small"
            prepend-icon="mdi-close-circle-outline"
            :loading="closing"
            @click="closeSession"
          >
            Cerrar chat
          </v-btn>
        </div>

        <!-- Mensajes -->
        <div ref="messagesEl" class="conversation-messages">
          <div
            v-for="(msg, i) in selectedMessages"
            :key="i"
            class="msg-row"
            :class="msg.sender_type === 'support' ? 'row-support' : 'row-student'"
          >
            <div
              class="msg-bubble"
              :class="msg.sender_type === 'support' ? 'bubble-support' : 'bubble-student'"
            >
              <div class="msg-sender">{{ msg.sender_name }}</div>
              <div class="msg-body">{{ msg.body }}</div>
              <div class="msg-time">{{ formatTime(msg.created_at) }}</div>
            </div>
          </div>

          <div v-if="selectedSession.status === 'closed'" class="conv-closed-notice">
            Sesión cerrada
          </div>
        </div>

        <!-- Input -->
        <div v-if="selectedSession.status !== 'closed'" class="conversation-input">
          <v-text-field
            v-model="replyText"
            placeholder="Escribe una respuesta..."
            variant="outlined"
            density="compact"
            hide-details
            :disabled="sending"
            @keyup.enter="sendReply"
          />
          <v-btn
            icon="mdi-send"
            color="primary"
            variant="flat"
            size="40"
            :loading="sending"
            :disabled="!replyText.trim()"
            @click="sendReply"
          />
        </div>
      </template>
    </div>

    <!-- Alert -->
    <v-snackbar v-model="snackbar.show" :color="snackbar.color" timeout="3000" location="top">
      {{ snackbar.text }}
    </v-snackbar>
  </div>
</template>

<script setup lang="ts">
  import { ref, computed, nextTick, onMounted, onBeforeUnmount } from 'vue'
  import { chatSupportService, type ChatSession, type ChatMessage } from '@/services/chatService'
  import { listenToSupportChats, leaveSupportChats } from '@/services/websocket'

  const sessions = ref<ChatSession[]>([])
  const selectedId = ref<number | null>(null)
  const selectedMessages = ref<ChatMessage[]>([])
  const loadingSessions = ref(false)
  const sending = ref(false)
  const closing = ref(false)
  const replyText = ref('')
  const messagesEl = ref<HTMLElement | null>(null)
  const snackbar = ref({ show: false, text: '', color: 'success' })

  const activeSessions = computed(() => sessions.value.filter(s => s.status !== 'closed'))
  const selectedSession = computed(() => sessions.value.find(s => s.id === selectedId.value) ?? null)

  function statusColor (status: string) {
    if (status === 'active') return 'success'
    if (status === 'waiting') return 'warning'
    return 'default'
  }

  function statusLabel (status: string) {
    if (status === 'active') return 'Activo'
    if (status === 'waiting') return 'En espera'
    return 'Cerrado'
  }

  function formatTime (dateStr: string) {
    return new Date(dateStr).toLocaleString('es-MX', {
      day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit',
    })
  }

  async function loadSessions () {
    loadingSessions.value = true
    try {
      sessions.value = await chatSupportService.getSessions()
    } finally {
      loadingSessions.value = false
    }
  }

  async function selectSession (id: number) {
    selectedId.value = id
    selectedMessages.value = []
    try {
      const full = await chatSupportService.getSession(id)
      selectedMessages.value = full.messages ?? []
      // Actualizar status en lista
      const idx = sessions.value.findIndex(s => s.id === id)
      if (idx !== -1) sessions.value[idx] = { ...sessions.value[idx], ...full }
      scrollToBottom()
    } catch {
      notify('Error al cargar la sesión', 'error')
    }
  }

  async function sendReply () {
    if (!replyText.value.trim() || !selectedId.value) return
    const body = replyText.value.trim()
    replyText.value = ''
    sending.value = true
    try {
      await chatSupportService.sendMessage(selectedId.value, body)
    } finally {
      sending.value = false
    }
  }

  async function closeSession () {
    if (!selectedId.value) return
    closing.value = true
    try {
      await chatSupportService.closeSession(selectedId.value)
      const idx = sessions.value.findIndex(s => s.id === selectedId.value)
      if (idx !== -1) sessions.value[idx].status = 'closed'
      notify('Sesión cerrada')
    } catch {
      notify('Error al cerrar la sesión', 'error')
    } finally {
      closing.value = false
    }
  }

  function scrollToBottom () {
    nextTick(() => {
      if (messagesEl.value) messagesEl.value.scrollTop = messagesEl.value.scrollHeight
    })
  }

  function notify (text: string, color = 'success') {
    snackbar.value = { show: true, text, color }
  }

  onMounted(async () => {
    await loadSessions()

    try {
      listenToSupportChats((event) => {
        // Nuevo mensaje: actualizar lista y conversación activa
        const token = event.session_token
        const idx = sessions.value.findIndex(s => s.session_token === token)
        if (idx !== -1) {
          sessions.value[idx].last_message = event.message as any
        } else {
          loadSessions()
        }

        if (selectedSession.value?.session_token === token) {
          selectedMessages.value.push(event.message as any)
          scrollToBottom()
        }
      })
    } catch (err) {
      console.error('Error conectando a WebSocket de soporte:', err)
    }
  })

  onBeforeUnmount(leaveSupportChats)
</script>

<style scoped>
.support-page {
  display: grid;
  grid-template-columns: 300px 1fr;
  height: calc(100vh - 64px);
  gap: 0;
  background: #f4f6f9;
}

/* ── Panel de sesiones ── */
.sessions-panel {
  background: #fff;
  border-right: 1px solid #e0e0e0;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.sessions-header {
  padding: 16px;
  border-bottom: 1px solid #e0e0e0;
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-shrink: 0;
}

.sessions-title {
  margin: 0;
  font-size: 1.1rem;
  font-weight: 700;
  color: #1e3a5f;
}

.sessions-loading,
.sessions-empty {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 8px;
  color: #9e9e9e;
  font-size: 0.9rem;
}

.sessions-list {
  flex: 1;
  overflow-y: auto;
}

.session-item {
  padding: 12px 16px;
  cursor: pointer;
  border-bottom: 1px solid #f0f0f0;
  transition: background 0.15s;
}

.session-item:hover { background: #f7f8fa; }
.session-item.session-active { background: #e8edf5; }

.session-item-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 4px;
}

.session-name {
  font-weight: 600;
  font-size: 0.9rem;
  color: #111;
}

.session-contact {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 0.78rem;
  color: #555;
  margin-bottom: 2px;
}

.session-last-msg {
  font-size: 0.8rem;
  color: #666;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.session-time {
  font-size: 0.72rem;
  color: #9e9e9e;
  margin-top: 2px;
}

/* ── Panel conversación ── */
.conversation-panel {
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.conversation-empty {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 12px;
  color: #9e9e9e;
  font-size: 0.95rem;
}

.conversation-header {
  padding: 14px 20px;
  background: #fff;
  border-bottom: 1px solid #e0e0e0;
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-shrink: 0;
}

.conv-title {
  font-weight: 700;
  font-size: 1rem;
  color: #1e3a5f;
}

.conv-sub {
  margin-top: 4px;
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 4px;
}

.conv-contact {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  font-size: 0.82rem;
  color: #555;
}

.conversation-messages {
  flex: 1;
  overflow-y: auto;
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 10px;
  background: #f7f8fa;
}

.msg-row { display: flex; }
.row-support { justify-content: flex-end; }
.row-student { justify-content: flex-start; }

.msg-bubble {
  max-width: 60%;
  padding: 10px 14px;
  border-radius: 12px;
  font-size: 0.88rem;
}

.bubble-support {
  background: #1e3a5f;
  color: #fff;
  border-bottom-right-radius: 4px;
}

.bubble-student {
  background: #fff;
  color: #111;
  border: 1px solid #e0e0e0;
  border-bottom-left-radius: 4px;
}

.msg-sender {
  font-size: 0.72rem;
  font-weight: 700;
  opacity: 0.7;
  margin-bottom: 4px;
}

.msg-body { line-height: 1.45; }

.msg-time {
  font-size: 0.7rem;
  opacity: 0.55;
  margin-top: 4px;
  text-align: right;
}

.conv-closed-notice {
  text-align: center;
  font-size: 0.8rem;
  color: #9e9e9e;
  padding: 8px;
  background: #f0f0f0;
  border-radius: 8px;
}

.conversation-input {
  padding: 12px 16px;
  display: flex;
  align-items: center;
  gap: 8px;
  border-top: 1px solid #e0e0e0;
  background: #fff;
  flex-shrink: 0;
}

@media (max-width: 768px) {
  .support-page {
    grid-template-columns: 1fr;
  }
  .sessions-panel {
    display: none;
  }
}
</style>
