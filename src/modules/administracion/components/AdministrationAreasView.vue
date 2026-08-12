<template>
  <v-card class="areas-card" rounded="xl" variant="flat">
    <div class="card-head">
      <div>
        <div class="section-kicker">Administración</div>
        <h2 class="card-title">Áreas</h2>
      </div>

      <v-btn color="#FAB21A" prepend-icon="mdi-sitemap-outline" variant="flat" @click="openCreateDialog">
        Nueva área
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

    <div v-if="loading" class="areas-state">
      <v-progress-circular color="#FAB21A" indeterminate />
      <span>Cargando áreas...</span>
    </div>

    <div v-else-if="areas.length === 0" class="areas-state areas-state--empty">
      <v-icon color="#FAB21A" icon="mdi-sitemap-outline" size="32" />
      <span>No hay áreas registradas.</span>
    </div>

    <div v-else class="area-list">
      <div
        v-for="entry in indentedAreas"
        :key="entry.area.id"
        class="area-row"
        :style="{ paddingLeft: `${entry.depth * 28}px` }"
      >
        <div class="area-main">
          <v-icon color="#FAB21A" :icon="entry.depth === 0 ? 'mdi-office-building-outline' : 'mdi-subdirectory-arrow-right'" size="20" />

          <div>
            <div class="area-name">
              {{ entry.area.name }}
              <span v-if="entry.area.type" class="area-type">· {{ entry.area.type }}</span>
            </div>

            <div class="area-manager">
              {{ entry.area.manager ? `Encargado: ${entry.area.manager.name}` : 'Sin encargado asignado aún' }}
            </div>
          </div>
        </div>

        <div class="area-actions">
          <v-btn
            color="#FAB21A"
            icon="mdi-pencil"
            size="small"
            variant="text"
            @click="openEditDialog(entry.area)"
          />

          <v-btn
            color="error"
            icon="mdi-delete"
            size="small"
            variant="text"
            @click="openDeleteDialog(entry.area)"
          />
        </div>
      </div>
    </div>
  </v-card>

  <v-dialog v-model="formDialog" max-width="600" persistent>
    <template #default>
      <v-card :loading="loading">
        <v-card-title>
          {{ isEditing ? 'Editar Área' : 'Nueva Área' }}
        </v-card-title>

        <v-card-text>
          <v-form ref="formRef" v-model="formValid" class="pt-4" validate-on="input lazy">
            <v-row>
              <v-col cols="12">
                <v-text-field
                  v-model="formData.name"
                  :counter="100"
                  label="Nombre"
                  placeholder="Ej. Rectoría, Departamento de Sistemas"
                  required
                  :rules="nameRules"
                  variant="outlined"
                />
              </v-col>

              <v-col cols="12">
                <v-text-field
                  v-model="formData.type"
                  label="Tipo (opcional)"
                  placeholder="Ej. Dirección, Coordinación, Departamento"
                  variant="outlined"
                />
              </v-col>

              <v-col cols="12">
                <v-select
                  v-model="formData.parent_id"
                  clearable
                  item-title="name"
                  item-value="id"
                  :items="parentOptions"
                  label="Área superior (opcional)"
                  variant="outlined"
                />
              </v-col>

              <v-col cols="12">
                <v-select
                  v-model="formData.manager_employee_id"
                  clearable
                  item-title="name"
                  item-value="id"
                  :items="employees"
                  label="Encargado (opcional)"
                  :loading="employeesLoading"
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
        <p>¿Estás seguro de que deseas eliminar el área <strong>{{ selectedArea?.name }}</strong>?</p>
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
</template>

