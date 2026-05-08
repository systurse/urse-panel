<template>
  <div class="sacc-page">
    <!-- Header con información del módulo -->
    <div class="module-header">
      <div class="header-content">
        <h1>SACC</h1>
        <p>Sistema de Apartado del Centro de Cómputo</p>
      </div>
      <div class="header-icon" style="background-color: #FAB21A">
        <v-icon color="white" icon="mdi-desktop-classic" size="32" />
      </div>
    </div>

    <!-- Quick Stats -->
    <div class="stats-grid">
      <v-card class="stat-card" rounded="xl">
        <v-card-text>
          <div class="stat-label">Reservaciones activas</div>
          <div class="stat-value">12</div>
        </v-card-text>
      </v-card>

      <v-card class="stat-card" rounded="xl">
        <v-card-text>
          <div class="stat-label">Equipos disponibles</div>
          <div class="stat-value">28</div>
        </v-card-text>
      </v-card>

      <v-card class="stat-card" rounded="xl">
        <v-card-text>
          <div class="stat-label">Equipos en mantenimiento</div>
          <div class="stat-value">3</div>
        </v-card-text>
      </v-card>
    </div>

    <!-- Main Content -->
    <v-card class="module-card" rounded="xl">
      <v-card-text>
        <div class="coming-soon">
          <v-icon color="#FAB21A" icon="mdi-hammer-wrench" size="64" />
          <h2>Módulo en desarrollo</h2>
          <p>Las funcionalidades del SACC estarán disponibles pronto.</p>
        </div>
      </v-card-text>
    </v-card>
  </div>
</template>

<script lang="ts" setup>
  import { useSACC } from '@/modules/sacc/hooks/useSACC'

  const { reservations, loading } = useSACC()
</script>

<style scoped>
.sacc-page {
  display: grid;
  gap: 24px;
}

.module-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  padding: 24px;
  background: linear-gradient(135deg, rgb(250 178 26 / 0.1) 0%, transparent 100%);
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
