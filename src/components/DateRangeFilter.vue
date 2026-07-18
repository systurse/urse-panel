<template>
  <div class="date-range-filter">
    <v-text-field
      :error-messages="rangeError ? [rangeError] : []"
      :label="labelFrom"
      :max="to || undefined"
      :model-value="from"
      style="margin-bottom: 16px;"
      type="date"
      variant="outlined"
      @update:model-value="$emit('update:from', $event)"
    />
    <v-text-field
      :error-messages="rangeError ? [rangeError] : []"
      :label="labelTo"
      :min="from || undefined"
      :model-value="to"
      style="margin-bottom: 16px;"
      type="date"
      variant="outlined"
      @update:model-value="$emit('update:to', $event)"
    />
  </div>
</template>

<script setup lang="ts">
  import { computed } from 'vue'

  const props = withDefaults(defineProps<{
    from?: string
    to?: string
    labelFrom?: string
    labelTo?: string
  }>(), {
    from: '',
    to: '',
    labelFrom: 'Fecha desde',
    labelTo: 'Fecha hasta',
  })

  defineEmits<{
    'update:from': [value: string]
    'update:to': [value: string]
  }>()

  const rangeError = computed(() => {
    if (props.from && props.to && props.from > props.to) {
      return 'La fecha "desde" no puede ser posterior a "hasta".'
    }
    return ''
  })

  defineExpose({
    hasError: computed(() => !!rangeError.value),
  })
</script>
