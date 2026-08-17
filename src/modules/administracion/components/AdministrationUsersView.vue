<template>
  <v-card class="users-card" rounded="xl" variant="flat">
    <div class="card-head">
      <div>
        <div class="section-kicker">Administración</div>
        <h2 class="card-title">Usuarios del sistema</h2>
      </div>

      <v-btn color="#FAB21A" prepend-icon="mdi-account-plus-outline" variant="flat" @click="openCreateDialog">
        Nuevo usuario
      </v-btn>
    </div>

    <v-alert
      v-if="error"
      class="mt-6"
      closable
      color="error"
      density="comfortable"
      variant="tonal"
      @click:close="clearError"
    >
      {{ error }}
    </v-alert>

    <div class="users-toolbar">
      <v-text-field
        v-model="searchInput"
        class="users-toolbar__search"
        clearable
        density="comfortable"
        hide-details
        placeholder="Buscar por nombre o correo..."
        prepend-inner-icon="mdi-magnify"
        variant="outlined"
        @update:model-value="onSearchInput"
      />

      <div class="users-toolbar__meta">
        <span class="users-toolbar__count">
          {{ meta.total }} {{ meta.total === 1 ? 'usuario' : 'usuarios' }}
        </span>

        <v-btn
          v-if="hasActiveFilters"
          density="comfortable"
          prepend-icon="mdi-filter-off-outline"
          size="small"
          text="Limpiar filtros"
          variant="text"
          @click="clearAllFilters"
        />
      </div>
    </div>

    <v-data-table-server
      v-model:items-per-page="perPage"
      v-model:page="page"
      v-model:sort-by="sortBy"
      class="users-table"
      :headers="headers"
      item-value="id"
      :items="users"
      :items-length="meta.total"
      :items-per-page-options="PER_PAGE_OPTIONS"
      items-per-page-text="Filas por página"
      :loading="loading"
      loading-text="Cargando usuarios..."
      :mobile="false"
      no-data-text="No hay usuarios que coincidan con los filtros."
      page-text="{0}-{1} de {2}"
      @update:options="onOptionsUpdate"
    >
      <template #header.name="{ column, getSortIcon }">
        <div class="v-data-table-header__content">
          <span>{{ column.title }}</span>
          <v-icon v-if="column.sortable" class="v-data-table-header__sort-icon" :icon="getSortIcon(column)" />

          <TableColumnFilter
            label="Nombre"
            :model-value="filters.name ?? null"
            placeholder="Contiene..."
            @update:model-value="value => applyFilter('name', value)"
          />
        </div>
      </template>

      <template #header.email="{ column, getSortIcon }">
        <div class="v-data-table-header__content">
          <span>{{ column.title }}</span>
          <v-icon v-if="column.sortable" class="v-data-table-header__sort-icon" :icon="getSortIcon(column)" />

          <TableColumnFilter
            label="Correo"
            :model-value="filters.email ?? null"
            placeholder="Ej. urse.edu.mx"
            @update:model-value="value => applyFilter('email', value)"
          />
        </div>
      </template>

      <template #header.roles="{ column }">
        <div class="v-data-table-header__content">
          <span>{{ column.title }}</span>

          <TableColumnFilter
            :items="roleFilterItems"
            label="Rol"
            :model-value="filters.role ?? null"
            type="select"
            @update:model-value="value => applyFilter('role', value)"
          />
        </div>
      </template>

      <template #header.verified="{ column, getSortIcon }">
        <div class="v-data-table-header__content">
          <span>{{ column.title }}</span>
          <v-icon v-if="column.sortable" class="v-data-table-header__sort-icon" :icon="getSortIcon(column)" />

          <TableColumnFilter
            :items="VERIFIED_FILTER_ITEMS"
            label="Verificación"
            :model-value="filters.verified ?? null"
            type="select"
            @update:model-value="value => applyFilter('verified', value)"
          />
        </div>
      </template>

      <template #item.name="{ item }">
        <div class="user-cell">
          <v-avatar color="#f1ddd0" size="36">{{ item.initials }}</v-avatar>
          <span class="user-cell__name">{{ item.name }}</span>
        </div>
      </template>

      <template #item.email="{ item }">
        <span class="user-cell__email">{{ item.email || '—' }}</span>
      </template>

      <template #item.roles="{ item }">
        <div class="role-chips">
          <v-chip
            v-for="(roleName, index) in displayRoles(item)"
            :key="`${item.id}-${roleName}-${index}`"
            color="#6a1b31"
            size="small"
            variant="tonal"
          >
            {{ roleName }}
          </v-chip>

          <span v-if="displayRoles(item).length === 0" class="text-medium-emphasis">Sin rol</span>
        </div>
      </template>

      <template #item.active="{ item }">
        <v-chip :color="item.active ? 'success' : 'grey'" size="small" variant="tonal">
          {{ item.active ? 'Activo' : 'Inactivo' }}
        </v-chip>
      </template>

      <template #item.verified="{ item }">
        <v-chip
          :color="item.verified ? 'success' : 'warning'"
          size="small"
          :title="item.verifiedAt ? `Verificado el ${formatDate(item.verifiedAt)}` : 'Correo sin verificar'"
          variant="tonal"
        >
          {{ item.verified ? 'Sí' : 'No' }}
        </v-chip>
      </template>

      <template #item.createdAt="{ item }">
        {{ formatDate(item.createdAt) }}
      </template>

      <template #item.actions="{ item }">
        <div class="user-actions">
          <v-btn
            color="#1a1a1a"
            icon="mdi-account-cog-outline"
            size="small"
            title="Asignar roles"
            variant="text"
            @click="openRolesDialog(item)"
          />

          <v-btn
            color="#1a1a1a"
            icon="mdi-shield-key-outline"
            size="small"
            title="Asignar permisos"
            variant="text"
            @click="openPermissionsDialog(item)"
          />

          <v-btn
            color="#FAB21A"
            icon="mdi-pencil"
            size="small"
            title="Editar usuario"
            variant="text"
            @click="openEditDialog(item)"
          />

          <v-btn
            color="error"
            icon="mdi-delete"
            size="small"
            title="Eliminar usuario"
            variant="text"
            @click="openDeleteDialog(item)"
          />
        </div>
      </template>
    </v-data-table-server>
  </v-card>

  <v-dialog v-model="formDialog" max-width="600" persistent>
    <template #default>
      <v-card :loading="loading">
        <v-card-title>
          {{ isEditing ? 'Editar Usuario' : 'Nuevo Usuario' }}
        </v-card-title>

        <v-card-text>
          <v-form ref="formRef" v-model="formValid" class="pt-4" validate-on="input lazy">
            <v-row>
              <v-col cols="12">
                <v-text-field
                  v-model="formData.name"
                  :counter="100"
                  label="Nombre completo"
                  placeholder="Ej. Juan Pérez"
                  required
                  :rules="nameRules"
                  variant="outlined"
                />
              </v-col>

              <v-col cols="12">
                <v-text-field
                  v-model="formData.email"
                  label="Correo electrónico"
                  placeholder="usuario@ejemplo.com"
                  required
                  :rules="emailRules"
                  type="email"
                  variant="outlined"
                />
              </v-col>

              <v-col cols="12">
                <v-select
                  v-model="formData.active"
                  item-title="text"
                  item-value="value"
                  :items="activeOptions"
                  label="Estado"
                  variant="outlined"
                />
              </v-col>

              <v-col cols="12">
                <v-text-field
                  v-model="formData.password"
                  :append-inner-icon="showPassword ? 'mdi-eye-off' : 'mdi-eye'"
                  label="Contraseña"
                  placeholder="Mínimo 8 caracteres"
                  :rules="isEditing ? [] : passwordRules"
                  :type="showPassword ? 'text' : 'password'"
                  variant="outlined"
                  @click:append-inner="showPassword = !showPassword"
                />
              </v-col>

              <v-col cols="12">
                <v-text-field
                  v-model="formData.passwordConfirmation"
                  label="Confirmar contraseña"
                  placeholder="Repite la contraseña"
                  :rules="isEditing ? [] : passwordConfirmationRules"
                  :type="showPassword ? 'text' : 'password'"
                  variant="outlined"
                />
              </v-col>
            </v-row>
          </v-form>
        </v-card-text>

        <v-divider />

        <v-card-actions>
          <v-spacer />
          <v-btn text="Cancelar" variant="text" @click="closeFormDialog" />

          <v-btn
            color="#FAB21A"
            :loading="loading"
            text="Guardar"
            variant="flat"
            @click="handleFormSubmit"
          />
        </v-card-actions>
      </v-card>
    </template>
  </v-dialog>

  <v-dialog v-model="deleteDialog" max-width="450" persistent>
    <v-card>
      <v-card-title class="text-h6 pt-6 pb-2">
        Confirmar eliminación
      </v-card-title>

      <v-card-text class="pb-6">
        <p>¿Estás seguro de que deseas eliminar al usuario <strong>{{ selectedUser?.name }}</strong>?</p>
        <p class="text-error mt-2">Esta acción no se puede deshacer.</p>
      </v-card-text>

      <v-divider />

      <v-card-actions>
        <v-spacer />
        <v-btn text="Cancelar" variant="text" @click="closeDeleteDialog" />

        <v-btn
          color="error"
          :loading="loading"
          text="Eliminar"
          variant="flat"
          @click="handleDelete"
        />
      </v-card-actions>
    </v-card>
  </v-dialog>

  <v-dialog v-model="permissionsDialog" max-width="720" persistent>
    <v-card :loading="permissionsDialogLoading || permissionsCatalogLoading">
      <v-card-title class="pt-6 pb-2">
        Permisos de usuario
      </v-card-title>

      <v-card-text class="pb-4">
        <div class="text-body-2 mb-4 text-medium-emphasis">
          <strong>{{ selectedUser?.name }}</strong> ({{ selectedUser?.email }})
        </div>

        <v-autocomplete
          v-model="selectedPermissionIds"
          chips
          clearable
          closable-chips
          item-title="name"
          item-value="id"
          :items="permissions"
          label="Selecciona permisos"
          :loading="permissionsCatalogLoading || permissionsDialogLoading"
          multiple
          no-data-text="No hay permisos disponibles"
          placeholder="Busca por nombre o módulo"
          prepend-inner-icon="mdi-magnify"
          variant="outlined"
        >
          <template #item="slotProps">
            <v-list-item
              v-bind="slotProps.props"
              :subtitle="permissionItemSubtitle(slotProps.item)"
            >
              <template #prepend>
                <v-icon icon="mdi-key-variant" size="18" />
              </template>
            </v-list-item>
          </template>
        </v-autocomplete>
      </v-card-text>

      <v-divider />

      <v-card-actions>
        <v-spacer />
        <v-btn text="Cancelar" variant="text" @click="closePermissionsDialog" />

        <v-btn
          color="#FAB21A"
          :loading="permissionsDialogLoading"
          text="Guardar permisos"
          variant="flat"
          @click="saveUserPermissions"
        />
      </v-card-actions>
    </v-card>
  </v-dialog>

  <v-dialog v-model="rolesDialog" max-width="600" persistent>
    <v-card :loading="rolesDialogLoading || rolesCatalogLoading">
      <v-card-title class="pt-6 pb-2">
        Roles de usuario
      </v-card-title>

      <v-card-text class="pb-4">
        <div class="text-body-2 mb-4 text-medium-emphasis">
          <strong>{{ selectedUser?.name }}</strong> ({{ selectedUser?.email }})
        </div>

        <v-autocomplete
          v-model="selectedRoleIds"
          chips
          clearable
          closable-chips
          item-title="name"
          item-value="id"
          :items="roles"
          label="Selecciona roles"
          :loading="rolesCatalogLoading || rolesDialogLoading"
          multiple
          no-data-text="No hay roles disponibles"
          placeholder="Busca por nombre"
          prepend-inner-icon="mdi-magnify"
          variant="outlined"
        />
      </v-card-text>

      <v-divider />

      <v-card-actions>
        <v-spacer />
        <v-btn text="Cancelar" variant="text" @click="closeRolesDialog" />

        <v-btn
          color="#FAB21A"
          :loading="rolesDialogLoading"
          text="Guardar roles"
          variant="flat"
          @click="saveUserRoles"
        />
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script lang="ts" setup>
  import type { Permission } from '@/modules/permissions/port'
  import type { User, UserFilters, UserPayload, UserSortField } from '@/modules/users/port'
  import { computed, onBeforeUnmount, ref } from 'vue'
  import TableColumnFilter from '@/modules/administracion/components/TableColumnFilter.vue'
  import { usePermissions } from '@/modules/permissions/usePermissions'
  import { useRoles } from '@/modules/roles/useRoles'
  import { useUsers } from '@/modules/users/useUsers'
  import { httpClient } from '@/services/http'

  interface SortItem {
    key: string
    order?: 'asc' | 'desc' | boolean
  }

  const {
    error,
    filters,
    hasActiveFilters,
    loading,
    loadUsers,
    meta,
    page,
    perPage,
    users,
    createUser,
    updateUser,
    removeUser,
    resetFilters,
    setFilters,
    setOptions,
  } = useUsers()
  const { loadRoles, loading: rolesCatalogLoading, roles } = useRoles()
  const { loadPermissions, loading: permissionsCatalogLoading, permissions } = usePermissions()

  const PER_PAGE_OPTIONS = [10, 25, 50, 100]

  const VERIFIED_FILTER_ITEMS = [
    { title: 'Verificado', value: true },
    { title: 'Sin verificar', value: false },
  ]

  // Sortable table columns mapped to the `AllowedSort` list of the backend;
  // anything outside this map is left unsorted so Spatie never answers 400.
  const SORT_FIELDS: Record<string, UserSortField> = {
    createdAt: 'created_at',
    email: 'email',
    name: 'name',
    verified: 'email_verified_at',
  }

  const headers = [
    { key: 'name', minWidth: '220px', sortable: true, title: 'Usuario' },
    { key: 'email', minWidth: '220px', sortable: true, title: 'Correo' },
    { key: 'roles', minWidth: '200px', sortable: false, title: 'Roles' },
    { key: 'active', sortable: false, title: 'Estado', width: '120px' },
    { key: 'verified', sortable: true, title: 'Verificado', width: '140px' },
    { key: 'createdAt', sortable: true, title: 'Registro', width: '150px' },
    { align: 'end', key: 'actions', sortable: false, title: 'Acciones', width: '180px' },
  ] as const

  const sortBy = ref<SortItem[]>([])
  const searchInput = ref('')

  const roleFilterItems = computed(() =>
    roles.value.map(role => ({ title: role.name, value: role.name })),
  )

  let searchTimer: ReturnType<typeof setTimeout> | undefined

  function toSortParam (sortItems: readonly SortItem[]): string | null {
    const [first] = sortItems

    if (!first) return null

    const field = SORT_FIELDS[first.key]

    if (!field) return null

    return first.order === 'desc' ? `-${field}` : field
  }

  function onOptionsUpdate (options: { itemsPerPage: number, page: number, sortBy: readonly SortItem[] }) {
    void setOptions({
      page: Number(options.page),
      perPage: Number(options.itemsPerPage),
      sort: toSortParam(options.sortBy),
    })
  }

  function applyFilter (key: keyof UserFilters, value: boolean | string | null) {
    const next: UserFilters = { ...filters.value }

    if (value === null || value === '') {
      delete next[key]
    } else {
      Object.assign(next, { [key]: value })
    }

    void setFilters(next)
  }

  function onSearchInput (value: string | null) {
    if (searchTimer) clearTimeout(searchTimer)

    searchTimer = setTimeout(() => {
      searchTimer = undefined
      applyFilter('search', value)
    }, 400)
  }

  function clearAllFilters () {
    if (searchTimer) clearTimeout(searchTimer)
    searchTimer = undefined
    searchInput.value = ''
    void resetFilters()
  }

  onBeforeUnmount(() => {
    if (searchTimer) clearTimeout(searchTimer)
  })

  // The API can describe roles either as objects or as a single `role` string;
  // both shapes are surfaced so no assignment is hidden from the list.
  function displayRoles (user: User): string[] {
    if (user.roles.length > 0) {
      return user.roles.map(role => role.name)
    }

    return user.role && user.role !== 'Sin rol' ? [user.role] : []
  }

  function formatDate (value: string | null) {
    if (!value) return '—'

    const date = new Date(value)

    return Number.isNaN(date.getTime())
      ? '—'
      : date.toLocaleDateString('es-MX', { day: '2-digit', month: 'short', year: 'numeric' })
  }

  const formDialog = ref(false)
  const formRef = ref()
  const formValid = ref(false)
  const isEditing = ref(false)
  const selectedUser = ref<User | null>(null)

  const formData = ref({
    name: '',
    email: '',
    active: true,
    password: '',
    passwordConfirmation: '',
  })

  const showPassword = ref(false)

  const activeOptions = [
    { text: 'Activo', value: true },
    { text: 'Inactivo', value: false },
  ]

  const nameRules = [
    (v: string) => !!v || 'El nombre es requerido',
    (v: string) => v.length >= 2 || 'El nombre debe tener al menos 2 caracteres',
    (v: string) => v.length <= 100 || 'El nombre no puede exceder 100 caracteres',
  ]

  const emailRules = [
    (v: string) => !!v || 'El correo electrónico es requerido',
    (v: string) => /.+@.+\..+/.test(v) || 'El correo electrónico debe ser válido',
  ]

  const passwordRules = [
    (v: string) => !!v || 'La contraseña es requerida',
    (v: string) => v.length >= 8 || 'La contraseña debe tener al menos 8 caracteres',
  ]

  const passwordConfirmationRules = [
    (v: string) => !!v || 'La confirmación de contraseña es requerida',
    (v: string) => v === formData.value.password || 'Las contraseñas no coinciden',
  ]

  function clearError () {
    error.value = null
  }

  function openCreateDialog () {
    isEditing.value = false
    formData.value = {
      name: '',
      email: '',
      active: true,
      password: '',
      passwordConfirmation: '',
    }
    showPassword.value = false
    formDialog.value = true
  }

  function openEditDialog (user: User) {
    isEditing.value = true
    selectedUser.value = user
    formData.value = {
      name: user.name,
      email: user.email,
      active: user.active,
      password: '',
      passwordConfirmation: '',
    }
    showPassword.value = false
    formDialog.value = true
  }

  function closeFormDialog () {
    formDialog.value = false
    formRef.value?.reset()
    formRef.value?.resetValidation()
  }

  async function handleFormSubmit () {
    const { valid } = await formRef.value.validate()

    if (!valid) return

    try {
      const payload: UserPayload & { password_confirmation?: string } = {
        name: formData.value.name,
        email: formData.value.email,
        active: formData.value.active,
      }

      if (formData.value.password) {
        payload.password = formData.value.password
        payload.password_confirmation = formData.value.passwordConfirmation
      }

      await (isEditing.value && selectedUser.value ? updateUser(selectedUser.value.id, payload) : createUser(payload))

      closeFormDialog()
    } catch {
      // Error is handled by the composable
    }
  }

  const deleteDialog = ref(false)
  const permissionsDialog = ref(false)
  const permissionsDialogLoading = ref(false)
  const selectedPermissionIds = ref<Array<number | string>>([])
  const initialPermissionIds = ref<Array<number | string>>([])

  function openDeleteDialog (user: User) {
    selectedUser.value = user
    deleteDialog.value = true
  }

  function closeDeleteDialog () {
    deleteDialog.value = false
    selectedUser.value = null
  }

  async function handleDelete () {
    if (!selectedUser.value) return

    try {
      await removeUser(selectedUser.value.id)
      closeDeleteDialog()
    } catch {
      // Error is handled by the composable
    }
  }

  function permissionItemSubtitle (item: Permission | { raw?: Permission } | null | undefined): string {
    if (item == null) return ''
    if ('raw' in item && item.raw) {
      return item.raw.module ?? ''
    }
    return 'module' in item ? item.module : ''
  }

  function normalizePermissionId (value: unknown): number | string | null {
    if (typeof value === 'number' || typeof value === 'string') {
      return value
    }
    return null
  }

  function extractPermissionId (entry: unknown): number | string | null {
    if (typeof entry === 'number' || typeof entry === 'string') {
      return entry
    }

    if (entry && typeof entry === 'object') {
      const record = entry as Record<string, unknown>
      return normalizePermissionId(record.id ?? record.permission_id ?? record.permissionId)
    }

    return null
  }

  function parsePermissionCollection (response: unknown): Array<number | string> {
    const source = Array.isArray(response)
      ? response
      : (response && typeof response === 'object' && 'data' in response
        ? (response as { data?: unknown }).data
        : [])

    if (!Array.isArray(source)) {
      return []
    }

    return source
      .map(item => extractPermissionId(item))
      .filter((id): id is number | string => id !== null)
  }

  async function openPermissionsDialog (user: User) {
    selectedUser.value = user
    permissionsDialog.value = true
    permissionsDialogLoading.value = true
    error.value = null

    try {
      await loadPermissions()
      const response = await httpClient.get<unknown>(`/api/v1/users/${user.id}/permissions`)
      const assignedIds = parsePermissionCollection(response)

      initialPermissionIds.value = assignedIds
      selectedPermissionIds.value = [...assignedIds]
    } catch (error_) {
      error.value = error_ instanceof Error ? error_.message : 'No fue posible cargar los permisos del usuario'
    } finally {
      permissionsDialogLoading.value = false
    }
  }

  function closePermissionsDialog () {
    permissionsDialog.value = false
    selectedPermissionIds.value = []
    initialPermissionIds.value = []
    selectedUser.value = null
  }

  async function saveUserPermissions () {
    if (!selectedUser.value) return

    permissionsDialogLoading.value = true
    error.value = null

    const toAdd = selectedPermissionIds.value.filter(id => !initialPermissionIds.value.includes(id))
    const toRemove = initialPermissionIds.value.filter(id => !selectedPermissionIds.value.includes(id))

    try {
      await Promise.all(
        toAdd.map(permissionId =>
          httpClient.post<unknown, { permission_id: number | string }>(
            `/api/v1/users/${selectedUser.value?.id}/permissions`,
            { permission_id: permissionId },
          ),
        ),
      )

      await Promise.all(
        toRemove.map(permissionId =>
          httpClient.delete<unknown>(`/api/v1/users/${selectedUser.value?.id}/permissions/${permissionId}`),
        ),
      )

      closePermissionsDialog()
    } catch (error_) {
      error.value = error_ instanceof Error ? error_.message : 'No fue posible guardar los permisos del usuario'
    } finally {
      permissionsDialogLoading.value = false
    }
  }

  const rolesDialog = ref(false)
  const rolesDialogLoading = ref(false)
  const selectedRoleIds = ref<Array<number | string>>([])
  const initialRoleIds = ref<Array<number | string>>([])

  async function openRolesDialog (user: User) {
    selectedUser.value = user
    rolesDialog.value = true
    rolesDialogLoading.value = true
    error.value = null

    try {
      await loadRoles()
      const assignedIds = user.roles.map(role => role.id)

      initialRoleIds.value = assignedIds
      selectedRoleIds.value = [...assignedIds]
    } catch (error_) {
      error.value = error_ instanceof Error ? error_.message : 'No fue posible cargar los roles del usuario'
    } finally {
      rolesDialogLoading.value = false
    }
  }

  function closeRolesDialog () {
    rolesDialog.value = false
    selectedRoleIds.value = []
    initialRoleIds.value = []
    selectedUser.value = null
  }

  async function saveUserRoles () {
    if (!selectedUser.value) return

    rolesDialogLoading.value = true
    error.value = null

    const toAdd = selectedRoleIds.value.filter(id => !initialRoleIds.value.includes(id))
    const toRemove = initialRoleIds.value.filter(id => !selectedRoleIds.value.includes(id))

    try {
      await Promise.all(
        toAdd.map(roleId =>
          httpClient.post<unknown, { role_id: number | string }>(
            `/api/v1/users/${selectedUser.value?.id}/roles`,
            { role_id: roleId },
          ),
        ),
      )

      await Promise.all(
        toRemove.map(roleId =>
          httpClient.delete<unknown>(`/api/v1/users/${selectedUser.value?.id}/roles/${roleId}`),
        ),
      )

      closeRolesDialog()
      // The page query is unchanged, so the reload has to be forced past the
      // composable's duplicate-request guard.
      await loadUsers({ force: true })
    } catch (error_) {
      error.value = error_ instanceof Error ? error_.message : 'No fue posible guardar los roles del usuario'
    } finally {
      rolesDialogLoading.value = false
    }
  }
