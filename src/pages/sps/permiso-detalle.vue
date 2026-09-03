<template>
  <div class="permit-detail-page">
    <v-card class="detail-card" rounded="xl" variant="flat">
      <div class="card-head">
        <div>
          <div class="section-kicker">Permisos F011A</div>
          <h2 class="card-title">Detalle del permiso #{{ permitId }}</h2>
        </div>

        <v-btn prepend-icon="mdi-arrow-left" variant="text" @click="router.push('/sps/permisos')">
          Volver al listado
        </v-btn>
      </div>

      <v-alert
        v-if="errorMessage"
        class="mt-4"
        closable
        color="error"
        variant="tonal"
        @click:close="errorMessage = null"
      >
        {{ errorMessage }}
      </v-alert>

      <div v-if="loading" class="state-box">
        <v-progress-circular color="#c89215" indeterminate />
        <span>Cargando permiso...</span>
      </div>

      <template v-else-if="permit">
        <div class="detail-meta mt-4">
          <v-chip :color="statusColor(permit.latestStatus)" size="small" variant="tonal">
            {{ statusLabel(permit.latestStatus) }}
          </v-chip>

          <span class="text-body-2 text-medium-emphasis ml-2">
            {{ permit.employee?.name ?? 'Sin empleado' }} ·
            #{{ permit.employee?.employeeNumber || 'N/A' }}
          </span>
        </div>

        <v-row class="mt-4" dense>
          <v-col cols="12" md="3">
            <span class="label">Tipo</span>
            <div>{{ kindLabel(permit.kind) }}</div>
          </v-col>

          <v-col cols="12" md="3">
            <span class="label">Turno</span>
            <div>{{ shiftLabel(permit.shift) }}</div>
          </v-col>

          <v-col cols="12" md="3">
            <span class="label">Fecha de solicitud</span>
            <div>{{ formatDate(permit.requestDate) }}</div>
          </v-col>

          <v-col cols="12" md="3">
            <span class="label">Días</span>
            <div>{{ permit.dayCount || '—' }}</div>
          </v-col>

          <v-col cols="12" md="6">
            <span class="label">Primer día</span>
            <div>{{ formatDate(permit.startsOn) }}</div>
          </v-col>

          <v-col cols="12" md="6">
            <span class="label">Último día</span>
            <div>{{ formatDate(permit.endsOn) }}</div>
          </v-col>
        </v-row>

        <v-divider class="my-4" />

        <div class="text-subtitle-2 font-weight-bold mb-3">Histórico</div>

        <div v-if="timeline.length === 0" class="text-medium-emphasis">
          Sin histórico disponible.
        </div>

        <v-timeline v-else density="compact" side="end">
          <v-timeline-item
            v-for="(entry, index) in timeline"
            :key="index"
            :dot-color="entry.color"
            :icon="entry.icon"
            size="small"
          >
            <div class="timeline-status">{{ entry.title }}</div>
            <div v-if="entry.at" class="timeline-date">{{ formatDateTime(entry.at) }}</div>
            <div v-if="entry.detail" class="timeline-notes">{{ entry.detail }}</div>
          </v-timeline-item>
        </v-timeline>

        <v-divider class="my-4" />

        <SignaturePanel
          :document-id="permitId"
          :is-owner="isOwner"
          resource="leave-permits"
          @loaded="signatures = $event"
          @signed="loadPermit"
        />

        <v-divider class="my-4" />

        <div class="actions-row">
          <v-btn
            :loading="pdfLoading"
            prepend-icon="mdi-file-pdf-box"
            variant="text"
            @click="handleDownloadPdf"
          >
            Descargar formato F011A
          </v-btn>
        </div>

        <p class="detail-note">
          El sistema no valida días festivos ni períodos vacacionales: esa parte de la NOTA del
          formato queda como texto impreso.
        </p>
      </template>
    </v-card>
  </div>
</template>

