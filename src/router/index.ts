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
import SPS from '@/pages/sps.vue'
import SSM from '@/pages/ssm.vue'
import Tickets from '@/pages/tickets.vue'
import Users from '@/pages/users.vue'

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
          path: '/negociaciones',
          component: Negociaciones,
        },
        {
          path: '/tickets',
          component: Tickets,
        },
        {
          path: '/aprobaciones',
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
          path: 'configuracion',
          component: Settings,
        },
      ],
    },
    {
      path: '/login',
      component: Login,
      meta: { guest: true },
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
})

export default router
