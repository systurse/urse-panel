<template>
  <v-card class="employees-card" rounded="xl" variant="flat">
    <div class="card-head">
      <div>
        <div class="section-kicker">Administración</div>
        <h2 class="card-title">Empleados</h2>
      </div>

      <v-btn color="#FAB21A" prepend-icon="mdi-account-plus-outline" variant="flat" @click="openCreateDialog">
        Nuevo empleado
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

    <div v-if="loading" class="employees-state">
      <v-progress-circular color="#FAB21A" indeterminate />
      <span>Cargando empleados...</span>
    </div>

    <div v-else-if="employees.length === 0" class="employees-state employees-state--empty">
      <v-icon color="#FAB21A" icon="mdi-account-off-outline" size="32" />
      <span>No hay empleados registrados.</span>
    </div>

    <div v-else class="employee-list">
      <div v-for="employee in employees" :key="employee.id" class="employee-row">
        <div class="employee-main">
          <v-avatar color="#f1ddd0" size="44">
            <v-icon color="#FAB21A" icon="mdi-account-outline" size="24" />
          </v-avatar>

          <div>
            <div class="employee-name">{{ employee.name }}</div>

            <div class="employee-meta">
              #{{ employee.employee_number || 'N/A' }} · {{ employee.area?.name ?? 'Sin área' }}
            </div>
          </div>
        </div>

        <div class="employee-actions">
          <v-btn
            color="#1a1a1a"
            icon="mdi-card-account-details-outline"
            size="small"
            variant="text"
            @click="openDetailDialog(employee)"
          />

          <v-btn
            color="#FAB21A"
            icon="mdi-pencil"
            size="small"
            variant="text"
            @click="openEditDialog(employee)"
          />

          <v-btn
            color="error"
            icon="mdi-delete"
            size="small"
            variant="text"
            @click="openDeleteDialog(employee)"
          />
        </div>
      </div>
    </div>
  </v-card>

  <v-dialog v-model="formDialog" max-width="640" persistent>
    <template #default>
      <v-card :loading="loading">
        <v-card-title>
          {{ isEditing ? 'Editar Empleado' : 'Nuevo Empleado' }}
        </v-card-title>

        <v-card-text>
          <v-form ref="formRef" v-model="formValid" class="pt-4" validate-on="input lazy">
            <v-row>
              <v-col cols="12" md="6">
                <v-text-field
                  v-model="formData.first_name"
                  label="Nombre(s)"
                  required
                  :rules="requiredRules"
                  variant="outlined"
                />
              </v-col>

              <v-col cols="12" md="6">
                <v-text-field
                  v-model="formData.employee_number"
                  label="Número de empleado"
                  required
                  :rules="requiredRules"
                  variant="outlined"
                />
              </v-col>

              <v-col cols="12" md="6">
                <v-text-field
                  v-model="formData.last_name"
                  label="Apellido paterno"
                  :rules="lastNameRules"
                  variant="outlined"
                />
              </v-col>

              <v-col cols="12" md="6">
                <v-text-field
                  v-model="formData.second_last_name"
                  label="Apellido materno"
                  :rules="secondLastNameRules"
                  variant="outlined"
                />
              </v-col>

              <v-col cols="12" md="6">
                <v-text-field
                  v-model="formData.category"
                  label="Categoría"
                  required
                  :rules="requiredRules"
                  variant="outlined"
                />
              </v-col>

              <v-col cols="12" md="6">
                <v-select
                  v-model="formData.area_id"
                  item-title="name"
                  item-value="id"
                  :items="areas"
                  label="Área"
                  :loading="areasLoading"
                  required
                  :rules="requiredRules"
                  variant="outlined"
                />
              </v-col>

              <v-col cols="12" md="4">
                <v-select
                  v-model="formData.work_schedule"
                  clearable
                  :items="workScheduleOptions"
                  label="Jornada laboral (opcional)"
                  variant="outlined"
                />
              </v-col>

              <v-col cols="12" md="4">
                <v-text-field
                  v-model="formData.shift_start"
                  label="Entrada (opcional)"
                  type="time"
                  variant="outlined"
                />
              </v-col>

              <v-col cols="12" md="4">
                <v-text-field
                  v-model="formData.shift_end"
                  label="Salida (opcional)"
                  type="time"
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

  <v-dialog v-model="detailDialog" max-width="520">
    <v-card :loading="supervisorLoading">
      <v-card-title class="pt-6 pb-2">
        Ficha de empleado
      </v-card-title>

      <v-card-text class="pb-6">
        <div class="ficha-row">
          <span class="ficha-label">Nombre</span>
          <span>{{ detailEmployee?.name }}</span>
        </div>

        <div class="ficha-row">
          <span class="ficha-label">Número de empleado</span>
          <span>{{ detailEmployee?.employee_number || 'N/A' }}</span>
        </div>

        <div class="ficha-row">
          <span class="ficha-label">Categoría</span>
          <span>{{ detailEmployee?.category || '—' }}</span>
        </div>

        <div class="ficha-row">
          <span class="ficha-label">Área</span>
          <span>{{ detailEmployee?.area?.name ?? 'Sin área' }}</span>
        </div>

        <div class="ficha-row">
          <span class="ficha-label">Autoriza sus pases de salida</span>
          <span>{{ detailSupervisor ? detailSupervisor.name : 'Sin encargado asignado aún' }}</span>
        </div>
      </v-card-text>

      <v-divider />

      <v-card-actions>
        <v-spacer />
        <v-btn text="Cerrar" variant="text" @click="closeDetailDialog" />
      </v-card-actions>
    </v-card>
  </v-dialog>

  <v-dialog v-model="deleteDialog" max-width="450" persistent>
    <v-card>
      <v-card-title class="text-h6 pt-6 pb-2">
        Confirmar eliminación
      </v-card-title>

      <v-card-text class="pb-6">
        <p>¿Estás seguro de que deseas eliminar al empleado <strong>{{ selectedEmployee?.name }}</strong>?</p>
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
  import type { Employee, EmployeePayload } from '@/modules/employees/port'
  import { ref } from 'vue'
  import { useAreas } from '@/modules/areas/useAreas'
  import { employeesAdapter } from '@/modules/employees/adapter'
  import { useEmployees } from '@/modules/employees/useEmployees'

  const { employees, error, loading, createEmployee, updateEmployee, removeEmployee } = useEmployees()
  const { areas, loading: areasLoading } = useAreas()

  const workScheduleOptions = [
    { title: 'Jornada continua', value: 'continuous' },
    { title: 'Jornada partida', value: 'split' },
  ]

  const formDialog = ref(false)
  const formRef = ref()
  const formValid = ref(false)
  const isEditing = ref(false)
  const selectedEmployee = ref<Employee | null>(null)

  const formData = ref<{
    first_name: string
    last_name: string
    second_last_name: string
    employee_number: string
    category: string
    area_id: number | string | null
    work_schedule: string | null
    shift_start: string
    shift_end: string
  }>({
    first_name: '',
    last_name: '',
    second_last_name: '',
    employee_number: '',
    category: '',
    area_id: null,
    work_schedule: null,
    shift_start: '',
    shift_end: '',
  })

  const requiredRules = [
    (v: string) => !!v || 'Este campo es requerido',
  ]

  const lastNameRules = [
    (v: string) => !!v || !!formData.value.second_last_name || 'Registra al menos un apellido (paterno o materno)',
  ]

  const secondLastNameRules = [
    (v: string) => !!v || !!formData.value.last_name || 'Registra al menos un apellido (paterno o materno)',
  ]

  function clearError () {
    error.value = null
  }

  function resetFormData () {
    formData.value = {
      area_id: null,
      category: '',
      employee_number: '',
      first_name: '',
      last_name: '',
      second_last_name: '',
      shift_end: '',
      shift_start: '',
      work_schedule: null,
    }
  }

  function openCreateDialog () {
    isEditing.value = false
    resetFormData()
    formDialog.value = true
  }

  function openEditDialog (employee: Employee) {
    isEditing.value = true
    selectedEmployee.value = employee
    formData.value = {
      area_id: employee.area_id,
      category: employee.category,
      employee_number: employee.employee_number,
      first_name: employee.first_name,
      last_name: employee.last_name ?? '',
      second_last_name: employee.second_last_name ?? '',
      shift_end: employee.shift_end ?? '',
      shift_start: employee.shift_start ?? '',
      work_schedule: employee.work_schedule,
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

    if (!valid || !formData.value.area_id) return

    try {
      const payload: EmployeePayload = {
        area_id: formData.value.area_id,
        category: formData.value.category,
        employee_number: formData.value.employee_number,
        first_name: formData.value.first_name,
        last_name: formData.value.last_name || null,
        second_last_name: formData.value.second_last_name || null,
        shift_end: formData.value.shift_end || null,
        shift_start: formData.value.shift_start || null,
        work_schedule: formData.value.work_schedule,
      }

      await (isEditing.value && selectedEmployee.value ? updateEmployee(selectedEmployee.value.id, payload) : createEmployee(payload))

      closeFormDialog()
    } catch {
      // Error is handled by the composable
    }
  }

  const detailDialog = ref(false)
  const detailEmployee = ref<Employee | null>(null)
  const detailSupervisor = ref<Employee | null>(null)
  const supervisorLoading = ref(false)

  async function openDetailDialog (employee: Employee) {
    detailEmployee.value = employee
    detailDialog.value = true
    supervisorLoading.value = true
    detailSupervisor.value = null

    try {
      detailSupervisor.value = await employeesAdapter.getSupervisor(employee.id)
    } catch {
      // Sin encargado disponible: se muestra el estado vacío por defecto.
    } finally {
      supervisorLoading.value = false
    }
  }

  function closeDetailDialog () {
    detailDialog.value = false
    detailEmployee.value = null
    detailSupervisor.value = null
  }

  const deleteDialog = ref(false)

  function openDeleteDialog (employee: Employee) {
    selectedEmployee.value = employee
    deleteDialog.value = true
  }

  function closeDeleteDialog () {
    deleteDialog.value = false
    selectedEmployee.value = null
  }

  async function handleDelete () {
    if (!selectedEmployee.value) return

    try {
      await removeEmployee(selectedEmployee.value.id)
      closeDeleteDialog()
    } catch {
      // Error is handled by the composable
    }
  }
</script>

<style scoped>
.employees-card {
  padding: 24px;
  background: #ffffff;
}

.card-head,
.employee-row,
.employee-main {
  display: flex;
  align-items: center;
}

.card-head,
.employee-row {
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

.employee-list {
  display: grid;
  gap: 14px;
  margin-top: 24px;
}

.employees-state {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
  min-height: 180px;
  margin-top: 24px;
  color: #6f5a60;
  text-align: center;
}

.employees-state--empty {
  flex-direction: column;
}

.employee-row {
  padding: 16px 0;
  border-bottom: 1px solid rgb(106 27 49 / 0.08);
}

.employee-row:last-child {
  border-bottom: 0;
}

.employee-main {
  gap: 14px;
  flex: 1;
}

.employee-name {
  color: #000000;
  font-weight: 700;
}

.employee-meta {
  color: #5e5e5e;
}

.employee-actions {
  display: flex;
  gap: 4px;
}

.ficha-row {
  display: flex;
  justify-content: space-between;
  gap: 12px;
  padding: 8px 0;
  border-bottom: 1px solid rgb(106 27 49 / 0.08);
}

.ficha-row:last-child {
  border-bottom: 0;
}

.ficha-label {
  color: #6f5a60;
  font-weight: 600;
}

@media (max-width: 960px) {
  .card-head,
  .employee-row {
    flex-direction: column;
    align-items: flex-start;
  }

  .employee-actions {
    align-self: flex-end;
  }
}
</style>
