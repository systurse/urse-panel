<template>
  <div class="printing-page">
    <v-card class="printing-card" rounded="xl" variant="flat">
      <div class="card-head">
        <div>
          <div class="section-kicker">Centro de cómputo</div>
          <h2 class="card-title">Buzón de impresión</h2>
          <p class="card-subtitle">Archivos subidos desde el código QR, agrupados por subida.</p>
        </div>

        <v-btn
          color="#c89215"
          prepend-icon="mdi-qrcode"
          variant="outlined"
          @click="openQrDialog"
        >
          Mostrar código QR
        </v-btn>
      </div>

      <v-alert
        v-if="error"
        class="mt-6"
        closable
        color="error"
        variant="tonal"
        @click:close="error = null"
      >
        {{ error }}
      </v-alert>

      <v-tabs v-model="selectedCampus" class="mt-4" show-arrows>
        <v-tab :value="null">Todos</v-tab>

        <v-tab v-for="campus in campuses" :key="campus.key" :value="campus.key">
          {{ campus.label }}
        </v-tab>
      </v-tabs>

      <div v-if="loading" class="state-box">
        <v-progress-circular color="#c89215" indeterminate />
        <span>Cargando archivos...</span>
      </div>

      <div v-else-if="batches.length === 0" class="state-box state-box--empty">
        <v-icon color="#c89215" icon="mdi-printer-off-outline" size="32" />
        <span>No hay archivos pendientes en este campus.</span>
      </div>

      <div v-else class="batch-list">
        <v-card
          v-for="batch in batches"
          :key="batch.batchCode"
          class="batch-item"
          rounded="lg"
          variant="outlined"
        >
          <div class="batch-item__head">
            <div>
              <div class="batch-item__code">{{ batch.batchCode }}</div>
              <div class="batch-item__meta">{{ batch.campusLabel }} · {{ batch.files.length }} archivo(s)</div>
            </div>
          </div>

          <v-divider class="my-2" />

          <div v-for="file in batch.files" :key="file.id" class="file-row">
            <v-icon :icon="fileIcon(file.extension)" size="22" />

            <div class="file-row__info">
              <div class="file-row__name">{{ file.originalName }}</div>

              <div class="file-row__meta">
                {{ formatSize(file.sizeBytes) }}
                <template v-if="file.printedAt">
                  · impreso por {{ file.printedBy ?? 'operador' }}
                </template>

                <template v-else>
                  · vence en {{ formatCountdown(file.remainingSeconds) }}
                </template>
              </div>
            </div>

            <v-chip v-if="file.printedAt" color="success" size="small" variant="tonal">
              Impreso
            </v-chip>

            <div class="file-row__actions">
              <v-btn
                v-if="file.canPreviewInline"
                icon="mdi-eye-outline"
                size="small"
                variant="text"
                @click="openFile(file.id, 'inline')"
              />

              <v-btn
                icon="mdi-download-outline"
                size="small"
                variant="text"
                @click="openFile(file.id, 'download', file.originalName)"
              />

              <v-btn
                v-if="canManage && !file.printedAt"
                color="#c89215"
                icon="mdi-printer-check"
                :loading="acting"
                size="small"
                variant="text"
                @click="confirmPrinted(file.id)"
              />

              <v-btn
                v-if="canManage"
                color="error"
                icon="mdi-delete-outline"
                :loading="acting"
                size="small"
                variant="text"
                @click="openDeleteDialog(file.id)"
              />
            </div>
          </div>
        </v-card>
      </div>

      <div v-if="meta.lastPage > 1" class="printing-pagination">
        <v-pagination
          :length="meta.lastPage"
          :model-value="meta.currentPage"
          rounded="circle"
          total-visible="7"
          @update:model-value="setPage"
        />
      </div>
    </v-card>

    <v-dialog v-model="qrDialog" max-width="360">
      <v-card class="qr-card" rounded="xl">
        <v-card-title class="text-center">Código QR del buzón</v-card-title>

        <v-card-text class="qr-card__body">
          <img v-if="qrDataUrl" alt="Código QR de subida" :src="qrDataUrl">
          <p class="qr-card__url">{{ uploadUrl }}</p>
        </v-card-text>

        <v-card-actions>
          <v-spacer />
          <v-btn text="Cerrar" variant="text" @click="qrDialog = false" />
        </v-card-actions>
      </v-card>
    </v-dialog>

    <v-dialog v-model="deleteDialog" max-width="420" persistent>
      <v-card>
        <v-card-title class="text-h6 pt-6 pb-2">Confirmar eliminación</v-card-title>

        <v-card-text class="pb-6">
          ¿Eliminar este archivo del buzón? Esta acción no se puede deshacer.
        </v-card-text>

        <v-divider />

        <v-card-actions>
          <v-spacer />
          <v-btn text="Cancelar" variant="text" @click="deleteDialog = false" />

          <v-btn
            color="error"
            :loading="acting"
            text="Eliminar"
            variant="flat"
            @click="confirmDelete"
          />
        </v-card-actions>
      </v-card>
    </v-dialog>
  </div>
