<template>
  <v-card
    class="deal-card"
    :class="{ 'deal-card--closed': deal.status !== 'open' }"
    draggable="true"
    rounded="lg"
    @click="emit('open', deal)"
    @dragstart="onDragStart"
  >
    <v-card-text class="deal-card-body">
      <div class="deal-card-header">
        <span class="deal-id">#{{ deal.id }}</span>

        <v-chip v-if="deal.status !== 'open'" :color="deal.status === 'won' ? 'success' : 'error'" size="x-small" variant="tonal">
          {{ deal.status_label }}
        </v-chip>

        <v-chip v-else size="x-small" variant="tonal">{{ deal.channel_label }}</v-chip>
      </div>

      <p class="deal-title">{{ deal.title }}</p>

      <div v-if="deal.contact" class="deal-contact">
        <v-icon icon="mdi-account-circle-outline" size="14" />
        <span>{{ deal.contact.full_name }}</span>
      </div>

      <div class="deal-meta">
        <v-tooltip location="top" text="Fecha de solicitud o reporte">
          <template #activator="{ props: tooltipProps }">
            <span class="deal-date" v-bind="tooltipProps">
              <v-icon icon="mdi-clock-outline" size="13" />
              {{ formatDate(deal.requested_at) }}
            </span>
          </template>
        </v-tooltip>

        <span v-if="deal.assignee" class="deal-assignee">{{ deal.assignee.name }}</span>
        <span v-else class="deal-assignee deal-assignee--none">Sin asignar</span>
      </div>

      <div class="deal-actions" @click.stop>
        <v-btn
          density="comfortable"
          icon="mdi-plus"
          size="x-small"
          title="Agregar actividad"
          variant="text"
          @click="emit('add-activity', deal)"
        />

        <v-btn
          density="comfortable"
          icon="mdi-account-outline"
          size="x-small"
          title="Datos del contacto"
          variant="text"
          @click="emit('show-contact', deal)"
        />

        <v-btn
          density="comfortable"
          :disabled="!deal.contact?.phone"
          icon="mdi-message-text-outline"
          size="x-small"
          title="Enviar mensaje por WhatsApp"
          variant="text"
          @click="openWhatsapp"
        />

        <v-btn
          density="comfortable"
          :disabled="!deal.contact?.email"
          icon="mdi-email-outline"
          size="x-small"
          title="Enviar correo electrónico"
          variant="text"
          @click="emit('send-email', deal)"
        />
      </div>
    </v-card-text>
  </v-card>
</template>

<script lang="ts" setup>
  import type { Deal } from '@/modules/crm/types'

  const props = defineProps<{ deal: Deal }>()

  const emit = defineEmits<{
    'open': [deal: Deal]
    'add-activity': [deal: Deal]
    'show-contact': [deal: Deal]
    'send-email': [deal: Deal]
  }>()

  function onDragStart (event: DragEvent) {
    event.dataTransfer?.setData('text/deal-id', String(props.deal.id))
    event.dataTransfer!.effectAllowed = 'move'
  }

  function openWhatsapp () {
    const phone = props.deal.contact?.phone?.replace(/\D/g, '')
    if (phone) {
      window.open(`https://wa.me/${phone}`, '_blank', 'noopener')
    }
  }

  function formatDate (value: string | null) {
    if (!value) {
      return 'Sin fecha'
    }
    return new Date(value).toLocaleDateString('es-MX', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })
  }
</script>

<style scoped>
.deal-card {
  cursor: grab;
  border: 1px solid rgba(0, 0, 0, 0.08);
}

.deal-card:active {
  cursor: grabbing;
}

.deal-card--closed {
  opacity: 0.75;
}

.deal-card-body {
  padding: 10px 12px;
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.deal-card-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 6px;
}

.deal-id {
  font-size: 11px;
  color: rgba(0, 0, 0, 0.5);
  font-weight: 600;
}

.deal-title {
  font-size: 13px;
  font-weight: 600;
  line-height: 1.3;
  margin: 0;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.deal-contact {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 12px;
  color: rgba(0, 0, 0, 0.65);
}

.deal-meta {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 6px;
  font-size: 11px;
  color: rgba(0, 0, 0, 0.55);
}

.deal-date {
  display: inline-flex;
  align-items: center;
  gap: 3px;
}

.deal-assignee {
  font-weight: 600;
  max-width: 45%;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.deal-assignee--none {
  color: #e65100;
}

.deal-actions {
  display: flex;
  gap: 2px;
  border-top: 1px dashed rgba(0, 0, 0, 0.08);
  padding-top: 4px;
}
</style>
