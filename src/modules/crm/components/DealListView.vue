<template>
  <v-card rounded="xl">
    <v-data-table
      density="comfortable"
      :headers="headers"
      hover
      :items="deals"
      items-per-page="25"
      no-data-text="No hay negociaciones con los filtros actuales"
      @click:row="onRowClick"
    >
      <template #item.id="{ item }">#{{ item.id }}</template>

      <template #item.stage="{ item }">
        <v-chip :color="item.stage?.color ?? undefined" size="small" variant="tonal">
          {{ item.stage?.name ?? '—' }}
        </v-chip>
      </template>

      <template #item.status="{ item }">
        <v-chip :color="statusColor(item.status)" size="small" variant="tonal">
          {{ item.status_label }}
        </v-chip>
      </template>

      <template #item.contact="{ item }">{{ item.contact?.full_name ?? '—' }}</template>
      <template #item.assignee="{ item }">{{ item.assignee?.name ?? 'Sin asignar' }}</template>
      <template #item.requested_at="{ item }">{{ formatDate(item.requested_at) }}</template>
      <template #item.due_date="{ item }">{{ item.due_date ?? '—' }}</template>
    </v-data-table>
  </v-card>
</template>

<script lang="ts" setup>
  import type { Deal, DealStatus } from '@/modules/crm/types'

  defineProps<{ deals: Deal[] }>()

  const emit = defineEmits<{ open: [deal: Deal] }>()

  const headers = [
    { title: 'ID', key: 'id', width: 80 },
    { title: 'Solicitud', key: 'title' },
    { title: 'Etapa', key: 'stage', sortable: false },
    { title: 'Estado', key: 'status' },
    { title: 'Contacto', key: 'contact', sortable: false },
    { title: 'Canal', key: 'channel_label' },
    { title: 'Responsable', key: 'assignee', sortable: false },
    { title: 'Solicitado', key: 'requested_at' },
    { title: 'Fecha final', key: 'due_date' },
  ]

  function statusColor (status: DealStatus) {
    return status === 'won' ? 'success' : (status === 'lost' ? 'error' : 'info')
  }

  function formatDate (value: string | null) {
    return value
      ? new Date(value).toLocaleDateString('es-MX', { day: '2-digit', month: 'short', year: 'numeric' })
      : '—'
  }

  function onRowClick (_event: unknown, row: { item: Deal }) {
    emit('open', row.item)
  }
</script>
