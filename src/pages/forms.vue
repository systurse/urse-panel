<template>
  <v-card class="forms-card" rounded="xl" variant="flat">
    <div class="card-head">
      <div>
        <div class="section-kicker">Administración</div>
        <h2 class="card-title">Formularios del sistema</h2>
      </div>
      <v-btn color="#FAB21A" prepend-icon="mdi-form-select" variant="flat" @click="openCreateDialog">
        Nuevo formulario
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

    <div v-if="loading" class="forms-state">
      <v-progress-circular color="#FAB21A" indeterminate />
      <span>Cargando formularios...</span>
    </div>

    <div v-else-if="forms.length === 0" class="forms-state forms-state--empty">
      <v-icon color="#FAB21A" icon="mdi-form" size="32" />
      <span>No hay formularios disponibles.</span>
    </div>

    <div v-else class="form-list">
      <div v-for="form in forms" :key="form.id" class="form-row">
        <div class="form-main">
          <v-avatar color="#f1ddd0" size="44">
            <v-icon color="#FAB21A" icon="mdi-file-document-edit-outline" size="24" />
          </v-avatar>
          <div>
            <div class="form-name">{{ form.name }}</div>
            <div class="form-type">{{ form.formType }}</div>
          </div>
        </div>

        <v-chip :color="form.isActive ? 'success' : 'grey'" size="small" variant="tonal">
          {{ form.isActive ? 'Activo' : 'Inactivo' }}
        </v-chip>

        <div class="form-actions">
          <v-btn
            color="#FAB21A"
            icon="mdi-eye-outline"
            size="small"
            variant="text"
            @click="openPreviewDialog(form)"
          />
          <v-btn
            color="#FAB21A"
            icon="mdi-pencil"
            size="small"
            variant="text"
            @click="openEditDialog(form)"
          />
          <v-btn
            color="error"
            icon="mdi-delete"
            size="small"
            variant="text"
            @click="openDeleteDialog(form)"
          />
        </div>
      </div>
    </div>
  </v-card>

  <!-- Form Dialog -->
  <v-dialog v-model="formDialog" max-width="600" persistent>
    <template #default="{ isActive }">
      <v-card :loading="loading">
        <v-card-title>
          {{ isEditing ? 'Editar Formulario' : 'Nuevo Formulario' }}
        </v-card-title>

        <v-card-text>
          <v-form ref="formRef" v-model="formValid" class="pt-4" validate-on="input lazy">
            <v-row>
              <v-col cols="12">
                <v-text-field
                  v-model="formData.name"
                  :counter="255"
                  label="Nombre del formulario"
                  placeholder="Ej. Solicitud de registro"
                  required
                  :rules="nameRules"
                  variant="outlined"
                />
              </v-col>

              <v-col cols="12">
                <v-text-field
                  v-model="formData.formType"
                  :counter="255"
                  label="Tipo de formulario"
                  placeholder="Ej. registro, encuesta, evaluacion"
                  required
                  :rules="formTypeRules"
                  variant="outlined"
                />
              </v-col>

              <v-col cols="12">
                <v-switch
                  v-model="formData.isActive"
                  color="success"
                  hide-details
                  label="Estado activo"
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

  <!-- Preview Dialog -->
  <v-dialog v-model="previewDialog" max-width="700" scrollable>
    <v-card>
      <v-card-title class="d-flex align-center justify-space-between pt-5 pb-2">
        Vista previa: {{ selectedForm?.name }}
        <v-btn icon="mdi-close" size="small" variant="text" @click="closePreviewDialog" />
      </v-card-title>
      <v-divider />
      <v-card-text class="pt-4">
        <FormRenderer
          v-if="selectedForm"
          :form-id="selectedForm.id"
          mode="submit"
        />
      </v-card-text>
    </v-card>
  </v-dialog>

  <!-- Delete Confirmation Dialog -->
  <v-dialog v-model="deleteDialog" max-width="450" persistent>
    <v-card>
      <v-card-title class="text-h6 pt-6 pb-2">
        Confirmar eliminación
      </v-card-title>

      <v-card-text class="pb-6">
        <p>¿Estás seguro de que deseas eliminar el formulario <strong>{{ selectedForm?.name }}</strong>?</p>
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
  import type { Form, FormPayload } from '@/modules/forms/port'
  import { ref } from 'vue'
  import FormRenderer from '@/components/FormRenderer.vue'
  import { useForms } from '@/modules/forms/useForms'

  const { error, loading, forms, createForm, updateForm, removeForm } = useForms()

  // Form dialog state
  const formDialog = ref(false)
  const formRef = ref()
  const formValid = ref(false)
  const isEditing = ref(false)
  const selectedForm = ref<Form | null>(null)

  const formData = ref({
    name: '',
    formType: '',
    isActive: true,
  })

  // Validation rules
  const nameRules = [
    (v: string) => !!v || 'El nombre del formulario es requerido',
    (v: string) => v.length >= 2 || 'El nombre debe tener al menos 2 caracteres',
    (v: string) => v.length <= 255 || 'El nombre no puede exceder 255 caracteres',
  ]

  const formTypeRules = [
    (v: string) => !!v || 'El tipo de formulario es requerido',
    (v: string) => v.length >= 2 || 'El tipo debe tener al menos 2 caracteres',
    (v: string) => v.length <= 255 || 'El tipo no puede exceder 255 caracteres',
  ]

  function clearError () {
    error.value = null
  }

  // Form dialog handlers
  function openCreateDialog () {
    isEditing.value = false
    formData.value = {
      name: '',
      formType: '',
      isActive: true,
    }
    formDialog.value = true
  }

  function openEditDialog (form: Form) {
    isEditing.value = true
    selectedForm.value = form
    formData.value = {
      name: form.name,
      formType: form.formType,
      isActive: form.isActive,
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
      const payload: FormPayload = {
        name: formData.value.name,
        form_type: formData.value.formType,
        is_active: formData.value.isActive,
      }

      await (isEditing.value && selectedForm.value ? updateForm(selectedForm.value.id, payload) : createForm(payload))

      closeFormDialog()
    } catch {
      // Error is handled by the composable
    }
  }

  // Preview dialog handlers
  const previewDialog = ref(false)

  function openPreviewDialog (form: Form) {
    selectedForm.value = form
    previewDialog.value = true
  }

  function closePreviewDialog () {
    previewDialog.value = false
    selectedForm.value = null
  }

  // Delete dialog handlers
  const deleteDialog = ref(false)

  function openDeleteDialog (form: Form) {
    selectedForm.value = form
    deleteDialog.value = true
  }

  function closeDeleteDialog () {
    deleteDialog.value = false
    selectedForm.value = null
  }

  async function handleDelete () {
    if (!selectedForm.value) return

    try {
      await removeForm(selectedForm.value.id)
      closeDeleteDialog()
    } catch {
      // Error is handled by the composable
    }
  }
</script>

<style scoped>
.forms-card {
  padding: 24px;
  background: #ffffff;
}

.card-head,
.form-row,
.form-main {
  display: flex;
  align-items: center;
}

.card-head,
.form-row {
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

.form-list {
  display: grid;
  gap: 14px;
  margin-top: 24px;
}

.forms-state {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
  min-height: 180px;
  margin-top: 24px;
  color: #6f5a60;
  text-align: center;
}

.forms-state--empty {
  flex-direction: column;
}

.form-row {
  padding: 16px 0;
  border-bottom: 1px solid rgb(106 27 49 / 0.08);
}

.form-row:last-child {
  border-bottom: 0;
}

.form-main {
  gap: 14px;
  flex: 1;
}

.form-name {
  color: #000000;
  font-weight: 700;
}

.form-type {
  color: #FAB21A;
  font-size: 0.85rem;
  font-weight: 600;
}

.form-actions {
  display: flex;
  gap: 4px;
}

@media (max-width: 960px) {
  .card-head,
  .form-row {
    flex-direction: column;
    align-items: flex-start;
  }

  .form-actions {
    align-self: flex-end;
  }
}
</style>
