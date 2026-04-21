<template>
  <div class="dashboard-grid">
    <section class="hero-card">
      <div>
        <div class="section-kicker">Operación diaria</div>
        <h2 class="hero-title">Supervisión centralizada del sistema URSE</h2>
        <p class="hero-copy">
          Consulta el estado general, detecta incidencias y mantén control sobre accesos,
          trámites y actividad reciente desde un solo panel.
        </p>
      </div>

      <div class="hero-stats">
        <div class="hero-stat">
          <span class="hero-stat-value">128</span>
          <span class="hero-stat-label">Solicitudes activas</span>
        </div>
        <div class="hero-stat">
          <span class="hero-stat-value">24</span>
          <span class="hero-stat-label">Requieren revisión</span>
        </div>
      </div>
    </section>

    <section class="metrics-grid">
      <v-card
        v-for="metric in metrics"
        :key="metric.title"
        class="metric-card"
        rounded="xl"
        variant="flat"
      >
        <div class="metric-header">
          <v-avatar :color="metric.color" size="42" variant="tonal">
            <v-icon :icon="metric.icon" />
          </v-avatar>
          <span class="metric-trend">{{ metric.trend }}</span>
        </div>

        <div class="metric-value">{{ metric.value }}</div>
        <div class="metric-title">{{ metric.title }}</div>
        <div class="metric-description">{{ metric.description }}</div>
      </v-card>
    </section>

    <section class="content-columns">
      <v-card class="panel-card" rounded="xl" variant="flat">
        <div class="panel-head">
          <div>
            <div class="section-kicker">Actividad reciente</div>
            <h3 class="panel-title">Movimientos del sistema</h3>
          </div>
        </div>

        <div class="activity-list">
          <div v-for="event in activity" :key="event.title" class="activity-item">
            <div class="activity-dot" />
            <div>
              <div class="activity-title">{{ event.title }}</div>
              <div class="activity-meta">{{ event.meta }}</div>
            </div>
          </div>
        </div>
      </v-card>

      <v-card class="panel-card panel-card-accent" rounded="xl" variant="flat">
        <div class="section-kicker">Resumen rápido</div>
        <h3 class="panel-title">Pendientes estratégicos</h3>

        <div class="summary-stack">
          <div v-for="item in summary" :key="item.label" class="summary-item">
            <div>
              <div class="summary-label">{{ item.label }}</div>
              <div class="summary-caption">{{ item.caption }}</div>
            </div>
            <div class="summary-value">{{ item.value }}</div>
          </div>
        </div>
      </v-card>
    </section>
  </div>
</template>

<script lang="ts" setup>
  const metrics = [
    {
      title: 'Usuarios conectados',
      value: '86',
      trend: '+12%',
      description: 'Sesiones con actividad en la última hora.',
      icon: 'mdi-account-multiple-outline',
      color: '#FAB21A',
    },
    {
      title: 'Trámites procesados',
      value: '1,240',
      trend: '+8%',
      description: 'Registros atendidos durante esta semana.',
      icon: 'mdi-file-document-outline',
      color: '#000000',
    },
    {
      title: 'Alertas abiertas',
      value: '07',
      trend: '-3%',
      description: 'Eventos pendientes de revisión por el equipo.',
      icon: 'mdi-alert-circle-outline',
      color: '#c89215',
    },
  ]

  const activity = [
    {
      title: 'Actualización de permisos en módulo de usuarios',
      meta: 'Hace 12 minutos por Super Admin',
    },
    {
      title: 'Sincronización de expedientes completada',
      meta: 'Hace 34 minutos por Proceso automático',
    },
    {
      title: 'Nuevo acceso registrado desde oficina central',
      meta: 'Hace 1 hora por Módulo de autenticación',
    },
  ]

  const summary = [
    {
      label: 'Solicitudes por validar',
      caption: 'Prioridad alta para turno matutino',
      value: '18',
    },
    {
      label: 'Equipos con mantenimiento',
      caption: 'Programados para esta semana',
      value: '05',
    },
    {
      label: 'Integraciones activas',
      caption: 'Servicios conectados actualmente',
      value: '09',
    },
  ]
</script>

<style scoped>
.dashboard-grid {
  display: grid;
  gap: 24px;
}

