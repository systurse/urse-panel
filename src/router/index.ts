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
import AdminMail from '@/pages/admin-mail.vue'
import Administration from '@/pages/administracion.vue'
import Aprobaciones from '@/pages/aprobaciones.vue'
import Areas from '@/pages/areas.vue'
import AuthCallback from '@/pages/auth-callback.vue'
import ChatSoporte from '@/pages/chat-soporte.vue'
import Credenciales from '@/pages/credenciales.vue'
import Employees from '@/pages/employees.vue'
import Index from '@/pages/index.vue'
import InscripcionesConfirmacion from '@/pages/inscripciones-confirmacion.vue'
import InscripcionesEditar from '@/pages/inscripciones-editar.vue'
import InscripcionesExportar from '@/pages/inscripciones-exportar.vue'
import InscripcionesImportar from '@/pages/inscripciones-importar.vue'
import InscripcionesListado from '@/pages/inscripciones-listado.vue'
import InscripcionesReporte from '@/pages/inscripciones-reporte.vue'
import Inscripciones from '@/pages/inscripciones.vue'
import Login from '@/pages/login.vue'
import MisSolicitudes from '@/pages/mis-solicitudes.vue'
import Permissions from '@/pages/permissions.vue'
import Roles from '@/pages/roles.vue'
import SACC from '@/pages/sacc.vue'
import Settings from '@/pages/settings.vue'
import Soporte from '@/pages/soporte.vue'
import SPSPasses from '@/pages/sps-pases.vue'
import SPS from '@/pages/sps.vue'
import SPSPassReturnCode from '@/pages/sps/pase-codigo-regreso.vue'
import SPSPassReturnConfirm from '@/pages/sps/pase-confirmar-regreso.vue'
import SPSPassDetail from '@/pages/sps/pase-detalle.vue'
import LeavePermitDetail from '@/pages/sps/permiso-detalle.vue'
import LeavePermits from '@/pages/sps/permisos.vue'
import SPSReportExitPasses from '@/pages/sps/report-exit-passes.vue'
import SSMCrmContactos from '@/pages/ssm-crm-contactos.vue'
import SSMCrmNegociacion from '@/pages/ssm-crm-negociacion.vue'
import SSMCrmPipelines from '@/pages/ssm-crm-pipelines.vue'
import SSMCrmReportes from '@/pages/ssm-crm-reportes.vue'
import SSMCrm from '@/pages/ssm-crm.vue'
import SSMTareas from '@/pages/ssm-tareas.vue'
import SSM from '@/pages/ssm.vue'
import Users from '@/pages/users.vue'
import VerifySignature from '@/pages/verificar.vue'
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
          path: 'areas',
          component: Areas,
        },
        {
          path: 'empleados',
          component: Employees,
        },
        {
          path: 'pases-salida',
          component: AdminExitPasses,
          meta: { requiresAnyPermission: ['sps.pass-signature.sign-as-supervisor'] },
        },
        {
          path: 'correos',
          component: AdminMail,
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
          path: 'crm',
          component: SSMCrm,
          meta: { requiresAnyPermission: ['crm.deals.view'] },
        },
        {
          path: 'crm/negociaciones/:id',
          component: SSMCrmNegociacion,
          meta: { requiresAnyPermission: ['crm.deals.view'] },
        },
        {
          path: 'crm/contactos',
          component: SSMCrmContactos,
          meta: { requiresAnyPermission: ['crm.contacts.view'] },
        },
        {
          path: 'crm/reportes',
          component: SSMCrmReportes,
          meta: { requiresAnyPermission: ['crm.reports.view'] },
        },
        {
          path: 'crm/pipelines',
          component: SSMCrmPipelines,
          meta: { requiresAdministrator: true },
        },
        {
          path: 'tareas',
          component: SSMTareas,
          meta: { requiresAnyPermission: ['crm.tasks.view'] },
        },
        {
          path: 'mis-solicitudes',
          component: MisSolicitudes,
        },
        {
          path: 'aprobaciones',
          component: Aprobaciones,
          meta: { requiresAdministrator: true },
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
          path: 'pases/:id',
          component: SPSPassDetail,
        },
        {
          path: 'pases/:id/regreso',
          component: SPSPassReturnConfirm,
        },
        {
          path: 'pases/:id/codigo',
          component: SPSPassReturnCode,
        },
        {
          path: 'permisos',
          component: LeavePermits,
          meta: {
            grantedToRoles: ['supervisor'],
            requiresAnyPermission: ['sps.permit.index'],
          },
        },
        {
          path: 'permisos/:id',
          component: LeavePermitDetail,
          meta: {
            grantedToRoles: ['supervisor'],
            requiresAnyPermission: ['sps.permit.show'],
          },
        },
        {
          path: 'reportes',
          component: SPSReportExitPasses,
          meta: {
            grantedToRoles: ['supervisor'],
            requiresAnyPermission: ['sps.pass.filter', 'sps.pass.export'],
          },
        },
        {
          path: 'configuracion',
          component: Settings,
        },
        {
          path: 'administracion/pases-salida',
          component: AdminExitPasses,
          meta: { requiresAnyPermission: ['sps.pass-signature.sign-as-supervisor'] },
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
        {
          path: 'listado',
          component: InscripcionesListado,
        },
        {
          path: 'importar',
          component: InscripcionesImportar,
        },
        {
          path: 'exportar',
          component: InscripcionesExportar,
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
      // Target of the QR printed on signed PDFs: opened without a session,
      // usually from a phone.
      path: '/verificar/:code',
      component: VerifySignature,
      meta: { public: true },
    },
    {
      path: '/soporte',
      component: Soporte,
      meta: { public: true },
    },
    {
      path: '/chat',
      component: ChatSoporte,
      meta: { requiresAuth: true },
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
