<template>
  <div class="modules-layout">
    <header class="modules-header">
      <div class="header-container">
        <div class="logo-section">
          <v-img
            alt="URSE"
            class="logo"
            contain
            max-width="120"
            src="@/assets/logo.png"
          />
        </div>
        <div class="header-actions">
          <v-menu>
            <template #activator="{ props }">
              <v-btn
                icon="mdi-account-circle"
                size="large"
                variant="text"
                v-bind="props"
              />
            </template>
            <v-list>
              <v-list-item title="Perfil" />
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
  import { useRouter } from 'vue-router'
  import { useAuthStore } from '@/stores/auth'

  const router = useRouter()
  const authStore = useAuthStore()

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
  background: #f7f7f7;
}

.modules-header {
  background: #ffffff;
  border-bottom: 1px solid rgb(0 0 0 / 0.08);
  padding: 16px 24px;
  position: sticky;
  top: 0;
  z-index: 100;
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
}

.logo {
  height: 40px;
}

.header-actions {
  display: flex;
  gap: 12px;
  align-items: center;
}

.modules-main {
  flex: 1;
  display: flex;
  flex-direction: column;
  padding: 40px 24px;
}
</style>
