<template>
  <v-card class="form-fields-card" rounded="xl" variant="flat">
    <div class="card-head">
      <div>
        <div class="section-kicker">Administración</div>
        <h2 class="card-title">Campos por formulario</h2>
      </div>
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

    <!-- Form selector -->
    <div class="form-selector">
      <v-select
        v-model="selectedFormId"
        hide-details
        item-title="label"
        item-value="value"
        :items="formOptions"
        label="Seleccionar formulario"
        :loading="formsLoading"
        placeholder="Elige un formulario para gestionar sus campos"
        variant="outlined"
        @update:model-value="onFormSelected"
      />
    </div>

    <!-- No form selected -->
    <div v-if="!selectedFormId" class="fields-state fields-state--empty">
      <v-icon color="#FAB21A" icon="mdi-form-select" size="40" />
      <span>Selecciona un formulario para ver y gestionar sus campos.</span>
    </div>

    <!-- Loading state -->
    <div v-else-if="loading" class="fields-state">
      <v-progress-circular color="#FAB21A" indeterminate />
      <span>Cargando campos del formulario...</span>
    </div>

    <!-- Empty state -->
    <div v-else-if="formFields.length === 0" class="fields-state fields-state--empty">
      <v-icon color="#FAB21A" icon="mdi-view-list-off-outline" size="32" />
      <span>Este formulario no tiene campos asignados.</span>
      <v-btn
        class="mt-4"
        color="#FAB21A"
        prepend-icon="mdi-plus"
        size="small"
        variant="tonal"
        @click="openAddDialog"
      >
        Agregar campo
      </v-btn>
    </div>

    <!-- Fields list -->
    <template v-else>
      <div class="list-header">
        <span>Campos asignados ({{ formFields.length }})</span>
        <v-btn
          color="#FAB21A"
          prepend-icon="mdi-plus"
          size="small"
          variant="tonal"
          @click="openAddDialog"
        >
          Agregar campo
        </v-btn>
      </div>

      <div class="field-list">
        <div v-for="(field, index) in sortedFields" :key="field.id" class="field-row">
          <div class="field-position">
            <v-chip color="#FAB21A" size="small" variant="outlined">
              #{{ field.position }}
            </v-chip>
          </div>

          <div class="field-main">
            <v-avatar color="#f1ddd0" size="40">
              <v-icon color="#FAB21A" icon="mdi-form-textbox" size="20" />
            </v-avatar>
            <div>
              <div class="field-label">{{ field.fieldLabel }}</div>
              <div class="field-meta">
                <span class="field-name">{{ field.fieldName }}</span>
                <span class="field-type">{{ field.fieldType }}</span>
              </div>
            </div>
          </div>

          <v-chip
            v-if="field.isOptionalPull"
            class="chip-badge"
            color="info"
            size="x-small"
            variant="tonal"
          >
            Pull opcional
          </v-chip>

          <div class="field-actions">
            <v-btn
              color="#FAB21A"
              icon="mdi-cog"
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
    </template>
  </v-card>

  <!-- Add Field Dialog -->
  <v-dialog v-model="addDialog" max-width="500" persistent>
    <template #default="{ isActive }">
      <v-card :loading="loading">
        <v-card-title>Agregar campo al formulario</v-card-title>

        <v-card-text>
          <v-form ref="addFormRef" v-model="addFormValid" class="pt-4" validate-on="input lazy">
            <v-row>
              <v-col cols="12">
                <v-autocomplete
                  v-model="addData.fieldId"
                  item-title="label"
                  item-value="value"
                  :items="availableFieldOptions"
                  label="Campo disponible"
                  placeholder="Busca y selecciona un campo"
                  required
                  :rules="fieldIdRules"
                  variant="outlined"
                />
              </v-col>

              <v-col cols="12">
                <v-text-field
                  v-model.number="addData.position"
                  label="Posición"
                  min="0"
                  required
                  :rules="positionRules"
                  type="number"
                  variant="outlined"
                />
              </v-col>

              <v-col cols="12">
                <v-switch
                  v-model="addData.isOptionalPull"
                  color="info"
                  hint="Permite obtener el valor de forma opcional desde otro campo"
                  label="Pull opcional"
                  persistent-hint
                />
              </v-col>
            </v-row>
          </v-form>
        </v-card-text>

        <v-divider />

        <v-card-actions>
          <v-spacer />
          <v-btn text="Cancelar" variant="text" @click="closeAddDialog" />
          <v-btn
            color="#FAB21A"
            :loading="loading"
            text="Agregar"
            variant="flat"
            @click="handleAddSubmit"
          />
        </v-card-actions>
      </v-card>
    </template>
  </v-dialog>

  <!-- Edit Field Dialog -->
  <v-dialog v-model="editDialog" max-width="500" persistent>
    <template #default="{ isActive }">
      <v-card :loading="loading">
        <v-card-title>Editar campo del formulario</v-card-title>

        <v-card-text>
          <v-form ref="editFormRef" v-model="editFormValid" class="pt-4" validate-on="input lazy">
            <v-row>
              <v-col cols="12">
                <div class="field-info">
                  <div class="field-info-label">Campo</div>
                  <div class="field-info-value">{{ selectedFormField?.fieldLabel }} ({{ selectedFormField?.fieldName }})</div>
                </div>
              </v-col>

              <v-col cols="12">
                <v-text-field
                  v-model.number="editData.position"
                  label="Posición"
                  min="0"
                  required
                  :rules="positionRules"
                  type="number"
                  variant="outlined"
                />
              </v-col>

              <v-col cols="12">
                <v-switch
                  v-model="editData.isOptionalPull"
                  color="info"
                  hint="Permite obtener el valor de forma opcional desde otro campo"
                  label="Pull opcional"
                  persistent-hint
                />
              </v-col>
            </v-row>
          </v-form>
        </v-card-text>

        <v-divider />

        <v-card-actions>
          <v-spacer />
          <v-btn text="Cancelar" variant="text" @click="closeEditDialog" />
          <v-btn
            color="#FAB21A"
            :loading="loading"
            text="Guardar"
            variant="flat"
            @click="handleEditSubmit"
          />
        </v-card-actions>
      </v-card>
    </template>
  </v-dialog>

  <!-- Delete Confirmation Dialog -->
  <v-dialog v-model="deleteDialog" max-width="450" persistent>
    <v-card>
      <v-card-title class="text-h6 pt-6 pb-2">
        Confirmar remoción
      </v-card-title>

      <v-card-text class="pb-6">
        <p>¿Deseas remover el campo <strong>{{ selectedFormField?.fieldLabel }}</strong> de este formulario?</p>
        <p class="text-medium-emphasis mt-2">El campo no se eliminará del sistema, solo se desvinculará del formulario.</p>
      </v-card-text>

      <v-divider />

      <v-card-actions>
        <v-spacer />
        <v-btn text="Cancelar" variant="text" @click="closeDeleteDialog" />
        <v-btn
          color="error"
          :loading="loading"
          text="Remover"
          variant="flat"
          @click="handleDelete"
        />
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script lang="ts" setup>
  import type { FormField, FormFieldPayload, FormFieldUpdatePayload } from '@/modules/form-fields/port'
  import { computed, ref, watch } from 'vue'
  import { useFields } from '@/modules/fields/useFields'
  import { formFieldsAdapter } from '@/modules/form-fields/adapter'
  import { useForms } from '@/modules/forms/useForms'

  const { forms: formsList, loading: formsLoading } = useForms()
  const { fields: allFields } = useFields()

  const formFields = ref<FormField[]>([])
  const loading = ref(false)
  const error = ref<string | null>(null)
  const selectedFormId = ref<number | string | null>(null)

  // Form options for selector
  const formOptions = computed(() =>
    formsList.value.map(f => ({ label: f.name, value: f.id })),
  )

  // All available fields options
  const allFieldOptions = computed(() =>
    allFields.value.map(f => ({ label: `${f.label} (${f.name})`, value: f.id })),
  )

  // Fields already linked to the form
  const linkedFieldIds = computed(() =>
    new Set<number>(formFields.value.map(f => Number(f.fieldId))),
  )

  // Available fields (not yet linked)
  const availableFieldOptions = computed(() =>
    allFieldOptions.value.filter(f => !linkedFieldIds.value.has(Number(f.value))),
  )

  // Sorted fields by position
  const sortedFields = computed(() =>
    [...formFields.value].sort((a, b) => a.position - b.position),
  )

  async function loadFormFields (formId: number | string) {
    loading.value = true
    error.value = null
    try {
      formFields.value = await formFieldsAdapter.list(formId)
    } catch (error_) {
      error.value = error_ instanceof Error ? error_.message : 'No fue posible cargar los campos del formulario'
    } finally {
      loading.value = false
    }
  }

  async function addField (formId: number | string, payload: FormFieldPayload) {
    loading.value = true
    error.value = null
    try {
      const newField = await formFieldsAdapter.create(formId, payload)
      formFields.value.push(newField)
    } catch (error_) {
      error.value = error_ instanceof Error ? error_.message : 'No fue posible agregar el campo al formulario'
      throw error_
    } finally {
      loading.value = false
    }
  }

  async function updateField (formFieldId: number | string, payload: FormFieldUpdatePayload) {
    loading.value = true
    error.value = null
    try {
      const updated = await formFieldsAdapter.update(formFieldId, payload)
      const index = formFields.value.findIndex(f => f.id === formFieldId)
      if (index !== -1) {
        formFields.value[index] = updated
      }
    } catch (error_) {
      error.value = error_ instanceof Error ? error_.message : 'No fue posible actualizar el campo'
      throw error_
    } finally {
      loading.value = false
    }
  }

  async function removeField (formFieldId: number | string) {
    loading.value = true
    error.value = null
    try {
      await formFieldsAdapter.remove(formFieldId)
      formFields.value = formFields.value.filter(f => f.id !== formFieldId)
    } catch (error_) {
      error.value = error_ instanceof Error ? error_.message : 'No fue posible remover el campo del formulario'
      throw error_
    } finally {
      loading.value = false
    }
  }

  function onFormSelected (formId: number | string | null) {
    if (formId) {
      void loadFormFields(formId)
    } else {
      formFields.value = []
    }
  }

  function clearError () {
    error.value = null
  }

  // ---- Add dialog ----
  const addDialog = ref(false)
  const addFormRef = ref()
  const addFormValid = ref(false)
  const addData = ref({
    fieldId: 0,
    position: 0,
    isOptionalPull: false,
  })

  const fieldIdRules = [
    (v: number) => v > 0 || 'Selecciona un campo',
  ]

  const positionRules = [
    (v: number) => v >= 0 || 'La posición debe ser 0 o mayor',
    (v: number) => Number.isInteger(v) || 'La posición debe ser un número entero',
  ]

  function openAddDialog () {
    addData.value = {
      fieldId: 0,
      position: formFields.value.length,
      isOptionalPull: false,
    }
    addDialog.value = true
  }

  function closeAddDialog () {
    addDialog.value = false
    addFormRef.value?.reset()
    addFormRef.value?.resetValidation()
  }

  async function handleAddSubmit () {
    if (!selectedFormId.value) return
    const { valid } = await addFormRef.value.validate()
    if (!valid) return

    try {
      const payload: FormFieldPayload = {
        field_id: addData.value.fieldId,
        position: addData.value.position,
        is_optional_pull: addData.value.isOptionalPull,
      }
      await addField(selectedFormId.value, payload)
      closeAddDialog()
    } catch {
      // Error handled by composable
    }
  }

  // ---- Edit dialog ----
  const editDialog = ref(false)
  const editFormRef = ref()
  const editFormValid = ref(false)
  const selectedFormField = ref<FormField | null>(null)
  const editData = ref({
    position: 0,
    isOptionalPull: false,
  })

  function openEditDialog (field: FormField) {
    selectedFormField.value = field
    editData.value = {
      position: field.position,
      isOptionalPull: field.isOptionalPull,
    }
    editDialog.value = true
  }

  function closeEditDialog () {
    editDialog.value = false
    editFormRef.value?.reset()
    editFormRef.value?.resetValidation()
  }

  async function handleEditSubmit () {
    if (!selectedFormField.value) return
    const { valid } = await editFormRef.value.validate()
    if (!valid) return

    try {
      const payload: FormFieldUpdatePayload = {
        position: editData.value.position,
        is_optional_pull: editData.value.isOptionalPull,
      }
      await updateField(selectedFormField.value.id, payload)
      closeEditDialog()
    } catch {
      // Error handled by composable
    }
  }

  // ---- Delete dialog ----
  const deleteDialog = ref(false)

  function openDeleteDialog (field: FormField) {
    selectedFormField.value = field
    deleteDialog.value = true
  }

  function closeDeleteDialog () {
    deleteDialog.value = false
    selectedFormField.value = null
  }

  async function handleDelete () {
    if (!selectedFormField.value) return

    try {
      await removeField(selectedFormField.value.id)
      closeDeleteDialog()
    } catch {
      // Error handled by composable
    }
  }
