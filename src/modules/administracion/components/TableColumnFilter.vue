<template>
  <v-menu v-model="menu" :close-on-content-click="false" location="bottom end" offset="4">
    <template #activator="{ props: activatorProps }">
      <v-btn
        v-bind="activatorProps"
        class="column-filter__toggle"
        :color="isActive ? '#FAB21A' : undefined"
        density="comfortable"
        :icon="isActive ? 'mdi-filter' : 'mdi-filter-outline'"
        size="x-small"
        :title="`Filtrar por ${label.toLowerCase()}`"
        variant="text"
        @click.stop
      />
    </template>

    <v-card class="column-filter__card" min-width="240" rounded="lg">
      <v-card-text class="pb-2">
        <v-select
          v-if="type === 'select'"
          class="column-filter__input"
          clearable
          density="compact"
          hide-details
          :items="items"
          :label="label"
          :model-value="draft"
          variant="outlined"
          @update:model-value="applySelect"
        />

        <v-text-field
          v-else
          autofocus
          clearable
          density="compact"
          hide-details
          :label="label"
          :model-value="draft"
          :placeholder="placeholder"
          prepend-inner-icon="mdi-magnify"
          variant="outlined"
          @update:model-value="applyText"
        />
      </v-card-text>

      <v-card-actions class="pt-0">
        <v-btn
          density="comfortable"
          :disabled="!isActive"
          size="small"
          text="Limpiar"
          variant="text"
          @click="clear"
        />

        <v-spacer />

        <v-btn
          density="comfortable"
          size="small"
          text="Cerrar"
          variant="text"
          @click="menu = false"
        />
      </v-card-actions>
    </v-card>
  </v-menu>
</template>

<script lang="ts" setup>
  import { onBeforeUnmount, ref, watch } from 'vue'

  type FilterValue = boolean | string | null

  const props = withDefaults(defineProps<{
    /** Delay before a typed value is emitted, in milliseconds. */
    debounce?: number
    items?: Array<{ title: string, value: FilterValue }>
    label: string
    modelValue: FilterValue
    placeholder?: string
    type?: 'select' | 'text'
  }>(), {
    debounce: 400,
    items: () => [],
    placeholder: undefined,
    type: 'text',
  })

  const emit = defineEmits<{ 'update:model-value': [value: FilterValue] }>()

  const menu = ref(false)
  const draft = ref<FilterValue>(props.modelValue)
  const isActive = ref(isFilled(props.modelValue))

  let debounceTimer: ReturnType<typeof setTimeout> | undefined

  function isFilled (value: FilterValue) {
    return value !== null && value !== undefined && value !== ''
  }

  function cancelPending () {
    if (debounceTimer) {
      clearTimeout(debounceTimer)
      debounceTimer = undefined
    }
  }

  // The parent may reset filters (e.g. "Limpiar filtros"); mirror that here
  // unless the user is mid-edit with a debounced value still in flight.
  watch(() => props.modelValue, value => {
    if (debounceTimer) return

    draft.value = value
    isActive.value = isFilled(value)
  })

  function applyText (value: string | null) {
    draft.value = value
    isActive.value = isFilled(value)
    cancelPending()

    debounceTimer = setTimeout(() => {
      debounceTimer = undefined
      emit('update:model-value', isFilled(value) ? value : null)
    }, props.debounce)
  }

  function applySelect (value: FilterValue) {
    cancelPending()
    draft.value = value
    isActive.value = isFilled(value)
    emit('update:model-value', isFilled(value) ? value : null)
    menu.value = false
  }

  function clear () {
    cancelPending()
    draft.value = null
    isActive.value = false
    emit('update:model-value', null)
    menu.value = false
  }

  onBeforeUnmount(cancelPending)
</script>

<style scoped>
.column-filter__toggle {
  margin-inline-start: 2px;
}

.column-filter__card {
  border: 1px solid rgb(106 27 49 / 0.12);
}
</style>
