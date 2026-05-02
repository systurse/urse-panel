import type { EncargadoPort, SshKeyInfo } from '@/modules/encargado/port'
import { onMounted, ref } from 'vue'
import { encargadoAdapter } from '@/modules/encargado/adapter'

export function useSshKey (encargadoPort: EncargadoPort = encargadoAdapter) {
  const keyInfo = ref<SshKeyInfo | null>(null)
  const loading = ref(false)
  const error = ref<string | null>(null)
  const success = ref<string | null>(null)
  /** true when the user explicitly wants to replace an existing key */
  const changingKey = ref(false)

  async function fetchKey () {
    loading.value = true
    error.value = null
    try {
      keyInfo.value = await encargadoPort.fetchKey()
    } catch {
      // not critical — just leave keyInfo null so the form shows
    } finally {
      loading.value = false
    }
  }

  async function uploadKey (privateKey: string): Promise<boolean> {
    loading.value = true
    error.value = null
    success.value = null

    try {
      keyInfo.value = await encargadoPort.storeKey(privateKey)
      success.value = 'Clave SSH registrada correctamente.'
      changingKey.value = false
      return true
    } catch (error_) {
      error.value = error_ instanceof Error ? error_.message : 'No fue posible registrar la clave SSH'
      return false
    } finally {
      loading.value = false
    }
  }

  async function removeKey (): Promise<boolean> {
    loading.value = true
    error.value = null
    success.value = null

    try {
      await encargadoPort.deleteKey()
      keyInfo.value = null
      changingKey.value = false
      success.value = 'Clave SSH eliminada.'
      return true
    } catch (error_) {
      error.value = error_ instanceof Error ? error_.message : 'No fue posible eliminar la clave SSH'
      return false
    } finally {
      loading.value = false
    }
  }

  onMounted(fetchKey)

  return {
    changingKey,
    error,
    keyInfo,
    loading,
    removeKey,
    success,
    uploadKey,
  }
}
