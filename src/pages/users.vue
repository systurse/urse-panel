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

    <div v-if="loading" class="users-state">
      <v-progress-circular color="#FAB21A" indeterminate />
      <span>Cargando usuarios...</span>
    </div>

    <div v-else-if="users.length === 0" class="users-state users-state--empty">
      <v-icon color="#FAB21A" icon="mdi-account-off-outline" size="32" />
      <span>No hay usuarios disponibles.</span>
    </div>

    <div v-else class="user-list">
      <div v-for="user in users" :key="user.email" class="user-row">
        <div class="user-main">
          <v-avatar color="#f1ddd0" size="44">{{ user.initials }}</v-avatar>
          <div>
            <div class="user-name">{{ user.name }}</div>
            <div class="user-email">{{ user.email }}</div>
          </div>
        </div>

        <div class="user-role">{{ user.role }}</div>
        <v-chip :color="user.active ? 'success' : 'grey'" size="small" variant="tonal">
          {{ user.active ? 'Activo' : 'Inactivo' }}
        </v-chip>

        <div class="user-actions">
          <v-btn
            color="#FAB21A"
            icon="mdi-pencil"
            size="small"
            variant="text"
            @click="openEditDialog(user)"
          />
          <v-btn
            color="error"
            icon="mdi-delete"
            size="small"
            variant="text"
            @click="openDeleteDialog(user)"
          />
        </div>
      </div>
    </div>
  </v-card>

  <!-- User Form Dialog -->
  <v-dialog v-model="formDialog" max-width="600" persistent>
    <template #default="{ isActive }">
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

              <v-col cols="12" md="6">
                <v-text-field
                  v-model="formData.role"
                  label="Rol"
                  placeholder="Ej. Administrador"
                  required
                  :rules="roleRules"
                  variant="outlined"
                />
              </v-col>

              <v-col cols="12" md="6">
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

  <!-- Delete Confirmation Dialog -->
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
</template>

<script lang="ts" setup>
  import type { User, UserPayload } from '@/modules/users/port'
  import { computed, ref } from 'vue'
  import { useUsers } from '@/modules/users/useUsers'

  const { error, loading, users, createUser, updateUser, removeUser } = useUsers()

  // Form dialog state
  const formDialog = ref(false)
  const formRef = ref()
  const formValid = ref(false)
  const isEditing = ref(false)
  const selectedUser = ref<User | null>(null)

  const formData = ref({
    name: '',
    email: '',
    role: '',
    active: true,
    password: '',
    passwordConfirmation: '',
  })

  const showPassword = ref(false)

  const activeOptions = [
    { text: 'Activo', value: true },
    { text: 'Inactivo', value: false },
  ]

  // Validation rules
  const nameRules = [
    (v: string) => !!v || 'El nombre es requerido',
    (v: string) => v.length >= 2 || 'El nombre debe tener al menos 2 caracteres',
    (v: string) => v.length <= 100 || 'El nombre no puede exceder 100 caracteres',
  ]

  const emailRules = [
    (v: string) => !!v || 'El correo electrónico es requerido',
    (v: string) => /.+@.+\..+/.test(v) || 'El correo electrónico debe ser válido',
  ]

  const roleRules = [
    (v: string) => !!v || 'El rol es requerido',
    (v: string) => v.length >= 2 || 'El rol debe tener al menos 2 caracteres',
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

  // Form dialog handlers
  function openCreateDialog () {
    isEditing.value = false
    formData.value = {
      name: '',
      email: '',
      role: '',
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
      role: user.role,
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
        role: formData.value.role,
        active: formData.value.active,
      }

      // Only send password fields when a password is provided
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

  // Delete dialog handlers
  const deleteDialog = ref(false)

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
</script>

<style scoped>
.users-card {
  padding: 24px;
  background: #ffffff;
}

.card-head,
.user-row,
.user-main {
  display: flex;
  align-items: center;
}

.card-head,
.user-row {
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

.user-list {
  display: grid;
  gap: 14px;
  margin-top: 24px;
}

.users-state {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
  min-height: 180px;
  margin-top: 24px;
  color: #6f5a60;
  text-align: center;
}

.users-state--empty {
  flex-direction: column;
}

.user-row {
  padding: 16px 0;
  border-bottom: 1px solid rgb(106 27 49 / 0.08);
}

.user-row:last-child {
  border-bottom: 0;
}

.user-main {
  gap: 14px;
  flex: 1;
}

.user-name {
  color: #000000;
  font-weight: 700;
}

.user-email {
  color: #5e5e5e;
}

.user-role {
  color: #5d3641;
  font-weight: 600;
  min-width: 120px;
  text-align: center;
}

.user-actions {
  display: flex;
  gap: 4px;
}

@media (max-width: 960px) {
  .card-head,
  .user-row {
    flex-direction: column;
    align-items: flex-start;
  }

  .user-role,
  .user-actions {
    align-self: flex-end;
  }
}
</style>
