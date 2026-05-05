<template>
  <div class="approvals-layout">
    <!-- Approval queue card -->
    <v-card class="approvals-card" rounded="xl" variant="flat">
      <div class="card-head">
        <div>
          <div class="section-kicker">Encargado</div>
          <h2 class="card-title">Cola de aprobaciones</h2>
        </div>
        <div class="card-head-actions">
          <v-switch
            v-model="includeSigned"
            color="#FAB21A"
            density="compact"
            hide-details
            label="Mostrar firmados"
            @update:model-value="loadApprovals"
          />
          <v-btn
            color="#FAB21A"
            prepend-icon="mdi-refresh"
            variant="tonal"
            :loading="loading"
            @click="loadApprovals"
          >
            Actualizar
          </v-btn>
        </div>
      </div>

      <v-alert
        v-if="error"
        class="mt-6"
        closable
        color="error"
        density="comfortable"
        variant="tonal"
        @click:close="error = null"
      >
        {{ error }}
      </v-alert>

      <div v-if="loading && approvals.length === 0" class="approvals-state">
        <v-progress-circular color="#FAB21A" indeterminate />
        <span>Cargando aprobaciones...</span>
      </div>

      <div v-else-if="!loading && approvals.length === 0" class="approvals-state approvals-state--empty">
        <v-icon color="#FAB21A" icon="mdi-check-circle-outline" size="32" />
        <span>{{ includeSigned ? 'No hay órdenes registradas.' : 'No hay órdenes pendientes de aprobación.' }}</span>
      </div>

      <v-table v-else class="mt-6" density="comfortable">
        <thead>
          <tr>
            <th class="text-left">Folio</th>
            <th class="text-left">Título</th>
            <th class="text-left">Técnico asignado</th>
            <th class="text-left">Solicitante</th>
            <th class="text-left">Área</th>
            <th class="text-left">Solicitud</th>
            <th class="text-center">Acciones</th>
          </tr>
        </thead>
        <tbody>
          <tr
            v-for="deal in approvals"
            :key="deal.id"
            class="clickable-row"
            @click="openDetailDialog(deal)"
          >
            <td class="approval-folio">#{{ deal.folio ?? deal.id }}</td>
            <td class="approval-title">
              {{ deal.title }}
              <v-chip
                v-if="deal.modification_requests?.length"
                class="ml-2"
                color="warning"
                density="comfortable"
                :prepend-icon="'mdi-history'"
                size="x-small"
                variant="tonal"
              >
                {{ deal.modification_requests.length }} rechazo{{ deal.modification_requests.length > 1 ? 's' : '' }}
              </v-chip>
            </td>
            <td>
              <div class="user-chip">
                <v-avatar color="#f1ddd0" size="26">
                  {{ initials(deal.assigned_user_name) }}
                </v-avatar>
                <span>{{ deal.assigned_user_name }}</span>
              </div>
            </td>
            <td>{{ deal.contact_name ?? '—' }}</td>
            <td>{{ deal.area_atencion ?? '—' }}</td>
            <td class="text-date">{{ formatDate(deal.approval_requested_at) }}</td>
            <td class="text-center" @click.stop>
              <div v-if="deal.status === 'signed'" class="signed-info">
                <v-icon color="success" icon="mdi-check-circle-outline" size="18" />
                <span class="signed-by">{{ deal.signed_by_name ?? 'Encargado' }}</span>
                <span class="signed-at">{{ formatDate(deal.signed_at) }}</span>
              </div>
              <v-btn
                v-else
                color="#FAB21A"
                density="comfortable"
                prepend-icon="mdi-draw-pen"
                size="small"
                variant="flat"
                @click="openSignDialog(deal)"
              >
                Firmar
              </v-btn>
            </td>
          </tr>
        </tbody>
      </v-table>
    </v-card>

    <!-- SSH Key management card -->
    <v-card class="ssh-card" rounded="xl" variant="flat">
      <div class="card-head">
        <div>
          <div class="section-kicker">Seguridad</div>
          <h2 class="card-title">Mi clave SSH</h2>
        </div>
      </div>

      <v-alert
        v-if="keySuccess"
        class="mt-4"
        closable
        color="success"
        density="comfortable"
        variant="tonal"
        @click:close="keySuccess = null"
      >
        {{ keySuccess }}
      </v-alert>

      <v-alert
        v-if="keyError"
        class="mt-4"
        closable
        color="error"
        density="comfortable"
        variant="tonal"
        @click:close="keyError = null"
      >
        {{ keyError }}
      </v-alert>

      <div v-if="keyLoading && keyInfo === null && !changingKey" class="ssh-loading mt-6">
        <v-progress-circular color="#FAB21A" indeterminate size="22" />
        <span>Verificando clave registrada...</span>
      </div>

      <template v-else-if="keyInfo !== null && !changingKey">
        <div class="ssh-registered mt-6">
          <v-icon color="#FAB21A" icon="mdi-shield-key" size="40" />
          <div class="ssh-registered-text">
            <span class="ssh-registered-label">Clave SSH activa</span>
            <code v-if="keyInfo.fingerprint" class="fingerprint-value">{{ keyInfo.fingerprint }}</code>
            <span v-else class="ssh-hint">Sin huella registrada</span>
          </div>
        </div>
        <div class="ssh-actions mt-5">
          <v-btn
            color="#FAB21A"
            prepend-icon="mdi-swap-horizontal"
            variant="tonal"
            @click="changingKey = true"
          >
            Cambiar clave
          </v-btn>
          <v-btn
            color="error"
            :loading="keyLoading"
            prepend-icon="mdi-delete-outline"
            variant="tonal"
            @click="handleDeleteKey"
          >
            Eliminar clave
          </v-btn>
        </div>
      </template>

      <template v-else>
        <p class="ssh-hint mt-4">
          Sube tu clave privada RSA (sin passphrase) para poder firmar digitalmente las órdenes de servicio.
          La clave se almacena cifrada en el servidor.
        </p>

        <v-textarea
          v-model="privateKeyInput"
          class="mt-4"
          density="comfortable"
          label="Clave privada RSA"
          placeholder="-----BEGIN OPENSSH PRIVATE KEY-----"
          rows="5"
          variant="outlined"
        />

        <div class="ssh-actions mt-2">
          <v-btn
            color="#FAB21A"
            :disabled="!privateKeyInput.trim()"
            :loading="keyLoading"
            prepend-icon="mdi-key-variant"
            variant="flat"
            @click="handleUploadKey"
          >
            Guardar clave
          </v-btn>
          <v-btn
            v-if="changingKey"
            :disabled="keyLoading"
            prepend-icon="mdi-arrow-left"
            variant="text"
            @click="changingKey = false"
          >
            Cancelar
          </v-btn>
        </div>
      </template>
    </v-card>

    <!-- Detail + modifications dialog -->
    <v-dialog v-model="detailDialog" max-width="620" scrollable>
      <v-card rounded="xl">
        <v-card-title class="pt-6 px-6 d-flex align-center gap-2">
          <span>{{ detailDeal?.title }}</span>
          <v-chip color="#FAB21A" density="comfortable" size="small" variant="tonal">
            #{{ detailDeal?.folio ?? detailDeal?.id }}
          </v-chip>
        </v-card-title>
        <v-card-subtitle class="px-6 pb-0">
          {{ detailDeal?.assigned_user_name }} · {{ detailDeal?.area_atencion ?? '—' }}
        </v-card-subtitle>

        <v-card-text class="px-6 pt-4">
          <!-- Report fields -->
          <div class="detail-fields">
            <div v-if="detailDeal?.reporte_usuario" class="detail-field">
              <span class="detail-label">Reporte del usuario</span>
              <p class="detail-value">{{ detailDeal.reporte_usuario }}</p>
            </div>
            <div v-if="detailDeal?.diagnostico" class="detail-field">
              <span class="detail-label">Diagnóstico</span>
              <p class="detail-value">{{ detailDeal.diagnostico }}</p>
            </div>
            <div v-if="detailDeal?.solucion" class="detail-field">
              <span class="detail-label">Solución</span>
              <p class="detail-value">{{ detailDeal.solucion }}</p>
            </div>
            <div v-if="detailDeal?.requerimientos" class="detail-field">
              <span class="detail-label">Requerimientos</span>
              <p class="detail-value">{{ detailDeal.requerimientos }}</p>
            </div>
            <div v-if="detailDeal?.recomendaciones" class="detail-field">
              <span class="detail-label">Recomendaciones</span>
              <p class="detail-value">{{ detailDeal.recomendaciones }}</p>
            </div>
            <p
              v-if="!detailDeal?.reporte_usuario && !detailDeal?.diagnostico && !detailDeal?.solucion && !detailDeal?.requerimientos && !detailDeal?.recomendaciones"
              class="text-medium-emphasis text-body-2"
            >
              Sin información de reporte registrada.
            </p>
          </div>

          <!-- Modifications form — only for non-signed deals -->
          <template v-if="detailDeal?.status !== 'signed'">
            <v-divider class="my-5" />

            <!-- Previous rejections history -->
            <template v-if="detailDeal?.modification_requests?.length">
              <p class="mb-2 text-body-2 font-weight-bold">Rechazos anteriores:</p>
              <div class="prev-modifications mb-4">
                <div
                  v-for="mod in detailDeal!.modification_requests"
                  :key="mod.id"
                  class="prev-modification-entry"
                >
                  <span class="prev-mod-meta">{{ mod.requested_by_name ?? 'Encargado' }} · {{ formatDate(mod.created_at) }}</span>
                  <p class="prev-mod-notes">{{ mod.notes }}</p>
                </div>
              </div>
            </template>

            <v-textarea
              v-model="modificationNotes"
              auto-grow
              density="comfortable"
              label="Notas para el técnico (opcional para firmar, requerido para pedir cambios)"
              maxlength="2000"
              rows="3"
              variant="outlined"
            />
            <v-alert
              v-if="modificationError"
              class="mt-2"
              color="error"
              density="comfortable"
              variant="tonal"
            >
              {{ modificationError }}
            </v-alert>
          </template>

          <!-- Signed info -->
          <template v-else>
            <v-divider class="my-5" />
            <div class="signed-detail">
              <v-icon color="success" icon="mdi-check-circle-outline" size="20" />
              <span>Firmado por <strong>{{ detailDeal.signed_by_name ?? 'Encargado' }}</strong> el {{ formatDate(detailDeal.signed_at) }}</span>
            </div>
          </template>
        </v-card-text>

        <v-card-actions class="px-6 pb-6 gap-2">
          <v-spacer />
          <v-btn
            :disabled="signing || requestingModifications"
            variant="text"
            @click="closeDetailDialog"
          >
            Cerrar
          </v-btn>
          <template v-if="detailDeal?.status !== 'signed'">
            <v-btn
              color="warning"
              :disabled="!modificationNotes.trim()"
              :loading="requestingModifications"
              prepend-icon="mdi-message-alert-outline"
              variant="tonal"
              @click="handleRequestModifications"
            >
              Pedir cambios
            </v-btn>
            <v-btn
              color="#FAB21A"
              :loading="signing"
              prepend-icon="mdi-draw-pen"
              variant="flat"
              @click="handleSignFromDetail"
            >
              Firmar
            </v-btn>
          </template>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Sign confirmation dialog -->
    <v-dialog v-model="signDialog" max-width="440" persistent>
      <v-card rounded="xl">
        <v-card-title class="pt-6 px-6">Firmar orden de servicio</v-card-title>
        <v-card-text class="px-6">
          <p class="mb-4 text-body-2 text-medium-emphasis">
            Vas a firmar digitalmente la orden <strong>{{ selectedDeal?.title }}</strong>
            (Folio: {{ selectedDeal?.folio ?? selectedDeal?.id }}).
            Esta acción es irreversible.
          </p>
          <v-alert
            v-if="signError"
            color="error"
            density="comfortable"
            variant="tonal"
          >
            {{ signError }}
          </v-alert>
        </v-card-text>
        <v-card-actions class="px-6 pb-6 gap-2">
          <v-spacer />
          <v-btn :disabled="signing" variant="text" @click="closeSignDialog">Cancelar</v-btn>
          <v-btn
            color="#FAB21A"
            :loading="signing"
            prepend-icon="mdi-draw-pen"
            variant="flat"
            @click="handleSign"
          >
            Firmar
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </div>
</template>

