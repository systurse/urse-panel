<template>
  <div class="mail-page">
    <!-- Header -->
    <div class="module-header">
      <div class="header-content">
        <h1>Correos Enviados</h1>
        <p>Historial de correos enviados desde el sistema</p>
      </div>
      <div class="header-icon" style="background-color: #2196f3">
        <v-icon icon="mdi-email-outline" size="32" color="white" />
      </div>
    </div>

    <!-- Alert de Error -->
    <v-alert
      v-if="error"
      class="mb-6"
      closable
      color="error"
      icon="mdi-alert-circle-outline"
      variant="tonal"
      @click:close="clearError"
    >
      {{ error }}
    </v-alert>

    <!-- Search and Filter -->
    <v-card rounded="xl" class="search-card mb-6">
      <v-card-text class="pa-6">
        <v-text-field
          v-model="searchQuery"
          placeholder="Buscar por asunto o contenido..."
          prepend-inner-icon="mdi-magnify"
          variant="outlined"
          @update:model-value="performSearch"
          clearable
        />
      </v-card-text>
    </v-card>

    <!-- Mails Table -->
    <v-card rounded="xl" class="mails-card">
      <v-card-text class="pa-6">
        <h3 class="list-title mb-6">Listado de Correos</h3>

        <div v-if="loading" class="loading-container">
          <v-progress-circular
            indeterminate
            color="primary"
            size="50"
          />
        </div>

        <div v-else>
          <v-data-table
            :headers="headers"
            :items="mails"
            :loading="loading"
            item-value="id"
            class="mails-table"
          >
            <template #item.sent_at="{ item }">
              {{ formatDate(item.sent_at) }}
            </template>

            <template #item.preview="{ item }">
              <div class="preview-cell">{{ item.preview }}</div>
            </template>

            <template #item.status="{ item }">
              <v-chip
                :color="getStatusColor(item.status)"
                label
                size="small"
              >
                {{ formatStatus(item.status) }}
              </v-chip>
            </template>

            <template #item.actions="{ item }">
              <v-btn
                icon="mdi-eye-outline"
                size="small"
                variant="text"
                @click="viewMail(item)"
              />
            </template>
          </v-data-table>

          <!-- Pagination -->
          <div v-if="totalPages > 1" class="pagination-container mt-4">
            <v-pagination
              v-model="currentPage"
              :length="totalPages"
              @update:model-value="handlePageChange"
            />
          </div>
        </div>
      </v-card-text>
    </v-card>

    <!-- Mail Detail Dialog -->
    <v-dialog v-model="showMailDetail" max-width="700">
      <v-card v-if="selectedMail" rounded="xl">
        <v-card-text class="pa-6">
          <div class="mail-detail">
            <div class="detail-field">
              <span class="detail-label">De:</span>
              <span class="detail-value">Sistema URSE</span>
            </div>
            <div class="detail-field">
              <span class="detail-label">Para:</span>
              <span class="detail-value">{{ selectedMail.to }}</span>
            </div>
            <div class="detail-field">
              <span class="detail-label">Asunto:</span>
              <span class="detail-value">{{ selectedMail.subject }}</span>
            </div>
            <div class="detail-field">
              <span class="detail-label">Fecha:</span>
              <span class="detail-value">{{ formatDate(selectedMail.sent_at) }}</span>
            </div>
            <v-divider class="my-4" />
            <div class="detail-field">
              <span class="detail-label">Contenido:</span>
              <div class="mail-body">{{ selectedMail.body }}</div>
            </div>

            <!-- Attachments Section -->
            <v-divider class="my-4" />
            <div class="attachments-section">
              <div class="attachments-header">
                <span class="detail-label">Adjuntos</span>
                <v-btn
                  v-if="!attachmentsLoaded"
                  size="small"
                  variant="text"
                  @click="loadAttachments"
                  :loading="attachmentsLoading"
                >
                  Cargar
                </v-btn>
              </div>

              <div v-if="attachmentsLoading" class="attachments-loading">
                <v-progress-circular
                  indeterminate
                  size="30"
                  color="primary"
                />
              </div>

              <div v-else-if="attachments.length > 0">
                <!-- Preview Section -->
                <div v-if="selectedPreview" class="preview-container">
                  <div class="preview-header">
                    <span class="preview-label">Vista previa: {{ selectedPreview.name }}</span>
                    <v-btn
                      icon="mdi-close"
                      size="small"
                      variant="text"
                      @click="selectedPreview = null"
                    />
                  </div>

                  <div v-if="isImagePreview(selectedPreview)" class="image-preview">
                    <img :src="`data:${selectedPreview.content_type};base64,${selectedPreview.content}`" :alt="selectedPreview.name" />
                  </div>

                  <div v-else-if="isPdfPreview(selectedPreview)" class="pdf-preview">
                    <iframe :src="`data:application/pdf;base64,${selectedPreview.content}`" />
                  </div>
                </div>

                <!-- Attachments List -->
                <div class="attachments-list">
                  <div
                    v-for="attachment in attachments"
                    :key="attachment.id"
                    class="attachment-item"
                  >
                    <div class="attachment-info">
                      <v-icon>{{ getFileIcon(attachment.content_type) }}</v-icon>
                      <div class="attachment-details">
                        <div class="attachment-name">{{ attachment.name }}</div>
                        <div class="attachment-size">{{ formatSize(attachment.size_kb) }}</div>
                      </div>
                    </div>
                    <div class="attachment-actions">
                      <v-btn
                        v-if="canPreview(attachment.content_type)"
                        icon="mdi-eye"
                        size="small"
                        variant="text"
                        color="info"
                        @click="showPreview(attachment)"
                      />
                      <v-btn
                        icon="mdi-download"
                        size="small"
                        variant="text"
                        color="primary"
                        @click="downloadAttachment(selectedMail.id, attachment.id)"
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div v-else-if="attachmentsLoaded && attachments.length === 0" class="no-attachments">
                No hay adjuntos en este correo
              </div>
            </div>
          </div>
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn color="primary" @click="showMailDetail = false">
            Cerrar
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </div>
</template>

