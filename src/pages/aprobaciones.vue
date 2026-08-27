<template>
  <div class="approvals-page">
    <div class="approvals-toolbar">
      <v-switch
        v-model="includeSigned"
        color="#1a1a1a"
        density="compact"
        hide-details
        label="Incluir firmadas"
        @update:model-value="load"
      />

      <v-btn prepend-icon="mdi-refresh" variant="outlined" @click="load">Actualizar</v-btn>
    </div>

    <v-alert
      v-if="error"
      closable
      rounded="xl"
      type="error"
      variant="tonal"
      @click:close="error = null"
    >{{ error }}</v-alert>

    <v-alert
      v-if="success"
      closable
      rounded="xl"
      type="success"
      variant="tonal"
      @click:close="success = null"
    >{{ success }}</v-alert>

    <div v-if="loading" class="approvals-loading">
      <v-progress-circular indeterminate size="40" />
    </div>

    <p v-else-if="orders.length === 0" class="approvals-empty">No hay órdenes pendientes de aprobación.</p>

    <v-card v-for="order in orders" :key="order.id" class="approval-card" rounded="xl">
      <v-card-text>
        <div class="approval-head">
          <div>
            <h2 class="approval-title">
              {{ order.folio ?? `Orden #${order.id}` }} — {{ order.deal?.title }}
            </h2>

            <p class="approval-subtitle">
              Solicitante: {{ order.deal?.contact?.full_name ?? 'N/A' }}
              · Responsable: {{ order.deal?.assignee?.name ?? 'Sin asignar' }}
              · Solicitada: {{ formatDate(order.approval_requested_at) }}
            </p>
          </div>

          <v-chip :color="order.status === 'signed' ? 'success' : 'info'" variant="tonal">
            {{ order.status_label }}
          </v-chip>
        </div>

        <v-row class="mt-1" dense>
          <v-col cols="12" md="6">
            <p class="field-label">Diagnóstico</p>
            <p class="field-value">{{ order.diagnosis ?? '—' }}</p>
            <p class="field-label">Solución</p>
            <p class="field-value">{{ order.solution ?? '—' }}</p>
          </v-col>

          <v-col cols="12" md="6">
            <p class="field-label">Requerimientos</p>
            <p class="field-value">{{ order.requirements ?? '—' }}</p>
            <p class="field-label">Recomendaciones</p>
            <p class="field-value">{{ order.recommendations ?? '—' }}</p>
            <p class="field-label">Tipo de atención / Problema en</p>
            <p class="field-value">{{ order.deal?.type ?? order.service_type ?? '—' }} · {{ order.problem_area ?? '—' }}</p>
            <p class="field-label">Equipo</p>

            <p class="field-value">
              {{ order.equipment_description ?? '—' }} · Inv: {{ order.inventory_number ?? '—' }}
              · Garantía: {{ order.warranty === null ? '—' : (order.warranty ? 'Sí' : 'No') }}
              · Préstamo: {{ order.loan === null ? '—' : (order.loan ? 'Sí' : 'No') }}
            </p>

            <p class="field-label">Ubicación / Responsable de equipo</p>
            <p class="field-value">{{ order.location ?? '—' }} · {{ order.team_manager ?? '—' }}</p>
          </v-col>
        </v-row>

        <div class="approval-actions">
          <v-btn
            prepend-icon="mdi-file-pdf-box"
            size="small"
            variant="text"
            @click="downloadDraft(order)"
          >Ver PDF</v-btn>

          <v-btn
            v-if="order.deal_id"
            prepend-icon="mdi-open-in-new"
            size="small"
            :to="`/ssm/crm/negociaciones/${order.deal_id}`"
            variant="text"
          >Negociación</v-btn>

          <v-spacer />

          <template v-if="order.status === 'approval_requested'">
            <v-btn
              color="warning"
              :loading="actingId === order.id"
              prepend-icon="mdi-comment-alert-outline"
              size="small"
              variant="tonal"
              @click="openModifications(order)"
            >Solicitar modificaciones</v-btn>

            <v-btn
              color="#1a1a1a"
              :loading="actingId === order.id"
              prepend-icon="mdi-draw-pen"
              size="small"
              variant="flat"
              @click="sign(order)"
            >Firmar orden</v-btn>
          </template>

          <v-btn
            v-else-if="order.signed_pdf_available"
            color="success"
            prepend-icon="mdi-file-check-outline"
            size="small"
            variant="tonal"
            @click="downloadSigned(order)"
          >Descargar firmada</v-btn>
        </div>
      </v-card-text>
    </v-card>

    <v-dialog v-model="showModifications" max-width="480">
      <v-card rounded="xl">
        <v-card-title class="pt-5 px-6">Solicitar modificaciones</v-card-title>

        <v-card-text class="px-6">
          <v-textarea v-model="modificationNotes" auto-grow label="Describe los cambios necesarios *" rows="3" />
        </v-card-text>

        <v-card-actions class="px-6 pb-5">
          <v-spacer />
          <v-btn variant="text" @click="showModifications = false">Cancelar</v-btn>
          <v-btn color="warning" :disabled="!modificationNotes" variant="flat" @click="submitModifications">Enviar</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </div>
