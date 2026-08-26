<template>
  <div class="signature-panel">
    <div class="signature-panel__head">
      <div class="text-subtitle-2 font-weight-bold">Firma electrónica</div>

      <v-chip
        :color="progress.isComplete ? 'success' : 'warning'"
        size="small"
        variant="tonal"
      >
        {{ progress.isComplete ? 'Completa' : `${progress.signedRoles.length} de ${requiredCount} firmas` }}
      </v-chip>
    </div>

    <v-alert
      v-if="error"
      class="mb-3"
      closable
      color="error"
      density="comfortable"
      variant="tonal"
      @click:close="clearError"
    >
      {{ error }}
    </v-alert>

    <div v-if="loading" class="signature-panel__state">
      <v-progress-circular color="#c89215" indeterminate size="24" />
      <span>Cargando firmas...</span>
    </div>

    <template v-else>
      <div class="signature-roles">
        <div
          v-for="role in progress.requiredRoles"
          :key="role"
          class="signature-role"
          :class="{ 'signature-role--signed': progress.signedRoles.includes(role) }"
        >
          <v-icon
            :color="progress.signedRoles.includes(role) ? 'success' : '#9e9e9e'"
            :icon="progress.signedRoles.includes(role) ? 'mdi-check-decagram' : 'mdi-clock-outline'"
            size="18"
          />

          <div>
            <div class="signature-role__name">{{ roleLabel(role) }}</div>

            <div class="signature-role__state">
              {{ signatureFor(role) ? signedCaption(signatureFor(role)!) : 'Pendiente de firma' }}
            </div>
          </div>
        </div>
      </div>

      <p v-if="hasPrintedSeal" class="signature-panel__note">
        La Dirección de Asuntos Administrativos no firma electrónicamente; en el PDF lleva un sello
        impreso.
      </p>

      <template v-if="signatures.length > 0">
        <v-divider class="my-3" />

        <div class="text-caption text-medium-emphasis mb-2">Firmas registradas</div>

        <div v-for="signature in signatures" :key="signature.id" class="signature-entry">
          <div>
            <span class="font-weight-bold">{{ signature.roleLabel || roleLabel(signature.role) }}</span>
            <span class="text-medium-emphasis"> · {{ signature.signerName }}</span>
          </div>

          <div class="text-caption text-medium-emphasis">
            {{ formatDateTime(signature.signedAt) }}
          </div>

          <v-btn
            v-if="signature.verificationCode"
            class="signature-entry__verify"
            density="comfortable"
            prepend-icon="mdi-qrcode-scan"
            size="small"
            target="_blank"
            :to="`/verificar/${signature.verificationCode}`"
            variant="text"
          >
            Verificar
          </v-btn>
        </div>
      </template>

      <template v-if="!progress.isComplete && signableRoles.length > 0">
        <v-divider class="my-3" />

        <div v-for="role in signableRoles" :key="`sign-${role}`" class="sign-block">
          <div class="text-body-2 font-weight-bold mb-1">
            Firmar como {{ roleLabel(role) }}
          </div>

          <p class="text-caption text-medium-emphasis mb-3">
            Te enviaremos un código de 6 dígitos por correo. Vence a los 5 minutos y solo puede
            usarse una vez.
          </p>

          <div v-if="destinations[role]" class="sign-block__destination">
            <v-icon icon="mdi-email-check-outline" size="16" />
            <span>Código enviado a <strong>{{ destinations[role] }}</strong></span>
          </div>

          <div class="sign-block__actions">
            <v-btn
              :disabled="cooldowns[role] > 0"
              :loading="requestingOtp"
              prepend-icon="mdi-email-fast-outline"
              variant="tonal"
              @click="onRequestOtp(role)"
            >
              {{ cooldowns[role] > 0 ? `Reenviar en ${cooldowns[role]}s` : 'Solicitar código' }}
            </v-btn>

            <v-text-field
              v-model="codes[role]"
              class="sign-block__code"
              density="comfortable"
              hide-details
              inputmode="numeric"
              label="Código"
              maxlength="6"
              placeholder="000000"
              variant="outlined"
            />

            <v-btn
              color="#c89215"
              :disabled="!isCodeComplete(role)"
              :loading="signing"
              prepend-icon="mdi-draw-pen"
              variant="flat"
              @click="onSign(role)"
            >
              Firmar
            </v-btn>
          </div>
        </div>
      </template>

      <p v-else-if="!progress.isComplete" class="signature-panel__note">
        No tienes un rol pendiente de firma en este pase.
      </p>
    </template>
  </div>
</template>

