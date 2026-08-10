<template>
  <v-dialog max-width="560" :model-value="modelValue" persistent @update:model-value="close">
    <v-card :loading="submitting">
      <v-card-title class="pt-6 pb-2">
        Cambiar contraseña de Wi-Fi
      </v-card-title>

      <v-card-text>
        <p class="text-body-2 text-medium-emphasis mb-4">
          {{ student?.name }} {{ student?.first_last_name }} {{ student?.second_last_name }}
          <span v-if="student?.matricula"> · {{ student.matricula }}</span>
        </p>

        <v-alert
          class="mb-4"
          density="compact"
          icon="mdi-information-outline"
          text="La contraseña se aplica primero en Active Directory. Si el directorio la rechaza, no se guarda nada."
          variant="tonal"
        />

        <v-alert
          v-if="errorMessage"
          class="mb-4"
          color="error"
          density="compact"
          icon="mdi-alert-circle-outline"
          variant="tonal"
        >
          {{ errorMessage }}
        </v-alert>

        <v-form ref="formRef" v-model="formValid" validate-on="input lazy">
          <v-text-field
            v-model="password"
            :append-inner-icon="showPassword ? 'mdi-eye-off' : 'mdi-eye'"
            autocomplete="off"
            :hint="suggestionLoading ? 'Generando sugerencia…' : 'Puedes usar la sugerencia o escribir otra.'"
            label="Nueva contraseña"
            persistent-hint
            :rules="passwordRules"
            :type="showPassword ? 'text' : 'password'"
            variant="outlined"
            @click:append-inner="showPassword = !showPassword"
          />

          <div class="d-flex justify-end mt-2">
            <v-btn
              :loading="suggestionLoading"
              prepend-icon="mdi-autorenew"
              size="small"
              text="Sugerir otra"
              variant="text"
              @click="loadSuggestion"
            />
          </div>
        </v-form>
      </v-card-text>

      <v-divider />

      <v-card-actions>
        <v-spacer />
        <v-btn :disabled="submitting" text="Cancelar" variant="text" @click="close" />
        <v-btn
          color="#FAB21A"
          :disabled="!formValid"
          :loading="submitting"
          text="Guardar"
          variant="flat"
          @click="submit"
        />
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script lang="ts" setup>
  import type { WifiPasswordUpdateResponse } from '@/modules/students/services/studentService'
  import { ref, watch } from 'vue'
  import { useStudent } from '@/modules/students/hooks/useStudent'

  interface DialogStudent {
    id: number
    matricula?: string
    name?: string
    first_last_name?: string
    second_last_name?: string
  }

  const props = defineProps<{
    modelValue: boolean
    student: DialogStudent | null
  }>()

  const emit = defineEmits<{
    'update:modelValue': [value: boolean]
    'saved': [result: WifiPasswordUpdateResponse]
  }>()

  const { suggestWifiPassword, updateWifiPassword } = useStudent()

  const formRef = ref()
  const formValid = ref(false)
  const password = ref('')
  const showPassword = ref(true)
  const suggestionLoading = ref(false)
  const submitting = ref(false)
  const errorMessage = ref<string | null>(null)

  /** Mismas reglas que valida el backend, que a su vez replican la política de AD. */
  const passwordRules = [
    (v: string) => !!v || 'La contraseña es obligatoria',
    (v: string) => v.length >= 8 || 'Mínimo 8 caracteres',
    (v: string) => v.length <= 64 || 'Máximo 64 caracteres',
    (v: string) => /[a-z]/.test(v) || 'Debe incluir una minúscula',
    (v: string) => /[A-Z]/.test(v) || 'Debe incluir una mayúscula',
    (v: string) => /\d/.test(v) || 'Debe incluir un dígito',
  ]

  async function loadSuggestion () {
    suggestionLoading.value = true

    try {
      password.value = await suggestWifiPassword()
    } catch {
      /**
       * La sugerencia es opcional: si falla, el operador puede escribir la suya
       * y el diálogo sigue siendo usable.
       */
      password.value = ''
    } finally {
      suggestionLoading.value = false
    }
  }

  async function submit () {
    const { valid } = await formRef.value.validate()
    if (!valid || !props.student) return

    submitting.value = true
    errorMessage.value = null

    try {
      const result = await updateWifiPassword(props.student.id, password.value)
      emit('saved', result)
      close()
    } catch (error: any) {
      const validationErrors = error.response?.data?.errors?.password
      errorMessage.value = validationErrors?.[0]
        || error.response?.data?.message
        || 'No se pudo actualizar la contraseña.'
    } finally {
      submitting.value = false
    }
  }

  function close () {
    emit('update:modelValue', false)
  }

  watch(() => props.modelValue, async isOpen => {
    if (!isOpen) return

    password.value = ''
    errorMessage.value = null
    showPassword.value = true
    formRef.value?.resetValidation()
    await loadSuggestion()
  })
</script>