</template>

<script lang="ts" setup>
  import type { ServiceOrder } from '@/modules/crm/types'
  import { onMounted, ref } from 'vue'
  import * as crm from '@/modules/crm/service'

  const orders = ref<ServiceOrder[]>([])
  const loading = ref(false)
  const includeSigned = ref(false)
  const error = ref<string | null>(null)
  const success = ref<string | null>(null)
  const actingId = ref<number | null>(null)
  const showModifications = ref(false)
  const modificationNotes = ref('')
  const modificationTarget = ref<ServiceOrder | null>(null)

  async function load () {
    loading.value = true
    error.value = null

    try {
      orders.value = await crm.listOrderApprovals(includeSigned.value)
    } catch (error_: any) {
      error.value = error_?.response?.data?.message ?? 'No fue posible cargar la cola de aprobaciones'
    } finally {
      loading.value = false
    }
  }

  async function sign (order: ServiceOrder) {
    actingId.value = order.id
    error.value = null
    success.value = null

    try {
      const response = await crm.signOrder(order.id)
      success.value = response.message
      await load()
    } catch (error_: any) {
      error.value = error_?.response?.data?.message ?? 'No fue posible firmar la orden'
    } finally {
      actingId.value = null
    }
  }

  function openModifications (order: ServiceOrder) {
    modificationTarget.value = order
    modificationNotes.value = ''
    showModifications.value = true
  }

  async function submitModifications () {
    if (!modificationTarget.value) {
      return
    }

    actingId.value = modificationTarget.value.id
    showModifications.value = false
    error.value = null

    try {
      const response = await crm.requestOrderModifications(modificationTarget.value.id, modificationNotes.value)
      success.value = response.message
      await load()
    } catch (error_: any) {
      error.value = error_?.response?.data?.message ?? 'No fue posible solicitar las modificaciones'
    } finally {
      actingId.value = null
    }
  }

  function triggerBlobDownload (blob: Blob, filename: string) {
    const url = URL.createObjectURL(blob)
    const anchor = document.createElement('a')
    anchor.href = url
    anchor.download = filename
    anchor.click()
    URL.revokeObjectURL(url)
  }

  async function downloadDraft (order: ServiceOrder) {
    try {
      const blob = await crm.downloadOrderPdf(order.id)
      triggerBlobDownload(blob, `orden-servicio-${order.folio ?? order.id}.pdf`)
    } catch (error_: any) {
      error.value = error_?.response?.data?.message ?? 'No fue posible descargar el PDF'
    }
  }

  async function downloadSigned (order: ServiceOrder) {
    try {
      const blob = await crm.downloadSignedOrderPdf(order.id)
      triggerBlobDownload(blob, `orden-servicio-${order.folio ?? order.id}-firmada.pdf`)
    } catch (error_: any) {
      error.value = error_?.response?.data?.message ?? 'No fue posible descargar la orden firmada'
    }
  }

  function formatDate (value: string | null) {
    return value ? new Date(value).toLocaleDateString('es-MX', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' }) : '—'
  }

  onMounted(load)
</script>

<style scoped>
.approvals-page {
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.approvals-toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.approvals-loading {
  display: flex;
  justify-content: center;
  padding: 60px 0;
}

.approvals-empty {
  color: rgba(0, 0, 0, 0.5);
  text-align: center;
  padding: 40px 0;
}

.approval-head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
}

.approval-title {
  font-size: 15px;
  margin: 0;
}

.approval-subtitle {
  font-size: 12px;
  color: rgba(0, 0, 0, 0.55);
  margin: 4px 0 0;
}

.field-label {
  font-size: 11px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  color: rgba(0, 0, 0, 0.5);
  margin: 8px 0 2px;
}

.field-value {
  font-size: 13px;
  margin: 0;
  white-space: pre-wrap;
}

.approval-actions {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-top: 14px;
  flex-wrap: wrap;
}
</style>
