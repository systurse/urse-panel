import type { User, UserPayload, UsersPort } from '@/modules/users/port'
import { onMounted, ref } from 'vue'
import { usersAdapter } from '@/modules/users/adapter'

export function useUsers (usersPort: UsersPort = usersAdapter) {
  const users = ref<User[]>([])
  const loading = ref(false)
  const error = ref<string | null>(null)

  async function loadUsers () {
    loading.value = true
    error.value = null

    try {
      users.value = await usersPort.list()
    } catch (error_) {
      error.value = error_ instanceof Error ? error_.message : 'No fue posible cargar los usuarios'
      throw error_
    } finally {
      loading.value = false
    }
  }

  async function createUser (payload: UserPayload) {
    loading.value = true
    error.value = null

    try {
      const newUser = await usersPort.create(payload)
      users.value.push(newUser)
      return newUser
    } catch (error_) {
      error.value = error_ instanceof Error ? error_.message : 'No fue posible crear el usuario'
      throw error_
    } finally {
      loading.value = false
    }
  }

  async function updateUser (userId: number | string, payload: Partial<UserPayload>) {
    loading.value = true
    error.value = null

    try {
      const updatedUser = await usersPort.update(userId, payload)
      const index = users.value.findIndex(u => u.id === userId)
      if (index !== -1) {
        users.value[index] = updatedUser
      }
      return updatedUser
    } catch (error_) {
      error.value = error_ instanceof Error ? error_.message : 'No fue posible actualizar el usuario'
      throw error_
    } finally {
      loading.value = false
    }
  }

  async function removeUser (userId: number | string) {
    loading.value = true
    error.value = null

    try {
      await usersPort.remove(userId)
      users.value = users.value.filter(u => u.id !== userId)
    } catch (error_) {
      error.value = error_ instanceof Error ? error_.message : 'No fue posible eliminar el usuario'
      throw error_
    } finally {
      loading.value = false
    }
  }

  onMounted(() => {
    void loadUsers()
  })

  return {
    createUser,
    error,
    loadUsers,
    loading,
    removeUser,
    updateUser,
    users,
  }
}
