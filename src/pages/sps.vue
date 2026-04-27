<template>
  <div class="sps-page">
    <!-- Header con información del módulo -->
    <div class="module-header">
      <div class="header-content">
        <h1>SPS</h1>
        <p>Sistema de Permisos de Salida</p>
      </div>
      <div class="header-icon" style="background-color: #c89215">
        <v-icon icon="mdi-badge-account-outline" size="32" color="white" />
      </div>
    </div>

    <!-- Quick Stats -->
    <div class="stats-grid">
      <v-card rounded="xl" class="stat-card">
        <v-card-text>
          <div class="stat-label">Permisos solicitados</div>
          <div class="stat-value">45</div>
        </v-card-text>
      </v-card>

      <v-card rounded="xl" class="stat-card">
        <v-card-text>
          <div class="stat-label">Pendientes aprobación</div>
          <div class="stat-value">7</div>
        </v-card-text>
      </v-card>

      <v-card rounded="xl" class="stat-card">
        <v-card-text>
          <div class="stat-label">Aprobados</div>
          <div class="stat-value">38</div>
        </v-card-text>
      </v-card>
    </div>

    <!-- Main Content -->
    <v-card rounded="xl" class="module-card">
      <v-card-text>
        <div class="coming-soon">
          <v-icon icon="mdi-hammer-wrench" size="64" color="#c89215" />
          <h2>Módulo en desarrollo</h2>
          <p>Las funcionalidades del SPS estarán disponibles pronto.</p>
        </div>
      </v-card-text>
    </v-card>
  </div>
</template>

<script lang="ts" setup>
  import { useSPS } from '@/modules/sps/hooks/useSPS'

  const { exitPermissions, pendingApprovals, loading } = useSPS()
</script>

<style scoped>
.sps-page {
  display: grid;
  gap: 24px;
}

.module-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  padding: 24px;
  background: linear-gradient(135deg, rgb(200 146 21 / 0.08) 0%, transparent 100%);
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
}

.header-icon {
  width: 64px;
  height: 64px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.stats-grid {
  display: grid;
  gap: 16px;
  grid-template-columns: repeat(3, 1fr);
}

.stat-card {
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

.module-card {
  background: #ffffff;
  border: 1px solid rgb(0 0 0 / 0.08);
}

.coming-soon {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 16px;
  padding: 60px 40px;
  text-align: center;
}

.coming-soon h2 {
  margin: 0;
  color: #000000;
  font-size: 1.5rem;
  font-weight: 800;
}

.coming-soon p {
  margin: 0;
  color: #5e5e5e;
  font-size: 0.95rem;
}

@media (max-width: 1024px) {
  .stats-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (max-width: 768px) {
  .stats-grid {
    grid-template-columns: 1fr;
  }

  .module-header {
    flex-direction: column;
    gap: 16px;
  }
}
</style>
