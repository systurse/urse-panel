<template>
  <div class="upload-page">
    <div class="upload-shell">
      <div class="upload-brand">
        <v-img alt="URSE" class="upload-logo" src="@/assets/logo.png" width="56" />

        <div>
          <div class="upload-brand__name">Universidad Regional del Sureste</div>
          <div class="upload-brand__tag">Buzón de impresión</div>
        </div>
      </div>

      <v-card class="upload-card" rounded="xl" variant="flat">
        <template v-if="result">
          <div class="upload-state">
            <v-icon color="success" icon="mdi-check-decagram" size="44" />
            <h1 class="upload-state__title">Archivo recibido</h1>

            <p class="upload-state__text">
              Anota o muestra este código en el Centro de Cómputo para recoger tu impresión.
              Vence en {{ result.expiresInMinutes }} minutos.
            </p>

            <div class="upload-code">{{ result.batchCode }}</div>

            <div class="upload-files">
              <div v-for="file in result.files" :key="file.originalName" class="upload-files__item">
                <v-icon icon="mdi-file-outline" size="18" />
                <span class="upload-files__name">{{ file.originalName }}</span>
                <span class="upload-files__size">{{ formatSize(file.sizeBytes) }}</span>
              </div>
            </div>

            <v-btn
              class="mt-6"
              color="#c89215"
              prepend-icon="mdi-upload-outline"
              variant="flat"
              @click="startOver"
            >
              Subir otro archivo
            </v-btn>
          </div>
        </template>

        <template v-else>
          <h1 class="upload-title">Sube tu archivo para imprimir</h1>

          <p class="upload-subtitle">
            Formatos permitidos: PDF, imágenes (JPG, PNG, GIF, WEBP), Word, Excel, PowerPoint y TXT.
            Hasta 10 archivos, 25 MB cada uno.
          </p>

          <v-alert
            v-if="error"
            class="mb-4"
            closable
            color="error"
            variant="tonal"
            @click:close="error = null"
          >
            {{ error }}
          </v-alert>

          <v-file-input
            v-model="selectedFiles"
            accept=".pdf,.jpg,.jpeg,.png,.gif,.webp,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt"
            chips
            counter
            :disabled="uploading"
            label="Archivos"
            multiple
            prepend-icon="mdi-paperclip"
            show-size
            variant="outlined"
          />

          <v-btn
            block
            class="mt-2"
            color="#c89215"
            :disabled="selectedFiles.length === 0"
            :loading="uploading"
            prepend-icon="mdi-upload-outline"
            size="large"
            variant="flat"
            @click="submit"
          >
            Subir
          </v-btn>
        </template>
      </v-card>
    </div>
  </div>
</template>

<script lang="ts" setup>
  import { ref } from 'vue'
  import { usePrintingUpload } from '@/modules/printing/usePrintingUpload'

  const { error, reset, result, upload, uploading } = usePrintingUpload()
  const selectedFiles = ref<File[]>([])

  function formatSize (bytes: number) {
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
  }

  async function submit () {
    try {
      await upload(selectedFiles.value)
      selectedFiles.value = []
    } catch {
      // El composable ya dejó el motivo en `error`.
    }
  }

  function startOver () {
    reset()
    selectedFiles.value = []
  }
</script>

<style scoped>
.upload-page {
  display: flex;
  justify-content: center;
  min-height: 100vh;
  padding: 24px 16px 48px;
  background: #f7f7f7;
}

.upload-shell {
  width: 100%;
  max-width: 480px;
}

.upload-brand {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 16px;
}

.upload-logo {
  flex: 0 0 auto;
}

.upload-brand__name {
  color: #000000;
  font-weight: 800;
  line-height: 1.2;
}

.upload-brand__tag {
  color: #c89215;
  font-size: 0.78rem;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.upload-card {
  padding: 24px 20px;
  background: #ffffff;
}

.upload-title {
  margin: 0;
  color: #000000;
  font-size: 1.3rem;
  font-weight: 800;
}

.upload-subtitle {
  margin: 8px 0 20px;
  color: #5e5e5e;
  font-size: 0.9rem;
}

.upload-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
  text-align: center;
}

.upload-state__title {
  margin: 4px 0 0;
  color: #000000;
  font-size: 1.25rem;
  font-weight: 800;
}

.upload-state__text {
  margin: 0;
  max-width: 40ch;
  color: #5e5e5e;
}

.upload-code {
  margin-top: 12px;
  padding: 14px 24px;
  border-radius: 12px;
  background: rgb(200 146 21 / 0.12);
  color: #8a5a00;
  font-family: 'Roboto Mono', 'SF Mono', Consolas, monospace;
  font-size: 1.8rem;
  font-weight: 800;
  letter-spacing: 0.12em;
}

.upload-files {
  display: grid;
  gap: 6px;
  width: 100%;
  margin-top: 16px;
}

.upload-files__item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 6px 10px;
  border-radius: 8px;
  background: #f7f7f7;
  font-size: 0.85rem;
}

.upload-files__name {
  flex: 1;
  overflow: hidden;
  color: #000000;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.upload-files__size {
  color: #5e5e5e;
  font-size: 0.78rem;
}
</style>
