import type { FormField, FormFieldPayload, FormFieldsPort, FormFieldUpdatePayload } from '@/modules/form-fields/port'
import { ref } from 'vue'
import { formFieldsAdapter } from '@/modules/form-fields/adapter'

export function useFormFields (port: FormFieldsPort = formFieldsAdapter) {
  const formFields = ref<FormField[]>([])
  const loading = ref(false)
  const error = ref<string | null>(null)

  async function loadFormFields (formId: number | string) {
    loading.value = true
    error.value = null

    try {
      formFields.value = await port.list(formId)
    } catch (error_) {
      error.value = error_ instanceof Error ? error_.message : 'No fue posible cargar los campos del formulario'
      throw error_
    } finally {
      loading.value = false
    }
  }

  async function addField (formId: number | string, payload: FormFieldPayload) {
    loading.value = true
    error.value = null

    try {
      const newField = await port.create(formId, payload)
      formFields.value.push(newField)
      formFields.value.sort((a, b) => a.position - b.position)
      return newField
    } catch (error_) {
      error.value = error_ instanceof Error ? error_.message : 'No fue posible agregar el campo al formulario'
      throw error_
    } finally {
      loading.value = false
    }
  }

  async function updateField (formFieldId: number | string, payload: FormFieldUpdatePayload) {
    loading.value = true
    error.value = null

    try {
      const updatedField = await port.update(formFieldId, payload)
      const index = formFields.value.findIndex(f => f.id === formFieldId)
      if (index !== -1) {
        formFields.value[index] = updatedField
      }
      formFields.value.sort((a, b) => a.position - b.position)
      return updatedField
    } catch (error_) {
      error.value = error_ instanceof Error ? error_.message : 'No fue posible actualizar el campo'
      throw error_
    } finally {
      loading.value = false
    }
  }

  async function removeField (formFieldId: number | string) {
    loading.value = true
    error.value = null

    try {
      await port.remove(formFieldId)
      formFields.value = formFields.value.filter(f => f.id !== formFieldId)
    } catch (error_) {
      error.value = error_ instanceof Error ? error_.message : 'No fue posible remover el campo del formulario'
      throw error_
    } finally {
      loading.value = false
    }
  }

  return {
    addField,
    error,
    formFields,
    loading,
    removeField,
    updateField,
  }
}
