<template>
  <div class="operators-page">
    <v-card class="operators-card" rounded="xl" variant="flat">
      <div class="section-kicker">Centro de cómputo</div>
      <h2 class="card-title">Operadores del buzón de impresión</h2>

      <p class="card-subtitle">
        Asigna los campus que cada operador puede ver en el panel. Un usuario necesita el permiso
        <code>printing.panel.view</code> (asignado desde Usuarios y Roles) antes de aparecer aquí.
      </p>

      <v-alert
        v-if="error"
        class="mt-4"
        closable
        color="error"
        variant="tonal"
        @click:close="error = null"
      >
        {{ error }}
      </v-alert>

      <v-autocomplete
        v-model="selectedUserId"
        class="mt-6"
        clearable
        item-title="name"
        item-value="id"
        :items="userOptions"
        label="Buscar operador"
        :loading="usersLoading"
        no-data-text="No se encontraron usuarios con ese nombre o correo."
        no-filter
        prepend-inner-icon="mdi-account-search-outline"
        return-object
        :search="userSearch"
        variant="outlined"
        @update:search="onUserSearch"
      >
        <template #item="{ props: itemProps, item }">
          <v-list-item v-bind="itemProps" :subtitle="item.email" />
        </template>
      </v-autocomplete>

      <template v-if="selectedUserId">
        <v-divider class="my-4" />

        <div v-if="campusesLoading" class="state-box">
          <v-progress-circular color="#c89215" indeterminate />
          <span>Cargando campus asignados...</span>
        </div>

        <template v-else>
          <v-select
            v-model="assignedCampuses"
            chips
            closable-chips
            item-title="label"
            item-value="key"
            :items="campusOptions"
            label="Campus asignados"
            multiple
            variant="outlined"
          />

          <v-btn
            color="#c89215"
            :loading="saving"
            prepend-icon="mdi-content-save-outline"
            variant="flat"
            @click="save"
          >
            Guardar
          </v-btn>
        </template>
      </template>
    </v-card>

    <v-snackbar v-model="snackbar" color="success" location="top" :timeout="3000">
      Campus actualizados correctamente.
    </v-snackbar>
  </div>
</template>

<script lang="ts" setup>
  import type { PrintingCampus } from '@/modules/printing/port'
  import type { User } from '@/modules/users/port'
  import { onMounted, ref, watch } from 'vue'
  import { printingAdapter } from '@/modules/printing/adapter'
  import { usersAdapter } from '@/modules/users/adapter'

  interface ApiErrorShape {
    message?: string
    response?: { data?: { message?: string }, status?: number }
  }

  function resolveApiMessage (error_: unknown, fallback: string): string {
    const apiError = error_ as ApiErrorShape
    return apiError?.response?.data?.message ?? apiError?.message ?? fallback
  }

  const error = ref<string | null>(null)

  const userOptions = ref<User[]>([])
  const usersLoading = ref(false)
  const userSearch = ref('')
  const selectedUserId = ref<User | null>(null)

  const campuses = ref<PrintingCampus[]>([])
  const campusOptions = ref<Array<PrintingCampus>>([])

  const assignedCampuses = ref<string[]>([])
  const campusesLoading = ref(false)
  const saving = ref(false)
  const snackbar = ref(false)

  let searchTimer: ReturnType<typeof setTimeout> | undefined

  async function loadUsers (search: string) {
    usersLoading.value = true

    try {
      const result = await usersAdapter.list({
        filters: search ? { search } : { permission: 'printing.panel.view' },
        perPage: 20,
      })
      userOptions.value = result.items
    } catch (error_) {
      error.value = resolveApiMessage(error_, 'No fue posible buscar usuarios.')
    } finally {
      usersLoading.value = false
    }
  }

  function onUserSearch (value: string) {
    userSearch.value = value ?? ''

    if (searchTimer) clearTimeout(searchTimer)
    searchTimer = setTimeout(() => void loadUsers(userSearch.value), 350)
  }

  async function loadCampuses () {
    try {
      campuses.value = await printingAdapter.listCampuses()
      // `unknown` (mobile data / unrecognized network) is a valid assignment
      // even when the endpoint that lists campus tabs omits it for this operator.
      campusOptions.value = campuses.value.some(campus => campus.key === 'unknown')
        ? campuses.value
        : [...campuses.value, { key: 'unknown', label: 'Datos móviles / red no reconocida' }]
    } catch (error_) {
      error.value = resolveApiMessage(error_, 'No fue posible cargar los campus.')
    }
  }

  async function loadAssignedCampuses (userId: number | string) {
    campusesLoading.value = true
    error.value = null

    try {
      assignedCampuses.value = await printingAdapter.getOperatorCampuses(userId)
    } catch (error_) {
      error.value = resolveApiMessage(error_, 'No fue posible cargar los campus del operador.')
      assignedCampuses.value = []
    } finally {
      campusesLoading.value = false
    }
  }

  async function save () {
    if (!selectedUserId.value) return

    saving.value = true
    error.value = null

    try {
      assignedCampuses.value = await printingAdapter.setOperatorCampuses(
        selectedUserId.value.id,
        assignedCampuses.value,
      )
      snackbar.value = true
    } catch (error_) {
      error.value = resolveApiMessage(error_, 'No fue posible guardar los campus.')
    } finally {
      saving.value = false
    }
  }

  watch(selectedUserId, user => {
    if (user) void loadAssignedCampuses(user.id)
    else assignedCampuses.value = []
  })

  onMounted(() => {
    void loadUsers('')
    void loadCampuses()
  })
</script>

<style scoped>
.operators-page {
  display: grid;
}

.operators-card {
  padding: 24px;
  background: #ffffff;
}

.section-kicker {
  color: #c89215;
  font-size: 0.8rem;
  font-weight: 800;
  letter-spacing: 0.14em;
  text-transform: uppercase;
}

.card-title {
  margin: 8px 0 0;
  color: #000000;
  font-size: 1.5rem;
  font-weight: 800;
}

.card-subtitle {
  margin: 4px 0 0;
  max-width: 64ch;
  color: #5e5e5e;
}

.state-box {
  display: flex;
  align-items: center;
  gap: 12px;
  min-height: 80px;
  color: #5e5e5e;
}
</style>
