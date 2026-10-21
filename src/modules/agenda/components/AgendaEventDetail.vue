<template>
  <v-dialog
    v-model="open"
    :fullscreen="xs"
    max-width="620"
    scrollable
  >
    <v-card class="event-detail" :rounded="xs ? 0 : 'xl'">
      <div class="event-detail__head" :style="{ borderLeftColor: color }">
        <div class="event-detail__head-text">
          <div class="event-detail__area" :style="{ color }">
            <v-icon icon="mdi-circle" size="10" />
            {{ event?.area?.name ?? 'Sin área' }}
          </div>

          <h3 class="event-detail__title">{{ event?.title }}</h3>
        </div>

        <v-btn
          aria-label="Cerrar"
          icon="mdi-close"
          size="small"
          variant="text"
          @click="open = false"
        />
      </div>

      <v-divider />

      <v-card-text v-if="event" class="event-detail__body">
        <v-alert
          v-if="actionError"
          class="mb-4"
          color="error"
          density="comfortable"
          variant="tonal"
        >
          {{ actionError }}
        </v-alert>

        <div class="event-detail__row">
          <v-icon icon="mdi-clock-outline" />

          <div>
            <div class="event-detail__value">{{ schedule }}</div>

            <div v-if="event.recurrence !== 'none'" class="event-detail__hint">
              <v-icon icon="mdi-repeat" size="14" /> {{ event.recurrenceLabel }}
            </div>
          </div>
        </div>

        <div class="event-detail__row">
          <v-icon icon="mdi-map-marker-outline" />
          <div class="event-detail__value">{{ event.locationLabel }}</div>
        </div>

        <div class="event-detail__row">
          <v-icon icon="mdi-bell-outline" />
          <div class="event-detail__value">{{ reminderLabel(event.reminderMinutes) }}</div>
        </div>

        <div v-if="event.creator" class="event-detail__row">
          <v-icon icon="mdi-account-tie-outline" />

          <div>
            <div class="event-detail__value">{{ event.creator.name }}</div>
            <div class="event-detail__hint">{{ event.creator.email }}</div>
          </div>
        </div>

        <div v-if="event.url" class="event-detail__row">
          <v-icon icon="mdi-link-variant" />
          <a class="event-detail__link" :href="safeUrl" rel="noopener noreferrer" target="_blank">{{ event.url }}</a>
        </div>

        <div v-if="event.notes" class="event-detail__row">
          <v-icon icon="mdi-note-text-outline" />
          <div class="event-detail__notes">{{ event.notes }}</div>
        </div>

        <template v-if="event.invitees.length > 0">
          <div class="event-detail__section">Invitados ({{ event.invitees.length }})</div>

          <div class="event-detail__chips">
            <v-chip
              v-for="invitee in event.invitees"
              :key="invitee.id"
              :prepend-icon="invitee.notifiedVia === 'outlook' ? 'mdi-microsoft-outlook' : invitee.notifiedAt ? 'mdi-email-check-outline' : 'mdi-clock-outline'"
              size="small"
              :title="invitee.notifiedAt ? `${invitee.notifiedViaLabel ?? 'Avisado'}` : 'Aviso pendiente'"
              variant="tonal"
            >
              {{ invitee.name ?? invitee.email }}
            </v-chip>
          </div>
        </template>

        <template v-if="event.attachments.length > 0">
          <div class="event-detail__section">Archivos</div>

          <div class="event-detail__chips">
            <v-chip
              v-for="attachment in event.attachments"
              :key="attachment.id"
              :disabled="downloadingId === attachment.id"
              prepend-icon="mdi-download"
              size="small"
              @click="downloadAttachment(attachment)"
            >
              {{ attachment.originalName }}
            </v-chip>
          </div>
        </template>

        <div class="event-detail__outlook">
          <v-icon :color="outlookStatus.color" :icon="outlookStatus.icon" size="16" />
          {{ outlookStatus.text }}
        </div>
      </v-card-text>

      <v-divider />

      <v-card-actions class="event-detail__actions">
        <v-btn
          :loading="downloadingIcs"
          prepend-icon="mdi-calendar-export"
          variant="text"
          @click="downloadIcs"
        >
          {{ xs ? '.ics' : 'Agregar a mi calendario' }}
        </v-btn>

        <v-spacer />

        <template v-if="event?.canManage">
          <v-btn
            color="error"
            prepend-icon="mdi-delete-outline"
            variant="text"
            @click="confirmingDelete = true"
          >
            Eliminar
          </v-btn>

          <v-btn
            color="#FAB21A"
            prepend-icon="mdi-pencil-outline"
            variant="flat"
            @click="emit('edit', event)"
          >
            Editar
          </v-btn>
        </template>
      </v-card-actions>
    </v-card>

    <v-dialog v-model="confirmingDelete" max-width="440" :persistent="deleting">
      <v-card rounded="xl">
        <v-card-title class="pt-5 px-6">¿Eliminar la actividad?</v-card-title>

        <v-card-text class="px-6">
          <strong>{{ event?.title }}</strong> se eliminará de la agenda
          <template v-if="event?.recurrence !== 'none'"> con todas sus repeticiones</template>.
          <template v-if="event && event.invitees.length > 0"> Los invitados recibirán la cancelación.</template>
          Esta acción no se puede deshacer.
        </v-card-text>

        <v-card-actions class="px-6 pb-5">
          <v-spacer />
          <v-btn :disabled="deleting" variant="text" @click="confirmingDelete = false">Cancelar</v-btn>

          <v-btn
            color="error"
            :loading="deleting"
            variant="flat"
            @click="confirmDelete"
          >
            Eliminar
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </v-dialog>
</template>

