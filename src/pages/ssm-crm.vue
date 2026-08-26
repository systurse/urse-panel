<template>
  <div class="crm-page">
    <div class="crm-toolbar">
      <div class="crm-toolbar-left">
        <v-select
          v-if="pipelines.length > 1"
          density="compact"
          hide-details
          item-title="name"
          item-value="id"
          :items="pipelines"
          label="Pipeline"
          :model-value="activePipelineId"
          style="max-width: 220px"
          variant="outlined"
          @update:model-value="selectPipeline($event as number)"
        />

        <v-text-field
          v-model="search"
          clearable
          density="compact"
          hide-details
          label="Buscar solicitud o contacto"
          prepend-inner-icon="mdi-magnify"
          style="min-width: 240px"
          variant="outlined"
          @click:clear="clearSearch"
          @keyup.enter="applyFilters"
        />

        <v-select
          v-model="filters.channel"
          clearable
          density="compact"
          hide-details
          item-title="label"
          item-value="value"
          :items="channelOptions"
          label="Canal"
          style="max-width: 190px"
          variant="outlined"
          @update:model-value="applyFilters"
        />

        <v-select
          v-model="filters.assigned_to"
          clearable
          density="compact"
          hide-details
          item-title="name"
          item-value="id"
          :items="assignables"
          label="Responsable"
          style="max-width: 200px"
          variant="outlined"
          @update:model-value="applyFilters"
        />

        <v-select
          v-model="filters.status"
          clearable
          density="compact"
          hide-details
          item-title="label"
          item-value="value"
          :items="statusOptions"
          label="Estado"
          style="max-width: 160px"
          variant="outlined"
          @update:model-value="applyFilters"
        />
      </div>

      <div class="crm-toolbar-right">
        <v-btn-toggle v-model="view" density="comfortable" mandatory variant="outlined">
          <v-btn icon="mdi-view-column-outline" title="Kanban" value="kanban" />
          <v-btn icon="mdi-format-list-bulleted" title="Lista" value="list" />
          <v-btn icon="mdi-calendar-month-outline" title="Calendario" value="calendar" />
        </v-btn-toggle>

        <v-btn
          v-if="canCreate"
          color="#1a1a1a"
          prepend-icon="mdi-plus"
          variant="flat"
          @click="showNewDeal = true"
        >Nueva negociación</v-btn>
      </div>
    </div>

    <v-alert
      v-if="error"
      class="mb-4"
      rounded="xl"
      type="error"
      variant="tonal"
    >{{ error }}</v-alert>

    <div v-if="loading && deals.length === 0" class="crm-loading">
      <v-progress-circular indeterminate size="40" />
    </div>

    <KanbanBoard
      v-else-if="view === 'kanban'"
      :deals="deals"
      :deals-by-stage="dealsByStage"
      :stages="stages"
      @add-activity="openActivity"
      @move="onMove"
      @open="openDeal"
      @send-email="openDealMessages"
      @show-contact="showContact"
    />

    <DealListView v-else-if="view === 'list'" :deals="deals" @open="openDeal" />
    <DealCalendarView v-else :deals="deals" @open="openDeal" />

    <NewDealDialog
      v-model="showNewDeal"
      :assignables="assignables"
      :pipeline-id="activePipelineId"
      @created="loadDeals"
    />

    <ContactDialog v-model="showContactDialog" :contact="selectedContact" />

    <ActivityDialog
      ref="activityDialog"
      v-model="showActivityDialog"
      :error="activityError"
      :saving="savingActivity"
      @submit="submitActivity"
    />

    <v-snackbar v-model="showLeadAlert" color="#1a1a1a" timeout="10000">
      <v-icon class="mr-2" icon="mdi-bell-ring-outline" />
      Nuevo lead: {{ leadAlert?.title }} — atiéndelo y asígnalo.
      <template #actions>
        <v-btn variant="text" @click="openLeadFromAlert">Ver</v-btn>
      </template>
    </v-snackbar>
  </div>
</template>

