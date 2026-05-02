<template>
  <div class="approvals-layout">
    <!-- Approval queue card -->
    <v-card class="approvals-card" rounded="xl" variant="flat">
      <div class="card-head">
        <div>
          <div class="section-kicker">Encargado</div>
          <h2 class="card-title">Cola de aprobaciones</h2>
        </div>
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
        <span>No hay órdenes pendientes de aprobación.</span>
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
            <th class="text-center">Firmar</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="deal in approvals" :key="deal.id">
            <td class="approval-folio">#{{ deal.folio ?? deal.id }}</td>
            <td class="approval-title">{{ deal.title }}</td>
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
            <td class="text-center">
              <v-btn
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

      <!-- Loading state -->
      <div v-if="keyLoading && keyInfo === null && !changingKey" class="ssh-loading mt-6">
        <v-progress-circular color="#FAB21A" indeterminate size="22" />
        <span>Verificando clave registrada...</span>
      </div>

      <!-- Key already registered — show info -->
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

      <!-- Upload form — no key yet, or user wants to change -->
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

    <!-- Sign dialog -->
    <v-dialog v-model="signDialog" max-width="440" persistent>
      <v-card rounded="xl">
        <v-card-title class="pt-6 px-6">Firmar orden de servicio</v-card-title>
        <v-card-text class="px-6">
          <p class="mb-4 text-body-2 text-medium-emphasis">
            Vas a firmar digitalmente la orden <strong>{{ selectedDeal?.title }}</strong>
            (Folio: {{ selectedDeal?.folio ?? selectedDeal?.id }}).
            Esta acción es irreversible.
          </p>
          <v-text-field
            v-model="signPassword"
            density="comfortable"
            label="Tu contraseña"
            :type="showPassword ? 'text' : 'password'"
            variant="outlined"
            :append-inner-icon="showPassword ? 'mdi-eye-off' : 'mdi-eye'"
            @click:append-inner="showPassword = !showPassword"
          />
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
            :disabled="!signPassword"
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

  const { approvals, error, loadApprovals, loading, sign, signError, signing } = useApprovals()
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

  // Sign dialog
  const signDialog = ref(false)
  const selectedDeal = ref<LocalDeal | null>(null)
  const signPassword = ref('')
  const showPassword = ref(false)

  function openSignDialog (deal: LocalDeal) {
    selectedDeal.value = deal
    signPassword.value = ''
    showPassword.value = false
    signDialog.value = true
  }

  function closeSignDialog () {
    signDialog.value = false
    selectedDeal.value = null
    signPassword.value = ''
  }

  async function handleSign () {
    if (!selectedDeal.value) return
    const ok = await sign(selectedDeal.value.id, signPassword.value)
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

@media (max-width: 960px) {
  .card-head {
    flex-direction: column;
    align-items: flex-start;
  }
}
</style>