<script setup lang="ts">
  import { onMounted, ref } from 'vue'
  import { useMail } from '@/modules/admin/hooks/useMail'
  import type { MailItem } from '@/modules/admin/services/mailService'

  const {
    mails,
    attachments,
    loading,
    attachmentsLoading,
    error,
    currentPage,
    totalPages,
    totalMails,
    perPage,
    fetchSentMails,
    fetchAttachments,
    downloadAttachment,
    clearError,
  } = useMail()

  const searchQuery = ref('')
  const selectedMail = ref<MailItem | null>(null)
  const showMailDetail = ref(false)
  const attachmentsLoaded = ref(false)
  const selectedPreview = ref<any>(null)

  const headers = [
    { title: 'Para', key: 'to' },
    { title: 'Asunto', key: 'subject' },
    { title: 'Preview', key: 'preview', width: '350px' },
    { title: 'Estado', key: 'status' },
    { title: 'Fecha', key: 'sent_at' },
    { title: 'Acciones', key: 'actions', sortable: false },
  ]

  function formatDate (date: string) {
    return new Date(date).toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  function getStatusColor (status: string) {
    switch (status) {
      case 'sent':
        return 'success'
      case 'pending':
        return 'warning'
      case 'failed':
        return 'error'
      default:
        return 'default'
    }
  }

  function formatStatus (status: string) {
    switch (status) {
      case 'sent':
        return 'Enviado'
      case 'pending':
        return 'Pendiente'
      case 'failed':
        return 'Fallido'
      default:
        return status
    }
  }

  function viewMail (mail: MailItem) {
    selectedMail.value = mail
    showMailDetail.value = true
    attachmentsLoaded.value = false
  }

  async function loadAttachments () {
    if (!selectedMail.value) return
    try {
      await fetchAttachments(selectedMail.value.id)
      attachmentsLoaded.value = true
    } catch (err) {
      console.error('Error cargando adjuntos:', err)
    }
  }

  function getFileIcon (contentType: string) {
    if (contentType.includes('pdf')) return 'mdi-file-pdf'
    if (contentType.includes('image')) return 'mdi-file-image'
    if (contentType.includes('word')) return 'mdi-file-word'
    if (contentType.includes('excel') || contentType.includes('spreadsheet')) return 'mdi-file-excel'
    return 'mdi-file'
  }

  function formatSize (sizeKb: number) {
    if (sizeKb < 1024) return `${sizeKb.toFixed(1)} KB`
    return `${(sizeKb / 1024).toFixed(2)} MB`
  }

  function canPreview (contentType: string) {
    return contentType.includes('image') || contentType.includes('pdf')
  }

  function isImagePreview (attachment: any) {
    return attachment && attachment.content_type.includes('image')
  }

  function isPdfPreview (attachment: any) {
    return attachment && attachment.content_type.includes('pdf')
  }

  function showPreview (attachment: any) {
    selectedPreview.value = attachment
  }

  async function handlePageChange (page: number) {
    await fetchSentMails({
      page,
      per_page: perPage.value,
      search: searchQuery.value || undefined,
    })
  }

  async function performSearch () {
    await fetchSentMails({
      page: 1,
      per_page: perPage.value,
      search: searchQuery.value || undefined,
    })
  }

  onMounted(async () => {
    await fetchSentMails({ page: 1, per_page: 20 })
  })
</script>

<style scoped>
.mail-page {
  display: grid;
  gap: 24px;
}

.module-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  padding: 24px;
  background: linear-gradient(135deg, rgb(33 150 243 / 0.1) 0%, transparent 100%);
  border-radius: 16px;
}

