import type { CrmUser, Deal, DealFilters, Pipeline, Stage } from '@/modules/crm/types'
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import * as crm from '@/modules/crm/service'
import { getEcho } from '@/services/websocket'

export interface LeadAlert {
  deal_id: number
  title: string
  contact_name: string | null
  channel: string
}

/**
 * Estado del tablero de negociaciones: pipeline activo, tarjetas agrupadas
 * por etapa y suscripción realtime al canal privado crm.board.
 */
export function useCrmBoard () {
  const pipelines = ref<Pipeline[]>([])
  const activePipelineId = ref<number | null>(null)
  const deals = ref<Deal[]>([])
  const assignables = ref<CrmUser[]>([])
  const loading = ref(false)
  const error = ref<string | null>(null)
  const leadAlert = ref<LeadAlert | null>(null)
  const filters = ref<DealFilters>({ status: 'open' })

  const activePipeline = computed(() =>
    pipelines.value.find(pipeline => pipeline.id === activePipelineId.value) ?? null,
  )

  const stages = computed<Stage[]>(() => activePipeline.value?.stages ?? [])

  const dealsByStage = computed<Record<number, Deal[]>>(() => {
    const groups: Record<number, Deal[]> = {}

    for (const stage of stages.value) {
      groups[stage.id] = []
    }

    for (const deal of deals.value) {
      (groups[deal.stage_id] ??= []).push(deal)
    }

    for (const stageDeals of Object.values(groups)) {
      stageDeals.sort((a, b) => a.position - b.position)
    }

    return groups
  })

  async function loadPipelines () {
    pipelines.value = await crm.listPipelines()

    if (activePipelineId.value === null) {
      const fallback = pipelines.value.find(pipeline => pipeline.is_default) ?? pipelines.value[0]
      activePipelineId.value = fallback?.id ?? null
    }
  }

  async function loadDeals () {
    if (activePipelineId.value === null) {
      deals.value = []
      return
    }

    loading.value = true
    error.value = null

    try {
      deals.value = await crm.listDeals({
        ...filters.value,
        pipeline_id: activePipelineId.value,
        per_page: 500,
        sort: 'position',
      })
    } catch (error_: any) {
      error.value = error_?.response?.data?.message ?? 'No fue posible cargar las negociaciones'
    } finally {
      loading.value = false
    }
  }

  async function load () {
    loading.value = true
    error.value = null

    try {
      await loadPipelines()
      await loadDeals()
      assignables.value = await crm.listAssignables()
    } catch (error_: any) {
      error.value = error_?.response?.data?.message ?? 'No fue posible cargar el tablero'
    } finally {
      loading.value = false
    }
  }

  async function selectPipeline (pipelineId: number) {
    activePipelineId.value = pipelineId
    await loadDeals()
  }

  /**
   * Movimiento optimista: la tarjeta cambia de columna al instante y se
   * revierte recargando si la API rechaza el movimiento.
   */
  async function moveDeal (deal: Deal, stageId: number, position: number) {
    const previousStage = deal.stage_id
    const previousPosition = deal.position

    deal.stage_id = stageId
    deal.position = position - 0.5 // se intercala antes de renumerar

    try {
      await crm.moveDeal(deal.id, stageId, position)
      await loadDeals()
    } catch (error_: any) {
      deal.stage_id = previousStage
      deal.position = previousPosition
      error.value = error_?.response?.data?.message ?? 'No fue posible mover la negociación'
      throw error_
    }
  }

  let refreshTimer: ReturnType<typeof setTimeout> | null = null

  function scheduleRefresh () {
    if (refreshTimer) {
      clearTimeout(refreshTimer)
    }
    refreshTimer = setTimeout(() => {
      loadDeals()
    }, 400)
  }

  function subscribe () {
    const echo = getEcho()

    echo.private('crm.board')
      .listen('.lead.created', (event: LeadAlert & { pipeline_id: number }) => {
        leadAlert.value = event
        scheduleRefresh()
      })
      .listen('.deal.moved', () => scheduleRefresh())
      .listen('.deal.updated', () => scheduleRefresh())
  }

  function unsubscribe () {
    getEcho().leave('private-crm.board')
  }

  onMounted(() => {
    load()
    subscribe()
  })

  onBeforeUnmount(() => {
    if (refreshTimer) {
      clearTimeout(refreshTimer)
    }
    unsubscribe()
  })

  return {
    activePipeline,
    activePipelineId,
    assignables,
    deals,
    dealsByStage,
    error,
    filters,
    leadAlert,
    load,
    loadDeals,
    loading,
    moveDeal,
    pipelines,
    selectPipeline,
    stages,
  }
}
