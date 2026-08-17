import type {
  PaginationMeta,
  User,
  UserFilters,
  UserPayload,
  UsersPort,
  UsersQuery,
} from '@/modules/users/port'
import { computed, ref } from 'vue'
import { DEFAULT_PER_PAGE, usersAdapter } from '@/modules/users/adapter'

function emptyMeta (perPage: number): PaginationMeta {
  return {
    currentPage: 1,
    from: null,
    lastPage: 1,
    perPage,
    to: null,
    total: 0,
  }
}

// Spatie answers 400 with the list of allowed filters/sorts, so the API message
// is far more useful than axios' generic "Request failed with status code 400".
function resolveErrorMessage (error: unknown, fallback: string) {
  const axiosError = error as { message?: string, response?: { data?: { message?: string } } }
  return axiosError?.response?.data?.message ?? axiosError?.message ?? fallback
}

export function useUsers (usersPort: UsersPort = usersAdapter) {
  const users = ref<User[]>([])
  const meta = ref<PaginationMeta>(emptyMeta(DEFAULT_PER_PAGE))
  const loading = ref(false)
  const error = ref<string | null>(null)

  const page = ref(1)
  const perPage = ref(DEFAULT_PER_PAGE)
  const sort = ref<string | null>(null)
  const filters = ref<UserFilters>({})

  // `v-data-table-server` re-emits `update:options` for changes this composable
  // already applied, so identical queries are collapsed into a single request.
  let lastQueryKey: string | null = null
  // Debounced search means responses can land out of order; only the newest
  // request is allowed to write to `users`/`meta`.
  let requestId = 0

  const hasActiveFilters = computed(() =>
    Object.values(filters.value).some(value => value !== undefined && value !== null && value !== ''),
  )

  function currentQuery (): UsersQuery {
    return {
      filters: { ...filters.value },
      page: page.value,
      perPage: perPage.value,
      sort: sort.value,
    }
  }

  /**
   * Resolves without throwing: the list is table-driven, so failures surface
   * through `error` instead of bubbling into an unhandled rejection.
   */
  async function loadUsers (options: { force?: boolean } = {}) {
    const query = currentQuery()
    const queryKey = JSON.stringify(query)

    if (!options.force && queryKey === lastQueryKey) {
      return
    }

    lastQueryKey = queryKey
    const currentRequest = ++requestId
    loading.value = true
    error.value = null

    try {
      const result = await usersPort.list(query)

      if (currentRequest !== requestId) {
        return
      }

      users.value = result.items
      meta.value = result.meta

      // A page can outrun the result set after deleting the last row of the
      // last page; step back instead of showing an empty table.
      if (result.items.length === 0 && result.meta.total > 0 && page.value > result.meta.lastPage) {
        page.value = result.meta.lastPage
        await loadUsers({ force: true })
      }
    } catch (error_) {
      if (currentRequest !== requestId) {
        return
      }

      lastQueryKey = null
      error.value = resolveErrorMessage(error_, 'No fue posible cargar los usuarios')
    } finally {
      if (currentRequest === requestId) {
        loading.value = false
      }
    }
  }

  function setOptions (options: { page?: number, perPage?: number, sort?: string | null }) {
    if (options.page !== undefined) {
      page.value = options.page
    }

    if (options.perPage !== undefined) {
      perPage.value = options.perPage
    }

    if (options.sort !== undefined) {
      sort.value = options.sort
    }

    return loadUsers()
  }

  function setFilters (next: UserFilters) {
    filters.value = { ...next }
    page.value = 1

    return loadUsers()
  }

  function resetFilters () {
    return setFilters({})
  }

  async function createUser (payload: UserPayload) {
    loading.value = true
    error.value = null

    try {
      const newUser = await usersPort.create(payload)
      await loadUsers({ force: true })
      return newUser
    } catch (error_) {
      error.value = resolveErrorMessage(error_, 'No fue posible crear el usuario')
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
      await loadUsers({ force: true })
      return updatedUser
    } catch (error_) {
      error.value = resolveErrorMessage(error_, 'No fue posible actualizar el usuario')
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
      await loadUsers({ force: true })
    } catch (error_) {
      error.value = resolveErrorMessage(error_, 'No fue posible eliminar el usuario')
      throw error_
    } finally {
      loading.value = false
    }
  }

  return {
    createUser,
    error,
    filters,
    hasActiveFilters,
    loadUsers,
    loading,
    meta,
    page,
    perPage,
    removeUser,
    resetFilters,
    setFilters,
    setOptions,
    sort,
    updateUser,
    users,
  }
}