<script lang="ts" setup>
  import type { ExitPassSignature, SignerRole } from '@/modules/exit-pass-signatures/port'
  import { computed, onBeforeUnmount, onMounted, reactive } from 'vue'
  import { useExitPassSignatures } from '@/modules/exit-pass-signatures/useExitPassSignatures'
  import { useAuthStore } from '@/stores/auth'

  const props = defineProps<{
    /** Whether the signed-in user is the employee the pass belongs to. */
    isOwner: boolean
    passId: number | string
  }>()

  const emit = defineEmits<{ signed: [role: SignerRole, isComplete: boolean] }>()

  const authStore = useAuthStore()

  const {
    clearError,
    error,
    loading,
    loadSignatures,
    progress,
    requestingOtp,
    requestOtp,
    sign,
    signatures,
    signing,
  } = useExitPassSignatures(props.passId)

  const ROLE_LABELS: Record<SignerRole, string> = {
    administrative_director: 'Dirección de Asuntos Administrativos',
    employee: 'Empleado',
    immediate_supervisor: 'Jefe inmediato',
  }

  const codes = reactive<Record<string, string>>({})
  const destinations = reactive<Record<string, string>>({})
  const cooldowns = reactive<Record<string, number>>({})
  const timers = new Map<string, ReturnType<typeof setInterval>>()

  const requiredCount = computed(() => progress.value.requiredRoles.length)

  const hasPrintedSeal = computed(() =>
    !progress.value.requiredRoles.includes('administrative_director'),
  )

  // The API is the authority and answers 403; this only decides what is worth
  // offering. A person may not hold two roles on the same pass, so the owner is
  // never shown the supervisor block.
  const signableRoles = computed(() => progress.value.pendingRoles.filter(role => {
    switch (role) {
      case 'administrative_director': {
        return authStore.hasRole('administrative_director')
      }
      case 'employee': {
        return props.isOwner && authStore.hasPermission('sps.pass-signature.sign')
      }
      case 'immediate_supervisor': {
        return !props.isOwner
          && authStore.hasRole('supervisor')
          && authStore.hasPermission('sps.pass-signature.sign-as-supervisor')
      }
      default: {
        return false
      }
    }
  }))

  function roleLabel (role: SignerRole) {
    return ROLE_LABELS[role] ?? role
  }

  function signatureFor (role: SignerRole) {
    return signatures.value.find(signature => signature.role === role) ?? null
  }

  function formatDateTime (value: string) {
    if (!value) return '—'
    const date = new Date(value)
    return Number.isNaN(date.getTime()) ? value : date.toLocaleString('es-MX')
  }

  function signedCaption (signature: ExitPassSignature) {
    return `Firmado por ${signature.signerName} · ${formatDateTime(signature.signedAt)}`
  }

  function isCodeComplete (role: SignerRole) {
    return /^\d{6}$/.test(codes[role] ?? '')
  }

  function stopCooldown (role: SignerRole) {
    const timer = timers.get(role)
    if (timer) {
      clearInterval(timer)
      timers.delete(role)
    }
    cooldowns[role] = 0
  }

  // Matches the API's one-request-per-60s rule so the signer sees a disabled
  // button rather than a 429.
  function startCooldown (role: SignerRole, seconds: number) {
    stopCooldown(role)
    cooldowns[role] = seconds
    timers.set(role, setInterval(() => {
      cooldowns[role] -= 1
      if (cooldowns[role] <= 0) {
        stopCooldown(role)
      }
    }, 1000))
  }

  async function onRequestOtp (role: SignerRole) {
    const result = await requestOtp(role)
    if (!result) return

    destinations[role] = result.destination
    startCooldown(role, 60)
  }

  async function onSign (role: SignerRole) {
    const result = await sign(role, codes[role] ?? '')
    if (!result) return

    codes[role] = ''
    destinations[role] = ''
    stopCooldown(role)

    // The pass flips to `authorized` on its own once the last required
    // signature lands, so the parent has to refetch it. Emitted only as a
    // result of signing — never by observing state, because the parent
    // remounts this panel while it reloads, which would loop forever.
    emit('signed', role, result.progress.isComplete)
  }

  onMounted(() => {
    void loadSignatures()
  })

  onBeforeUnmount(() => {
    for (const timer of timers.values()) {
      clearInterval(timer)
    }
    timers.clear()
  })

  defineExpose({ loadSignatures })
</script>

<style scoped>
.signature-panel {
  padding: 16px;
  border-radius: 12px;
  background: rgb(200 146 21 / 0.06);
}

.signature-panel__head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 12px;
}

.signature-panel__state {
  display: flex;
  align-items: center;
  gap: 10px;
  color: #5e5e5e;
}

.signature-panel__note {
  margin: 12px 0 0;
  color: #5e5e5e;
  font-size: 0.8rem;
}

.signature-roles {
  display: grid;
  gap: 10px;
}

.signature-role {
  display: flex;
  align-items: center;
  gap: 10px;
}

.signature-role__name {
  font-weight: 700;
  color: #000000;
}

.signature-role__state {
  color: #5e5e5e;
  font-size: 0.8rem;
}

.signature-entry {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 8px;
  padding: 6px 0;
}

.signature-entry__verify {
  margin-inline-start: auto;
}

.sign-block {
  padding-top: 4px;
}

.sign-block__destination {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-bottom: 10px;
  color: #2e7d5b;
  font-size: 0.85rem;
}

.sign-block__actions {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 10px;
}

.sign-block__code {
  max-width: 160px;
}

@media (max-width: 900px) {
  .sign-block__code {
    max-width: none;
    width: 100%;
  }
}
</style>