</script>

<style scoped>
.users-card {
  padding: 24px;
  background: #ffffff;
}

.card-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
}

.section-kicker {
  color: #FAB21A;
  font-size: 0.8rem;
  font-weight: 800;
  letter-spacing: 0.14em;
  text-transform: uppercase;
}

.card-title {
  margin: 10px 0 0;
  color: #000000;
  font-size: 1.5rem;
  font-weight: 800;
}

.users-toolbar {
  display: flex;
  align-items: center;
  gap: 16px;
  margin-top: 24px;
}

.users-toolbar__search {
  max-width: 420px;
}

.users-toolbar__meta {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-inline-start: auto;
}

.users-toolbar__count {
  color: #5e5e5e;
  font-size: 0.85rem;
  font-weight: 600;
}

.users-table {
  margin-top: 16px;
  border: 1px solid rgb(106 27 49 / 0.08);
  border-radius: 12px;
}

.user-cell {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 8px 0;
}

.user-cell__name {
  color: #000000;
  font-weight: 700;
}

.user-cell__email {
  color: #5e5e5e;
}

.role-chips {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
  padding: 8px 0;
}

.user-actions {
  display: flex;
  justify-content: flex-end;
  gap: 4px;
}

@media (max-width: 960px) {
  .card-head,
  .users-toolbar {
    flex-direction: column;
    align-items: flex-start;
  }

  .users-toolbar__search {
    max-width: none;
    width: 100%;
  }

  .users-toolbar__meta {
    margin-inline-start: 0;
  }
}
</style>
