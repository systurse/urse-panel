import type { Form, FormPayload, FormsPort } from '@/modules/forms/port'
import { onMounted, ref } from 'vue'
import { formsAdapter } from '@/modules/forms/adapter'

export function useForms (formsPort: FormsPort = formsAdapter) {
  const forms = ref<Form[]>([])
  const loading = ref(false)
  const error = ref<string | null>(null)

  async function loadForms () {
    loading.value = true
    error.value = null

    try {
      forms.value = await formsPort.list()
    } catch (error_) {
      error.value = error_ instanceof Error ? error_.message : 'No fue posible cargar los formularios'
      throw error_
    } finally {
      loading.value = false
    }
  }

  async function createForm (payload: FormPayload) {
    loading.value = true
    error.value = null

    try {
      const newForm = await formsPort.create(payload)
      forms.value.push(newForm)
      return newForm
    } catch (error_) {
      error.value = error_ instanceof Error ? error_.message : 'No fue posible crear el formulario'
      throw error_
    } finally {
      loading.value = false
    }
  }

  async function updateForm (formId: number | string, payload: Partial<FormPayload>) {
    loading.value = true
    error.value = null

    try {
      const updatedForm = await formsPort.update(formId, payload)
      const index = forms.value.findIndex(f => f.id === formId)
      if (index !== -1) {
        forms.value[index] = updatedForm
      }
      return updatedForm
    } catch (error_) {
      error.value = error_ instanceof Error ? error_.message : 'No fue posible actualizar el formulario'
      throw error_
    } finally {
      loading.value = false
    }
  }

  async function removeForm (formId: number | string) {
    loading.value = true
    error.value = null

    try {
      await formsPort.remove(formId)
      forms.value = forms.value.filter(f => f.id !== formId)
    } catch (error_) {
      error.value = error_ instanceof Error ? error_.message : 'No fue posible eliminar el formulario'
      throw error_
    } finally {
      loading.value = false
    }
  }

  onMounted(() => {
    void loadForms()
  })

  return {
    createForm,
    error,
    loadForms,
    loading,
    removeForm,
    forms,
    updateForm,
  }
}
