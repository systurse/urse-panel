<template>
  <v-card class="roles-card" rounded="xl" variant="flat">
    <div class="card-head">
      <div>
        <div class="section-kicker">Administración</div>
        <h2 class="card-title">Roles del sistema</h2>
      </div>
      <v-btn color="#FAB21A" prepend-icon="mdi-shield-account-plus-outline" variant="flat" @click="openCreateDialog">
        Nuevo rol
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

    <div v-if="loading" class="roles-state">
      <v-progress-circular color="#FAB21A" indeterminate />
      <span>Cargando roles...</span>
    </div>

    <div v-else-if="roles.length === 0" class="roles-state roles-state--empty">
      <v-icon color="#FAB21A" icon="mdi-shield-off-outline" size="32" />
      <span>No hay roles disponibles.</span>
    </div>

    <div v-else class="role-list">
      <div v-for="role in roles" :key="role.id" class="role-row">
        <div class="role-main">
          <v-avatar color="#f1ddd0" size="44">
            <v-icon color="#FAB21A" icon="mdi-shield-account-outline" size="24" />
          </v-avatar>
          <div>
            <div class="role-name">{{ role.name }}</div>
            <div class="role-description">{{ role.description }}</div>
          </div>
        </div>

        <div class="role-actions">
          <v-btn
            color="#FAB21A"
            icon="mdi-pencil"
            size="small"
            variant="text"
            @click="openEditDialog(role)"
          />
          <v-btn
            color="error"
            icon="mdi-delete"
            size="small"
            variant="text"
            @click="openDeleteDialog(role)"
          />
        </div>
      </div>
    </div>
  </v-card>

  <!-- Role Form Dialog -->
  <v-dialog v-model="formDialog" max-width="600" persistent>
    <template #default="{ isActive }">
      <v-card :loading="loading">
        <v-card-title>
          {{ isEditing ? 'Editar Rol' : 'Nuevo Rol' }}
        </v-card-title>

        <v-card-text>
          <v-form ref="formRef" v-model="formValid" class="pt-4" validate-on="input lazy">
            <v-row>
              <v-col cols="12">
                <v-text-field
                  v-model="formData.name"
                  :counter="100"
                  label="Nombre del rol"
                  placeholder="Ej. Administrador"
                  required
                  :rules="nameRules"
                  variant="outlined"
                />
              </v-col>

              <v-col cols="12">
                <v-textarea
                  v-model="formData.description"
                  label="Descripción"
                  placeholder="Describe las responsabilidades y permisos de este rol"
                  rows="4"
                  :rules="descriptionRules"
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

  <!-- Delete Confirmation Dialog -->
  <v-dialog v-model="deleteDialog" max-width="450" persistent>
    <v-card>
      <v-card-title class="text-h6 pt-6 pb-2">
        Confirmar eliminación
      </v-card-title>

      <v-card-text class="pb-6">
        <p>¿Estás seguro de que deseas eliminar el rol <strong>{{ selectedRole?.name }}</strong>?</p>
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
  import type { Role, RolePayload } from '@/modules/roles/port'
  import { ref } from 'vue'
  import { useRoles } from '@/modules/roles/useRoles'

  const { error, loading, roles, createRole, updateRole, removeRole } = useRoles()

  // Form dialog state
  const formDialog = ref(false)
  const formRef = ref()
  const formValid = ref(false)
  const isEditing = ref(false)
  const selectedRole = ref<Role | null>(null)

  const formData = ref({
    name: '',
    description: '',
  })

  // Validation rules
  const nameRules = [
    (v: string) => !!v || 'El nombre del rol es requerido',
    (v: string) => v.length >= 2 || 'El nombre debe tener al menos 2 caracteres',
    (v: string) => v.length <= 100 || 'El nombre no puede exceder 100 caracteres',
  ]

  const descriptionRules = [
    (v: string) => !!v || 'La descripción es requerida',
    (v: string) => v.length >= 10 || 'La descripción debe tener al menos 10 caracteres',
  ]

  function clearError () {
    error.value = null
  }

  // Form dialog handlers
  function openCreateDialog () {
    isEditing.value = false
    formData.value = {
      name: '',
      description: '',
    }
    formDialog.value = true
  }

  function openEditDialog (role: Role) {
    isEditing.value = true
    selectedRole.value = role
    formData.value = {
      name: role.name,
      description: role.description,
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
      const payload: RolePayload = {
        name: formData.value.name,
        description: formData.value.description,
      }

      await (isEditing.value && selectedRole.value ? updateRole(selectedRole.value.id, payload) : createRole(payload))

      closeFormDialog()
    } catch {
      // Error is handled by the composable
    }
  }

  // Delete dialog handlers
  const deleteDialog = ref(false)

  function openDeleteDialog (role: Role) {
    selectedRole.value = role
    deleteDialog.value = true
  }

  function closeDeleteDialog () {
    deleteDialog.value = false
    selectedRole.value = null
  }

  async function handleDelete () {
    if (!selectedRole.value) return

    try {
      await removeRole(selectedRole.value.id)
      closeDeleteDialog()
    } catch {
      // Error is handled by the composable
    }
  }
</script>

<style scoped>
.roles-card {
  padding: 24px;
  background: #ffffff;
}

.card-head,
.role-row,
.role-main {
  display: flex;
  align-items: center;
}

.card-head,
.role-row {
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

.role-list {
  display: grid;
  gap: 14px;
  margin-top: 24px;
}

.roles-state {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
  min-height: 180px;
  margin-top: 24px;
  color: #6f5a60;
  text-align: center;
}

.roles-state--empty {
  flex-direction: column;
}

.role-row {
  padding: 16px 0;
  border-bottom: 1px solid rgb(106 27 49 / 0.08);
}

.role-row:last-child {
  border-bottom: 0;
}

.role-main {
  gap: 14px;
  flex: 1;
}

.role-name {
  color: #000000;
  font-weight: 700;
}

.role-description {
  color: #5e5e5e;
}

.role-actions {
  display: flex;
  gap: 4px;
}

@media (max-width: 960px) {
  .card-head,
  .role-row {
    flex-direction: column;
    align-items: flex-start;
  }

  .role-actions {
    align-self: flex-end;
  }
}
</style>