.header-content h1 {
  margin: 0;
  font-size: 2rem;
  font-weight: 800;
  color: #000000;
}

.header-content p {
  margin: 8px 0 0;
  color: #5e5e5e;
  font-size: 0.95rem;
}

.header-icon {
  width: 64px;
  height: 64px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.search-card {
  background: #ffffff;
  border: 1px solid rgb(0 0 0 / 0.08);
}

.mails-card {
  background: #ffffff;
  border: 1px solid rgb(0 0 0 / 0.08);
}

.list-title {
  margin: 0;
  font-size: 1.2rem;
  font-weight: 700;
  color: #000000;
}

.loading-container {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 300px;
}

.mails-table {
  border-radius: 8px;
}

.preview-cell {
  max-width: 350px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  color: #666;
  font-size: 0.9rem;
}

.pagination-container {
  display: flex;
  justify-content: center;
}

.mail-detail {
  display: grid;
  gap: 16px;
}

.detail-field {
  display: grid;
  gap: 4px;
}

.detail-label {
  font-size: 0.8rem;
  color: #5e5e5e;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  font-weight: 600;
}

.detail-value {
  font-size: 0.95rem;
  color: #000000;
  font-weight: 600;
}

.mail-body {
  padding: 12px;
  background: rgb(0 0 0 / 0.02);
  border-radius: 8px;
  border-left: 3px solid #2196f3;
  white-space: pre-wrap;
  word-break: break-word;
  font-size: 0.9rem;
  line-height: 1.6;
}

.attachments-section {
  display: grid;
  gap: 12px;
}

.attachments-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.attachments-loading {
  display: flex;
  justify-content: center;
  padding: 16px;
}

.attachments-list {
  display: grid;
  gap: 8px;
}

.attachment-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px;
  background: rgb(0 0 0 / 0.02);
  border: 1px solid rgb(0 0 0 / 0.08);
  border-radius: 8px;
}

.attachment-info {
  display: flex;
  align-items: center;
  gap: 12px;
  flex: 1;
  min-width: 0;
}

.attachment-details {
  display: flex;
  flex-direction: column;
  gap: 4px;
  min-width: 0;
}

.attachment-name {
  font-weight: 600;
  color: #000000;
  font-size: 0.9rem;
  word-break: break-word;
}

.attachment-size {
  font-size: 0.75rem;
  color: #999;
}

.no-attachments {
  padding: 16px;
  text-align: center;
  color: #999;
  font-size: 0.9rem;
}

.preview-container {
  display: grid;
  gap: 12px;
  padding: 12px;
  background: rgb(0 0 0 / 0.02);
  border: 1px solid rgb(0 0 0 / 0.08);
  border-radius: 8px;
  margin-bottom: 16px;
}

.preview-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.preview-label {
  font-size: 0.8rem;
  color: #5e5e5e;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  font-weight: 600;
}

.image-preview {
  display: flex;
  justify-content: center;
  align-items: center;
  max-height: 400px;
  overflow: auto;
  border-radius: 4px;
  background: #f5f5f5;
}

.image-preview img {
  max-width: 100%;
  max-height: 400px;
  object-fit: contain;
}

.pdf-preview {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 500px;
  border-radius: 4px;
  background: #f5f5f5;
  overflow: hidden;
}

.pdf-preview iframe {
  width: 100%;
  height: 100%;
  border: none;
}

.attachment-actions {
  display: flex;
  gap: 4px;
}

@media (max-width: 768px) {
  .module-header {
    flex-direction: column;
    gap: 16px;
    padding: 16px;
  }

  .header-content h1 {
    font-size: 1.5rem;
  }

  .header-icon {
    width: 48px;
    height: 48px;
  }

  .preview-cell {
    max-width: 200px;
  }
}

@media (max-width: 480px) {
  .module-header {
    padding: 12px;
    gap: 12px;
  }

  .header-content h1 {
    font-size: 1.25rem;
  }

  .header-icon {
    width: 40px;
    height: 40px;
  }

  .preview-cell {
    max-width: 150px;
    font-size: 0.8rem;
  }

  .list-title {
    font-size: 1rem;
  }
}
</style>