<script lang="ts" setup>
  import type { Area, AreaPayload } from '@/modules/areas/port'
  import type { AxiosError } from 'axios'
  import { computed, ref } from 'vue'
  import { useAreas } from '@/modules/areas/useAreas'
  import { useEmployees } from '@/modules/employees/useEmployees'

  const { areas, error, loading, createArea, updateArea, removeArea } = useAreas()
  const { employees, loading: employeesLoading } = useEmployees()

  const formDialog = ref(false)
  const formRef = ref()
  const formValid = ref(false)
  const isEditing = ref(false)
  const selectedArea = ref<Area | null>(null)

  const formData = ref<{
    name: string
    type: string
    parent_id: number | string | null
    manager_employee_id: number | string | null
  }>({
    name: '',
    type: '',
    parent_id: null,
    manager_employee_id: null,
  })

  const nameRules = [
    (v: string) => !!v || 'El nombre es requerido',
    (v: string) => v.length >= 2 || 'El nombre debe tener al menos 2 caracteres',
    (v: string) => v.length <= 100 || 'El nombre no puede exceder 100 caracteres',
  ]

  const parentOptions = computed(() =>
    areas.value.filter(area => area.id !== selectedArea.value?.id),
  )

  const indentedAreas = computed(() => {
    const byParent = new Map<string, Area[]>()
    for (const area of areas.value) {
      const key = area.parent_id === null ? 'root' : String(area.parent_id)
      const siblings = byParent.get(key) ?? []
      siblings.push(area)
      byParent.set(key, siblings)
    }
    for (const siblings of byParent.values()) {
      siblings.sort((a, b) => a.name.localeCompare(b.name))
    }

    const result: Array<{ area: Area, depth: number }> = []
    const visited = new Set<number | string>()

    function visit (area: Area, depth: number) {
      if (visited.has(area.id)) return
      visited.add(area.id)
      result.push({ area, depth })
      for (const child of byParent.get(String(area.id)) ?? []) {
        visit(child, depth + 1)
      }
    }

    for (const root of byParent.get('root') ?? []) {
      visit(root, 0)
    }

    return result
  })

  function clearError () {
    error.value = null
  }

  function openCreateDialog () {
    isEditing.value = false
    formData.value = { name: '', type: '', parent_id: null, manager_employee_id: null }
    formDialog.value = true
  }

  function openEditDialog (area: Area) {
    isEditing.value = true
    selectedArea.value = area
    formData.value = {
      manager_employee_id: area.manager_employee_id,
      name: area.name,
      parent_id: area.parent_id,
      type: area.type ?? '',
    }
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
      const payload: AreaPayload = {
        manager_employee_id: formData.value.manager_employee_id,
        name: formData.value.name,
        parent_id: formData.value.parent_id,
        type: formData.value.type || null,
      }

      await (isEditing.value && selectedArea.value ? updateArea(selectedArea.value.id, payload) : createArea(payload))

      closeFormDialog()
    } catch {
      // Error is handled by the composable
    }
  }

  const deleteDialog = ref(false)

  function openDeleteDialog (area: Area) {
    selectedArea.value = area
    deleteDialog.value = true
  }

  function closeDeleteDialog () {
    deleteDialog.value = false
    selectedArea.value = null
  }

  async function handleDelete () {
    if (!selectedArea.value) return

    try {
      await removeArea(selectedArea.value.id)
      closeDeleteDialog()
    } catch (error_) {
      const axiosError = error_ as AxiosError
      if (axiosError?.response?.status === 409) {
        error.value = 'Esta área tiene sub-áreas o empleados asignados; primero reasígnalos.'
      }
    }
  }
</script>

<style scoped>
.areas-card {
  padding: 24px;
  background: #ffffff;
}

.card-head,
.area-row,
.area-main {
  display: flex;
  align-items: center;
}

.card-head,
.area-row {
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

.area-list {
  display: grid;
  gap: 14px;
  margin-top: 24px;
}

.areas-state {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
  min-height: 180px;
  margin-top: 24px;
  color: #6f5a60;
  text-align: center;
}

.areas-state--empty {
  flex-direction: column;
}

.area-row {
  padding: 16px 0;
  border-bottom: 1px solid rgb(106 27 49 / 0.08);
}

.area-row:last-child {
  border-bottom: 0;
}

.area-main {
  gap: 14px;
  flex: 1;
}

.area-name {
  color: #000000;
  font-weight: 700;
}

.area-type {
  color: #5e5e5e;
  font-weight: 400;
  font-size: 0.85rem;
}

.area-manager {
  color: #5e5e5e;
}

.area-actions {
  display: flex;
  gap: 4px;
}

@media (max-width: 960px) {
  .card-head,
  .area-row {
    flex-direction: column;
    align-items: flex-start;
  }

  .area-actions {
    align-self: flex-end;
  }
}
</style>
