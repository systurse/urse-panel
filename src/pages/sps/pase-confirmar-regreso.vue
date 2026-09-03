<template>
  <div class="return-page">
    <v-card class="return-card" rounded="xl" variant="flat">
      <div class="card-head">
        <div>
          <div class="section-kicker">Pases de salida</div>
          <h2 class="card-title">Confirmar regreso — pase #{{ passId }}</h2>
        </div>

        <v-btn prepend-icon="mdi-arrow-left" :to="`/sps/pases/${passId}`" variant="text">
          Volver al pase
        </v-btn>
      </div>

      <v-alert
        v-if="errorMessage"
        class="mt-4"
        closable
        color="error"
        variant="tonal"
        @click:close="errorMessage = null"
      >
        {{ errorMessage }}
      </v-alert>

      <div v-if="loading" class="state-box">
        <v-progress-circular color="#c89215" indeterminate />
        <span>Cargando pase...</span>
      </div>

      <div v-else-if="alreadyReturned" class="state-box state-box--success">
        <v-icon color="success" icon="mdi-check-decagram" size="32" />
        <span>Este pase ya registró su regreso.</span>
      </div>

      <div v-else-if="!canManageReturn" class="state-box">
        <v-icon color="#c89215" icon="mdi-lock-outline" size="32" />

        <span>
          No tienes permiso para gestionar el regreso de este pase. Se requiere ser el empleado
          titular, tener el rol de administrador, o ser supervisor del área con el permiso
          <code>sps.pass.return</code>.
        </span>
      </div>

      <div v-else class="mt-4">
        <p class="text-body-2 text-medium-emphasis mb-4">
          <template v-if="isOwner">
            Al presionar "Ya regresé" te enviaremos un código de 6 dígitos a tu correo institucional,
            vigente por 5 minutos.
          </template>

          <template v-else>
            Al presionar "Enviar código" se enviará un código de 6 dígitos al correo institucional
            del empleado titular, vigente por 5 minutos.
          </template>
        </p>

        <v-btn
          color="#c89215"
          :disabled="cooldownSeconds > 0"
          :loading="sendingOtp"
          prepend-icon="mdi-email-fast-outline"
          variant="flat"
          @click="sendOtp"
        >
          {{ sendButtonLabel }}
        </v-btn>

        <v-divider class="my-5" />

        <v-form ref="verifyFormRef" v-model="verifyValid" @submit.prevent="verifyOtp">
          <v-text-field
            v-model="code"
            label="Código de verificación"
            maxlength="6"
            :rules="codeRules"
            variant="outlined"
          />

          <!-- Not gated on `codeSent`: the code may have been sent from the
               admin view or an earlier visit, and would otherwise be unusable. -->
          <v-btn
            color="primary"
            :disabled="!code"
            :loading="verifying"
            variant="flat"
            @click="verifyOtp"
          >
            Confirmar regreso
          </v-btn>
        </v-form>
      </div>
    </v-card>

    <v-snackbar v-model="snackbar" :color="snackbarColor" location="top" :timeout="3500">
      {{ snackbarText }}
    </v-snackbar>
  </div>
</template>

