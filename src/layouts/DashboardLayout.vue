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
      subtitle: 'Resumen general del sistema y actividad reciente.',
    },
    {
      title: 'Reportes',
      to: '/reportes',
      icon: 'mdi-chart-box-outline',
      subtitle: 'Indicadores operativos, seguimiento y productividad.',
    },
    {
      title: 'separator',
      divider: true,
    },
    {
      title: 'Usuarios',
      to: '/usuarios',
      icon: 'mdi-account-group-outline',
      subtitle: 'Gestión de usuarios, roles y estado de acceso.',
    },
    {
      title: 'Roles',
      to: '/roles',
      icon: 'mdi-shield-account-outline',
      subtitle: 'Gestión de roles y permisos del sistema.',
    },
    {
      title: 'Permisos',
      to: '/permisos',
      icon: 'mdi-lock-outline',
      subtitle: 'Listado de permisos y accesos del sistema.',
    },
    {
      title: 'Formularios',
      to: '/formularios',
      icon: 'mdi-form-select',
      subtitle: 'Administración de formularios y tipos de captura.',
    },
    {
      title: 'Campos',
      to: '/campos',
      icon: 'mdi-view-list-outline',
      subtitle: 'Gestión de campos reutilizables para formularios.',
    },
    {
      title: 'Campos por formulario',
      to: '/formularios/campos',
      icon: 'mdi-clipboard-list-outline',
      subtitle: 'Vincula campos existentes a formularios específicos.',
    },
    {
      title: 'separator',
      divider: true,
    },
    {
      title: 'Crear ticket',
      to: '/crear-ticket',
      icon: 'mdi-file-plus-outline',
      subtitle: 'Genera un nuevo ticket de soporte o seguimiento.',
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

  function handleLogout () {
    authStore.logout()
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