</template>

<script lang="ts" setup>
  import QRCode from 'qrcode'
  import { ref } from 'vue'
  import { usePrintingPanel } from '@/modules/printing/usePrintingPanel'
  import { useAuthStore } from '@/stores/auth'

  const authStore = useAuthStore()
  const canManage = authStore.isAdmin || authStore.hasPermission('printing.panel.manage')

  const {
    acting,
    batches,
    campuses,
    error,
    loading,
    markPrinted,
    meta,
    openFile,
    removeFile,
    selectedCampus,
    setPage,
  } = usePrintingPanel()

  const EXTENSION_ICONS: Record<string, string> = {
    pdf: 'mdi-file-pdf-box',
    jpg: 'mdi-file-image-outline',
    jpeg: 'mdi-file-image-outline',
    png: 'mdi-file-image-outline',
    gif: 'mdi-file-image-outline',
    webp: 'mdi-file-image-outline',
    doc: 'mdi-file-word-outline',
    docx: 'mdi-file-word-outline',
    xls: 'mdi-file-excel-outline',
    xlsx: 'mdi-file-excel-outline',
    ppt: 'mdi-file-powerpoint-outline',
    pptx: 'mdi-file-powerpoint-outline',
    txt: 'mdi-file-document-outline',
  }

  function fileIcon (extension: string) {
    return EXTENSION_ICONS[extension.toLowerCase()] ?? 'mdi-file-outline'
  }

  function formatSize (bytes: number) {
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
  }

  function formatCountdown (seconds: number) {
    if (seconds <= 0) return 'expirado'
    const minutes = Math.floor(seconds / 60)
    const rest = seconds % 60
    return `${minutes}:${String(rest).padStart(2, '0')}`
  }

  const qrDialog = ref(false)
  const qrDataUrl = ref('')
  const uploadUrl = `${window.location.origin}/imprimir`

  async function openQrDialog () {
    qrDialog.value = true
    qrDataUrl.value = await QRCode.toDataURL(uploadUrl, { margin: 1, width: 240 })
  }

  async function confirmPrinted (fileId: string) {
    try {
      await markPrinted(fileId)
    } catch {
      // El composable ya dejó el motivo en `error`.
    }
  }

  const deleteDialog = ref(false)
  const selectedFileId = ref<string | null>(null)

  function openDeleteDialog (fileId: string) {
    selectedFileId.value = fileId
    deleteDialog.value = true
  }

  async function confirmDelete () {
    if (!selectedFileId.value) return

    try {
      await removeFile(selectedFileId.value)
      deleteDialog.value = false
    } catch {
      // El composable ya dejó el motivo en `error`.
    }
  }
</script>

<style scoped>
.printing-page {
  display: grid;
}

.printing-card {
  padding: 24px;
  background: #ffffff;
}

.card-head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
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
  color: #000000;
  font-size: 1.5rem;
  font-weight: 800;
}

.card-subtitle {
  margin: 4px 0 0;
  color: #5e5e5e;
}

.state-box {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
  min-height: 180px;
  color: #5e5e5e;
}

.state-box--empty {
  flex-direction: column;
}

.batch-list {
  display: grid;
  gap: 12px;
  margin-top: 16px;
}

.batch-item {
  padding: 16px;
}

.batch-item__head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
}

.batch-item__code {
  color: #000000;
  font-family: 'Roboto Mono', 'SF Mono', Consolas, monospace;
  font-size: 1.05rem;
  font-weight: 800;
  letter-spacing: 0.06em;
}

.batch-item__meta {
  color: #5e5e5e;
  font-size: 0.82rem;
}

.file-row {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 8px 0;
}

.file-row__info {
  flex: 1;
  min-width: 0;
}

.file-row__name {
  overflow: hidden;
  color: #000000;
  font-weight: 600;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.file-row__meta {
  color: #5e5e5e;
  font-size: 0.78rem;
}

.file-row__actions {
  display: flex;
  align-items: center;
  flex-shrink: 0;
}

.printing-pagination {
  display: flex;
  justify-content: center;
  margin-top: 20px;
}

.qr-card__body {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
}

.qr-card__url {
  margin: 0;
  color: #5e5e5e;
  font-size: 0.82rem;
  word-break: break-all;
}

@media (max-width: 900px) {
  .card-head {
    flex-direction: column;
  }
}
</style>
