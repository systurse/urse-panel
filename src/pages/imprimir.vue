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
              Tu archivo ya está en el Centro de Cómputo, listo para imprimirse. Vence en
              {{ result.expiresInMinutes }} minutos si no se recoge.
            </p>

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

          <!-- A plain HTML5 drop target: it also accepts the iOS/iPadOS gesture
               of dragging a file out of Photos/Files into Safari, which hands
               the same `dataTransfer.files` a desktop drop does. -->
          <div
            class="dropzone"
            :class="{ 'dropzone--active': isDragging, 'dropzone--disabled': uploading }"
            tabindex="0"
            @click="openFilePicker"
            @dragenter.prevent="onDragEnter"
            @dragleave.prevent="onDragLeave"
            @dragover.prevent
            @drop.prevent="onDrop"
            @keydown.enter="openFilePicker"
            @keydown.space.prevent="openFilePicker"
          >
            <v-icon color="#c89215" icon="mdi-tray-arrow-up" size="40" />

            <p class="dropzone__text">
              Arrastra tus archivos aquí o toca para seleccionarlos
            </p>

            <input
              ref="fileInputRef"
              accept=".pdf,.jpg,.jpeg,.png,.gif,.webp,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt"
              class="dropzone__input"
              :disabled="uploading"
              multiple
              tabindex="-1"
              type="file"
              @change="onInputChange"
            >
          </div>

          <div v-if="selectedFiles.length > 0" class="upload-files mt-4">
            <div v-for="(file, index) in selectedFiles" :key="`${file.name}-${index}`" class="upload-files__item">
              <v-icon icon="mdi-file-outline" size="18" />
              <span class="upload-files__name">{{ file.name }}</span>
              <span class="upload-files__size">{{ formatSize(file.size) }}</span>

              <v-btn
                density="comfortable"
                icon="mdi-close"
                size="x-small"
                variant="text"
                @click="removeSelectedFile(index)"
              />
            </div>
          </div>

          <v-btn
            block
            class="mt-4"
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

  const fileInputRef = ref<HTMLInputElement>()
  const isDragging = ref(false)
  // dragenter/dragleave fire for every nested element the pointer crosses, so a
  // plain boolean flickers off whenever it passes over the icon or the text.
  let dragDepth = 0

  function formatSize (bytes: number) {
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
  }

  function addFiles (fileList: FileList | null) {
    if (!fileList || fileList.length === 0) return
    selectedFiles.value = [...selectedFiles.value, ...Array.from(fileList)]
  }

  function openFilePicker () {
    if (uploading.value) return
    fileInputRef.value?.click()
  }

  function onInputChange (event: Event) {
    const input = event.target as HTMLInputElement
    addFiles(input.files)
    // Clears the native picker so selecting the same file twice fires `change` again.
    input.value = ''
  }

  function onDragEnter () {
    if (uploading.value) return
    dragDepth += 1
    isDragging.value = true
  }

  function onDragLeave () {
    dragDepth = Math.max(0, dragDepth - 1)
    if (dragDepth === 0) isDragging.value = false
  }

  function onDrop (event: DragEvent) {
    dragDepth = 0
    isDragging.value = false
    if (uploading.value) return
    addFiles(event.dataTransfer?.files ?? null)
  }

  function removeSelectedFile (index: number) {
    selectedFiles.value = selectedFiles.value.filter((_, i) => i !== index)
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

.dropzone {
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 8px;
  min-height: 160px;
  padding: 24px 16px;
  border: 2px dashed rgb(200 146 21 / 0.45);
  border-radius: 16px;
  background: rgb(200 146 21 / 0.05);
  cursor: pointer;
  text-align: center;
  transition: background 0.15s ease, border-color 0.15s ease;
}

.dropzone:focus-visible {
  outline: 2px solid #c89215;
  outline-offset: 2px;
}

.dropzone--active {
  border-color: #c89215;
  background: rgb(200 146 21 / 0.14);
}

.dropzone--disabled {
  cursor: not-allowed;
  opacity: 0.6;
}

.dropzone__text {
  margin: 0;
  max-width: 28ch;
  color: #5e5e5e;
  font-size: 0.9rem;
  font-weight: 600;
}

.dropzone__input {
  position: absolute;
  width: 1px;
  height: 1px;
  overflow: hidden;
  opacity: 0;
  /* The div handles the click (and triggers this input via ref); without this
     the input would sit on top and fire its own native picker a second time. */
  pointer-events: none;
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

.upload-files {
  display: grid;
  gap: 6px;
  width: 100%;
}

.upload-files__item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 6px 6px 6px 10px;
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
