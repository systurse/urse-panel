<template>
  <div class="administration-page">
    <div class="module-header">
      <div class="header-content">
        <h1>Administración</h1>
        <p>Gestiona usuarios, roles y permisos del panel desde un módulo independiente.</p>
      </div>
      <div class="header-icon">
        <v-icon color="white" icon="mdi-shield-crown-outline" size="32" />
      </div>
    </div>

    <div class="stats-grid">
      <v-card class="stat-card" rounded="xl">
        <v-card-text>
          <div class="stat-label">Rol actual</div>
          <div class="stat-value stat-value--compact">{{ roleLabel }}</div>
        </v-card-text>
      </v-card>

      <v-card class="stat-card" rounded="xl">
        <v-card-text>
          <div class="stat-label">Permisos cargados</div>
          <div class="stat-value">{{ permissionsCount }}</div>
        </v-card-text>
      </v-card>

      <v-card class="stat-card" rounded="xl">
        <v-card-text>
          <div class="stat-label">Secciones</div>
          <div class="stat-value">{{ sections.length }}</div>
        </v-card-text>
      </v-card>
    </div>

    <div class="sections-grid">
      <router-link
        v-for="section in sections"
        :key="section.to"
        class="section-link"
        :to="section.to"
      >
        <v-card class="section-card" rounded="xl" variant="flat">
          <div class="section-icon">
            <v-icon :icon="section.icon" size="28" />
          </div>
          <div class="section-title">{{ section.title }}</div>
          <div class="section-description">{{ section.description }}</div>
        </v-card>
      </router-link>
    </div>
  </div>
</template>

<script lang="ts" setup>
  import { storeToRefs } from 'pinia'
  import { computed } from 'vue'
  import { useAdministration } from '@/modules/administracion/hooks/useAdministration'
  import { useAuthStore } from '@/stores/auth'
  import { formatRoleLabel } from '@/utils/auth'

  const authStore = useAuthStore()
  const { permissions, role } = storeToRefs(authStore)
  const { sections } = useAdministration()

  const permissionsCount = computed(() => permissions.value.length)
  const roleLabel = computed(() => formatRoleLabel(role.value))
</script>

<style scoped>
.administration-page {
  display: grid;
  gap: 24px;
}

.module-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  padding: 24px;
  background: linear-gradient(135deg, rgb(61 44 0 / 0.08) 0%, rgb(250 178 26 / 0.12) 100%);
  border-radius: 16px;
}

.header-content h1 {
  margin: 0;
  font-size: 2rem;
  font-weight: 800;
  color: #000000;
}

.header-content p {
  margin: 8px 0 0;
  color: #5e5e5e;
  font-size: 0.95rem;
  max-width: 640px;
}

.header-icon {
  width: 64px;
  height: 64px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #3d2c00;
}

.stats-grid,
.sections-grid {
  display: grid;
  gap: 16px;
}

.stats-grid {
  grid-template-columns: repeat(3, minmax(0, 1fr));
}

.stat-card,
.section-card {
  background: #ffffff;
  border: 1px solid rgb(0 0 0 / 0.08);
}

.stat-label {
  color: #5e5e5e;
  font-size: 0.85rem;
  font-weight: 500;
  margin-bottom: 8px;
}

.stat-value {
  color: #000000;
  font-size: 2rem;
  font-weight: 800;
}

.stat-value--compact {
  font-size: 1.45rem;
}

.sections-grid {
  grid-template-columns: repeat(3, minmax(0, 1fr));
}

.section-link {
  color: inherit;
  text-decoration: none;
}

.section-card {
  height: 100%;
  padding: 22px;
  transition: transform 0.2s ease, box-shadow 0.2s ease;
}

.section-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 12px 24px rgb(0 0 0 / 0.08);
}

.section-icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 52px;
  height: 52px;
  border-radius: 14px;
  background: #fff2cc;
  color: #3d2c00;
}

.section-title {
  margin-top: 18px;
  color: #000000;
  font-size: 1.15rem;
  font-weight: 800;
}

.section-description {
  margin-top: 10px;
  color: #5e5e5e;
  line-height: 1.6;
}

@media (max-width: 1024px) {
  .stats-grid,
  .sections-grid {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 768px) {
  .module-header {
    flex-direction: column;
    gap: 16px;
  }
}
</style>
