<template>
  <v-dialog
    v-model="open"
    :fullscreen="smAndDown"
    max-width="980"
    :persistent="importing"
    scrollable
  >
    <v-card class="import-dialog" :rounded="smAndDown ? 0 : 'xl'">
      <div class="import-dialog__head">
        <div class="import-dialog__icon">
          <v-icon icon="mdi-card-account-phone-outline" size="22" />
        </div>

        <div class="import-dialog__head-text">
          <div class="import-dialog__kicker">Agenda institucional</div>
          <h3 class="import-dialog__title">Importar directores del directorio</h3>
        </div>

        <v-spacer />

        <v-btn
          aria-label="Cerrar"
          color="white"
          :disabled="importing"
          icon="mdi-close"
          size="small"
          variant="text"
          @click="open = false"
        />
      </div>

      <v-divider />

      <v-card-text class="import-dialog__body">
        <div v-if="loading" class="import-dialog__state">
          <v-progress-circular color="#c89215" indeterminate size="32" />
          <div>Buscando a los directores en Microsoft 365…</div>
        </div>

        <template v-else>
          <p class="import-dialog__intro">
            Se registran como directores aunque todavía no hayan iniciado sesión. Revisa la cuenta de cada uno:
            el día que entren con Microsoft, la plataforma los reconoce y ya tendrán la agenda.
          </p>

          <v-alert
            v-if="loadError"
            class="mb-4"
            color="error"
            density="comfortable"
            variant="tonal"
          >
            {{ loadError }}
          </v-alert>

          <v-alert
            v-if="preview?.graphError"
            class="mb-4"
            color="warning"
            density="comfortable"
            icon="mdi-microsoft"
            variant="tonal"
          >
            {{ preview.graphError }}
          </v-alert>

          <v-alert
            v-if="result"
            class="mb-4"
            :color="result.errors.length > 0 ? 'warning' : 'success'"
            density="comfortable"
            variant="tonal"
          >
            <div>Registrados: {{ result.created }} · Actualizados: {{ result.updated }}</div>

            <ul v-if="result.errors.length > 0" class="import-dialog__errors">
              <li v-for="error in result.errors" :key="error.index">{{ error.name }}: {{ error.message }}</li>
            </ul>
          </v-alert>

          <div v-if="rows.length > 0" class="import-dialog__summary">
            <v-chip
              v-for="chip in summaryChips"
              :key="chip.status"
              :color="STATUS_META[chip.status].color"
              :prepend-icon="STATUS_META[chip.status].icon"
              size="small"
              variant="tonal"
            >
              {{ chip.count }} {{ STATUS_META[chip.status].plural }}
            </v-chip>

            <v-spacer />

            <v-btn
              v-if="readyStates.length > 0"
              size="small"
              variant="text"
              @click="toggleAll"
            >
              {{ allSelectableChosen ? 'Quitar selección' : 'Seleccionar los listos' }}
            </v-btn>
          </div>

          <div v-else-if="!loadError" class="import-dialog__state">
            No se encontraron rectores ni directores con área en el directorio.
          </div>

          <v-form ref="formRef" class="import-dialog__rows">
            <article
              v-for="(state, index) in states"
              :key="state.row.directoryEntryId"
              class="import-row"
              :class="{ 'import-row--selected': state.selected }"
            >
              <div class="import-row__top">
                <v-checkbox-btn v-model="state.selected" color="#c89215" />

                <div class="import-row__who">
                  <div class="import-row__name">{{ state.row.personName }}</div>

                  <div class="import-row__meta">
                    {{ state.row.position }} · {{ state.row.area.name }}<template v-if="state.row.campus"> · {{ state.row.campus }}</template>
                  </div>
                </div>

                <v-chip
                  class="import-row__status"
                  :color="STATUS_META[state.row.status].color"
                  :prepend-icon="STATUS_META[state.row.status].icon"
                  size="small"
                  variant="tonal"
                >
                  {{ STATUS_META[state.row.status].label }}
                </v-chip>
              </div>

              <div v-if="state.selected" class="import-row__fields">
                <v-select
                  v-model="state.type"
                  class="import-row__type"
                  density="compact"
                  hide-details="auto"
                  :items="TYPE_OPTIONS"
                  label="Cargo"
                  :rules="[(value: string | null) => Boolean(value) || 'Elige el cargo.']"
                  variant="outlined"
                />

                <div class="import-row__account">
                  <v-btn-toggle
                    v-model="state.mode"
                    class="mb-2"
                    color="#c89215"
                    density="compact"
                    divided
                    mandatory
                    variant="outlined"
                  >
                    <v-btn size="small" value="account">Cuenta de Microsoft 365</v-btn>
                    <v-btn size="small" value="manual">Escribir correo</v-btn>
                  </v-btn-toggle>

                  <AgendaMicrosoftAccountPicker
                    v-if="state.mode === 'account'"
                    v-model="state.account"
                    density="compact"
                    :hint="state.row.status === 'ambiguous' ? 'Hay varias cuentas con ese nombre: elige la correcta.' : undefined"
                    :initial-items="[...(state.row.account ? [state.row.account] : []), ...state.row.alternatives]"
                    :rules="[(value: AgendaMicrosoftAccount | null) => !state.selected || Boolean(value) || 'Elige la cuenta o escribe el correo.']"
                  />

                  <v-text-field
                    v-else
                    v-model="state.email"
                    density="compact"
                    hide-details="auto"
                    hint="Debe ser la cuenta con la que la persona entra a la plataforma."
                    label="Correo"
                    persistent-hint
                    prepend-inner-icon="mdi-email-outline"
                    :rules="[validEmail]"
                    type="email"
                    variant="outlined"
                  />
                </div>
              </div>

              <div v-if="state.row.registeredDirector" class="import-row__note">
                <v-icon icon="mdi-check-circle-outline" size="16" />
                Registrado como {{ state.row.registeredDirector.user.email }} en {{ state.row.registeredDirector.area.name }}.
              </div>

              <div v-for="warning in state.row.warnings" :key="warning" class="import-row__note import-row__note--warning">
                <v-icon icon="mdi-alert-outline" size="16" />
                {{ warning }}
              </div>

              <div v-if="rowError(index)" class="import-row__note import-row__note--error">
                <v-icon icon="mdi-close-circle-outline" size="16" />
                {{ rowError(index) }}
              </div>
            </article>
          </v-form>
        </template>
      </v-card-text>

      <v-divider />

      <v-card-actions class="import-dialog__actions">
        <v-btn
          :disabled="loading || importing"
          prepend-icon="mdi-refresh"
          variant="text"
          @click="load"
        >
          Volver a buscar
        </v-btn>

        <v-spacer />

        <v-btn :disabled="importing" variant="text" @click="open = false">Cerrar</v-btn>

        <v-btn
          color="#FAB21A"
          :disabled="selectedCount === 0 || loading"
          :loading="importing"
          prepend-icon="mdi-account-multiple-plus-outline"
          variant="flat"
          @click="submit"
        >
          Importar {{ selectedCount }}
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script lang="ts" setup>
  import type { AgendaDirectorType, AgendaImportPreview, AgendaImportResult, AgendaImportRow, AgendaImportSelection, AgendaImportStatus, AgendaMicrosoftAccount, AgendaPort } from '@/modules/agenda/port'
  import { computed, reactive, ref, watch } from 'vue'
  import { useDisplay } from 'vuetify'
  import { agendaAdapter } from '@/modules/agenda/adapter'
  import AgendaMicrosoftAccountPicker from '@/modules/agenda/components/AgendaMicrosoftAccountPicker.vue'
  import { resolveApiMessage } from '@/modules/agenda/useAgendaCalendar'

  const props = withDefaults(defineProps<{
    port?: AgendaPort
  }>(), {
    port: () => agendaAdapter,
  })

  const emit = defineEmits<{
    imported: [result: AgendaImportResult]
  }>()

  const { smAndDown } = useDisplay()

  const open = defineModel<boolean>({ default: false })

  const EMAIL_PATTERN = /^[^\s@]+@[^\s@][^\s.@]*\.[^\s@]+$/

  const TYPE_OPTIONS: { title: string, value: AgendaDirectorType }[] = [
    { title: 'Rector', value: 'rector' },
    { title: 'Director general', value: 'general_director' },
    { title: 'Director de escuela', value: 'school_director' },
  ]

  const STATUS_META: Record<AgendaImportStatus, { label: string, plural: string, color: string, icon: string }> = {
    found: { label: 'Cuenta encontrada', plural: 'con cuenta encontrada', color: 'success', icon: 'mdi-account-check-outline' },
    ambiguous: { label: 'Elegir cuenta', plural: 'por elegir cuenta', color: 'warning', icon: 'mdi-account-question-outline' },
    not_found: { label: 'Sin cuenta', plural: 'sin cuenta encontrada', color: 'error', icon: 'mdi-account-off-outline' },
    graph_unavailable: { label: 'Capturar correo', plural: 'por capturar correo', color: 'grey', icon: 'mdi-email-edit-outline' },
    registered: { label: 'Ya registrado', plural: 'ya registrados', color: 'info', icon: 'mdi-check-circle-outline' },
  }

  interface RowState {
    row: AgendaImportRow
    selected: boolean
    type: AgendaDirectorType | null
    mode: 'account' | 'manual'
    account: AgendaMicrosoftAccount | null
    email: string
  }

  const formRef = ref<{ validate: () => Promise<{ valid: boolean }> } | null>(null)
  const preview = ref<AgendaImportPreview | null>(null)
  const states = ref<RowState[]>([])
  const loading = ref(false)
  const importing = ref(false)
  const loadError = ref<string | null>(null)
  const result = ref<AgendaImportResult | null>(null)
  /** Which row of the last request each error belongs to. */
  const submittedIndexes = ref<number[]>([])

  const rows = computed(() => preview.value?.rows ?? [])

  const selectedCount = computed(() => states.value.filter(state => state.selected).length)

  const summaryChips = computed(() => (Object.keys(STATUS_META) as AgendaImportStatus[])
    .map(status => ({ status, count: rows.value.filter(row => row.status === status).length }))
    .filter(chip => chip.count > 0))

  const readyStates = computed(() => states.value.filter(state => state.row.status === 'found'))
  const allSelectableChosen = computed(() => readyStates.value.length > 0 && readyStates.value.every(state => state.selected))

  function stateFor (row: AgendaImportRow): RowState {
    return reactive({
      row,
      // Only the clear matches start selected; the rest need a look first.
      selected: row.status === 'found',
      type: row.type,
      mode: row.status === 'not_found' || row.status === 'graph_unavailable' ? 'manual' : 'account',
      account: row.account,
      email: row.status === 'graph_unavailable' || row.status === 'not_found' ? (row.directoryEmail ?? '') : '',
    })
  }

  async function load () {
    loading.value = true
    loadError.value = null
    result.value = null
    try {
      preview.value = await props.port.previewDirectorImport()
      states.value = preview.value.rows.map(row => stateFor(row))
    } catch (error_) {
      preview.value = null
      states.value = []
      loadError.value = resolveApiMessage(error_, 'No fue posible leer el directorio.')
    } finally {
      loading.value = false
    }
  }

  watch(open, isOpen => {
    if (isOpen) {
      load()
    }
  }, { immediate: true })

  function toggleAll () {
    const select = !allSelectableChosen.value
    for (const state of readyStates.value) {
      state.selected = select
    }
  }

  function validEmail (value: string) {
    return EMAIL_PATTERN.test((value ?? '').trim()) || 'Escribe un correo válido.'
  }

  function rowError (index: number): string | null {
    const position = submittedIndexes.value.indexOf(index)
    return position === -1 ? null : result.value?.errors.find(error => error.index === position)?.message ?? null
  }

  function selectionFor (state: RowState): AgendaImportSelection {
    const account = state.mode === 'account' ? state.account : null

    return {
      directoryEntryId: state.row.directoryEntryId,
      areaId: state.row.area.id,
      type: state.type as AgendaDirectorType,
      email: account ? account.email : state.email.trim().toLowerCase(),
      name: account ? account.name : state.row.personName,
      microsoftId: account ? account.microsoftId : null,
    }
  }

  async function submit () {
    const validation = await formRef.value?.validate()
    if (!validation?.valid) {
      loadError.value = 'Completa la cuenta o el correo de las filas seleccionadas.'
      return
    }

    loadError.value = null
    const indexes = states.value.map((state, index) => state.selected ? index : -1).filter(index => index !== -1)

    importing.value = true
    try {
      const outcome = await props.port.importDirectors(indexes.map(index => selectionFor(states.value[index] as RowState)))
      submittedIndexes.value = indexes
      emit('imported', outcome)
      // Refresh the statuses, then show the outcome on top of them.
      await load()
      result.value = outcome
    } catch (error_) {
      loadError.value = resolveApiMessage(error_, 'No fue posible importar a los directores.')
    } finally {
      importing.value = false
    }
  }
