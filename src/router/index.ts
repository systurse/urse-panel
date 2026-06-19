/**
 * router/index.ts
 *
 * Manual routes for ./src/pages/*.vue
 */

// Composables
import { createRouter, createWebHistory } from 'vue-router'
import DashboardLayout from '@/layouts/DashboardLayout.vue'
import ModulesLayout from '@/layouts/ModulesLayout.vue'
import SSMLayout from '@/layouts/SSM.vue'
import AdminExitPasses from '@/pages/admin-exit-passes.vue'
import Administration from '@/pages/administracion.vue'
import Aprobaciones from '@/pages/aprobaciones.vue'
import AuthCallback from '@/pages/auth-callback.vue'
import Index from '@/pages/index.vue'
import Login from '@/pages/login.vue'
import Negociaciones from '@/pages/negociaciones.vue'
import Permissions from '@/pages/permissions.vue'
import Roles from '@/pages/roles.vue'
import SACC from '@/pages/sacc.vue'
import Settings from '@/pages/settings.vue'
import SPSPasses from '@/pages/sps-pases.vue'
import SPS from '@/pages/sps.vue'
import SPSReportExitPasses from '@/pages/sps/report-exit-passes.vue'
import SSM from '@/pages/ssm.vue'
import Inscripciones from '@/pages/inscripciones.vue'
import InscripcionesConfirmacion from '@/pages/inscripciones-confirmacion.vue'
import InscripcionesEditar from '@/pages/inscripciones-editar.vue'
import InscripcionesReporte from '@/pages/inscripciones-reporte.vue'
import Credenciales from '@/pages/credenciales.vue'
import MisSolicitudes from '@/pages/mis-solicitudes.vue'
import Tickets from '@/pages/tickets.vue'
import Users from '@/pages/users.vue'
import { useAuthStore } from '@/stores/auth'
import { canAccessRouteMeta } from '@/utils/routeAccess'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      meta: { requiresAuth: true },
      component: ModulesLayout,
      children: [
        {
          path: '',
          component: Index,
        },
      ],
    },
    {
      path: '/sacc',
      meta: { requiresAuth: true },
      component: DashboardLayout,
      children: [
        {
          path: '',
          component: SACC,
        },
        {
          path: 'roles',
          component: Roles,
        },
        {
          path: 'usuarios',
          component: Users,
        },
        {
          path: 'permisos',
          component: Permissions,
        },
        {
          path: 'configuracion',
          component: Settings,
        },
      ],
    },
    {
      path: '/administracion',
      meta: { requiresAuth: true },
      component: DashboardLayout,
      children: [
        {
          path: '',
          component: Administration,
        },
        {
          path: 'usuarios',
          component: Users,
        },
        {
          path: 'roles',
          component: Roles,
        },
        {
          path: 'permisos',
          component: Permissions,
        },
        {
          path: 'pases-salida',
          component: AdminExitPasses,
          meta: { requiresAdministrator: true },
        },
        {
          path: 'configuracion',
          component: Settings,
        },
      ],
    },
    {
      path: '/ssm',
      meta: { requiresAuth: true },
      component: SSMLayout,
      children: [
        {
          path: '',
          component: SSM,
        },
        {
          path: 'negociaciones',
          component: Negociaciones,
        },
        {
          path: 'tickets',
          component: Tickets,
        },
        {
          path: 'mis-solicitudes',
          component: MisSolicitudes,
        },
        {
          path: 'aprobaciones',
          component: Aprobaciones,
        },
        {
          path: 'configuracion',
          component: Settings,
        },
      ],
    },
    {
      path: '/sps',
      meta: { requiresAuth: true },
      component: DashboardLayout,
      children: [
        {
          path: '',
          component: SPS,
        },
        {
          path: 'pases',
          component: SPSPasses,
        },
        {
          path: 'reportes',
          component: SPSReportExitPasses,
          meta: { requiresAnyPermission: ['sps.pass.filter', 'sps.pass.export'] },
        },
        {
          path: 'configuracion',
          component: Settings,
        },
        {
          path: 'administracion/pases-salida',
          component: AdminExitPasses,
          meta: { requiresAdministrator: true },
        },
      ],
    },
    {
      path: '/inscripciones',
      component: DashboardLayout,
      children: [
        {
          path: '',
          component: Inscripciones,
        },
        {
          path: 'confirmacion/:studentId',
          component: InscripcionesConfirmacion,
        },
        {
          path: 'editar/:studentId',
          component: InscripcionesEditar,
        },
        {
          path: 'reporte',
          component: InscripcionesReporte,
        },
      ],
    },
    {
      path: '/login',
      component: Login,
      meta: { guest: true },
    },
    {
      path: '/credenciales',
      component: Credenciales,
      meta: { public: true },
    },
    {
      path: '/auth/callback',
      component: AuthCallback,
      meta: { public: true },
    },
  ],
})

router.beforeEach(to => {
  const token = localStorage.getItem('auth_token')

  if (to.meta.public) {
    return
  }

  if (to.meta.requiresAuth && !token) {
    return { path: '/login' }
  }

  if (to.meta.guest && token) {
    return { path: '/' }
  }

  const authStore = useAuthStore()
  if (!canAccessRouteMeta(to.meta, authStore)) {
    return { path: '/administracion' }
  }
})

export default router