</script>

<style scoped>
.form-fields-card {
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

.form-selector {
  margin-top: 20px;
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

.list-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-top: 20px;
  color: #000000;
  font-weight: 700;
  font-size: 0.95rem;
}

.field-list {
  display: grid;
  gap: 14px;
  margin-top: 16px;
}

.field-row {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 14px 0;
  border-bottom: 1px solid rgb(106 27 49 / 0.08);
}

.field-row:last-child {
  border-bottom: 0;
}

.field-position {
  flex-shrink: 0;
}

.field-main {
  display: flex;
  align-items: center;
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

.field-type {
  color: #FAB21A;
  font-size: 0.75rem;
  text-transform: capitalize;
  font-weight: 600;
}

.chip-badge {
  height: 20px;
  font-size: 0.7rem;
}

.field-actions {
  display: flex;
  gap: 4px;
}

.field-info {
  padding: 12px 16px;
  background: rgb(106 27 49 / 0.04);
  border-radius: 8px;
}

.field-info-label {
  color: #5e5e5e;
  font-size: 0.8rem;
  margin-bottom: 4px;
}

.field-info-value {
  color: #000000;
  font-weight: 700;
}

@media (max-width: 960px) {
  .card-head,
  .list-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 12px;
  }

  .field-row {
    flex-wrap: wrap;
  }
}
</style>
