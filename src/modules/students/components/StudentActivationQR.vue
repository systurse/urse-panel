<template>
  <v-card rounded="xl" class="qr-card">
    <v-card-text class="pa-6">
      <h3 class="qr-title">Hoja de Credenciales</h3>
      <p class="qr-subtitle">Escanea este código QR para descargar la hoja de credenciales</p>

      <!-- QR Code Container -->
      <div class="qr-container">
        <img
          :src="qrImageUrl"
          alt="Código QR de credenciales"
          class="qr-code"
        />
      </div>

      <!-- Link Display -->
      <div class="link-section mt-6">
        <div class="link-label">Link de credenciales:</div>
        <div class="link-display">
          <span class="link-text">{{ credentialSheetUrl }}</span>
          <v-btn
            icon="mdi-content-copy"
            size="small"
            variant="text"
            @click="copyLink"
          />
        </div>
      </div>

      <!-- Action Buttons -->
      <div class="qr-actions mt-6">
        <v-btn
          block
          color="primary"
          size="large"
          variant="flat"
          @click="openLink"
        >
          <v-icon left>mdi-open-in-new</v-icon>
          Descargar Hoja de Credenciales
        </v-btn>
      </div>

      <!-- Info Alert -->
      <v-alert
        class="mt-4"
        color="info"
        icon="mdi-information-outline"
        variant="tonal"
      >
        La hoja de credenciales contiene la información de acceso del estudiante.
      </v-alert>
    </v-card-text>
  </v-card>
</template>

<script setup lang="ts">
  import { computed, ref } from 'vue'

  interface Props {
    credentialSheetUrl: string
  }

  const props = withDefaults(defineProps<Props>(), {})

  const copied = ref(false)

  // Generar URL del QR usando API externa (qrserver.com)
  const qrImageUrl = computed(() => {
    const encodedUrl = encodeURIComponent(props.credentialSheetUrl)
    return `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodedUrl}`
  })

  function copyLink () {
    navigator.clipboard.writeText(props.credentialSheetUrl)
    copied.value = true
    setTimeout(() => {
      copied.value = false
    }, 2000)
  }

  function openLink () {
    window.open(props.credentialSheetUrl, '_blank')
  }
</script>

<style scoped>
.qr-card {
  background: #ffffff;
  border: 1px solid rgb(0 0 0 / 0.08);
}

.qr-title {
  margin: 0;
  font-size: 1.3rem;
  font-weight: 800;
  color: #000000;
}

.qr-subtitle {
  margin: 8px 0 0;
  color: #5e5e5e;
  font-size: 0.9rem;
}

.qr-container {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 24px;
  background: #f7f7f7;
  border-radius: 12px;
  margin-top: 16px;
}

.qr-code {
  max-width: 100%;
  height: auto;
  filter: drop-shadow(0 2px 4px rgba(0 0 0 / 0.1));
}

.link-section {
  padding: 16px;
  background: rgb(250 178 26 / 0.04);
  border-radius: 8px;
  border: 1px solid rgb(250 178 26 / 0.2);
}

.link-label {
  font-size: 0.85rem;
  color: #5e5e5e;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  margin-bottom: 8px;
}

.link-display {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px;
  background: #ffffff;
  border-radius: 6px;
  border: 1px solid rgb(250 178 26 / 0.3);
}

.link-text {
  flex: 1;
  font-family: 'Courier New', monospace;
  font-size: 0.8rem;
  color: #000000;
  word-break: break-all;
  font-weight: 600;
}

.qr-actions {
  display: flex;
  gap: 12px;
}
</style>
