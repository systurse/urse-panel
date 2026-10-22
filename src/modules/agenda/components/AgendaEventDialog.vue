<template>
  <v-dialog
    v-model="open"
    :fullscreen="xs"
    max-width="760"
    persistent
    scrollable
  >
    <v-card class="event-dialog" :rounded="xs ? 0 : 'xl'">
      <div class="event-dialog__head">
        <div class="event-dialog__icon">
          <v-icon :icon="isEditing ? 'mdi-calendar-edit' : 'mdi-calendar-plus'" size="22" />
        </div>

        <div class="event-dialog__head-text">
          <div class="event-dialog__kicker">Agenda institucional</div>
          <h3 class="event-dialog__title">{{ isEditing ? 'Editar actividad' : 'Nueva actividad' }}</h3>
        </div>

        <v-spacer />

        <v-btn
          aria-label="Cerrar"
          color="white"
          :disabled="saving"
          icon="mdi-close"
          size="small"
          variant="text"
          @click="close"
        />
      </div>

      <v-divider />

      <v-card-text class="event-dialog__body">
        <v-alert
          v-if="formError"
          class="mb-4"
          color="error"
          density="comfortable"
          variant="tonal"
        >
          {{ formError }}
        </v-alert>

        <v-alert
          v-if="isEditing && event?.recurrence !== 'none'"
          class="mb-4"
          color="info"
          density="compact"
          icon="mdi-repeat"
          variant="tonal"
        >
          Es un evento que se repite: los cambios aplican a toda la serie.
        </v-alert>

        <v-form ref="formRef" @submit.prevent="submit">
          <div class="event-dialog__section">Actividad</div>

          <v-row dense>
            <v-col cols="12">
              <v-text-field
                v-model="form.title"
                autofocus
                :error-messages="fieldErrors.title"
                hide-details="auto"
                label="Actividad *"
                maxlength="255"
                placeholder="Ej. Ceremonia de graduación"
                prepend-inner-icon="mdi-format-title"
                :rules="[required('Escribe el nombre de la actividad.')]"
                variant="outlined"
              />
            </v-col>

            <v-col cols="12">
              <v-autocomplete
                v-if="context?.canManageAll"
                v-model="form.areaId"
                :error-messages="fieldErrors.area_id"
                hide-details="auto"
                item-title="name"
                item-value="id"
                :items="areaOptions"
                label="Área *"
                no-data-text="Sin áreas"
                prepend-inner-icon="mdi-sitemap-outline"
                :rules="[requiredSelection('Selecciona el área del evento.')]"
                variant="outlined"
              />

              <div v-else class="event-dialog__area">
                <v-icon icon="mdi-sitemap-outline" size="18" />
                <span>{{ fixedAreaName }}</span>
              </div>
            </v-col>
          </v-row>

          <div class="event-dialog__section">
            Fecha y hora
            <span v-if="durationText" class="event-dialog__section-hint">Duración: {{ durationText }}</span>
          </div>

          <v-row dense>
            <v-col cols="12">
              <v-switch
                v-model="form.allDay"
                color="#c89215"
                density="compact"
                hide-details
                inset
                label="Todo el día"
              />
            </v-col>

            <v-col :cols="form.allDay ? 6 : 7" :sm="form.allDay ? 6 : 4">
              <v-text-field
                v-model="form.startDate"
                :error-messages="fieldErrors.starts_at"
                hide-details="auto"
                label="Fecha *"
                :rules="[required('Indica la fecha.')]"
                type="date"
                variant="outlined"
              />
            </v-col>

            <v-col v-if="!form.allDay" cols="5" sm="2">
              <v-text-field
                v-model="form.startTime"
                hide-details="auto"
                label="Inicio *"
                :rules="[required('Hora de inicio.')]"
                type="time"
                variant="outlined"
              />
            </v-col>

            <v-col :cols="form.allDay ? 6 : 7" :sm="form.allDay ? 6 : 4">
              <v-text-field
                v-model="form.endDate"
                :error-messages="fieldErrors.ends_at"
                hide-details="auto"
                :label="form.allDay ? 'Hasta el día *' : 'Termina el *'"
                :min="form.startDate"
                :rules="[required('Indica cuándo termina.'), endAfterStart]"
                type="date"
                variant="outlined"
              />
            </v-col>

            <v-col v-if="!form.allDay" cols="5" sm="2">
              <v-text-field
                v-model="form.endTime"
                hide-details="auto"
                label="Fin *"
                :rules="[required('Hora de fin.')]"
                type="time"
                variant="outlined"
              />
            </v-col>

            <v-col v-if="!form.allDay" cols="12">
              <div class="event-dialog__chips">
                <span class="event-dialog__chips-label">Duración rápida:</span>

                <v-chip
                  v-for="option in DURATION_PRESETS"
                  :key="option"
                  :color="durationMinutes === option ? '#c89215' : undefined"
                  size="small"
                  :variant="durationMinutes === option ? 'flat' : 'outlined'"
                  @click="setDuration(option)"
                >
                  {{ formatDuration(option) }}
                </v-chip>
              </div>
            </v-col>
          </v-row>

          <div class="event-dialog__section">Lugar</div>

          <v-row dense>
            <v-col cols="12">
              <v-btn-toggle
                v-model="form.placeMode"
                class="event-dialog__toggle"
                color="#c89215"
                density="compact"
                divided
                mandatory
                variant="outlined"
              >
                <v-btn prepend-icon="mdi-domain" value="space">Espacio del catálogo</v-btn>
                <v-btn prepend-icon="mdi-map-marker-outline" value="other">Otro lugar</v-btn>
              </v-btn-toggle>
            </v-col>

            <v-col v-if="form.placeMode === 'space'" cols="12">
              <v-autocomplete
                v-model="form.spaceId"
                v-model:search="spaceSearch"
                :error-messages="fieldErrors.space_id"
                hide-details="auto"
                hint="Si el espacio ya está ocupado en ese horario, no se podrá guardar."
                item-title="label"
                item-value="id"
                :items="spaceOptions"
                label="Espacio *"
                persistent-hint
                prepend-inner-icon="mdi-domain"
                :rules="[requiredSelection('Elige un espacio o cambia a «Otro lugar».')]"
                variant="outlined"
              >
                <template #no-data>
                  <v-list-item
                    v-if="context?.canCreateSpaces"
                    prepend-icon="mdi-domain-plus"
                    :subtitle="spaceSearch ? 'No está en el catálogo' : undefined"
                    :title="spaceSearch ? `Agregar «${spaceSearch.trim()}» como espacio nuevo` : 'Agregar un espacio nuevo'"
                    @click="openSpaceDialog"
                  />

                  <v-list-item
                    v-else
                    subtitle="Usa «Otro lugar» o pide a Asuntos Académicos que lo agregue."
                    title="No está en el catálogo"
                  />
                </template>
              </v-autocomplete>

              <v-btn
                v-if="context?.canCreateSpaces"
                class="event-dialog__add-space"
                color="#8a5a00"
                prepend-icon="mdi-plus"
                size="small"
                variant="text"
                @click="openSpaceDialog"
              >
                ¿No está en la lista? Agregar espacio
              </v-btn>
            </v-col>

            <v-col v-else cols="12">
              <v-text-field
                v-model="form.location"
                :error-messages="fieldErrors.location ?? fieldErrors.space_id"
                hide-details="auto"
                label="Lugar *"
                maxlength="255"
                placeholder="Ej. Explanada principal, Microsoft Teams…"
                prepend-inner-icon="mdi-map-marker-outline"
                :rules="[required('Escribe el lugar.')]"
                variant="outlined"
              />
            </v-col>
          </v-row>

          <div class="event-dialog__section">Recordatorio y repetición</div>

          <v-row dense>
            <v-col cols="12" sm="6">
              <v-select
                v-model="form.reminderMinutes"
                :error-messages="fieldErrors.reminder_minutes"
                hide-details="auto"
                :items="reminderOptions"
                label="Recordatorio"
                prepend-inner-icon="mdi-bell-outline"
                variant="outlined"
              />
            </v-col>

            <v-col cols="12" sm="6">
              <v-select
                v-model="form.recurrence"
                :error-messages="fieldErrors.recurrence"
                hide-details="auto"
                :items="RECURRENCE_OPTIONS"
                label="Repetición"
                prepend-inner-icon="mdi-repeat"
                variant="outlined"
              />
            </v-col>

            <template v-if="form.recurrence !== 'none'">
              <v-col cols="5" sm="4">
                <v-text-field
                  v-model.number="form.recurrenceInterval"
                  :error-messages="fieldErrors.recurrence_interval"
                  hide-details="auto"
                  label="Cada"
                  max="30"
                  min="1"
                  :rules="[validInterval]"
                  :suffix="intervalSuffix"
                  type="number"
                  variant="outlined"
                />
              </v-col>

              <v-col cols="7" sm="8">
                <v-text-field
                  v-model="form.recurrenceUntil"
                  :error-messages="fieldErrors.recurrence_until"
                  hide-details="auto"
                  label="Se repite hasta *"
                  :max="maxRecurrenceUntil"
                  :min="form.startDate"
                  :rules="[required('Indica hasta cuándo se repite.')]"
                  type="date"
                  variant="outlined"
                />
              </v-col>
            </template>
          </v-row>

          <div class="event-dialog__section">
            Invitados
            <span class="event-dialog__section-hint">{{ invitationHint }}</span>
          </div>

          <v-row dense>
            <v-col cols="12">
              <v-autocomplete
                v-model="form.inviteeUsers"
                v-model:search="userSearch"
                chips
                closable-chips
                :error-messages="fieldErrors.invitee_user_ids"
                hide-details="auto"
                item-title="name"
                item-value="id"
                :items="userOptions"
                label="Personal de URSE"
                :loading="usersLoading"
                multiple
                no-data-text="Escribe un nombre o correo para buscar"
                no-filter
                prepend-inner-icon="mdi-account-multiple-plus-outline"
                return-object
                variant="outlined"
              >
                <template #item="{ props: itemProps, item }">
                  <v-list-item v-bind="itemProps" :subtitle="item.email" />
                </template>
              </v-autocomplete>
            </v-col>

            <v-col cols="12">
              <v-combobox
                v-model="form.inviteeEmails"
                chips
                closable-chips
                :error-messages="inviteeEmailErrors"
                hide-details="auto"
                hint="Escribe un correo y presiona Enter. Sirve para invitados externos."
                label="Otros correos"
                multiple
                persistent-hint
                prepend-inner-icon="mdi-email-plus-outline"
                :rules="[validEmails]"
                variant="outlined"
              />
            </v-col>
          </v-row>

          <div class="event-dialog__section">Detalles</div>

          <v-row dense>
            <v-col cols="12">
              <v-textarea
                v-model="form.notes"
                auto-grow
                counter="5000"
                :error-messages="fieldErrors.notes"
                hide-details="auto"
                label="Notas"
                maxlength="5000"
                prepend-inner-icon="mdi-note-text-outline"
                rows="2"
                variant="outlined"
              />
            </v-col>

            <v-col cols="12">
              <v-text-field
                v-model="form.url"
                :error-messages="fieldErrors.url"
                hide-details="auto"
                label="Enlace (URL)"
                maxlength="2048"
                placeholder="https://"
                prepend-inner-icon="mdi-link-variant"
                :rules="[validUrl]"
                type="url"
                variant="outlined"
              />
            </v-col>

            <v-col v-if="existingAttachments.length > 0" cols="12">
              <div class="event-dialog__attachments">
                <v-chip
                  v-for="attachment in existingAttachments"
                  :key="attachment.id"
                  closable
                  prepend-icon="mdi-paperclip"
                  size="small"
                  @click:close="removeAttachment(attachment)"
                >
                  {{ attachment.originalName }}
                </v-chip>
              </div>
            </v-col>

            <v-col cols="12">
              <v-file-input
                v-model="form.files"
                accept=".pdf,.jpg,.jpeg,.png,.doc,.docx,.xls,.xlsx,.ppt,.pptx"
                chips
                :error-messages="attachmentErrors"
                :hint="`Hasta ${MAX_ATTACHMENTS} archivos de 10 MB (PDF, imágenes u Office).`"
                label="Archivos"
                multiple
                persistent-hint
                prepend-icon=""
                prepend-inner-icon="mdi-paperclip"
                :rules="[validFiles]"
                show-size
                variant="outlined"
              />
            </v-col>
          </v-row>
        </v-form>
      </v-card-text>

      <v-divider />

      <v-card-actions class="event-dialog__actions">
        <v-spacer />

        <v-btn :disabled="saving" variant="text" @click="close">Cancelar</v-btn>

        <v-btn
          color="#FAB21A"
          :loading="saving"
          prepend-icon="mdi-content-save-outline"
          variant="flat"
          @click="submit"
        >
          {{ isEditing ? 'Guardar cambios' : 'Crear actividad' }}
        </v-btn>
      </v-card-actions>
    </v-card>

    <AgendaSpaceDialog
      v-model="spaceDialogOpen"
      :initial-name="spaceDialogName"
      :port="port"
      @created="onSpaceCreated"
    />
  </v-dialog>
