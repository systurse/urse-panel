<template>
  <div class="modules-container">
    <!-- Hero Section -->
    <section class="hero-section">
      <div class="hero-content">
        <h1 class="hero-title">Bienvenido al Portal URSE</h1>
        <p class="hero-subtitle">Selecciona un módulo para comenzar</p>
      </div>
    </section>

    <!-- Módulos Grid -->
    <section class="modules-grid">
      <router-link
        v-for="module in modules"
        :key="module.id"
        :to="module.path"
        class="module-card-link"
      >
        <v-card
          class="module-card"
          rounded="xl"
          elevation="0"
        >
          <!-- Imagen/Icono del módulo -->
          <div class="module-image-container">
            <div class="module-icon-wrapper" :style="{ backgroundColor: module.color }">
              <v-icon :icon="module.icon" size="48" color="white" />
            </div>
          </div>

          <!-- Contenido del módulo -->
          <div class="module-content">
            <h3 class="module-title">{{ module.title }}</h3>
            <p class="module-description">{{ module.description }}</p>

            <!-- Características rápidas -->
            <div class="module-features">
              <div v-for="feature in module.features" :key="feature" class="feature-item">
                <v-icon icon="mdi-check-circle" size="16" color="#FAB21A" />
                <span>{{ feature }}</span>
              </div>
            </div>
          </div>

          <!-- Footer con CTA -->
          <div class="module-footer">
            <span class="cta-text">Acceder al módulo</span>
            <v-icon icon="mdi-arrow-right" size="20" color="#FAB21A" />
          </div>
        </v-card>
      </router-link>
    </section>
  </div>
</template>

<script lang="ts" setup>
  const modules = [
    {
      id: 'sacc',
      title: 'SACC',
      fullName: 'Sistema de Apartado del Centro de Cómputo',
      description: 'Administra y controla las reservas de equipos de cómputo',
      path: '/sacc',
      icon: 'mdi-desktop-classic',
      color: '#FAB21A',
      features: ['Reservas en tiempo real', 'Control de equipos', 'Reportes de uso'],
    },
    {
      id: 'ssm',
      title: 'SSM',
      fullName: 'Sistema de Servicios y Mantenimiento',
      description: 'Gestiona servicios, mantenimiento preventivo y correctivo',
      path: '/ssm',
      icon: 'mdi-toolbox-outline',
      color: '#1a1a1a',
      features: ['Órdenes de trabajo', 'Programación', 'Seguimiento'],
    },
    {
      id: 'sps',
      title: 'SPS',
      fullName: 'Sistema de Permisos de Salida',
      description: 'Controla y autoriza permisos de salida del personal',
      path: '/sps',
      icon: 'mdi-badge-account-outline',
      color: '#c89215',
      features: ['Solicitud de permisos', 'Autorizaciones', 'Historial'],
    },
  ]
</script>

<style scoped>
.modules-container {
  display: grid;
  gap: 40px;
}

.hero-section {
  padding: 40px 0;
  text-align: center;
}

.hero-content {
  max-width: 640px;
  margin: 0 auto;
}

.hero-title {
  margin: 0;
  font-size: clamp(2rem, 4vw, 3rem);
  font-weight: 800;
  color: #000000;
  letter-spacing: -0.5px;
}

.hero-subtitle {
  margin: 12px 0 0;
  font-size: 1.1rem;
  color: #5e5e5e;
  font-weight: 500;
}

.modules-grid {
  display: grid;
  gap: 28px;
  grid-template-columns: repeat(3, minmax(0, 1fr));
}

.module-card-link {
  text-decoration: none;
  color: inherit;
  transition: transform 0.2s ease, box-shadow 0.2s ease;
}

.module-card-link:hover {
  transform: translateY(-8px);
}

.module-card {
  display: flex;
  flex-direction: column;
  height: 100%;
  background: #ffffff;
  border: 1px solid rgb(0 0 0 / 0.08);
  overflow: hidden;
  transition: all 0.3s ease;
  position: relative;
}

.module-card-link:hover .module-card {
  box-shadow: 0 12px 32px rgb(0 0 0 / 0.12);
  border-color: rgb(250 178 26 / 0.3);
}

.module-image-container {
  padding: 32px 24px 24px;
  background: linear-gradient(135deg, rgb(250 178 26 / 0.08) 0%, rgb(0 0 0 / 0.02) 100%);
  display: flex;
  align-items: center;
  justify-content: center;
}

.module-icon-wrapper {
  width: 80px;
  height: 80px;
  border-radius: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 4px 16px rgba(0 0 0 / 0.1);
}

.module-content {
  flex: 1;
  padding: 24px;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.module-title {
  margin: 0;
  font-size: 1.5rem;
  font-weight: 800;
  color: #000000;
}

.module-description {
  margin: 0;
  font-size: 0.95rem;
  color: #5e5e5e;
  line-height: 1.6;
}

.module-features {
  display: grid;
  gap: 8px;
  margin-top: 8px;
}

.feature-item {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 0.85rem;
  color: #404040;
}

.feature-item :deep(.v-icon) {
  flex-shrink: 0;
}

.module-footer {
  padding: 16px 24px;
  border-top: 1px solid rgb(0 0 0 / 0.08);
  display: flex;
  align-items: center;
  justify-content: space-between;
  background: linear-gradient(135deg, rgb(250 178 26 / 0.04) 0%, transparent 100%);
  transition: background 0.2s ease;
}

.module-card-link:hover .module-footer {
  background: linear-gradient(135deg, rgb(250 178 26 / 0.08) 0%, transparent 100%);
}

.cta-text {
  font-weight: 700;
  color: #FAB21A;
  font-size: 0.9rem;
}

/* Responsive */
@media (max-width: 1200px) {
  .modules-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (max-width: 768px) {
  .modules-grid {
    grid-template-columns: 1fr;
  }

  .hero-title {
    font-size: clamp(1.5rem, 3vw, 2rem);
  }

  .module-card {
    flex-direction: column;
  }
}
</style>
