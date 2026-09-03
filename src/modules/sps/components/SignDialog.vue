<template>
  <v-dialog max-width="480" :model-value="modelValue" persistent @update:model-value="close">
    <v-card :loading="requestingOtp || signing">
      <v-card-title class="pt-6 pb-2">
        Firmar como {{ roleLabel }}
      </v-card-title>

      <v-card-text>
        <p v-if="intro" class="text-body-2 mb-3">{{ intro }}</p>

        <p class="text-caption text-medium-emphasis mb-4">
          Te enviaremos un código de 6 dígitos por correo. Vence a los 5 minutos y solo puede
          usarse una vez.
        </p>

        <v-alert
          v-if="error"
          class="mb-4"
          closable
          color="error"
          density="comfortable"
          variant="tonal"
          @click:close="clearError"
        >
          {{ error }}
        </v-alert>

        <div v-if="destination" class="sign-dialog__destination mb-4">
          <v-icon icon="mdi-email-check-outline" size="16" />
          <span>Código enviado a <strong>{{ destination }}</strong></span>
        </div>

        <v-btn
          block
          :disabled="cooldown > 0"
          :loading="requestingOtp"
          prepend-icon="mdi-email-fast-outline"
          variant="tonal"
          @click="onRequestOtp"
        >
          {{ requestLabel }}
        </v-btn>

        <v-text-field
          v-model="code"
          class="mt-4"
          density="comfortable"
          hide-details
          inputmode="numeric"
          label="Código de 6 dígitos"
          maxlength="6"
          placeholder="000000"
          variant="outlined"
          @keyup.enter="onSign"
        />
      </v-card-text>

      <v-divider />

      <v-card-actions>
        <v-spacer />

        <v-btn :disabled="signing" text="Cancelar" variant="text" @click="close" />

        <v-btn
          color="#c89215"
          :disabled="!isCodeComplete"
          :loading="signing"
          prepend-icon="mdi-draw-pen"
          text="Firmar"
          variant="flat"
          @click="onSign"
        />
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script lang="ts" setup>
  import type { SignableResource, SignerRole } from '@/modules/signatures/port'
  import { computed, onBeforeUnmount, ref } from 'vue'
  import { useSignatures } from '@/modules/signatures/useSignatures'

  const props = defineProps<{
    /** Extra line explaining why the signature is being asked for. */
    intro?: string
    modelValue: boolean
    /**
     * Captured once when this dialog mounts, so the parent must key it by
     * document (`:key="documentId"`) when reusing it across rows.
     */
    documentId: number | string
    resource: SignableResource
    roleLabel: string
    signerRole: SignerRole
  }>()

  const emit = defineEmits<{ 'signed': [], 'update:model-value': [value: boolean] }>()

  const {
    clearError,
    error,
    requestingOtp,
    requestOtp,
    sign,
    signing,
  } = useSignatures(props.resource, props.documentId)

  const code = ref('')
  const destination = ref('')
  const cooldown = ref(0)
  let cooldownTimer: ReturnType<typeof setInterval> | null = null

  const isCodeComplete = computed(() => /^\d{6}$/.test(code.value))

  const requestLabel = computed(() =>
    cooldown.value > 0 ? `Reenviar en ${cooldown.value}s` : 'Solicitar código',
  )

  function stopCooldown () {
    if (cooldownTimer) {
      clearInterval(cooldownTimer)
      cooldownTimer = null
    }
    cooldown.value = 0
  }

  // Mirrors the API's one-request-per-60s rule so the signer gets a disabled
  // button instead of a 429.
  function startCooldown (seconds: number) {
    stopCooldown()
    cooldown.value = seconds
    cooldownTimer = setInterval(() => {
      cooldown.value -= 1
      if (cooldown.value <= 0) {
        stopCooldown()
      }
    }, 1000)
  }

  function close () {
    stopCooldown()
    code.value = ''
    destination.value = ''
    clearError()
    emit('update:model-value', false)
  }

  async function onRequestOtp () {
    const result = await requestOtp(props.signerRole)
    if (!result) return

    destination.value = result.destination
    startCooldown(60)
  }

  async function onSign () {
    if (!isCodeComplete.value) return

    const result = await sign(props.signerRole, code.value)
    if (!result) return

    close()
    emit('signed')
  }

  onBeforeUnmount(stopCooldown)
</script>

<style scoped>
.sign-dialog__destination {
  display: flex;
  align-items: center;
  gap: 6px;
  color: #2e7d5b;
  font-size: 0.85rem;
}
</style>
