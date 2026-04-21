/**
 * router/index.ts
 *
 * Manual routes for ./src/pages/*.vue
 */

// Composables
import { createRouter, createWebHistory } from 'vue-router'
import DashboardLayout from '@/layouts/DashboardLayout.vue'
import AuthCallback from '@/pages/auth-callback.vue'
import CreateTicket from '@/pages/create-ticket.vue'
import Fields from '@/pages/fields.vue'
import FormFields from '@/pages/form-fields.vue'
import Forms from '@/pages/forms.vue'
import Index from '@/pages/index.vue'
import Login from '@/pages/login.vue'
import Permissions from '@/pages/permissions.vue'
import Reports from '@/pages/reports.vue'
import Roles from '@/pages/roles.vue'
import Settings from '@/pages/settings.vue'
import Users from '@/pages/users.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      meta: { requiresAuth: true },
      component: DashboardLayout,
      children: [
        {
          path: '',
          component: Index,
        },
        {
          path: 'crear-ticket',
          component: CreateTicket,
        },
        {
          path: 'reportes',
          component: Reports,
        },
        {
          path: 'campos',
          component: Fields,
        },
        {
          path: 'formularios/campos',
          component: FormFields,
        },
        {
          path: 'formularios',
          component: Forms,
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
