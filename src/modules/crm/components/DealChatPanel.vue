<template>
  <div class="deal-chat" :style="{ height }">
    <div class="chat-header">
      <v-chip :color="isOpen ? 'success' : 'grey'" size="small" variant="tonal">
        <v-icon :icon="isOpen ? 'mdi-chat-outline' : 'mdi-archive-outline'" size="16" start />
        {{ isOpen ? 'Chat abierto' : 'Histórico' }}
      </v-chip>

      <span v-if="chat && isOpen" class="presence">
        <span class="presence-dot" :class="{ online: otherPartyOnline }" />
        {{ otherPartyLabel }} {{ otherPartyOnline ? 'en línea' : 'desconectado' }}
      </span>

      <v-spacer />

      <v-btn
        density="comfortable"
        icon="mdi-refresh"
        :loading="loading"
        size="small"
        title="Actualizar"
        variant="text"
        @click="load()"
      />
    </div>

    <v-alert
      v-if="error"
      class="mx-3 mt-2"
      closable
      density="compact"
      type="error"
      variant="tonal"
      @click:close="error = null"
    >{{ error }}</v-alert>

    <div ref="scroller" class="chat-messages">
      <div v-if="loading && !chat" class="chat-empty">
        <v-progress-circular color="#1a1a1a" indeterminate size="28" />
      </div>

      <div v-else-if="messages.length === 0" class="chat-empty">
        <v-icon color="grey" icon="mdi-forum-outline" size="36" />
        <span>{{ emptyText }}</span>
      </div>

      <template v-for="message in messages" :key="message.id">
        <div v-if="message.sender_type === 'system'" class="system-row">
          <span>{{ message.body }} · {{ formatTime(message.created_at) }}</span>
        </div>

        <div v-else class="bubble-row" :class="isMine(message) ? 'row-mine' : 'row-theirs'">
          <div class="bubble" :class="isMine(message) ? 'bubble-mine' : 'bubble-theirs'">
            <div v-if="!isMine(message)" class="bubble-author">{{ message.sender_name }}</div>
            <div v-if="message.body" class="bubble-body">{{ message.body }}</div>

            <div v-if="message.attachments.length > 0" class="bubble-files">
              <v-chip
                v-for="attachment in message.attachments"
                :key="attachment.id"
                :color="isMine(message) ? 'white' : undefined"
                prepend-icon="mdi-paperclip"
                size="small"
                variant="tonal"
                @click="download(attachment)"
              >{{ attachment.original_name }}</v-chip>
            </div>

            <div class="bubble-time">{{ formatTime(message.created_at) }}</div>
          </div>
        </div>
      </template>
    </div>

    <form v-if="isOpen && canWrite" class="chat-input" @submit.prevent="submit">
      <div v-if="files.length > 0" class="pending-files">
        <v-chip
          v-for="(file, index) in files"
          :key="`${file.name}-${index}`"
          closable
          size="small"
          @click:close="files.splice(index, 1)"
        >{{ file.name }}</v-chip>
      </div>

      <div class="input-row">
        <v-btn
          density="comfortable"
          icon="mdi-paperclip"
          title="Adjuntar pdf, docx, jpg o png"
          variant="text"
          @click="fileInput?.click()"
        />

        <input
          ref="fileInput"
          accept=".pdf,.docx,.jpg,.jpeg,.png"
          hidden
          multiple
          type="file"
          @change="pickFiles"
        >

        <v-textarea
          v-model="body"
          auto-grow
          density="compact"
          hide-details
          max-rows="5"
          placeholder="Escribe un mensaje…"
          rows="1"
          variant="outlined"
          @keydown.enter.exact.prevent="submit"
        />

        <v-btn
          color="#1a1a1a"
          :disabled="!body.trim() && files.length === 0"
          icon="mdi-send"
          :loading="sending"
          type="submit"
          variant="flat"
        />
      </div>
    </form>

    <div v-else-if="chat && !isOpen" class="chat-closed">
      El ticket está cerrado: esta conversación queda como histórico de solo lectura.
    </div>

    <div v-else-if="chat" class="chat-closed">
      Solo el responsable de la negociación puede escribir en este chat.
    </div>
  </div>
</template>

