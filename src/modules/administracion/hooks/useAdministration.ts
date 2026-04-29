import { storeToRefs } from 'pinia'
import { useAdministrationStore } from '@/modules/administracion/states/administrationStore'

export function useAdministration () {
  const store = useAdministrationStore()
  const { sections } = storeToRefs(store)

  return {
    sections,
  }
}
