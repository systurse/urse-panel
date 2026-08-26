<template>
  <div v-if="items.length > 0" class="timeline">
    <div v-for="activity in items" :key="activity.id" class="timeline-item">
      <v-icon class="timeline-icon" :icon="iconFor(activity.type)" size="18" />

      <div class="timeline-content">
        <div class="timeline-head">
          <span class="timeline-user">{{ activity.user?.name ?? 'Sistema' }}</span>
          <span class="timeline-date">{{ formatDate(activity.created_at) }}</span>
        </div>

        <p v-if="activity.metadata?.subject" class="timeline-subject">{{ activity.metadata.subject }}</p>
        <p class="timeline-body">{{ activity.body }}</p>

        <p v-if="activity.remind_at" class="timeline-remind">
          <v-icon icon="mdi-bell-outline" size="12" /> Recordar el {{ formatDate(activity.remind_at) }}
        </p>

        <div v-if="activity.attachments?.length" class="timeline-attachments">
          <v-chip
            v-for="attachment in activity.attachments"
            :key="attachment.id"
            prepend-icon="mdi-paperclip"
            size="small"
            variant="outlined"
            @click="emit('download', attachment.download_url, attachment.original_name)"
          >{{ attachment.original_name }}</v-chip>
        </div>
      </div>
    </div>
  </div>

  <p v-else class="timeline-empty">{{ emptyText }}</p>
</template>

<script lang="ts" setup>
  import type { DealActivity } from '@/modules/crm/types'

  defineProps<{ items: DealActivity[], emptyText: string }>()

  const emit = defineEmits<{ download: [url: string, name: string] }>()

  function iconFor (type: string) {
    switch (type) {
      case 'reminder': {
        return 'mdi-bell-outline'
      }
      case 'email': {
        return 'mdi-email-outline'
      }
      case 'system': {
        return 'mdi-cog-outline'
      }
      default: {
        return 'mdi-comment-text-outline'
      }
    }
  }

  function formatDate (value: string) {
    return new Date(value).toLocaleDateString('es-MX', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })
  }
</script>

<style scoped>
.timeline {
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.timeline-item {
  display: flex;
  gap: 10px;
}

.timeline-icon {
  margin-top: 2px;
  color: rgba(0, 0, 0, 0.45);
}

.timeline-content {
  flex: 1;
  border-bottom: 1px dashed rgba(0, 0, 0, 0.08);
  padding-bottom: 10px;
}

.timeline-head {
  display: flex;
  justify-content: space-between;
  gap: 8px;
}

.timeline-user {
  font-size: 12px;
  font-weight: 700;
}

.timeline-date {
  font-size: 11px;
  color: rgba(0, 0, 0, 0.5);
}

.timeline-subject {
  font-size: 12px;
  font-weight: 600;
  margin: 4px 0 0;
}

.timeline-body {
  font-size: 13px;
  margin: 4px 0 0;
  white-space: pre-wrap;
}

.timeline-remind {
  font-size: 11px;
  color: #e65100;
  margin: 4px 0 0;
}

.timeline-attachments {
  display: flex;
  gap: 6px;
  flex-wrap: wrap;
  margin-top: 6px;
}

.timeline-empty {
  font-size: 13px;
  color: rgba(0, 0, 0, 0.5);
}
</style>