<script lang="ts" setup>
  import type { AgendaAttachment, AgendaEvent, AgendaPort } from '@/modules/agenda/port'
  import { computed, ref, watch } from 'vue'
  import { useDisplay } from 'vuetify'
  import { agendaAdapter } from '@/modules/agenda/adapter'
  import { areaColor } from '@/modules/agenda/colors'
  import { formatSchedule, reminderLabel } from '@/modules/agenda/dates'
  import { resolveApiMessage } from '@/modules/agenda/useAgendaCalendar'
  import { downloadBlob } from '@/utils/download'

  const props = withDefaults(defineProps<{
    event: AgendaEvent | null
    /** The occurrence clicked; a recurring event shows that date, not the first one. */
    occurrenceStart?: string | null
    occurrenceEnd?: string | null
    outlookSyncEnabled?: boolean
    port?: AgendaPort
  }>(), {
    occurrenceStart: null,
    occurrenceEnd: null,
    outlookSyncEnabled: false,
    port: () => agendaAdapter,
  })

  const emit = defineEmits<{
    edit: [event: AgendaEvent]
    deleted: [event: AgendaEvent]
  }>()

  const { xs } = useDisplay()

  const open = defineModel<boolean>({ default: false })

  const confirmingDelete = ref(false)
  const deleting = ref(false)
  const downloadingIcs = ref(false)
  const downloadingId = ref<number | null>(null)
  const actionError = ref<string | null>(null)

  watch(open, isOpen => {
    if (isOpen) {
      actionError.value = null
      confirmingDelete.value = false
    }
  })

  const color = computed(() => areaColor(props.event?.areaId))

  const schedule = computed(() => {
    if (!props.event) {
      return ''
    }
    const startsAt = new Date(props.occurrenceStart ?? props.event.startsAt)
    const endsAt = new Date(props.occurrenceEnd ?? props.event.endsAt)
    return formatSchedule(startsAt, endsAt, props.event.allDay)
  })

  // Only http(s) links are rendered as links.
  const safeUrl = computed(() => {
    try {
      const parsed = new URL(props.event?.url ?? '')
      return ['http:', 'https:'].includes(parsed.protocol) ? parsed.href : undefined
    } catch {
      return undefined
    }
  })

  const outlookStatus = computed(() => {
    const outlook = props.event?.outlook
    if (outlook?.synced) {
      return { icon: 'mdi-microsoft-outlook', color: '#0a64ad', text: 'Sincronizado con el calendario de Outlook del organizador.' }
    }
    if (outlook?.error) {
      return { icon: 'mdi-alert-outline', color: 'warning', text: 'No se pudo sincronizar con Outlook; los invitados recibieron el aviso por correo.' }
    }
    if (props.outlookSyncEnabled) {
      return { icon: 'mdi-sync', color: undefined, text: 'Sincronización con Outlook en proceso.' }
    }
    return { icon: 'mdi-email-outline', color: undefined, text: 'Los invitados reciben el aviso por correo con el archivo .ics.' }
  })

  async function downloadIcs () {
    if (!props.event) {
      return
    }
    downloadingIcs.value = true
    try {
      downloadBlob(await props.port.downloadIcs(props.event.id), `${props.event.title || 'evento'}.ics`)
    } catch (error_) {
      actionError.value = resolveApiMessage(error_, 'No fue posible descargar el archivo del calendario.')
    } finally {
      downloadingIcs.value = false
    }
  }

  async function downloadAttachment (attachment: AgendaAttachment) {
    downloadingId.value = attachment.id
    try {
      downloadBlob(await props.port.downloadAttachment(attachment.id), attachment.originalName)
    } catch (error_) {
      actionError.value = resolveApiMessage(error_, 'No fue posible descargar el archivo.')
    } finally {
      downloadingId.value = null
    }
  }

  async function confirmDelete () {
    const event = props.event
    if (!event) {
      return
    }

    deleting.value = true
    try {
      await props.port.deleteEvent(event.id)
      confirmingDelete.value = false
      open.value = false
      emit('deleted', event)
    } catch (error_) {
      confirmingDelete.value = false
      actionError.value = resolveApiMessage(error_, 'No fue posible eliminar la actividad.')
    } finally {
      deleting.value = false
    }
  }
