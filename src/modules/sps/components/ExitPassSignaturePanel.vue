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

        <div class="sign-actions">
          <v-btn
            v-for="role in signableRoles"
            :key="`sign-${role}`"
            color="#c89215"
            prepend-icon="mdi-draw-pen"
            variant="flat"
            @click="openSignDialog(role)"
          >
            Firmar como {{ roleLabel(role) }}
          </v-btn>
        </div>
      </template>

      <p v-else-if="!progress.isComplete" class="signature-panel__note">
        No tienes un rol pendiente de firma en este pase.
      </p>
    </template>

    <ExitPassSignDialog
      v-if="dialogRole"
      :key="`${passId}-${dialogRole}`"
      v-model="signDialog"
      :pass-id="passId"
      :role-label="roleLabel(dialogRole)"
      :signer-role="dialogRole"
      @signed="onSigned"
    />
  </div>
</template>

<script lang="ts" setup>
  import type { ExitPassSignature, SignerRole } from '@/modules/exit-pass-signatures/port'
  import { computed, onMounted, ref } from 'vue'
  import { useExitPassSignatures } from '@/modules/exit-pass-signatures/useExitPassSignatures'
  import ExitPassSignDialog from '@/modules/sps/components/ExitPassSignDialog.vue'
  import { useAuthStore } from '@/stores/auth'

  const props = defineProps<{
    /** Whether the signed-in user is the employee the pass belongs to. */
    isOwner: boolean
    passId: number | string
  }>()

  const emit = defineEmits<{
    loaded: [signatures: ExitPassSignature[]]
    signed: [role: SignerRole, isComplete: boolean]
  }>()

  const authStore = useAuthStore()

  const {
    clearError,
    error,
    loading,
    loadSignatures,
    progress,
    signatures,
  } = useExitPassSignatures(props.passId)

  const ROLE_LABELS: Record<SignerRole, string> = {
    administrative_director: 'Dirección de Asuntos Administrativos',
    employee: 'Empleado',
    immediate_supervisor: 'Jefe inmediato',
  }

  const signDialog = ref(false)
  const dialogRole = ref<SignerRole | null>(null)

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

  function openSignDialog (role: SignerRole) {
    dialogRole.value = role
    signDialog.value = true
  }

  async function onSigned () {
    const role = dialogRole.value
    await refresh()

    // The pass flips to `authorized` on its own once the last required
    // signature lands, so the parent has to refetch it. Emitted only as a
    // result of signing — never by observing state, because the parent
    // remounts this panel while it reloads, which would loop forever.
    if (role) {
      emit('signed', role, progress.value.isComplete)
    }
  }

  async function refresh () {
    await loadSignatures()
    emit('loaded', signatures.value)
  }

  onMounted(() => {
    void refresh()
  })

  defineExpose({ refresh })
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

.sign-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}
</style>
