import type { Deal, DealActivity, ServiceOrderPayload } from '@/modules/crm/types'
import { ref } from 'vue'
import * as crm from '@/modules/crm/service'

/**
 * Estado del detalle de una negociación: secciones General/Detalles/Orden de
 * servicio y el panel derecho de actividades, comentarios, mensajes y tareas.
 */
export function useDealDetail (dealId: number) {
  const deal = ref<Deal | null>(null)
  const loading = ref(false)
  const saving = ref(false)
  const error = ref<string | null>(null)
  const success = ref<string | null>(null)

  async function load () {
    loading.value = true
    error.value = null

    try {
      deal.value = await crm.getDeal(dealId)
    } catch (error_: any) {
      error.value = error_?.response?.data?.message ?? 'No fue posible cargar la negociación'
    } finally {
      loading.value = false
    }
  }

  function extractError (error_: any, fallback: string): string {
    const data = error_?.response?.data
    const validation = data?.errors ? Object.values(data.errors as Record<string, string[]>).flat()[0] : null
    return validation ?? data?.message ?? fallback
  }

  async function run<T> (action: () => Promise<T>, successMessage: string | null, fallbackError: string): Promise<T | null> {
    saving.value = true
    error.value = null
    success.value = null

    try {
      const result = await action()
      success.value = successMessage
      return result
    } catch (error_: any) {
      error.value = extractError(error_, fallbackError)
      return null
    } finally {
      saving.value = false
    }
  }

  async function updateDeal (payload: Parameters<typeof crm.updateDeal>[1]) {
    const updated = await run(() => crm.updateDeal(dealId, payload), 'Negociación actualizada.', 'No fue posible guardar los cambios')
    if (updated) {
      await load()
    }
    return updated
  }

  async function assign (userId: number | null) {
    const updated = await run(() => crm.assignDeal(dealId, userId), 'Responsable actualizado.', 'No fue posible asignar el responsable')
    if (updated) {
      await load()
    }
    return updated
  }

  async function moveToStage (stageId: number) {
    const moved = await run(() => crm.moveDeal(dealId, stageId, 0), 'Etapa actualizada.', 'No fue posible cambiar la etapa')
    if (moved) {
      await load()
    }
    return moved
  }

  async function close (result: 'won' | 'lost', generateServiceOrder: boolean) {
    const closed = await run(
      () => crm.closeDeal(dealId, result, generateServiceOrder),
      result === 'won' ? 'Negociación cerrada como ganada.' : 'Negociación cerrada como perdida.',
      'No fue posible cerrar la negociación',
    )
    if (closed) {
      await load()
    }
    return closed
  }

  async function saveServiceOrder (payload: ServiceOrderPayload) {
    const order = await run(() => crm.upsertServiceOrder(dealId, payload), 'Orden de servicio guardada.', 'No fue posible guardar la orden')
    if (order && deal.value) {
      deal.value.service_order = order
    }
    return order
  }

  async function generateOrder () {
    const order = await run(() => crm.generateServiceOrder(dealId), 'Orden de servicio generada.', 'No fue posible generar la orden')
    if (order) {
      await load()
    }
    return order
  }

  async function requestOrderApproval () {
    if (!deal.value?.service_order) {
      return null
    }
    const result = await run(
      () => crm.requestOrderApproval(deal.value!.service_order!.id),
      'Aprobación solicitada. Los encargados fueron notificados.',
      'No fue posible solicitar la aprobación',
    )
    if (result) {
      await load()
    }
    return result
  }

  async function addActivity (payload: { type: 'reminder' | 'comment', body: string, remind_at?: string | null, attachments?: File[] }) {
    const activity = await run(() => crm.createActivity(dealId, payload), 'Actividad registrada.', 'No fue posible registrar la actividad')
    if (activity) {
      await load()
    }
    return activity
  }

  async function sendMessage (payload: { subject: string, body: string }) {
    const activity: DealActivity | null = await run(
      () => crm.sendDealMessage(dealId, payload),
      'Correo enviado al contacto.',
      'No fue posible enviar el correo',
    )
    if (activity) {
      await load()
    }
    return activity
  }

  async function addTask (payload: { title: string, description?: string | null, assigned_to?: number | null, due_date?: string | null }) {
    const task = await run(
      () => crm.createTask({ ...payload, deal_id: dealId }),
      'Tarea creada.',
      'No fue posible crear la tarea',
    )
    if (task) {
      await load()
    }
    return task
  }

  async function destroy () {
    return run(() => crm.deleteDeal(dealId), 'Negociación eliminada.', 'No fue posible eliminar la negociación')
  }

  return {
    addActivity,
    addTask,
    assign,
    close,
    deal,
    destroy,
    error,
    generateOrder,
    load,
    loading,
    moveToStage,
    requestOrderApproval,
    saveServiceOrder,
    saving,
    sendMessage,
    success,
    updateDeal,
  }
}