</script>

<style scoped>
.import-dialog__head {
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 20px 24px;
  background: linear-gradient(135deg, #141414 0%, #3d2c00 100%);
  color: #ffffff;
}

.import-dialog__icon {
  display: grid;
  flex: none;
  place-items: center;
  width: 44px;
  height: 44px;
  border-radius: 12px;
  background: #FAB21A;
  color: #1a1a1a;
}

.import-dialog__kicker {
  color: #FAB21A;
  font-size: 0.72rem;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.import-dialog__title {
  margin: 2px 0 0;
  font-size: 1.2rem;
  font-weight: 800;
}

.import-dialog__body {
  padding: 18px 22px !important;
}

.import-dialog__intro {
  margin: 0 0 14px;
  color: #6b6b6b;
}

.import-dialog__state {
  display: grid;
  place-items: center;
  gap: 12px;
  padding: 40px 0;
  color: #8a8a8a;
  text-align: center;
}

.import-dialog__summary {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 6px;
  margin-bottom: 12px;
}

.import-dialog__errors {
  margin: 6px 0 0 18px;
}

.import-row {
  margin-bottom: 10px;
  padding: 12px;
  border: 1px solid rgba(var(--v-border-color), var(--v-border-opacity));
  border-radius: 12px;
}

.import-row--selected {
  border-color: #c89215;
  background: rgba(250, 178, 26, 0.06);
}

.import-row__top {
  display: flex;
  align-items: center;
  gap: 8px;
}

/* The checkbox control grows by default and pushes the name to the right. */
.import-row__top :deep(.v-selection-control) {
  flex: 0 0 auto;
}

.import-row__who {
  flex: 1;
  min-width: 0;
}

.import-row__name {
  font-weight: 700;
}

.import-row__meta {
  color: #8a8a8a;
  font-size: 0.85rem;
}

.import-row__status {
  flex: none;
}

.import-row__fields {
  display: grid;
  align-items: start;
  grid-template-columns: 220px 1fr;
  gap: 12px;
  margin: 12px 0 0 40px;
}

.import-row__note {
  display: flex;
  align-items: center;
  gap: 6px;
  margin: 8px 0 0 40px;
  color: #2f6fae;
  font-size: 0.82rem;
}

.import-row__note--warning {
  color: #b26a00;
}

.import-row__note--error {
  color: #b00020;
}

.import-dialog__actions {
  flex-wrap: wrap;
  padding: 12px 16px !important;
}

@media (max-width: 840px) {
  .import-dialog__head {
    padding: 14px 16px;
  }

  .import-dialog__body {
    padding: 14px !important;
  }

  .import-row__top {
    flex-wrap: wrap;
  }

  .import-row__status {
    margin-left: 40px;
  }

  .import-row__fields {
    grid-template-columns: 1fr;
    margin-left: 0;
  }

  .import-row__note {
    margin-left: 0;
  }
}
</style>
