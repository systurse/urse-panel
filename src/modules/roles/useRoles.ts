import type { Role, RolePayload, RolesPort } from '@/modules/roles/port'
import { onMounted, ref } from 'vue'
import { rolesAdapter } from '@/modules/roles/adapter'

export function useRoles (rolesPort: RolesPort = rolesAdapter) {
  const roles = ref<Role[]>([])
  const loading = ref(false)
  const error = ref<string | null>(null)

  async function loadRoles () {
    loading.value = true
    error.value = null

    try {
      roles.value = await rolesPort.list()
    } catch (error_) {
      error.value = error_ instanceof Error ? error_.message : 'No fue posible cargar los roles'
      throw error_
    } finally {
      loading.value = false
    }
  }

  async function createRole (payload: RolePayload) {
    loading.value = true
    error.value = null

    try {
      const newRole = await rolesPort.create(payload)
      roles.value.push(newRole)
      return newRole
    } catch (error_) {
      error.value = error_ instanceof Error ? error_.message : 'No fue posible crear el rol'
      throw error_
    } finally {
      loading.value = false
    }
  }

  async function updateRole (roleId: number | string, payload: Partial<RolePayload>) {
    loading.value = true
    error.value = null

    try {
      const updatedRole = await rolesPort.update(roleId, payload)
      const index = roles.value.findIndex(r => r.id === roleId)
      if (index !== -1) {
        roles.value[index] = updatedRole
      }
      return updatedRole
    } catch (error_) {
      error.value = error_ instanceof Error ? error_.message : 'No fue posible actualizar el rol'
      throw error_
    } finally {
      loading.value = false
    }
  }

  async function removeRole (roleId: number | string) {
    loading.value = true
    error.value = null

    try {
      await rolesPort.remove(roleId)
      roles.value = roles.value.filter(r => r.id !== roleId)
    } catch (error_) {
      error.value = error_ instanceof Error ? error_.message : 'No fue posible eliminar el rol'
      throw error_
    } finally {
      loading.value = false
    }
  }

  onMounted(() => {
    void loadRoles()
  })

  return {
    createRole,
    error,
    loadRoles,
    loading,
    removeRole,
    roles,
    updateRole,
  }
}
