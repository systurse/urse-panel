<template>
  <v-card class="create-ticket-card" rounded="xl" variant="flat">
    <div class="card-head">
      <div>
        <div class="section-kicker">Soporte</div>
        <h2 class="card-title">Crear ticket</h2>
      </div>
    </div>

    <v-alert
      v-if="submitError"
      class="mt-6"
      closable
      color="error"
      density="comfortable"
      variant="tonal"
      @click:close="submitError = null"
    >
      {{ submitError }}
    </v-alert>

    <v-alert
      v-if="submitSuccess"
      class="mt-6"
      closable
      color="success"
      density="comfortable"
      variant="tonal"
      @click:close="submitSuccess = false"
    >
      Ticket creado exitosamente.
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
        placeholder="Elige un formulario para crear el ticket"
        variant="outlined"
      />
    </div>

    <!-- No form selected -->
    <div v-if="!selectedFormId" class="ticket-state ticket-state--empty">
      <v-icon color="#FAB21A" icon="mdi-ticket-plus-outline" size="40" />
      <span>Selecciona un formulario para comenzar a crear el ticket.</span>
    </div>

    <!-- Form renderer -->
    <div v-else class="ticket-form-area">
      <FormRenderer
        :key="selectedFormId"
        :form-id="selectedFormId"
        mode="submit"
        submit-label="Crear ticket"
        @error="onFormError"
        @submit="handleFormSubmit"
      />
    </div>
  </v-card>
</template>

<script lang="ts" setup>
  import { computed, ref } from 'vue'
  import FormRenderer from '@/components/FormRenderer.vue'
  import { useForms } from '@/modules/forms/useForms'

  const { forms: formsList, loading: formsLoading } = useForms()

  const selectedFormId = ref<number | string | null>(null)
  const submitError = ref<string | null>(null)
  const submitSuccess = ref(false)

  const formOptions = computed(() =>
    formsList.value.map(f => ({ label: f.name, value: f.id })),
  )

  function handleFormSubmit (data: Record<string, unknown>) {
    // TODO: Send ticket data to backend
    console.log('Ticket submission data:', data)
    console.log('Form ID:', selectedFormId.value)

    // Simulate success for now
    submitSuccess.value = true
    selectedFormId.value = null
  }

  function onFormError (message: string) {
    submitError.value = message
  }
</script>

<style scoped>
.create-ticket-card {
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

.ticket-state {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
  min-height: 220px;
  margin-top: 24px;
  color: #6f5a60;
  text-align: center;
}

.ticket-state--empty {
  flex-direction: column;
}

.ticket-form-area {
  margin-top: 24px;
}
</style>
