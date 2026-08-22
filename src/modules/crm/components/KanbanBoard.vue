<template>
  <div class="kanban-board">
    <div
      v-for="stage in stages"
      :key="stage.id"
      class="kanban-column"
      :class="{ 'kanban-column--over': dragOverStageId === stage.id }"
      @dragleave="onDragLeave(stage.id)"
      @dragover.prevent="onDragOver(stage.id, $event)"
      @drop.prevent="onDrop(stage.id, $event)"
    >
      <div class="kanban-column-header" :style="{ borderTopColor: stage.color ?? '#9e9e9e' }">
        <span class="kanban-column-title">{{ stage.name }}</span>
        <v-chip size="x-small" variant="tonal">{{ (dealsByStage[stage.id] ?? []).length }}</v-chip>
      </div>

      <div class="kanban-column-body">
        <DealCard
          v-for="deal in dealsByStage[stage.id] ?? []"
          :key="deal.id"
          :deal="deal"
          @add-activity="emit('add-activity', $event)"
          @open="emit('open', $event)"
          @send-email="emit('send-email', $event)"
          @show-contact="emit('show-contact', $event)"
        />

        <p v-if="(dealsByStage[stage.id] ?? []).length === 0" class="kanban-empty">
          Arrastra aquí una tarjeta
        </p>
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
  import type { Deal, Stage } from '@/modules/crm/types'
  import { ref } from 'vue'
  import DealCard from '@/modules/crm/components/DealCard.vue'

  const props = defineProps<{
    stages: Stage[]
    dealsByStage: Record<number, Deal[]>
    deals: Deal[]
  }>()

  const emit = defineEmits<{
    'move': [deal: Deal, stageId: number, position: number]
    'open': [deal: Deal]
    'add-activity': [deal: Deal]
    'show-contact': [deal: Deal]
    'send-email': [deal: Deal]
  }>()

  const dragOverStageId = ref<number | null>(null)

  function onDragOver (stageId: number, event: DragEvent) {
    event.dataTransfer!.dropEffect = 'move'
    dragOverStageId.value = stageId
  }

  function onDragLeave (stageId: number) {
    if (dragOverStageId.value === stageId) {
      dragOverStageId.value = null
    }
  }

  function onDrop (stageId: number, event: DragEvent) {
    dragOverStageId.value = null

    const dealId = Number(event.dataTransfer?.getData('text/deal-id'))
    const deal = props.deals.find(item => item.id === dealId)

    if (!deal) {
      return
    }

    // Al soltar, la tarjeta se agrega al final de la columna destino
    const position = (props.dealsByStage[stageId] ?? []).filter(item => item.id !== dealId).length

    emit('move', deal, stageId, position)
  }
</script>

<style scoped>
.kanban-board {
  display: flex;
  gap: 12px;
  overflow-x: auto;
  padding-bottom: 12px;
  align-items: flex-start;
  min-height: 60vh;
}

.kanban-column {
  min-width: 280px;
  width: 280px;
  flex-shrink: 0;
  background: rgba(0, 0, 0, 0.035);
  border-radius: 12px;
  display: flex;
  flex-direction: column;
  max-height: calc(100vh - 300px);
}

.kanban-column--over {
  outline: 2px dashed #1a1a1a;
  outline-offset: -2px;
}

.kanban-column-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 12px;
  border-top: 4px solid;
  border-top-left-radius: 12px;
  border-top-right-radius: 12px;
  background: rgba(255, 255, 255, 0.7);
}

.kanban-column-title {
  font-size: 13px;
  font-weight: 700;
}

.kanban-column-body {
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 10px;
  overflow-y: auto;
}

.kanban-empty {
  font-size: 12px;
  color: rgba(0, 0, 0, 0.4);
  text-align: center;
  border: 1px dashed rgba(0, 0, 0, 0.15);
  border-radius: 8px;
  padding: 16px 8px;
  margin: 0;
}
</style>