</template>

<script lang="ts" setup>
  import type { AgendaAttachment, AgendaContext, AgendaEvent, AgendaEventPayload, AgendaPort, AgendaRecurrence, AgendaSpace, AgendaUserSummary } from '@/modules/agenda/port'
  import type { Area } from '@/modules/areas/port'
  import { computed, onBeforeUnmount, reactive, ref, watch } from 'vue'
  import { useDisplay } from 'vuetify'
  import { agendaAdapter } from '@/modules/agenda/adapter'
  import AgendaSpaceDialog from '@/modules/agenda/components/AgendaSpaceDialog.vue'
  import { addDays, formatDuration, parseLocal, reminderLabel, toDateKey, toTimeKey } from '@/modules/agenda/dates'

  const props = withDefaults(defineProps<{
    /** Null opens the dialog to create a new activity. */
    event: AgendaEvent | null
    context: AgendaContext | null
    spaces: AgendaSpace[]
    areas: Area[]
    /** Prefills the date (and time, from the day and week views) on create. */
    defaultStart?: Date | null
    port?: AgendaPort
  }>(), {
    defaultStart: null,
    port: () => agendaAdapter,
  })

  const emit = defineEmits<{
    'saved': [event: AgendaEvent, created: boolean]
    'space-created': [space: AgendaSpace]
  }>()

  // A phone gets the whole screen: the form is long and the keyboard eats half of it.
  const { xs } = useDisplay()

  const open = defineModel<boolean>({ default: false })

  const DURATION_PRESETS = [30, 60, 90, 120, 180, 240]
  const MAX_ATTACHMENTS = 5
  const MAX_FILE_BYTES = 10 * 1024 * 1024
  const EMAIL_PATTERN = /^[^\s@]+@[^\s@][^\s.@]*\.[^\s@]+$/
  const USER_SEARCH_DEBOUNCE_MS = 350

  const RECURRENCE_OPTIONS: { title: string, value: AgendaRecurrence }[] = [
    { title: 'No se repite', value: 'none' },
    { title: 'Diario', value: 'daily' },
    { title: 'Semanal', value: 'weekly' },
    { title: 'Mensual (mismo día del mes)', value: 'monthly' },
    { title: 'Anual', value: 'yearly' },
  ]

  interface FormState {
    title: string
    areaId: number | null
    allDay: boolean
    startDate: string
    startTime: string
    endDate: string
    endTime: string
    placeMode: 'space' | 'other'
    spaceId: number | null
    location: string
    reminderMinutes: number | null
    recurrence: AgendaRecurrence
    recurrenceInterval: number
    recurrenceUntil: string
    inviteeUsers: AgendaUserSummary[]
    inviteeEmails: string[]
    notes: string
    url: string
    files: File[]
  }

  interface ApiErrorShape {
    response?: {
      status?: number
      data?: { message?: string, errors?: Record<string, string[]> }
    }
  }

  const formRef = ref<{ validate: () => Promise<{ valid: boolean }>, resetValidation: () => void } | null>(null)
  const form = reactive<FormState>(emptyForm())
  const fieldErrors = ref<Record<string, string[]>>({})
  const formError = ref<string | null>(null)
  const saving = ref(false)
  const existingAttachments = ref<AgendaAttachment[]>([])

  const userSearch = ref('')
  const userResults = ref<AgendaUserSummary[]>([])
  const usersLoading = ref(false)
  let userSearchTimer: ReturnType<typeof setTimeout> | undefined
  let userRequestId = 0

  const spaceSearch = ref('')
  const spaceDialogOpen = ref(false)
  const spaceDialogName = ref('')
  /** Spaces added from here, shown right away while the parent refreshes its list. */
  const addedSpaces = ref<AgendaSpace[]>([])

  const isEditing = computed(() => props.event !== null)

  const areaOptions = computed(() => props.areas.map(area => ({ id: Number(area.id), name: area.name })))

  const fixedAreaName = computed(() =>
    props.event?.area?.name ?? props.context?.director?.area?.name ?? 'Sin área asignada',
  )

  // Inactive spaces only show up when the event already uses one.
  const spaceOptions = computed(() => [...props.spaces, ...addedSpaces.value.filter(added => !props.spaces.some(space => space.id === added.id))]
    .filter(space => space.isActive || space.id === props.event?.spaceId)
    .map(space => ({ id: space.id, label: space.campus ? `${space.name} · ${space.campus.name}` : space.name })))

  const reminderOptions = computed(() => [
    { title: reminderLabel(null), value: null },
    ...(props.context?.reminderOptions ?? [0, 15, 30, 60, 1440]).map(minutes => ({ title: reminderLabel(minutes), value: minutes })),
  ])

  // The selected users stay in the list while a new search runs.
  const userOptions = computed(() => {
    const selectedIds = new Set(form.inviteeUsers.map(user => user.id))
    return [...form.inviteeUsers, ...userResults.value.filter(user => !selectedIds.has(user.id))]
  })

  const startDateTime = computed(() => form.startDate ? parseLocal(form.startDate, form.allDay ? '00:00' : form.startTime || '00:00') : null)
  const endDateTime = computed(() => form.endDate ? parseLocal(form.endDate, form.allDay ? '00:00' : form.endTime || '00:00') : null)

  const durationMinutes = computed(() => {
    if (!startDateTime.value || !endDateTime.value || form.allDay) {
      return null
    }
    const minutes = Math.round((endDateTime.value.getTime() - startDateTime.value.getTime()) / 60_000)
    return minutes > 0 ? minutes : null
  })

  const durationText = computed(() => {
    if (form.allDay && form.startDate && form.endDate) {
      const days = Math.round((parseLocal(form.endDate).getTime() - parseLocal(form.startDate).getTime()) / 86_400_000) + 1
      return days > 0 ? `${days} ${days === 1 ? 'día' : 'días'}` : null
    }
    return durationMinutes.value ? formatDuration(durationMinutes.value) : null
  })

  const intervalSuffix = computed(() => {
    const plural = form.recurrenceInterval !== 1
    switch (form.recurrence) {
      case 'daily': {
        return plural ? 'días' : 'día'
      }
      case 'weekly': {
        return plural ? 'semanas' : 'semana'
      }
      case 'monthly': {
        return plural ? 'meses' : 'mes'
      }
      case 'yearly': {
        return plural ? 'años' : 'año'
      }
      default: {
        return ''
      }
    }
  })

  const maxRecurrenceUntil = computed(() => form.startDate
    ? toDateKey(addDays(parseLocal(form.startDate), props.context?.maxRecurrenceDays ?? 366))
    : undefined)

  const invitationHint = computed(() => props.context?.outlookSyncEnabled
    ? 'reciben la invitación de Outlook en su correo'
    : 'reciben un correo con la invitación y el archivo .ics')

  const inviteeEmailErrors = computed(() => [
    ...(fieldErrors.value.invitee_emails ?? []),
    ...Object.entries(fieldErrors.value).filter(([key]) => key.startsWith('invitee_emails.')).flatMap(([, messages]) => messages),
  ])

  const attachmentErrors = computed(() => [
    ...(fieldErrors.value.attachments ?? []),
    ...Object.entries(fieldErrors.value).filter(([key]) => key.startsWith('attachments.')).flatMap(([, messages]) => messages),
  ])

  function emptyForm (): FormState {
    return {
      title: '',
      areaId: null,
      allDay: false,
      startDate: '',
      startTime: '09:00',
      endDate: '',
      endTime: '10:00',
      placeMode: 'space',
      spaceId: null,
      location: '',
      reminderMinutes: 30,
      recurrence: 'none',
      recurrenceInterval: 1,
      recurrenceUntil: '',
      inviteeUsers: [],
      inviteeEmails: [],
      notes: '',
      url: '',
      files: [],
    }
  }

  /** "Nueva actividad" without a clicked slot proposes the next half hour, not 17:25. */
  function nextHalfHour (): Date {
    const date = new Date()
    date.setSeconds(0, 0)
    date.setMinutes(date.getMinutes() < 30 ? 30 : 60)
    return date
  }

  function formFromEvent (event: AgendaEvent | null): FormState {
    if (!event) {
      const start = props.defaultStart ?? nextHalfHour()
      // From the month view the click carries no time: start at 09:00.
      const hasTime = start.getHours() !== 0 || start.getMinutes() !== 0
      const startTime = hasTime ? toTimeKey(start) : '09:00'
      const end = parseLocal(toDateKey(start), startTime)
      end.setHours(end.getHours() + 1)

      return {
        ...emptyForm(),
        areaId: props.context?.director?.areaId ?? null,
        startDate: toDateKey(start),
        startTime,
        endDate: toDateKey(end),
        endTime: toTimeKey(end),
        placeMode: props.spaces.some(space => space.isActive) ? 'space' : 'other',
      }
    }

    const startsAt = new Date(event.startsAt)
    // All-day events end at 00:00 of the day after; the form shows the last day.
    const endsAt = event.allDay ? addDays(new Date(event.endsAt), -1) : new Date(event.endsAt)
    const inviteeUsers = event.invitees
      .filter(invitee => invitee.userId !== null)
      .map(invitee => ({ id: invitee.userId as number, name: invitee.name ?? invitee.email, email: invitee.email, avatar: null }))

    return {
      title: event.title,
      areaId: event.areaId,
      allDay: event.allDay,
      startDate: toDateKey(startsAt),
      startTime: toTimeKey(startsAt),
      endDate: toDateKey(endsAt),
      endTime: toTimeKey(endsAt),
      placeMode: event.spaceId ? 'space' : 'other',
      spaceId: event.spaceId,
      location: event.location ?? '',
      reminderMinutes: event.reminderMinutes,
      recurrence: event.recurrence,
      recurrenceInterval: event.recurrenceInterval,
      recurrenceUntil: event.recurrenceUntil ?? '',
      inviteeUsers,
      inviteeEmails: event.invitees.filter(invitee => invitee.userId === null).map(invitee => invitee.email),
      notes: event.notes ?? '',
      url: event.url ?? '',
      files: [],
    }
  }

  watch(open, isOpen => {
    if (!isOpen) {
      return
    }

    Object.assign(form, formFromEvent(props.event))
    existingAttachments.value = [...(props.event?.attachments ?? [])]
    fieldErrors.value = {}
    formError.value = null
    userSearch.value = ''
    userResults.value = []
    formRef.value?.resetValidation()
  }, { immediate: true })

  // Moving the start keeps the duration, like any calendar app.
  watch(() => [form.startDate, form.startTime] as const, ([newDate, newTime], [oldDate, oldTime]) => {
    if (!open.value || !oldDate || !newDate || form.allDay) {
      if (form.allDay && newDate && (!form.endDate || form.endDate < newDate)) {
        form.endDate = newDate
      }
      return
    }

    const previousStart = parseLocal(oldDate, oldTime || '00:00')
    const previousEnd = parseLocal(form.endDate || oldDate, form.endTime || '00:00')
    const duration = Math.max(15, Math.round((previousEnd.getTime() - previousStart.getTime()) / 60_000))
    const newEnd = new Date(parseLocal(newDate, newTime || '00:00').getTime() + duration * 60_000)

    form.endDate = toDateKey(newEnd)
    form.endTime = toTimeKey(newEnd)
  })

  // A server error belongs to the value that caused it; once edited, drop it.
  watch(form, () => {
    if (Object.keys(fieldErrors.value).length > 0) {
      fieldErrors.value = {}
    }
  })

  watch(userSearch, value => {
    clearTimeout(userSearchTimer)
    const term = value?.trim() ?? ''
    if (term.length < 2) {
      userResults.value = []
      return
    }
    userSearchTimer = setTimeout(() => searchUsers(term), USER_SEARCH_DEBOUNCE_MS)
  })

  onBeforeUnmount(() => clearTimeout(userSearchTimer))

  async function searchUsers (term: string) {
    const current = ++userRequestId
    usersLoading.value = true
    try {
      const users = await props.port.searchUsers(term)
      if (current === userRequestId) {
        userResults.value = users
      }
    } catch {
      if (current === userRequestId) {
        userResults.value = []
      }
    } finally {
      if (current === userRequestId) {
        usersLoading.value = false
      }
    }
  }

  // The current text of the search is not a value of its own: if it matches
  // a selected space it is just that space's label.
  function openSpaceDialog () {
    const selected = spaceOptions.value.find(option => option.id === form.spaceId)
    spaceDialogName.value = spaceSearch.value && spaceSearch.value !== selected?.label ? spaceSearch.value : ''
    spaceDialogOpen.value = true
  }

  function onSpaceCreated (space: AgendaSpace) {
    addedSpaces.value = [...addedSpaces.value, space]
    form.placeMode = 'space'
    form.spaceId = space.id
    emit('space-created', space)
  }

  function setDuration (minutes: number) {
    if (!startDateTime.value) {
      return
    }
    const end = new Date(startDateTime.value.getTime() + minutes * 60_000)
    form.endDate = toDateKey(end)
    form.endTime = toTimeKey(end)
  }

  function clean (value: string): string | null {
    const trimmed = value.trim()
    return trimmed.length > 0 ? trimmed : null
  }

  function required (message: string) {
    return (value: string) => Boolean(value && String(value).trim()) || message
  }

  function requiredSelection (message: string) {
    return (value: number | null) => value !== null || message
  }

  function endAfterStart () {
    if (!startDateTime.value || !endDateTime.value) {
      return true
    }
    return form.allDay
      ? endDateTime.value >= startDateTime.value || 'Debe ser el mismo día o posterior.'
      : endDateTime.value > startDateTime.value || 'Debe terminar después de iniciar.'
  }

  function validInterval (value: number) {
    return (Number.isInteger(Number(value)) && Number(value) >= 1 && Number(value) <= 30) || 'Entre 1 y 30.'
  }

  function validEmails (values: string[]) {
    const invalid = (values ?? []).find(value => !EMAIL_PATTERN.test(String(value).trim()))
    return !invalid || `«${invalid}» no es un correo válido.`
  }

  function validUrl (value: string) {
    if (!clean(value)) {
      return true
    }
    try {
      const parsed = new URL(value.trim())
      return ['http:', 'https:'].includes(parsed.protocol) || 'Escribe una URL que empiece con http:// o https://.'
    } catch {
      return 'Escribe una URL válida (https://…).'
    }
  }

  function validFiles (files: File[]) {
    const list = files ?? []
    if (list.length + existingAttachments.value.length > MAX_ATTACHMENTS) {
      return `Un evento puede tener como máximo ${MAX_ATTACHMENTS} archivos.`
    }
    return list.every(file => file.size <= MAX_FILE_BYTES) || 'Cada archivo puede pesar como máximo 10 MB.'
  }

  function buildPayload (): AgendaEventPayload {
    const allDayEnd = form.endDate ? toDateKey(addDays(parseLocal(form.endDate), 1)) : ''
    const repeats = form.recurrence !== 'none'

    const payload: AgendaEventPayload = {
      title: form.title.trim(),
      allDay: form.allDay,
      startsAt: form.allDay ? `${form.startDate} 00:00` : `${form.startDate} ${form.startTime}`,
      endsAt: form.allDay ? `${allDayEnd} 00:00` : `${form.endDate} ${form.endTime}`,
      spaceId: form.placeMode === 'space' ? form.spaceId : null,
      location: form.placeMode === 'other' ? clean(form.location) : null,
      reminderMinutes: form.reminderMinutes,
      recurrence: form.recurrence,
      recurrenceInterval: repeats ? Number(form.recurrenceInterval) : 1,
      recurrenceUntil: repeats ? form.recurrenceUntil : null,
      notes: clean(form.notes),
      url: clean(form.url),
      inviteeUserIds: form.inviteeUsers.map(user => user.id),
      inviteeEmails: [...new Set(form.inviteeEmails.map(email => String(email).trim().toLowerCase()).filter(Boolean))],
    }

    if (props.context?.canManageAll) {
      payload.areaId = form.areaId
    }

    return payload
  }

  async function submit () {
    if (saving.value) {
      return
    }

    formError.value = null
    const result = await formRef.value?.validate()
    if (!result?.valid) {
      formError.value = 'Revisa los campos marcados.'
      return
    }

    saving.value = true
    const editing = props.event
    let saved: AgendaEvent | null = null

    try {
      saved = editing
        ? await props.port.updateEvent(editing.id, buildPayload())
        : await props.port.createEvent(buildPayload())
    } catch (error_) {
      handleError(error_, 'No fue posible guardar la actividad.')
      saving.value = false
      return
    }

    // The event exists from here on: a failed upload must not lose it.
    if (form.files.length > 0) {
      try {
        const uploaded = await props.port.uploadAttachments(saved.id, form.files)
        saved = { ...saved, attachments: [...saved.attachments, ...uploaded] }
      } catch (error_) {
        emit('saved', saved, !editing)
        handleError(error_, 'La actividad se guardó, pero no fue posible subir los archivos.')
        saving.value = false
        if (!editing) {
          close()
        }
        return
      }
    }

    saving.value = false
    emit('saved', saved, !editing)
    close()
  }

  async function removeAttachment (attachment: AgendaAttachment) {
    try {
      await props.port.deleteAttachment(attachment.id)
      existingAttachments.value = existingAttachments.value.filter(item => item.id !== attachment.id)
    } catch (error_) {
      handleError(error_, 'No fue posible quitar el archivo.')
    }
  }

  function handleError (error_: unknown, fallback: string) {
    const response = (error_ as ApiErrorShape)?.response
    const status = response?.status

    if (status === 422 && response?.data?.errors) {
      fieldErrors.value = response.data.errors
      formError.value = response.data.message ?? 'Revisa los campos marcados.'
      return
    }

    if (status === 403) {
      formError.value = response?.data?.message ?? 'No tienes permiso para realizar esta acción.'
      return
    }

    if (status === 404) {
      formError.value = 'La actividad ya no existe; cierra el diálogo y actualiza la agenda.'
      return
    }

    formError.value = response?.data?.message ?? fallback
  }

  function close () {
    open.value = false
  }
