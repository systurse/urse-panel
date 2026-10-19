<template>
  <div class="followup-page">
    <div class="followup-container">
      <header class="followup-header">
        <h1>Seguimiento de tu solicitud</h1>

        <template v-if="info">
          <p class="followup-title">#{{ info.folio }} — {{ info.title }}</p>

          <div class="followup-chips">
            <v-chip size="small" variant="tonal">{{ info.stage ?? 'En proceso' }}</v-chip>

            <v-chip
              v-if="info.status !== 'open'"
              :color="info.status === 'won' ? 'success' : 'error'"
              size="small"
              variant="tonal"
            >{{ info.status_label }}</v-chip>
          </div>
        </template>
      </header>

      <v-card class="followup-card" rounded="xl">
        <v-card-text class="pa-4">
          <DealChatPanel height="65vh" :target="{ mode: 'contact', token }" @loaded="info = $event" />
        </v-card-text>
      </v-card>

      <p class="followup-note">Esta liga es personal: no la compartas.</p>
    </div>
  </div>
</template>

<script lang="ts" setup>
  import type { DealChat } from '@/modules/crm/types'
  import { ref } from 'vue'
  import { useRoute } from 'vue-router'
  import DealChatPanel from '@/modules/crm/components/DealChatPanel.vue'

  const route = useRoute()
  const token = String(route.params.token)
  const info = ref<DealChat | null>(null)
</script>

<style scoped>
.followup-page {
  min-height: 100vh;
  background: #efe7de;
  display: flex;
  justify-content: center;
  padding: 32px 16px;
}

.followup-container {
  width: 100%;
  max-width: 720px;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.followup-header h1 {
  font-size: 24px;
  margin: 0;
}

.followup-title {
  color: rgba(0, 0, 0, 0.7);
  margin: 6px 0 8px;
}

.followup-chips {
  display: flex;
  gap: 6px;
}

.followup-note {
  font-size: 12px;
  color: rgba(0, 0, 0, 0.5);
  text-align: center;
  margin: 0;
}
</style>
