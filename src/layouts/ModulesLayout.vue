<template>
  <div class="modules-layout">
    <header class="modules-header">
      <div class="header-container">
        <div class="logo-section">
          <v-img
            alt="URSE - Universidad Regional del Sureste"
            class="logo"
            contain
            src="@/assets/logo.png"
          />
        </div>
        <div class="header-actions">
          <v-menu>
            <template #activator="{ props }">
              <div class="user-info">
                <div class="user-details">
                  <div class="user-name">{{ userName }}</div>
                  <div class="user-role">{{ userRole }}</div>
                </div>
                <v-btn
                  icon="mdi-account-circle"
                  size="large"
                  variant="text"
                  v-bind="props"
                />
              </div>
            </template>
            <v-list>
              <v-list-item prepend-icon="mdi-shield-crown-outline" title="Administración" to="/administracion" />
              <v-list-item title="Mi Perfil" />
              <v-list-item title="Configuración" />
              <v-divider />
              <v-list-item
                title="Cerrar sesión"
                @click="handleLogout"
              />
            </v-list>
          </v-menu>
        </div>
      </div>
    </header>

    <main class="modules-main">
      <router-view />
    </main>
  </div>
</template>

<script lang="ts" setup>
  import { computed } from 'vue'
  import { useRouter } from 'vue-router'
  import { useAuthStore } from '@/stores/auth'
  import { formatRoleLabel } from '@/utils/auth'

  const router = useRouter()
  const authStore = useAuthStore()

  const userName = computed(() => {
    return authStore.user?.name || authStore.user?.email?.split('@')[0] || 'Usuario'
  })

  const userRole = computed(() => {
    return formatRoleLabel(authStore.role)
  })

  async function handleLogout () {
    await authStore.logout()
    router.push('/login')
  }
</script>

<style scoped>
.modules-layout {
  display: flex;
  flex-direction: column;
  min-height: 100vh;
  background: linear-gradient(135deg, #000000 0%, #1a1a1a 50%, #FAB21A 50%, #FAB21A 100%);
}

.modules-header {
  background: #ffffff;
  border-bottom: 2px solid #FAB21A;
  padding: 12px 24px;
  position: sticky;
  top: 0;
  z-index: 100;
  box-shadow: 0 2px 8px rgb(0 0 0 / 0.08);
}

.header-container {
  max-width: 1400px;
  margin: 0 auto;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 24px;
}

.logo-section {
  display: flex;
  align-items: center;
  min-width: 140px;
}

.logo {
  height: 48px;
  width: auto;
}

.header-actions {
  display: flex;
  gap: 16px;
  align-items: center;
}

.user-info {
  display: flex;
  align-items: center;
  gap: 12px;
  cursor: pointer;
  padding: 8px 12px;
  border-radius: 8px;
  transition: background 0.2s ease;
}

.user-info:hover {
  background: rgb(0 0 0 / 0.04);
}

.user-details {
  text-align: right;
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.user-name {
  font-weight: 700;
  color: #000000;
  font-size: 0.9rem;
}

.user-role {
  font-size: 0.75rem;
  color: #5e5e5e;
  text-transform: capitalize;
}

.modules-main {
  flex: 1;
  display: flex;
  flex-direction: column;
  padding: 40px 24px;
  max-width: 1400px;
  margin: 0 auto;
  width: 100%;
  box-sizing: border-box;
}

@media (max-width: 768px) {
  .user-details {
    display: none;
  }

  .header-container {
    gap: 12px;
  }

  .modules-main {
    padding: 24px 16px;
  }
}
</style>
