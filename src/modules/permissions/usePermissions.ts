import type { Permission, PermissionsPort } from '@/modules/permissions/port'
import { onMounted, ref } from 'vue'
import { permissionsAdapter } from '@/modules/permissions/adapter'

export function usePermissions (permissionsPort: PermissionsPort = permissionsAdapter) {
  const permissions = ref<Permission[]>([])
  const loading = ref(false)
  const error = ref<string | null>(null)

  async function loadPermissions () {
    loading.value = true
    error.value = null

    try {
      permissions.value = await permissionsPort.list()
    } catch (error_) {
      error.value = error_ instanceof Error ? error_.message : 'No fue posible cargar los permisos'
      throw error_
    } finally {
      loading.value = false
    }
  }

  onMounted(() => {
    void loadPermissions()
  })

  return {
    error,
    loadPermissions,
    loading,
    permissions,
  }
}
