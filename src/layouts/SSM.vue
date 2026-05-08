<template>
  <v-layout class="dashboard-layout">
    <DashboardSidebar
      v-model="drawer"
      :items="navigationItems"
      :rail="rail"
      @toggle-rail="rail = !rail"
    />

    <div class="dashboard-main" :style="mainStyles">
      <DashboardTopbar
        :subtitle="currentSection.subtitle"
        :title="currentSection.title"
        @logout="handleLogout"
      />

      <v-main class="dashboard-content-area">
        <DashboardContent>
          <router-view />
        </DashboardContent>
      </v-main>
    </div>
  </v-layout>
</template>

<script lang="ts" setup>
  import { computed, ref } from 'vue'
  import { useRoute, useRouter } from 'vue-router'
  import DashboardContent from '@/components/dashboard/DashboardContent.vue'
  import DashboardSidebar from '@/components/dashboard/DashboardSidebar.vue'
  import DashboardTopbar from '@/components/dashboard/DashboardTopbar.vue'
  import { useAuthStore } from '@/stores/auth'

  const route = useRoute()
  const router = useRouter()
  const authStore = useAuthStore()

  const drawer = ref(true)
  const rail = ref(false)

  const navigationItems = [
    {
      title: 'Inicio',
      to: '/',
      icon: 'mdi-view-dashboard-outline',
      subtitle: 'Listado de aplicaciones.',
    },
    {
      title: 'separator',
      divider: true,
    },
    {
      title: 'Mis tickets',
      to: '/ssm/tickets',
      icon: 'mdi-ticket-outline',
      subtitle: 'Órdenes de servicio asignadas a tu usuario.',
    },
    {
      title: 'Mis solicitudes',
      to: '/ssm/mis-solicitudes',
      icon: 'mdi-file-search-outline',
      subtitle: 'Seguimiento de tus solicitudes de servicio.',
    },
    {
      title: 'Aprobaciones',
      to: '/ssm/aprobaciones',
      icon: 'mdi-draw-pen',
      subtitle: 'Cola de aprobaciones pendientes de firma digital.',
      enabled: authStore.isAdmin
    },
    {
      title: 'separator',
      divider: true,
    },
    {
      title: 'Configuración',
      to: '/configuracion',
      icon: 'mdi-cog-outline',
      subtitle: 'Parámetros generales e integraciones del panel.',
    },
  ]

  const currentSection = computed(() => {
    const section = navigationItems.find(item => 'to' in item && item.to === route.path)
    return section && 'to' in section
      ? { title: section.title, subtitle: section.subtitle ?? '' }
      : { title: navigationItems[0].title, subtitle: (navigationItems[0] as { subtitle?: string }).subtitle ?? '' }
  })

  const drawerWidth = computed(() => (rail.value ? 88 : 280))

  const mainStyles = computed(() => ({
    marginInlineStart: `${drawerWidth.value}px`,
    width: `calc(100% - ${drawerWidth.value}px)`,
  }))

  async function handleLogout () {
    await authStore.logout()
    router.push('/login')
  }
</script>

<style scoped>
.dashboard-layout {
  height: 100vh;
  overflow: hidden;
  background: #efe7de;
}

.dashboard-main {
  display: flex;
  flex: 1;
  min-width: 0;
  min-height: 0;
  height: 100vh;
  overflow: hidden;
  flex-direction: column;
}

.dashboard-content-area {
  flex: 1;
  min-width: 0;
  min-height: 0;
  overflow: auto;
  padding: 0 24px 24px;
  padding-top: 136px;
  box-sizing: border-box;
  background: transparent;
}

@media (max-width: 960px) {
  .dashboard-main {
    width: 100% !important;
    margin-inline-start: 0 !important;
  }

  .dashboard-content-area {
    padding: 0 16px 16px;
    padding-top: 160px;
  }
}
</style>