</script>

<style scoped>
.event-dialog__head {
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 20px 24px;
  background: linear-gradient(135deg, #141414 0%, #3d2c00 100%);
  color: #ffffff;
}

.event-dialog__icon {
  display: grid;
  flex: none;
  place-items: center;
  width: 44px;
  height: 44px;
  border-radius: 12px;
  background: #FAB21A;
  color: #1a1a1a;
}

.event-dialog__kicker {
  color: #FAB21A;
  font-size: 0.72rem;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.event-dialog__title {
  margin: 2px 0 0;
  font-size: 1.25rem;
  font-weight: 800;
}

.event-dialog__body {
  padding: 20px 24px !important;
}

.event-dialog__section {
  display: flex;
  flex-wrap: wrap;
  align-items: baseline;
  gap: 8px;
  margin: 14px 0 10px;
  color: rgb(var(--v-theme-on-surface));
  font-size: 0.8rem;
  font-weight: 800;
  letter-spacing: 0.06em;
  text-transform: uppercase;
}

.event-dialog__section:first-of-type {
  margin-top: 0;
}

.event-dialog__section-hint {
  color: #8a8a8a;
  font-size: 0.75rem;
  font-weight: 500;
  letter-spacing: 0;
  text-transform: none;
}

.event-dialog__area {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 12px;
  border-radius: 10px;
  background: rgba(250, 178, 26, 0.12);
  font-weight: 600;
}

.event-dialog__chips,
.event-dialog__attachments {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 6px;
}

.event-dialog__chips-label {
  color: #8a8a8a;
  font-size: 0.8rem;
}

.event-dialog__add-space {
  margin-top: 4px;
  padding-inline: 4px !important;
  text-transform: none;
}

.event-dialog__toggle {
  flex-wrap: wrap;
  height: auto !important;
}

.event-dialog__actions {
  padding: 14px 20px !important;
}

.event-dialog__body :deep(.v-col) {
  padding-bottom: 10px;
}

@media (max-width: 600px) {
  .event-dialog__head {
    padding: 14px 16px;
  }

  .event-dialog__body {
    padding: 16px !important;
  }

  .event-dialog__toggle :deep(.v-btn) {
    flex: 1 1 auto;
  }
}
</style>