<script lang="ts" setup>
  import type { DealChat, DealChatMessage } from '@/modules/crm/types'
  import type { DealChatTarget } from '@/modules/crm/useDealChat'
  import { computed, nextTick, onMounted, ref, watch } from 'vue'
  import { useDealChat } from '@/modules/crm/useDealChat'

  const props = withDefaults(defineProps<{
    target: DealChatTarget
    canWrite?: boolean
    height?: string
  }>(), {
    canWrite: true,
    height: '520px',
  })

  const emit = defineEmits<{
    loaded: [chat: DealChat]
  }>()

  const MAX_FILES = 5

  const { chat, download, error, isOpen, load, loading, messages, otherPartyOnline, send, sending, start } = useDealChat(props.target)

  const body = ref('')
  const files = ref<File[]>([])
  const scroller = ref<HTMLElement | null>(null)
  const fileInput = ref<HTMLInputElement | null>(null)

  const ownSender = computed(() => props.target.mode === 'staff' ? 'staff' : 'contact')
  const otherPartyLabel = computed(() => props.target.mode === 'staff' ? 'Solicitante' : 'Soporte')
  const emptyText = computed(() => props.target.mode === 'staff'
    ? 'Aún no hay mensajes. Escribe para dar seguimiento al solicitante.'
    : 'Aún no hay mensajes. Escribe aquí para dar seguimiento a tu solicitud.')

  function isMine (message: DealChatMessage) {
    return message.sender_type === ownSender.value
  }

  function formatTime (value: string) {
    return new Date(value).toLocaleString('es-MX', { dateStyle: 'short', timeStyle: 'short' })
  }

  function pickFiles (event: Event) {
    const input = event.target as HTMLInputElement
    files.value = [...files.value, ...Array.from(input.files ?? [])].slice(0, MAX_FILES)
    input.value = ''
  }

  async function submit () {
    if (sending.value || (!body.value.trim() && files.value.length === 0)) {
      return
    }

    const sent = await send(body.value, files.value)
    if (sent) {
      body.value = ''
      files.value = []
    }
  }

  async function scrollToBottom () {
    await nextTick()
    if (scroller.value) {
      scroller.value.scrollTop = scroller.value.scrollHeight
    }
  }

  watch(() => messages.value.length, scrollToBottom)
  watch(chat, value => {
    if (value) {
      emit('loaded', value)
    }
  })

  onMounted(async () => {
    await load()
    start()
    scrollToBottom()
  })
</script>

<style scoped>
.deal-chat {
  display: flex;
  flex-direction: column;
  min-height: 320px;
  border: 1px solid #e0e0e0;
  border-radius: 12px;
  overflow: hidden;
  background: #fafafa;
}

.chat-header {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 8px 12px;
  border-bottom: 1px solid #e0e0e0;
  background: #fff;
}

.presence {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: 0.8rem;
  color: #5e5e5e;
}

.presence-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: #bdbdbd;
}

.presence-dot.online {
  background: #2e7d32;
}

.chat-messages {
  flex: 1;
  overflow-y: auto;
  padding: 12px;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.chat-empty {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 8px;
  text-align: center;
  color: #5e5e5e;
  font-size: 0.9rem;
}

.system-row {
  display: flex;
  justify-content: center;
}

.system-row span {
  font-size: 0.75rem;
  color: #616161;
  background: #eeeeee;
  padding: 4px 10px;
  border-radius: 999px;
  text-align: center;
}

.bubble-row {
  display: flex;
}

.row-mine {
  justify-content: flex-end;
}

.row-theirs {
  justify-content: flex-start;
}

.bubble {
  max-width: 75%;
  padding: 8px 12px;
  border-radius: 12px;
  font-size: 0.88rem;
  line-height: 1.4;
}

.bubble-mine {
  background: #1e3a5f;
  color: #fff;
  border-bottom-right-radius: 4px;
}

.bubble-theirs {
  background: #fff;
  color: #111;
  border: 1px solid #e0e0e0;
  border-bottom-left-radius: 4px;
}

.bubble-author {
  font-size: 0.72rem;
  font-weight: 600;
  margin-bottom: 2px;
  color: #1e3a5f;
}

.bubble-body {
  white-space: pre-wrap;
  word-break: break-word;
}

.bubble-files {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
  margin-top: 6px;
}

.bubble-time {
  font-size: 0.7rem;
  opacity: 0.6;
  margin-top: 4px;
  text-align: right;
}

.chat-input {
  padding: 8px 12px;
  border-top: 1px solid #e0e0e0;
  background: #fff;
}

.pending-files {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
  margin-bottom: 6px;
}

.input-row {
  display: flex;
  align-items: flex-end;
  gap: 8px;
}

.chat-closed {
  text-align: center;
  font-size: 0.8rem;
  color: #757575;
  padding: 10px;
  background: #f0f0f0;
  border-top: 1px solid #e0e0e0;
}
</style>
