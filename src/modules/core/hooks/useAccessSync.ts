import { onBeforeUnmount, onMounted, watch } from 'vue'
import { useRouter } from 'vue-router'
import { leaveAccessChanges, listenToAccessChanges } from '@/services/websocket'
import { useAuthStore } from '@/stores/auth'
import { canAccessRouteMeta } from '@/utils/routeAccess'

/** Al volver a la pestaña solo se relee si pasó al menos este tiempo. */
const FOCUS_REFRESH_INTERVAL_MS = 60_000

/**
 * Mantiene los roles y permisos de la sesión al día sin volver a iniciarla:
 * los relee al abrir el panel, cuando el API avisa por Reverb que cambiaron
 * y, por si el socket no está disponible, al volver a la pestaña. Si con el
 * acceso nuevo ya no puede ver la pantalla actual, lo manda al inicio.
 */
export function useAccessSync () {
  const authStore = useAuthStore()
  const router = useRouter()

  let lastRefreshAt = 0
  let pendingRefresh: Promise<void> | null = null
  let subscribedUserId: number | null = null

  async function refresh () {
    lastRefreshAt = Date.now()

    if (!(await authStore.refreshAccess())) {
      return
    }

    const { meta } = router.currentRoute.value
    if (!meta.public && !canAccessRouteMeta(meta, authStore)) {
      await router.replace('/')
    }
  }

  function requestRefresh () {
    pendingRefresh ??= refresh().finally(() => {
      pendingRefresh = null
    })

    return pendingRefresh
  }

  function onVisibilityChange () {
    if (document.visibilityState === 'visible' && Date.now() - lastRefreshAt >= FOCUS_REFRESH_INTERVAL_MS) {
      void requestRefresh()
    }
  }

  function unsubscribe () {
    if (subscribedUserId === null) {
      return
    }

    try {
      leaveAccessChanges(subscribedUserId)
    } catch {
      // Sin Reverb no hubo suscripción que cerrar.
    }

    subscribedUserId = null
  }

  watch(() => authStore.user?.id ?? null, userId => {
    if (userId === subscribedUserId) {
      return
    }

    unsubscribe()

    if (userId === null) {
      return
    }

    try {
      listenToAccessChanges(userId, () => void requestRefresh())
      subscribedUserId = userId
    } catch {
      // Sin Reverb configurado queda el respaldo de volver a la pestaña.
    }
  }, { immediate: true })

  onMounted(() => {
    document.addEventListener('visibilitychange', onVisibilityChange)
    void requestRefresh()
  })

  onBeforeUnmount(() => {
    document.removeEventListener('visibilitychange', onVisibilityChange)
    unsubscribe()
  })
}