<script lang="ts" setup>
  import type { Contact, Deal } from '@/modules/crm/types'
  import { computed, ref, watch } from 'vue'
  import { useRouter } from 'vue-router'
  import ActivityDialog from '@/modules/crm/components/ActivityDialog.vue'
  import ContactDialog from '@/modules/crm/components/ContactDialog.vue'
  import DealCalendarView from '@/modules/crm/components/DealCalendarView.vue'
  import DealListView from '@/modules/crm/components/DealListView.vue'
  import KanbanBoard from '@/modules/crm/components/KanbanBoard.vue'
  import NewDealDialog from '@/modules/crm/components/NewDealDialog.vue'
  import * as crm from '@/modules/crm/service'
  import { useCrmBoard } from '@/modules/crm/useCrmBoard'
  import { useAuthStore } from '@/stores/auth'

  const router = useRouter()
  const authStore = useAuthStore()

  const {
    activePipelineId,
    assignables,
    deals,
    dealsByStage,
    error,
    filters,
    leadAlert,
    loadDeals,
    loading,
    moveDeal,
    pipelines,
    selectPipeline,
    stages,
  } = useCrmBoard()

  const view = ref<'kanban' | 'list' | 'calendar'>('kanban')
  const search = ref('')
  const showNewDeal = ref(false)
  const showContactDialog = ref(false)
  const selectedContact = ref<Contact | null>(null)
  const showActivityDialog = ref(false)
  const activityDealId = ref<number | null>(null)
  const savingActivity = ref(false)
  const activityError = ref<string | null>(null)
  const activityDialog = ref<InstanceType<typeof ActivityDialog> | null>(null)
  const showLeadAlert = ref(false)

  const canCreate = computed(() => authStore.isAdmin || authStore.hasPermission('crm.deals.create'))

  const channelOptions = [
    { value: 'contact_form', label: 'Formulario' },
    { value: 'whatsapp', label: 'WhatsApp' },
    { value: 'email', label: 'Correo' },
    { value: 'manual', label: 'Manual' },
  ]

  const statusOptions = [
    { value: 'open', label: 'Abiertas' },
    { value: 'won', label: 'Ganadas' },
    { value: 'lost', label: 'Perdidas' },
  ]

  watch(leadAlert, value => {
    if (value) {
      showLeadAlert.value = true
    }
  })

  function applyFilters () {
    filters.value.q = search.value || undefined
    loadDeals()
  }

  function clearSearch () {
    search.value = ''
    applyFilters()
  }

  function openDeal (deal: Deal) {
    router.push(`/ssm/crm/negociaciones/${deal.id}`)
  }

  function openDealMessages (deal: Deal) {
    router.push(`/ssm/crm/negociaciones/${deal.id}?tab=mensaje`)
  }

  function openLeadFromAlert () {
    if (leadAlert.value) {
      router.push(`/ssm/crm/negociaciones/${leadAlert.value.deal_id}`)
    }
  }

  function showContact (deal: Deal) {
    selectedContact.value = deal.contact ?? null
    showContactDialog.value = true
  }

  function openActivity (deal: Deal) {
    activityDealId.value = deal.id
    activityError.value = null
    showActivityDialog.value = true
  }

  async function submitActivity (payload: { type: 'reminder' | 'comment', body: string, remind_at?: string | null, attachments?: File[] }) {
    if (!activityDealId.value) {
      return
    }

    savingActivity.value = true
    activityError.value = null

    try {
      await crm.createActivity(activityDealId.value, payload)
      showActivityDialog.value = false
      activityDialog.value?.reset()
    } catch (error_: any) {
      activityError.value = error_?.response?.data?.message ?? 'No fue posible registrar la actividad'
    } finally {
      savingActivity.value = false
    }
  }

  async function onMove (deal: Deal, stageId: number, position: number) {
    try {
      await moveDeal(deal, stageId, position)
    } catch {
      // el error ya queda expuesto por el composable
    }
  }
</script>

<style scoped>
.crm-page {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.crm-toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  flex-wrap: wrap;
}

.crm-toolbar-left {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
  flex: 1;
}

.crm-toolbar-right {
  display: flex;
  align-items: center;
  gap: 10px;
}

.crm-loading {
  display: flex;
  justify-content: center;
  padding: 80px 0;
}
</style>
