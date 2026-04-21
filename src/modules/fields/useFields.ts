import type { Field, FieldPayload, FieldsPort } from '@/modules/fields/port'
import { onMounted, ref } from 'vue'
import { fieldsAdapter } from '@/modules/fields/adapter'

export function useFields (fieldsPort: FieldsPort = fieldsAdapter) {
  const fields = ref<Field[]>([])
  const loading = ref(false)
  const error = ref<string | null>(null)

  async function loadFields () {
    loading.value = true
    error.value = null

    try {
      fields.value = await fieldsPort.list()
    } catch (error_) {
      error.value = error_ instanceof Error ? error_.message : 'No fue posible cargar los campos'
      throw error_
    } finally {
      loading.value = false
    }
  }

  async function createField (payload: FieldPayload) {
    loading.value = true
    error.value = null

    try {
      const newField = await fieldsPort.create(payload)
      fields.value.push(newField)
      return newField
    } catch (error_) {
      error.value = error_ instanceof Error ? error_.message : 'No fue posible crear el campo'
      throw error_
    } finally {
      loading.value = false
    }
  }

  async function updateField (fieldId: number | string, payload: Partial<FieldPayload>) {
    loading.value = true
    error.value = null

    try {
      const updatedField = await fieldsPort.update(fieldId, payload)
      const index = fields.value.findIndex(f => f.id === fieldId)
      if (index !== -1) {
        fields.value[index] = updatedField
      }
      return updatedField
    } catch (error_) {
      error.value = error_ instanceof Error ? error_.message : 'No fue posible actualizar el campo'
      throw error_
    } finally {
      loading.value = false
    }
  }

  async function removeField (fieldId: number | string) {
    loading.value = true
    error.value = null

    try {
      await fieldsPort.remove(fieldId)
      fields.value = fields.value.filter(f => f.id !== fieldId)
    } catch (error_) {
      error.value = error_ instanceof Error ? error_.message : 'No fue posible eliminar el campo'
      throw error_
    } finally {
      loading.value = false
    }
  }

  onMounted(() => {
    void loadFields()
  })

  return {
    createField,
    error,
    loadFields,
    loading,
    removeField,
    fields,
    updateField,
  }
}