<script lang="ts" setup>
  import type { AxiosError } from 'axios'
  import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
  import { useRoute } from 'vue-router'
  import { employeesAdapter } from '@/modules/employees/adapter'
  import { httpClient } from '@/services/http'
  import { useAuthStore } from '@/stores/auth'
  import { isSameId } from '@/utils/identity'

  const route = useRoute()
  const authStore = useAuthStore()
  const passId = String(route.params.id)

  const loading = ref(false)
  const errorMessage = ref<string | null>(null)
  const isOwner = ref(false)
  const alreadyReturned = ref(false)

  const sendingOtp = ref(false)
  const cooldownSeconds = ref(0)
  let cooldownTimer: ReturnType<typeof setInterval> | null = null

  const verifyFormRef = ref()
  const verifyValid = ref(false)
  const code = ref('')
  const verifying = ref(false)

  const codeRules = [
    (v: string) => !!v || 'El código es requerido',
    (v: string) => /^\d{6}$/.test(v) || 'El código debe tener 6 dígitos',
  ]

  // Mirrors the backend's `canBeManagedForReturnBy`: the pass owner, the
  // administrator role, or a supervisor holding `sps.pass.return`. The area a
  // supervisor manages is only known server-side, so that half is left to the
  // API — it answers 403 when the area doesn't match.
  const canManageReturn = computed(() =>
    isOwner.value
    || authStore.isAdmin
    || (authStore.hasRole('supervisor') && authStore.hasPermission('sps.pass.return')),
  )

  const sendButtonLabel = computed(() => {
    if (cooldownSeconds.value > 0) return `Reenviar en ${cooldownSeconds.value}s`
    return isOwner.value ? 'Ya regresé' : 'Enviar código'
  })

  const snackbar = ref(false)
  const snackbarText = ref('')
  const snackbarColor = ref<'success' | 'error' | 'info'>('success')

  function resolveMessage (error: unknown, fallback: string) {
    const axiosError = error as AxiosError<{ message?: string }>
    return axiosError?.response?.data?.message ?? axiosError?.message ?? fallback
  }

  function showSnackbar (text: string, color: 'success' | 'error' | 'info') {
    snackbarText.value = text
    snackbarColor.value = color
    snackbar.value = true
  }

  function readString (source: Record<string, unknown>, ...keys: string[]) {
    for (const key of keys) {
      const value = source[key]
      if (typeof value === 'string' && value.trim().length > 0) return value
    }
    return ''
  }

  function readId (source: Record<string, unknown>, ...keys: string[]) {
    for (const key of keys) {
      const value = source[key]
      if (typeof value === 'number' || typeof value === 'string') return value
    }
    return null
  }

  function unwrapSingle (response: unknown): Record<string, unknown> {
    if (response && typeof response === 'object' && 'data' in response) {
      const data = (response as { data?: unknown }).data
      return data && typeof data === 'object' ? data as Record<string, unknown> : {}
    }
    return response && typeof response === 'object' ? response as Record<string, unknown> : {}
  }

  function startCooldown (seconds: number) {
    cooldownSeconds.value = seconds
    if (cooldownTimer) clearInterval(cooldownTimer)
    cooldownTimer = setInterval(() => {
      cooldownSeconds.value -= 1
      if (cooldownSeconds.value <= 0 && cooldownTimer) {
        clearInterval(cooldownTimer)
        cooldownTimer = null
      }
    }, 1000)
  }

  async function loadPass () {
    loading.value = true
    errorMessage.value = null

    try {
      const response = await httpClient.get<unknown>(`/api/v1/exit-passes/${passId}`)
      const item = unwrapSingle(response)
      const employee = (item.employee && typeof item.employee === 'object' ? item.employee : {}) as Record<string, unknown>
      const employeeId = readId(item, 'employee_id') ?? readId(employee, 'id')
      const statuses = Array.isArray(item.statuses) ? item.statuses : []
      const statusNames = statuses.map(entry =>
        typeof entry === 'string' ? entry : readString(entry as Record<string, unknown>, 'status', 'name', 'value'),
      )
      alreadyReturned.value = statusNames.some(status => status.toLowerCase() === 'returned')

      // Resolving the employee record only decides whether the operator is the
      // pass owner. Administrators and supervisors have no employee record to
      // match, so a failure here must not blank out the page for them.
      const userId = authStore.user?.id
      if (userId) {
        try {
          const myEmployee = await employeesAdapter.getByUserId(userId)
          isOwner.value = isSameId(myEmployee?.id, employeeId)
        } catch {
          isOwner.value = false
        }
      }
    } catch (error) {
      errorMessage.value = resolveMessage(error, 'No fue posible cargar el pase.')
    } finally {
      loading.value = false
    }
  }

  async function sendOtp () {
    sendingOtp.value = true
    errorMessage.value = null

    try {
      await httpClient.post(`/api/v1/exit-passes/${passId}/return/otp`)
      startCooldown(60)
      showSnackbar(
        isOwner.value
          ? 'Código enviado a tu correo institucional.'
          : 'Código enviado al correo institucional del empleado.',
        'success',
      )
    } catch (error) {
      const axiosError = error as AxiosError
      if (axiosError?.response?.status === 429) {
        showSnackbar('Espera antes de solicitar otro código.', 'error')
      } else if (axiosError?.response?.status === 403) {
        showSnackbar('No tienes permiso para gestionar el regreso de este pase.', 'error')
      } else {
        showSnackbar(resolveMessage(error, 'No fue posible enviar el código.'), 'error')
      }
    } finally {
      sendingOtp.value = false
    }
  }

  async function verifyOtp () {
    const { valid } = await verifyFormRef.value.validate()
    if (!valid) return

    verifying.value = true
    errorMessage.value = null

    try {
      await httpClient.post(`/api/v1/exit-passes/${passId}/return/verify`, { code: code.value })
      alreadyReturned.value = true
      showSnackbar('Regreso confirmado correctamente.', 'success')
    } catch (error) {
      showSnackbar(resolveMessage(error, 'El código no es válido o ya venció.'), 'error')
    } finally {
      verifying.value = false
    }
  }

  onMounted(() => {
    void loadPass()
  })

  onBeforeUnmount(() => {
    if (cooldownTimer) clearInterval(cooldownTimer)
  })
</script>

<style scoped>
.return-page {
  display: grid;
}

.return-card {
  padding: 24px;
  background: #ffffff;
}

.card-head {
  display: flex;
  justify-content: space-between;
  gap: 16px;
  align-items: flex-start;
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
  font-size: 1.4rem;
  font-weight: 800;
  color: #000000;
}

.state-box {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
  min-height: 160px;
  margin-top: 16px;
  color: #5e5e5e;
  text-align: center;
}

.state-box--success {
  color: #2e7d5b;
}

@media (max-width: 900px) {
  .card-head {
    flex-direction: column;
  }
}
</style>
