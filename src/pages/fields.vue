<template>
  <v-card class="fields-card" rounded="xl" variant="flat">
    <div class="card-head">
      <div>
        <div class="section-kicker">Administración</div>
        <h2 class="card-title">Campos del sistema</h2>
      </div>
      <v-btn color="#FAB21A" prepend-icon="mdi-view-list-outline" variant="flat" @click="openCreateDialog">
        Nuevo campo
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

    <div v-if="loading" class="fields-state">
      <v-progress-circular color="#FAB21A" indeterminate />
      <span>Cargando campos...</span>
    </div>

    <div v-else-if="fields.length === 0" class="fields-state fields-state--empty">
      <v-icon color="#FAB21A" icon="mdi-view-list-off-outline" size="32" />
      <span>No hay campos disponibles.</span>
    </div>

    <div v-else class="field-list">
      <div v-for="field in fields" :key="field.id" class="field-row">
        <div class="field-main">
          <v-avatar color="#f1ddd0" size="44">
            <v-icon color="#FAB21A" icon="mdi-form-textbox" size="24" />
          </v-avatar>
          <div>
            <div class="field-label">{{ field.label }}</div>
            <div class="field-meta">
              <span class="field-name">{{ field.name }}</span>
              <v-chip
                v-if="field.isRequired"
                class="chip-badge"
                color="warning"
                size="x-small"
                variant="tonal"
              >
                Requerido
              </v-chip>
              <v-chip
                v-if="field.isGlobal"
                class="chip-badge"
                color="info"
                size="x-small"
                variant="tonal"
              >
                Global
              </v-chip>
            </div>
          </div>
        </div>

        <div class="field-type">{{ field.type }}</div>

        <div class="field-actions">
          <v-btn
            color="#FAB21A"
            icon="mdi-pencil"
            size="small"
            variant="text"
            @click="openEditDialog(field)"
          />
          <v-btn
            color="error"
            icon="mdi-delete"
            size="small"
            variant="text"
            @click="openDeleteDialog(field)"
          />
        </div>
      </div>
    </div>
  </v-card>

  <!-- Field Form Dialog -->
  <v-dialog v-model="formDialog" max-width="650" persistent>
    <template #default="{ isActive }">
      <v-card :loading="loading">
        <v-card-title>
          {{ isEditing ? 'Editar Campo' : 'Nuevo Campo' }}
        </v-card-title>

        <v-card-text>
          <v-form ref="formRef" v-model="formValid" class="pt-4" validate-on="input lazy">
            <v-row>
              <v-col cols="12" md="6">
                <v-text-field
                  v-model="formData.name"
                  :counter="100"
                  hint="Identificador único en minúsculas con guiones bajos"
                  label="Nombre técnico"
                  persistent-hint
                  placeholder="Ej. email_address"
                  required
                  :rules="nameRules"
                  variant="outlined"
                />
              </v-col>

              <v-col cols="12" md="6">
                <v-text-field
                  v-model="formData.label"
                  :counter="255"
                  label="Etiqueta visible"
                  placeholder="Ej. Correo electrónico"
                  required
                  :rules="labelRules"
                  variant="outlined"
                />
              </v-col>

              <v-col cols="12" md="6">
                <v-select
                  v-model="formData.type"
                  item-title="text"
                  item-value="value"
                  :items="fieldTypeOptions"
                  label="Tipo de campo"
                  required
                  :rules="typeRules"
                  variant="outlined"
                />
              </v-col>

              <v-col cols="12" md="6">
                <v-textarea
                  v-model="formData.optionsText"
                  :hint="showOptionsHint ? 'Separa cada opción con un salto de línea' : ''"
                  label="Opciones"
                  persistent-hint
                  placeholder="Una opción por línea (solo para select, radio, checkbox)"
                  rows="3"
                  variant="outlined"
                />
              </v-col>

              <v-col cols="12" md="6">
                <v-switch
                  v-model="formData.isRequired"
                  color="warning"
                  hide-details
                  label="Campo requerido"
                />
              </v-col>

              <v-col cols="12" md="6">
                <v-switch
                  v-model="formData.isGlobal"
                  color="info"
                  hint="Disponible para todos los formularios"
                  label="Campo global"
                  persistent-hint
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
        <p>¿Estás seguro de que deseas eliminar el campo <strong>{{ selectedField?.label }}</strong>?</p>
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
  import type { Field, FieldPayload } from '@/modules/fields/port'
  import { computed, ref } from 'vue'
  import { useFields } from '@/modules/fields/useFields'

  const { error, loading, fields, createField, updateField, removeField } = useFields()

  // Form dialog state
  const formDialog = ref(false)
  const formRef = ref()
  const formValid = ref(false)
  const isEditing = ref(false)
  const selectedField = ref<Field | null>(null)

  const formData = ref({
    name: '',
    label: '',
    type: 'text',
    optionsText: '',
    isRequired: false,
    isGlobal: false,
  })

  const fieldTypeOptions = [
    { text: 'Texto corto (text)', value: 'text' },
    { text: 'Texto largo (textarea)', value: 'textarea' },
    { text: 'Número (number)', value: 'number' },
    { text: 'Correo (email)', value: 'email' },
    { text: 'Fecha (date)', value: 'date' },
    { text: 'Fecha y hora (datetime)', value: 'datetime' },
    { text: 'Selección única (select)', value: 'select' },
    { text: 'Selección múltiple (multiselect)', value: 'multiselect' },
    { text: 'Radio (radio)', value: 'radio' },
    { text: 'Casilla (checkbox)', value: 'checkbox' },
    { text: 'Archivo (file)', value: 'file' },
  ]

  const showOptionsHint = computed(() =>
    ['select', 'multiselect', 'radio', 'checkbox'].includes(formData.value.type),
  )

  // Validation rules
  const nameRules = [
    (v: string) => !!v || 'El nombre técnico es requerido',
    (v: string) => /^[a-z][a-z0-9_]*$/.test(v) || 'Solo minúsculas, números y guiones bajos, iniciando con letra',
    (v: string) => v.length <= 100 || 'El nombre no puede exceder 100 caracteres',
  ]

  const labelRules = [
    (v: string) => !!v || 'La etiqueta visible es requerida',
    (v: string) => v.length >= 2 || 'La etiqueta debe tener al menos 2 caracteres',
    (v: string) => v.length <= 255 || 'La etiqueta no puede exceder 255 caracteres',
  ]

  const typeRules = [
    (v: string) => !!v || 'El tipo de campo es requerido',
  ]

  function parseOptions (text: string): string[] | null {
    const trimmed = text.trim()
    if (!trimmed) return null
    return trimmed.split('\n').map(line => line.trim()).filter(Boolean)
  }

  function formatOptions (options: string[] | null): string {
    if (!options || options.length === 0) return ''
    return options.join('\n')
  }

  function clearError () {
    error.value = null
  }

  // Form dialog handlers
  function openCreateDialog () {
    isEditing.value = false
    formData.value = {
      name: '',
      label: '',
      type: 'text',
      optionsText: '',
      isRequired: false,
      isGlobal: false,
    }
    formDialog.value = true
  }

  function openEditDialog (field: Field) {
    isEditing.value = true
    selectedField.value = field
    formData.value = {
      name: field.name,
      label: field.label,
      type: field.type,
      optionsText: formatOptions(field.options),
      isRequired: field.isRequired,
      isGlobal: field.isGlobal,
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
      const payload: FieldPayload = {
        name: formData.value.name,
        label: formData.value.label,
        type: formData.value.type,
        options: parseOptions(formData.value.optionsText),
        is_required: formData.value.isRequired,
        is_global: formData.value.isGlobal,
      }

      await (isEditing.value && selectedField.value ? updateField(selectedField.value.id, payload) : createField(payload))

      closeFormDialog()
    } catch {
      // Error is handled by the composable
    }
  }

  // Delete dialog handlers
  const deleteDialog = ref(false)

  function openDeleteDialog (field: Field) {
    selectedField.value = field
    deleteDialog.value = true
  }

  function closeDeleteDialog () {
    deleteDialog.value = false
    selectedField.value = null
  }

  async function handleDelete () {
    if (!selectedField.value) return

    try {
      await removeField(selectedField.value.id)
      closeDeleteDialog()
    } catch {
      // Error is handled by the composable
    }
  }
