import type { Area, AreaPayload, AreasPort } from '@/modules/areas/port'
import { onMounted, ref } from 'vue'
import { areasAdapter } from '@/modules/areas/adapter'

export function useAreas (areasPort: AreasPort = areasAdapter) {
  const areas = ref<Area[]>([])
  const loading = ref(false)
  const error = ref<string | null>(null)

  async function loadAreas () {
    loading.value = true
    error.value = null

    try {
      areas.value = await areasPort.list()
    } catch (error_) {
      error.value = error_ instanceof Error ? error_.message : 'No fue posible cargar las áreas'
      throw error_
    } finally {
      loading.value = false
    }
  }

  async function createArea (payload: AreaPayload) {
    loading.value = true
    error.value = null

    try {
      const newArea = await areasPort.create(payload)
      areas.value.push(newArea)
      return newArea
    } catch (error_) {
      error.value = error_ instanceof Error ? error_.message : 'No fue posible crear el área'
      throw error_
    } finally {
      loading.value = false
    }
  }

  async function updateArea (areaId: number | string, payload: Partial<AreaPayload>) {
    loading.value = true
    error.value = null

    try {
      const updatedArea = await areasPort.update(areaId, payload)
      const index = areas.value.findIndex(a => a.id === areaId)
      if (index !== -1) {
        areas.value[index] = updatedArea
      }
      return updatedArea
    } catch (error_) {
      error.value = error_ instanceof Error ? error_.message : 'No fue posible actualizar el área'
      throw error_
    } finally {
      loading.value = false
    }
  }

  async function removeArea (areaId: number | string) {
    loading.value = true
    error.value = null

    try {
      await areasPort.remove(areaId)
      areas.value = areas.value.filter(a => a.id !== areaId)
    } catch (error_) {
      error.value = error_ instanceof Error ? error_.message : 'No fue posible eliminar el área'
      throw error_
    } finally {
      loading.value = false
    }
  }

  onMounted(() => {
    void loadAreas()
  })

  return {
    areas,
    createArea,
    error,
    loadAreas,
    loading,
    removeArea,
    updateArea,
  }
}
