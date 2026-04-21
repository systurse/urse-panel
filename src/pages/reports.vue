<template>
  <div class="page-grid">
    <v-card class="page-card" rounded="xl" variant="flat">
      <div class="section-kicker">Rendimiento</div>
      <h2 class="page-title">Reportes de operación</h2>
      <p class="page-copy">
        Monitorea la ejecución de procesos, el comportamiento de módulos y la evolución de
        indicadores clave para la toma de decisiones.
      </p>
    </v-card>

    <div class="report-grid">
      <v-card
        v-for="report in reports"
        :key="report.title"
        class="report-card"
        rounded="xl"
        variant="flat"
      >
        <div class="report-title">{{ report.title }}</div>
        <div class="report-value">{{ report.value }}</div>
        <div class="report-meta">{{ report.meta }}</div>
      </v-card>
    </div>
  </div>
</template>

<script lang="ts" setup>
  const reports = [
    { title: 'Cumplimiento mensual', value: '94%', meta: 'Meta institucional alcanzada' },
    { title: 'Tiempo promedio', value: '18 min', meta: 'Por trámite completado' },
    { title: 'Incidencias', value: '11', meta: 'Pendientes de seguimiento' },
  ]
</script>

<style scoped>
.page-grid,
.report-grid {
  display: grid;
  gap: 20px;
}

.report-grid {
  grid-template-columns: repeat(3, minmax(0, 1fr));
}

.page-card,
.report-card {
  padding: 24px;
  background: #ffffff;
}

.section-kicker {
  color: #FAB21A;
  font-size: 0.8rem;
  font-weight: 800;
  letter-spacing: 0.14em;
  text-transform: uppercase;
}

.page-title,
.report-title {
  margin: 0;
  color: #000000;
  font-weight: 800;
}

.page-title {
  margin-top: 10px;
  font-size: 1.6rem;
}

.page-copy,
.report-meta {
  color: #756467;
  line-height: 1.7;
}

.report-value {
  margin-top: 14px;
  color: #FAB21A;
  font-size: 2rem;
  font-weight: 800;
}

@media (max-width: 960px) {
  .report-grid {
    grid-template-columns: 1fr;
  }
}
</style>