</script>

<style scoped>
.fields-card {
  padding: 24px;
  background: #ffffff;
}

.card-head,
.field-row,
.field-main {
  display: flex;
  align-items: center;
}

.card-head,
.field-row {
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

.field-list {
  display: grid;
  gap: 14px;
  margin-top: 24px;
}

.fields-state {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
  min-height: 180px;
  margin-top: 24px;
  color: #6f5a60;
  text-align: center;
}

.fields-state--empty {
  flex-direction: column;
}

.field-row {
  padding: 16px 0;
  border-bottom: 1px solid rgb(106 27 49 / 0.08);
}

.field-row:last-child {
  border-bottom: 0;
}

.field-main {
  gap: 14px;
  flex: 1;
}

.field-label {
  color: #000000;
  font-weight: 700;
}

.field-meta {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-top: 2px;
}

.field-name {
  color: #5e5e5e;
  font-size: 0.85rem;
  font-family: var(--font-mono);
}

.chip-badge {
  height: 20px;
  font-size: 0.7rem;
}

.field-type {
  color: #5d3641;
  font-weight: 600;
  font-size: 0.85rem;
  text-transform: capitalize;
  min-width: 100px;
  text-align: center;
}

.field-actions {
  display: flex;
  gap: 4px;
}

@media (max-width: 960px) {
  .card-head,
  .field-row {
    flex-direction: column;
    align-items: flex-start;
  }

  .field-type,
  .field-actions {
    align-self: flex-end;
  }
}
</style>