<script lang="ts" setup>
  import type { LocalDeal } from '@/modules/tickets/port'
  import { ref } from 'vue'
  import { useApprovals } from '@/modules/approvals/useApprovals'
  import { useSshKey } from '@/modules/encargado/useSshKey'

  const {
    approvals,
    error,
    includeSigned,
    loadApprovals,
    loading,
    modificationError,
    requestModifications,
    requestingModifications,
    sign,
    signError,
    signing,
  } = useApprovals()
  const { changingKey, error: keyError, keyInfo, loading: keyLoading, removeKey, success: keySuccess, uploadKey } = useSshKey()

  // SSH key form
  const privateKeyInput = ref('')

  async function handleUploadKey () {
    const ok = await uploadKey(privateKeyInput.value.trim())
    if (ok) {
      privateKeyInput.value = ''
    }
  }

  async function handleDeleteKey () {
    await removeKey()
  }

  // Detail + modifications dialog
  const detailDialog = ref(false)
  const detailDeal = ref<LocalDeal | null>(null)
  const modificationNotes = ref('')

  function openDetailDialog (deal: LocalDeal) {
    detailDeal.value = deal
    modificationNotes.value = ''
    detailDialog.value = true
  }

  function closeDetailDialog () {
    detailDialog.value = false
    detailDeal.value = null
    modificationNotes.value = ''
  }

  async function handleRequestModifications () {
    if (!detailDeal.value) return
    const ok = await requestModifications(detailDeal.value.id, modificationNotes.value)
    if (ok) {
      closeDetailDialog()
    }
  }

  async function handleSignFromDetail () {
    if (!detailDeal.value) return
    const ok = await sign(detailDeal.value.id)
    if (ok) {
      closeDetailDialog()
    }
  }

  // Quick sign from table row button
  const signDialog = ref(false)
  const selectedDeal = ref<LocalDeal | null>(null)

  function openSignDialog (deal: LocalDeal) {
    selectedDeal.value = deal
    signDialog.value = true
  }

  function closeSignDialog () {
    signDialog.value = false
    selectedDeal.value = null
  }

  async function handleSign () {
    if (!selectedDeal.value) return
    const ok = await sign(selectedDeal.value.id)
    if (ok) {
      closeSignDialog()
    }
  }

  // Helpers
  function formatDate (value: string | null): string {
    if (!value) return '—'
    return new Date(value).toLocaleString('es-MX', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  function initials (name: string): string {
    return name
      .split(' ')
      .filter(Boolean)
      .slice(0, 2)
      .map(part => part[0]?.toUpperCase() ?? '')
      .join('')
  }
</script>

<style scoped>
.approvals-layout {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.approvals-card,
.ssh-card {
  padding: 24px;
  background: #ffffff;
}

.card-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
}

.card-head-actions {
  display: flex;
  align-items: center;
  gap: 16px;
  flex-wrap: wrap;
}

.section-kicker {
  color: #fab21a;
  font-size: 0.8rem;
  font-weight: 800;
  letter-spacing: 0.14em;
  text-transform: uppercase;
}

.card-title {
  margin: 10px 0 0;
  color: #000000;
  font-size: 1.5rem;
  font-weight: 800;
}

.approvals-state {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
  min-height: 180px;
  margin-top: 24px;
  color: #6f5a60;
  text-align: center;
}

.approvals-state--empty {
  flex-direction: column;
}

.clickable-row {
  cursor: pointer;
  transition: background-color 0.15s;
}

.clickable-row:hover {
  background-color: #fafafa;
}

.approval-folio {
  color: #fab21a;
  font-weight: 700;
  white-space: nowrap;
}

.approval-title {
  font-weight: 600;
  max-width: 220px;
}

.text-date {
  white-space: nowrap;
  color: #5e5e5e;
  font-size: 0.85rem;
}

.user-chip {
  display: flex;
  align-items: center;
  gap: 8px;
}

.ssh-hint {
  font-size: 0.875rem;
  color: #5e5e5e;
  line-height: 1.5;
}

.ssh-loading {
  display: flex;
  align-items: center;
  gap: 10px;
  color: #5e5e5e;
  font-size: 0.875rem;
}

.ssh-registered {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 16px 20px;
  background: #f8f8f8;
  border-radius: 14px;
}

.ssh-registered-text {
  display: flex;
  flex-direction: column;
  gap: 4px;
  min-width: 0;
}

.ssh-registered-label {
  font-weight: 700;
  font-size: 0.95rem;
  color: #000;
}

.ssh-actions {
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
}

.fingerprint-value {
  font-family: monospace;
  font-size: 0.78rem;
  color: #444;
  word-break: break-all;
}

.gap-2 {
  gap: 8px;
}

.signed-info {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  color: #2e7d32;
}

.signed-by {
  font-size: 0.85rem;
  font-weight: 600;
}

.signed-at {
  font-size: 0.78rem;
  color: #5e5e5e;
  white-space: nowrap;
}

.detail-fields {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.detail-field {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.detail-label {
  font-size: 0.75rem;
  font-weight: 700;
  color: #fab21a;
  text-transform: uppercase;
  letter-spacing: 0.08em;
}

.detail-value {
  margin: 0;
  font-size: 0.9rem;
  color: #222;
  line-height: 1.6;
  white-space: pre-wrap;
}

.prev-modifications {
  display: flex;
  flex-direction: column;
  gap: 10px;
  padding: 12px;
  background: #f8f8f8;
  border-radius: 10px;
}

.prev-modification-entry {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.prev-mod-meta {
  font-size: 0.78rem;
  color: #888;
}

.prev-mod-notes {
  margin: 0;
  font-size: 0.875rem;
  color: #333;
  white-space: pre-wrap;
}

.signed-detail {
  display: flex;
  align-items: center;
  gap: 8px;
  color: #2e7d32;
  font-size: 0.9rem;
}

@media (max-width: 960px) {
  .card-head {
    flex-direction: column;
    align-items: flex-start;
  }
}
</style>