.hero-card {
  display: flex;
  justify-content: space-between;
  gap: 24px;
  padding: 28px;
  border-radius: 28px;
  background:
    radial-gradient(circle at top right, rgb(250 178 26 / 0.28), transparent 32%),
    linear-gradient(135deg, #000000 0%, #1a1a1a 55%, #2a2a2a 100%);
  color: white;
}

.section-kicker {
  margin-bottom: 10px;
  color: #FAB21A;
  font-size: 0.8rem;
  font-weight: 800;
  letter-spacing: 0.14em;
  text-transform: uppercase;
}

.hero-card .section-kicker {
  color: #FAB21A;
}

.hero-title {
  max-width: 640px;
  margin: 0;
  font-size: clamp(1.9rem, 2vw, 2.7rem);
  font-weight: 800;
  line-height: 1.05;
}

.hero-copy {
  max-width: 680px;
  margin: 16px 0 0;
  color: rgb(255 255 255 / 0.82);
  font-size: 1rem;
  line-height: 1.7;
}

.hero-stats {
  display: grid;
  gap: 14px;
  min-width: 220px;
}

.hero-stat {
  display: flex;
  flex-direction: column;
  gap: 4px;
  padding: 18px 20px;
  border: 1px solid rgb(250 178 26 / 0.28);
  border-radius: 22px;
  background: rgb(255 255 255 / 0.06);
  backdrop-filter: blur(8px);
}

.hero-stat-value {
  color: #FAB21A;
  font-size: 1.8rem;
  font-weight: 800;
}

.hero-stat-label {
  color: rgb(255 255 255 / 0.74);
}

.metrics-grid {
  display: grid;
  gap: 20px;
  grid-template-columns: repeat(3, minmax(0, 1fr));
}

.metric-card {
  padding: 22px;
  background: #ffffff;
  border: 1px solid rgb(0 0 0 / 0.06);
}

.metric-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.metric-trend {
  color: #2f7b4d;
  font-size: 0.85rem;
  font-weight: 700;
}

.metric-value {
  margin-top: 18px;
  color: #000000;
  font-size: 2rem;
  font-weight: 800;
}

.metric-title {
  margin-top: 6px;
  color: #1a1a1a;
  font-weight: 700;
}

.metric-description {
  margin-top: 8px;
  color: #5e5e5e;
  line-height: 1.6;
}

.content-columns {
  display: grid;
  gap: 20px;
  grid-template-columns: minmax(0, 1.6fr) minmax(320px, 1fr);
}

.panel-card {
  padding: 24px;
  background: #ffffff;
  border: 1px solid rgb(0 0 0 / 0.06);
}

.panel-card-accent {
  background:
    radial-gradient(circle at top, rgb(250 178 26 / 0.18), transparent 28%),
    #ffffff;
  border: 1px solid rgb(250 178 26 / 0.3);
}

.panel-head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
}

.panel-title {
  margin: 0;
  color: #000000;
  font-size: 1.3rem;
  font-weight: 800;
}

.activity-list,
.summary-stack {
  display: grid;
  gap: 16px;
  margin-top: 20px;
}

.activity-item,
.summary-item {
  display: flex;
  gap: 14px;
  align-items: flex-start;
  padding: 16px 0;
  border-bottom: 1px solid rgb(0 0 0 / 0.08);
}

.activity-item:last-child,
.summary-item:last-child {
  border-bottom: 0;
  padding-bottom: 0;
}

.activity-dot {
  width: 12px;
  height: 12px;
  margin-top: 5px;
  border-radius: 999px;
  background: linear-gradient(135deg, #000000, #FAB21A);
}

.activity-title,
.summary-label {
  color: #000000;
  font-weight: 700;
}

.activity-meta,
.summary-caption {
  margin-top: 4px;
  color: #5e5e5e;
  line-height: 1.5;
}

.summary-item {
  justify-content: space-between;
  align-items: center;
}

.summary-value {
  color: #FAB21A;
  font-size: 1.5rem;
  font-weight: 800;
}

@media (max-width: 1200px) {
  .metrics-grid,
  .content-columns {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 960px) {
  .hero-card {
    flex-direction: column;
  }

  .hero-stats {
    min-width: 0;
  }
}
</style>
