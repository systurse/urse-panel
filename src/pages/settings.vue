<template>
  <div class="settings-grid">
    <v-card class="settings-card" rounded="xl" variant="flat">
      <div class="section-kicker">Sistema</div>
      <h2 class="settings-title">Configuración general</h2>
      <p class="settings-copy">
        Ajusta parámetros clave del sistema, revisa la conectividad de integraciones y define
        lineamientos operativos del panel.
      </p>
    </v-card>

    <v-card class="settings-card" rounded="xl" variant="flat">
      <div v-for="setting in settings" :key="setting.title" class="setting-row">
        <div>
          <div class="setting-title">{{ setting.title }}</div>
          <div class="setting-caption">{{ setting.caption }}</div>
        </div>
        <v-switch color="#FAB21A" inset :model-value="setting.enabled" />
      </div>
    </v-card>
  </div>
</template>

<script lang="ts" setup>
  const settings = [
    {
      title: 'Notificaciones críticas',
      caption: 'Alertas para eventos prioritarios del sistema.',
      enabled: true,
    },
    {
      title: 'Respaldo automático',
      caption: 'Ejecución diaria fuera de horario laboral.',
      enabled: true,
    },
    {
      title: 'Modo de mantenimiento',
      caption: 'Bloquea temporalmente accesos no administrativos.',
      enabled: false,
    },
  ]
</script>

<style scoped>
.settings-grid {
  display: grid;
  gap: 20px;
}

.settings-card {
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

.settings-title {
  margin: 10px 0 0;
  color: #000000;
  font-size: 1.5rem;
  font-weight: 800;
}

.settings-copy,
.setting-caption {
  color: #7b696d;
  line-height: 1.7;
}

.setting-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 18px;
  padding: 14px 0;
  border-bottom: 1px solid rgb(106 27 49 / 0.08);
}

.setting-row:last-child {
  border-bottom: 0;
}

.setting-title {
  color: #000000;
  font-weight: 700;
}

@media (max-width: 960px) {
  .setting-row {
    flex-direction: column;
    align-items: flex-start;
  }
}
</style>
