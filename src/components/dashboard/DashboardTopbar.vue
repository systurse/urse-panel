<template>
  <v-app-bar app class="topbar-shell" elevation="0" height="112">
    <div class="topbar-inner">
      <div>
        <div class="eyebrow">Centro de control</div>
        <h1 class="topbar-title">{{ title }}</h1>
        <div class="topbar-subtitle">{{ subtitle }}</div>
      </div>

      <div class="topbar-actions">
        <v-text-field
          class="topbar-search"
          density="comfortable"
          hide-details
          placeholder="Buscar modulo o accion"
          prepend-inner-icon="mdi-magnify"
          variant="solo-filled"
        />

        <v-btn icon="mdi-bell-outline" variant="text" />

        <v-menu location="bottom end">
          <template #activator="{ props }">
            <v-btn class="profile-trigger" v-bind="props" variant="text">
              <div class="profile-meta">
                <span class="profile-name">{{ userName }}</span>
                <span class="profile-role">{{ userRole }}</span>
              </div>
              <v-avatar color="#000000" size="38">
                <span class="profile-initials">{{ userInitials }}</span>
              </v-avatar>
            </v-btn>
          </template>

          <v-list min-width="220">
            <v-list-item :subtitle="userEmail" :title="userName" />
            <v-divider />
            <v-list-item prepend-icon="mdi-shield-crown-outline" title="Administración" to="/administracion" />
            <v-list-item prepend-icon="mdi-logout" title="Cerrar sesión" @click="emit('logout')" />
          </v-list>
        </v-menu>
      </div>
    </div>
  </v-app-bar>
</template>

<script lang="ts" setup>
  import { storeToRefs } from 'pinia'
  import { computed } from 'vue'
  import { useAuthStore } from '@/stores/auth'
  import { formatRoleLabel } from '@/utils/auth'

  defineProps<{
    title: string
    subtitle: string
  }>()

  const emit = defineEmits<{
    logout: []
  }>()

  const authStore = useAuthStore()
  const { role, user } = storeToRefs(authStore)

  const userName = computed(() => user.value?.name || user.value?.email?.split('@')[0] || 'Usuario')
  const userEmail = computed(() => user.value?.email || 'Sin correo')
  const userRole = computed(() => formatRoleLabel(role.value))
  const userInitials = computed(() => {
    const source = user.value?.name?.trim() || user.value?.email || 'U'
    const parts = source.split(/\s+/).filter(Boolean)
    return parts.slice(0, 2).map(part => part[0]?.toUpperCase() ?? '').join('') || 'U'
  })
</script>

<style scoped>
.topbar-shell {
  position: sticky;
  top: 0;
  z-index: 10;
  border-bottom: 1px solid rgb(0 0 0 / 0.08) !important;
  display: flex;
  background:
    linear-gradient(180deg, rgb(255 255 255 / 0.96), rgb(255 255 255 / 0.88)),
    linear-gradient(135deg, #fff7e0 0%, #ffffff 55%, #ffe8a8 100%);
  backdrop-filter: blur(12px);
}

.topbar-inner {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  width: 100%;
  padding: 20px 28px;
}

.eyebrow {
  color: #FAB21A;
  font-size: 0.78rem;
  font-weight: 700;
  letter-spacing: 0.14em;
  text-transform: uppercase;
}

.topbar-title {
  margin: 2px 0 0;
  color: #000000;
  font-size: 1.75rem;
  font-weight: 800;
}

.topbar-subtitle {
  color: #4a4a4a;
  font-size: 0.94rem;
}

.topbar-actions {
  display: flex;
  align-items: center;
  gap: 10px;
}

.topbar-search {
  width: min(360px, 42vw);
}

.profile-trigger {
  min-width: auto;
  padding: 6px 8px;
}

.profile-meta {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  margin-right: 10px;
  text-transform: none;
}

.profile-name {
  color: #101010;
  font-size: 0.92rem;
  font-weight: 700;
}

.profile-role {
  color: #5e5e5e;
  font-size: 0.76rem;
}

.profile-initials {
  color: #FAB21A;
  font-weight: 800;
}

@media (max-width: 960px) {
  .topbar-shell {
    height: auto !important;
  }

  .topbar-inner {
    flex-direction: column;
    align-items: stretch;
    padding: 18px 20px;
  }

  .topbar-actions {
    width: 100%;
  }

  .topbar-search {
    flex: 1;
    width: 100%;
  }

  .profile-meta {
    display: none;
  }
}
</style>
