<script lang="ts" setup>
  import type { Field } from '@/modules/fields/port'
  import { computed, onMounted, ref, watch } from 'vue'
  import { formFieldsAdapter } from '@/modules/form-fields/adapter'
  import { buildSchema } from '@/utils/schemaBuilder'

  interface Props {
    formId: number | string
    mode?: 'preview' | 'submit'
    initialData?: Record<string, unknown>
    submitLabel?: string
  }

  interface Emits {
    (event: 'submit' | 'update:modelValue', data: Record<string, unknown>): void
    (event: 'error', message: string): void
  }

  const props = withDefaults(defineProps<Props>(), {
    mode: 'submit',
    initialData: () => ({}),
    submitLabel: 'Enviar',
  })

  const emit = defineEmits<Emits>()

  const fields = ref<Field[]>([])
  const loading = ref(false)
  const error = ref<string | null>(null)
  const formData = ref<Record<string, unknown>>({ ...props.initialData })

  const schema = computed(() =>
    fields.value.length > 0 ? buildSchema(fields.value) : null,
  )

  async function fetchFields (formId: number | string) {
    loading.value = true
    error.value = null
    try {
      const formFields = await formFieldsAdapter.listByForm(formId)
      fields.value = formFields.map(ff => ff.field) as Field[]
    } catch {
      error.value = 'Error al cargar los campos del formulario'
      emit('error', error.value)
    } finally {
      loading.value = false
    }
  }

  onMounted(() => fetchFields(props.formId))

  watch(() => props.formId, newId => {
    formData.value = { ...props.initialData }
    fetchFields(newId)
  })

  function handleSubmit () {
    emit('submit', { ...formData.value })
  }

  function getInputType (field: Field): string {
    const map: Record<string, string> = {
      number: 'number',
      email: 'email',
      date: 'date',
      datetime: 'datetime-local',
    }
    return map[field.type] ?? 'text'
  }

  function getStringValue (key: string): string {
    const val = formData.value[key]
    return typeof val === 'string' ? val : ''
  }

  function setStringValue (key: string, val: string) {
    formData.value[key] = val
    emit('update:modelValue', { ...formData.value })
  }

  function getArrayValue (key: string): string[] {
    const val = formData.value[key]
    return Array.isArray(val) ? val : []
  }

  function setArrayValue (key: string, val: string[]) {
    formData.value[key] = val
    emit('update:modelValue', { ...formData.value })
  }

  function getBooleanValue (key: string): boolean {
    return formData.value[key] === true
  }

  function setBooleanValue (key: string, val: boolean) {
    formData.value[key] = val
    emit('update:modelValue', { ...formData.value })
  }
</script>

<template>
  <div class="form-renderer">
    <div v-if="loading" class="form-renderer__loading">
      <v-progress-circular color="primary" indeterminate size="32" />
      <span class="form-renderer__loading-text">Cargando formulario...</span>
    </div>

    <v-alert
      v-else-if="error"
      class="mb-4"
      color="error"
      density="comfortable"
      variant="tonal"
    >
      {{ error }}
    </v-alert>

    <v-alert
      v-else-if="!loading && fields.length === 0"
      class="mb-4"
      color="info"
      density="comfortable"
      variant="tonal"
    >
      Este formulario no tiene campos configurados.
    </v-alert>

    <template v-else-if="schema">
      <template v-for="field in fields" :key="field.name">
        <v-textarea
          v-if="field.type === 'textarea'"
          class="mb-3"
          density="comfortable"
          :label="field.label"
          :model-value="getStringValue(field.name)"
          :readonly="mode === 'preview'"
          :required="field.isRequired"
          rows="4"
          variant="outlined"
          @update:model-value="setStringValue(field.name, $event)"
        />

        <v-select
          v-else-if="field.type === 'select' || field.type === 'radio'"
          class="mb-3"
          density="comfortable"
          :items="field.options ?? []"
          :label="field.label"
          :model-value="getStringValue(field.name)"
          :readonly="mode === 'preview'"
          :required="field.isRequired"
          variant="outlined"
          @update:model-value="setStringValue(field.name, $event)"
        />

        <v-select
          v-else-if="field.type === 'multiselect'"
          class="mb-3"
          density="comfortable"
          :items="field.options ?? []"
          :label="field.label"
          :model-value="getArrayValue(field.name)"
          multiple
          :readonly="mode === 'preview'"
          :required="field.isRequired"
          variant="outlined"
          @update:model-value="setArrayValue(field.name, $event)"
        />

        <div v-else-if="field.type === 'checkbox'" class="mb-3">
          <template v-if="field.options && field.options.length > 0">
            <div class="text-body-2 mb-1">{{ field.label }}</div>
            <v-checkbox
              v-for="opt in field.options"
              :key="opt"
              density="comfortable"
              hide-details
              :label="opt"
              :model-value="getArrayValue(field.name)"
              :readonly="mode === 'preview'"
              :value="opt"
              @update:model-value="(v: string[] | null) => setArrayValue(field.name, v ?? [])"
            />
          </template>
          <v-checkbox
            v-else
            density="comfortable"
            :label="field.label"
            :model-value="getBooleanValue(field.name)"
            :readonly="mode === 'preview'"
            @update:model-value="(v: boolean | null) => setBooleanValue(field.name, v ?? false)"
          />
        </div>

        <v-file-input
          v-else-if="field.type === 'file'"
          class="mb-3"
          density="comfortable"
          :label="field.label"
          :readonly="mode === 'preview'"
          :required="field.isRequired"
          variant="outlined"
          @update:model-value="(v) => { formData[field.name] = v; emit('update:modelValue', { ...(formData as Record<string, unknown>) }) }"
        />

        <v-text-field
          v-else
          class="mb-3"
          density="comfortable"
          :label="field.label"
          :model-value="getStringValue(field.name)"
          :readonly="mode === 'preview'"
          :required="field.isRequired"
          :type="getInputType(field)"
          variant="outlined"
          @update:model-value="setStringValue(field.name, $event)"
        />
      </template>

      <div v-if="mode === 'submit'" class="form-renderer__actions">
        <v-btn color="primary" variant="flat" @click="handleSubmit">
          {{ submitLabel }}
        </v-btn>
      </div>
    </template>
  </div>
</template>

<style scoped>
.form-renderer__loading {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 24px 0;
}

.form-renderer__loading-text {
  color: rgba(0, 0, 0, 0.6);
  font-size: 0.875rem;
}

.form-renderer__actions {
  display: flex;
  justify-content: flex-end;
  margin-top: 16px;
}
</style>
