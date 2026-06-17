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
  import type { RouteMeta } from 'vue-router'
  import { computed, ref, onMounted } from 'vue'
  import { useRoute, useRouter } from 'vue-router'
  import { useDisplay } from 'vuetify'
  import DashboardContent from '@/components/dashboard/DashboardContent.vue'
  import DashboardSidebar from '@/components/dashboard/DashboardSidebar.vue'
  import DashboardTopbar from '@/components/dashboard/DashboardTopbar.vue'
  import { useAuthStore } from '@/stores/auth'
  import { canAccessRouteMeta } from '@/utils/routeAccess'

  const route = useRoute()
  const router = useRouter()
  const authStore = useAuthStore()
  const display = useDisplay()

  const drawer = ref(true)
  const rail = ref(false)

  onMounted(() => {
    // En móvil, cerrar el drawer por defecto
    if (display.xs.value || display.sm.value) {
      drawer.value = false
    }
  })

  const moduleBase = computed(() => `/${route.path.split('/')[1]}`)

  const navigationItems = computed(() => {
    if (moduleBase.value === '/administracion') {
      const items = [
        {
          title: 'Inicio',
          to: '/',
          icon: 'mdi-home-outline',
          subtitle: 'Vista general del panel de control.',
        },
        {
          title: 'Resumen',
          to: '/administracion',
          icon: 'mdi-view-dashboard-outline',
          subtitle: 'Vista general del módulo de administración.',
        },
        {
          title: 'Usuarios',
          to: '/administracion/usuarios',
          icon: 'mdi-account-group-outline',
          subtitle: 'Gestión de usuarios, acceso y estado de cuentas.',
        },
        {
          title: 'Roles',
          to: '/administracion/roles',
          icon: 'mdi-shield-account-outline',
          subtitle: 'Definición de roles disponibles dentro del sistema.',
        },
        {
          title: 'Permisos',
          to: '/administracion/permisos',
          icon: 'mdi-lock-outline',
          subtitle: 'Listado de permisos y capacidades asociadas.',
        },
      ]

      return items
    }

    if (moduleBase.value === '/sps') {
      const items = [
        {
          title: 'Inicio',
          to: '/',
          icon: 'mdi-home-outline',
          subtitle: 'Vista general del panel de control.',
        },
        {
          title: 'Solicitud de pase',
          to: '/sps',
          icon: 'mdi-badge-account-outline',
          subtitle: 'Registra empleado y crea un pase de salida.',
        },
        {
          title: 'Pases registrados',
          to: '/sps/pases',
          icon: 'mdi-file-document-multiple-outline',
          subtitle: 'Consulta el historial de pases de salida capturados.',
        },
        {
          title: 'Reporte de pases',
          to: '/sps/reportes',
          icon: 'mdi-file-chart-outline',
          subtitle: 'Vista de reporte con filtros y exportación.',
          meta: { requiresAnyPermission: ['sps.pass.filter', 'sps.pass.export'] },
        },
        {
          title: 'Pases de salida',
          to: '/sps/administracion/pases-salida',
          icon: 'mdi-clipboard-check-multiple-outline',
          subtitle: 'Consulta y resuelve pases de salida (autorizar o rechazar).',
          meta: { requiresAdministrator: true },
        },
      ]

      return items.filter(item => {
        if (!('meta' in item)) {
          return true
        }

        return canAccessRouteMeta(item.meta as RouteMeta | undefined, authStore)
      })
    }

    if (moduleBase.value === '/inscripciones') {
      return [
        {
          title: 'Inicio',
          to: '/',
          icon: 'mdi-home-outline',
          subtitle: 'Vista general del panel de control.',
        },
        {
          title: 'Nueva Inscripción',
          to: '/inscripciones',
          icon: 'mdi-account-school-outline',
          subtitle: 'Registra un nuevo estudiante en el sistema.',
        },
        {
          title: 'Reporte',
          to: '/inscripciones/reporte',
          icon: 'mdi-chart-pie',
          subtitle: 'Estadísticas y listado de estudiantes registrados.',
        },
      ]
    }

    return [
      {
        title: 'Inicio',
        to: moduleBase.value,
        icon: 'mdi-view-dashboard-outline',
        subtitle: 'Resumen general del sistema y actividad reciente.',
      },
      {
        title: 'Reportes',
        to: `${moduleBase.value}/reportes`,
        icon: 'mdi-chart-box-outline',
        subtitle: 'Indicadores operativos, seguimiento y productividad.',
      },
      {
        title: 'separator',
        divider: true,
      },
      {
        title: 'Formularios',
        to: `${moduleBase.value}/formularios`,
        icon: 'mdi-form-select',
        subtitle: 'Administración de formularios y tipos de captura.',
      },
      {
        title: 'Campos',
        to: `${moduleBase.value}/campos`,
        icon: 'mdi-view-list-outline',
        subtitle: 'Gestión de campos reutilizables para formularios.',
      },
      {
        title: 'Campos por formulario',
        to: `${moduleBase.value}/formularios/campos`,
        icon: 'mdi-clipboard-list-outline',
        subtitle: 'Vincula campos existentes a formularios específicos.',
      },
      {
        title: 'separator',
        divider: true,
      },
      {
        title: 'Crear ticket',
        to: `${moduleBase.value}/crear-ticket`,
        icon: 'mdi-file-plus-outline',
        subtitle: 'Genera un nuevo ticket de soporte o seguimiento.',
      },
      {
        title: 'separator',
        divider: true,
      },
      {
        title: 'Configuración',
        to: `${moduleBase.value}/configuracion`,
        icon: 'mdi-cog-outline',
        subtitle: 'Parámetros generales e integraciones del panel.',
      },
    ]
  })

  const currentSection = computed(() => {
    const section = navigationItems.value.find(item => {
      if (!('to' in item) || item.to !== route.path) {
        return false
      }

      if (!('meta' in item)) {
        return true
      }

      return canAccessRouteMeta(item.meta as RouteMeta | undefined, authStore)
    })
    return section && 'to' in section
      ? { title: section.title, subtitle: section.subtitle ?? '' }
      : { title: navigationItems.value[0].title, subtitle: (navigationItems.value[0] as { subtitle?: string }).subtitle ?? '' }
  })

  const drawerWidth = computed(() => {
    if (!drawer.value && (display.xs.value || display.sm.value)) {
      return 0
    }
    return rail.value ? 88 : 280
  })

  const mainStyles = computed(() => ({
    marginInlineStart: `${drawerWidth.value}px`,
    width: `calc(100% - ${drawerWidth.value}px)`,
  }))

  async function handleLogout () {
    await authStore.logout()
    router.push('/login')
  }

  const closeDrawerOnNavigation = () => {
    if (display.xs.value || display.sm.value) {
      drawer.value = false
    }
  }

  // Cerrar el drawer cuando se navega
  router.afterEach(() => {
    closeDrawerOnNavigation()
  })
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