</script>

<style scoped>
.event-detail__head {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  padding: 18px 16px 16px 20px;
  border-left: 6px solid #FAB21A;
}

.event-detail__head-text {
  flex: 1;
  min-width: 0;
}

.event-detail__area {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 0.78rem;
  font-weight: 700;
  letter-spacing: 0.04em;
  text-transform: uppercase;
}

.event-detail__title {
  margin: 4px 0 0;
  font-size: 1.3rem;
  font-weight: 800;
  overflow-wrap: anywhere;
}

.event-detail__body {
  padding: 18px 22px !important;
}

.event-detail__row {
  display: flex;
  align-items: flex-start;
  gap: 14px;
  margin-bottom: 14px;
}

.event-detail__row > .v-icon {
  flex: none;
  margin-top: 1px;
  color: #8a8a8a;
}

.event-detail__value {
  font-weight: 600;
}

.event-detail__value::first-letter {
  text-transform: uppercase;
}

.event-detail__hint {
  color: #8a8a8a;
  font-size: 0.85rem;
}

.event-detail__link {
  color: #0a64ad;
  overflow-wrap: anywhere;
}

.event-detail__notes {
  white-space: pre-line;
  overflow-wrap: anywhere;
}

.event-detail__section {
  margin: 18px 0 8px;
  font-size: 0.78rem;
  font-weight: 800;
  letter-spacing: 0.06em;
  text-transform: uppercase;
}

.event-detail__chips {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.event-detail__outlook {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-top: 20px;
  color: #8a8a8a;
  font-size: 0.82rem;
}

.event-detail__actions {
  flex-wrap: wrap;
  padding: 12px 16px !important;
}
</style>
