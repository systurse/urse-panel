<template>
  <v-autocomplete
    v-model="model"
    v-model:search="search"
    clearable
    :density="density"
    :error-messages="errorMessages ?? (searchError ? [searchError] : undefined)"
    hide-details="auto"
    :hint="hint"
    item-title="name"
    item-value="microsoftId"
    :items="items"
    :label="label"
    :loading="loading"
    :no-data-text="noDataText"
    no-filter
    persistent-hint
    prepend-inner-icon="mdi-microsoft"
    return-object
    :rules="rules"
    variant="outlined"
  >
    <template #item="{ props: itemProps, item }">
      <v-list-item v-bind="itemProps" :subtitle="[item.email, item.jobTitle].filter(Boolean).join(' · ')">
        <template v-if="item.isDirector" #append>
          <v-chip color="#c89215" size="x-small" variant="tonal">Ya es director</v-chip>
        </template>
      </v-list-item>
    </template>
  </v-autocomplete>
</template>

<script lang="ts" setup>
  import type { AgendaMicrosoftAccount, AgendaPort } from '@/modules/agenda/port'
  import { computed, onBeforeUnmount, ref, watch } from 'vue'
  import { agendaAdapter } from '@/modules/agenda/adapter'
  import { resolveApiMessage } from '@/modules/agenda/useAgendaCalendar'

  const props = withDefaults(defineProps<{
    label?: string
    hint?: string
    density?: 'default' | 'comfortable' | 'compact'
    /** Accounts offered before any search, e.g. the alternatives the import proposed. */
    initialItems?: AgendaMicrosoftAccount[]
    errorMessages?: string[]
    rules?: ((value: AgendaMicrosoftAccount | null) => boolean | string)[]
    port?: AgendaPort
  }>(), {
    label: 'Cuenta de Microsoft 365',
    hint: undefined,
    density: 'comfortable',
    initialItems: () => [],
    errorMessages: undefined,
    rules: () => [],
    port: () => agendaAdapter,
  })

  const model = defineModel<AgendaMicrosoftAccount | null>({ default: null })

  const SEARCH_DEBOUNCE_MS = 400

  const search = ref('')
  const results = ref<AgendaMicrosoftAccount[]>([])
  const loading = ref(false)
  const searchError = ref<string | null>(null)
  let timer: ReturnType<typeof setTimeout> | undefined
  let requestId = 0

  const noDataText = computed(() => {
    if (searchError.value) {
      return searchError.value
    }
    return search.value && search.value.trim().length >= 2 ? 'Sin cuentas con ese nombre o correo' : 'Escribe un nombre o correo'
  })

  // The chosen account stays in the list while a new search runs.
  const items = computed(() => {
    const seen = new Set<string>()
    return [...(model.value ? [model.value] : []), ...props.initialItems, ...results.value].filter(account => {
      if (seen.has(account.microsoftId)) {
        return false
      }
      seen.add(account.microsoftId)
      return true
    })
  })

  watch(search, value => {
    clearTimeout(timer)
    const term = value?.trim() ?? ''
    if (term.length < 2 || term === model.value?.name) {
      return
    }
    timer = setTimeout(() => runSearch(term), SEARCH_DEBOUNCE_MS)
  })

  onBeforeUnmount(() => clearTimeout(timer))

  async function runSearch (term: string) {
    const current = ++requestId
    loading.value = true
    searchError.value = null
    try {
      const accounts = await props.port.searchMicrosoftUsers(term)
      if (current === requestId) {
        results.value = accounts
      }
    } catch (error_) {
      if (current === requestId) {
        results.value = []
        searchError.value = resolveApiMessage(error_, 'No fue posible buscar en Microsoft 365.')
      }
    } finally {
      if (current === requestId) {
        loading.value = false
      }
    }
  }
</script>