<script lang="ts" setup>
  import type { LeavePermit } from '@/modules/leave-permits/port'
  import type { DocumentSignature } from '@/modules/signatures/port'
  import { computed, onMounted, ref } from 'vue'
  import { useRoute, useRouter } from 'vue-router'
  import { employeesAdapter } from '@/modules/employees/adapter'
  import { leavePermitsAdapter } from '@/modules/leave-permits/adapter'
  import SignaturePanel from '@/modules/sps/components/SignaturePanel.vue'
  import { useAuthStore } from '@/stores/auth'
  import { isSameId } from '@/utils/identity'

  const route = useRoute()
  const router = useRouter()
  const authStore = useAuthStore()

  const permitId = String(route.params.id)

  const loading = ref(false)
  const pdfLoading = ref(false)
  const errorMessage = ref<string | null>(null)
  const permit = ref<LeavePermit | null>(null)
  const signatures = ref<DocumentSignature[]>([])
  const myEmployeeId = ref<number | string | null>(null)

  const isOwner = computed(() =>
    isSameId(permit.value?.employeeId, myEmployeeId.value),
  )

  const ROLE_LABELS: Record<string, string> = {
    administrative_director: 'Dirección de Asuntos Administrativos',
    employee: 'Empleado',
    immediate_supervisor: 'Jefe inmediato',
  }

  interface TimelineEntry {
    at: string
    color: string
    detail: string
    icon: string
    title: string
  }

  function statusLabel (status: string) {
    if (status === 'authorized') return 'Autorizado'
    if (status === 'refused') return 'Rechazado'
    if (status === 'pending') return 'Pendiente'
    return status.replaceAll('_', ' ')
  }

  function statusColor (status: string) {
    if (status === 'authorized') return 'success'
    if (status === 'refused') return 'error'
    return 'warning'
  }

  // Statuses alone say little about a permit, since it only ever moves on its
  // own; the signatures are what actually happened to it.
  const timeline = computed<TimelineEntry[]>(() => {
    const statusEntries: TimelineEntry[] = (permit.value?.statuses ?? []).map(entry => ({
      at: entry.createdAt,
      color: statusColor(entry.status),
      detail: entry.notes,
      icon: '',
      title: statusLabel(entry.status),
    }))

    const signatureEntries: TimelineEntry[] = signatures.value.map(signature => ({
      at: signature.signedAt,
      color: 'success',
      detail: `Firmado por ${signature.signerName}`,
      icon: 'mdi-draw-pen',
      title: `Firma · ${signature.roleLabel || ROLE_LABELS[signature.role] || signature.role}`,
    }))

    // Sorting in place is safe: the array was just built by the spread, and
    // sort is stable, so entries sharing a timestamp keep their order.
    // eslint-disable-next-line unicorn/no-array-sort
    return [...statusEntries, ...signatureEntries].sort((a, b) => {
      const timeA = Date.parse(a.at)
      const timeB = Date.parse(b.at)

      if (Number.isNaN(timeA) && Number.isNaN(timeB)) return 0
      if (Number.isNaN(timeA)) return -1
      if (Number.isNaN(timeB)) return 1

      return timeA - timeB
    })
  })

  function kindLabel (kind: string) {
    return kind === 'non_economic' ? 'No económico' : 'Económico'
  }

  function shiftLabel (shift: string) {
    if (shift === 'morning') return 'Matutino'
    if (shift === 'afternoon') return 'Vespertino'
    return 'Completo'
  }

  // Plain dates are built from their parts: `new Date('2026-09-07')` is UTC
  // midnight and renders as the previous day in any negative offset.
  function formatDate (value: string) {
    if (!value) return '—'

    const parts = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value)
    const date = parts
      ? new Date(Number(parts[1]), Number(parts[2]) - 1, Number(parts[3]))
      : new Date(value)

    return Number.isNaN(date.getTime())
      ? value
      : date.toLocaleDateString('es-MX', { day: '2-digit', month: 'long', year: 'numeric' })
  }

  function formatDateTime (value: string) {
    if (!value) return '—'
    const date = new Date(value)
    return Number.isNaN(date.getTime()) ? value : date.toLocaleString('es-MX')
  }

  function resolveMessage (error: unknown, fallback: string) {
    const apiError = error as { message?: string, response?: { data?: { message?: string } } }
    return apiError?.response?.data?.message ?? apiError?.message ?? fallback
  }

  async function loadPermit () {
    loading.value = true
    errorMessage.value = null

    try {
      permit.value = await leavePermitsAdapter.getById(permitId)
    } catch (error) {
      errorMessage.value = resolveMessage(error, 'No fue posible cargar el permiso.')
    } finally {
      loading.value = false
    }
  }

  // Administrators and supervisors have no employee record to match, so a
  // failed lookup simply means "not the owner".
  async function loadMyEmployee () {
    const userId = authStore.user?.id
    if (!userId) return

    try {
      const employee = await employeesAdapter.getByUserId(userId)
      myEmployeeId.value = employee?.id ?? null
    } catch {
      myEmployeeId.value = null
    }
  }

  async function handleDownloadPdf () {
    pdfLoading.value = true
    errorMessage.value = null

    try {
      // Built as a blob on purpose: the token travels in the header, which a
      // plain <a href> download would not carry.
      const blob = await leavePermitsAdapter.downloadPdf(permitId)
      const url = URL.createObjectURL(blob)
      window.open(url, '_blank', 'noopener,noreferrer')
      setTimeout(() => URL.revokeObjectURL(url), 60_000)
    } catch (error) {
      errorMessage.value = resolveMessage(error, 'No fue posible generar el formato en PDF.')
    } finally {
      pdfLoading.value = false
    }
  }

  onMounted(() => {
    void loadPermit()
    void loadMyEmployee()
  })
</script>

<style scoped>
.permit-detail-page {
  display: grid;
}

.detail-card {
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
  font-size: 1.4rem;
  font-weight: 800;
}

.state-box {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
  min-height: 160px;
  margin-top: 16px;
  color: #5e5e5e;
}

.detail-meta {
  display: flex;
  align-items: center;
}

.label {
  display: block;
  color: #5e5e5e;
  font-size: 0.72rem;
  font-weight: 700;
  letter-spacing: 0.06em;
  text-transform: uppercase;
}

.timeline-status {
  color: #000000;
  font-weight: 700;
}

.timeline-date,
.timeline-notes {
  color: #5e5e5e;
  font-size: 0.82rem;
}

.actions-row {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.detail-note {
  margin: 16px 0 0;
  color: #5e5e5e;
  font-size: 0.8rem;
}

@media (max-width: 900px) {
  .card-head {
    flex-direction: column;
  }
}
</style>
