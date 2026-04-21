<template>
  <v-card class="permissions-card" rounded="xl" variant="flat">
    <div class="card-head">
      <div>
        <div class="section-kicker">Administración</div>
        <h2 class="card-title">Permisos del sistema</h2>
      </div>
    </div>

    <v-alert
      v-if="error"
      class="mt-6"
      closable
      color="error"
      density="comfortable"
      variant="tonal"
      @click:close="clearError"
    >
      {{ error }}
    </v-alert>

    <div class="search-bar">
      <v-text-field
        v-model="searchQuery"
        clearable
        density="comfortable"
        hide-details
        placeholder="Buscar por nombre, módulo o descripción"
        prepend-inner-icon="mdi-magnify"
        variant="outlined"
      />
    </div>

    <div v-if="loading" class="permissions-state">
      <v-progress-circular color="#FAB21A" indeterminate />
      <span>Cargando permisos...</span>
    </div>

    <div v-else-if="filteredPermissions.length === 0" class="permissions-state permissions-state--empty">
      <v-icon color="#FAB21A" icon="mdi-lock-off-outline" size="32" />
      <span v-if="searchQuery">No se encontraron permisos para "{{ searchQuery }}"</span>
      <span v-else>No hay permisos disponibles.</span>
    </div>

    <div v-else class="permission-list">
      <div v-for="permission in filteredPermissions" :key="permission.id" class="permission-row">
        <div class="permission-main">
          <v-avatar color="#f1ddd0" size="44">
            <v-icon color="#FAB21A" icon="mdi-key-variant" size="24" />
          </v-avatar>
          <div>
            <div class="permission-name">{{ permission.name }}</div>
            <div class="permission-module">{{ permission.module }}</div>
          </div>
        </div>

        <div class="permission-description">{{ permission.description }}</div>

        <div class="permission-actions">
          <v-btn
            color="#FAB21A"
            disabled
            icon="mdi-pencil"
            size="small"
            variant="text"
            @click="handleEdit(permission)"
          />
          <v-btn
            color="error"
            disabled
            icon="mdi-delete"
            size="small"
            variant="text"
            @click="handleDelete(permission)"
          />
        </div>
      </div>
    </div>

    <div v-if="filteredPermissions.length > 0" class="permission-count">
      Mostrando {{ filteredPermissions.length }} de {{ permissions.length }} permisos
    </div>
  </v-card>
</template>

<script lang="ts" setup>
  import type { Permission } from '@/modules/permissions/port'
  import { computed, ref } from 'vue'
  import { usePermissions } from '@/modules/permissions/usePermissions'

  const { error, loading, permissions } = usePermissions()

  const searchQuery = ref('')

  const filteredPermissions = computed(() => {
    const query = searchQuery.value.toLowerCase().trim()

    if (!query) return permissions.value

    return permissions.value.filter(p =>
      p.name.toLowerCase().includes(query)
      || p.module.toLowerCase().includes(query)
      || p.description.toLowerCase().includes(query),
    )
  })

  function clearError () {
    error.value = null
  }

  // TODO: Implement edit functionality
  function handleEdit (_permission: Permission) {
    // Placeholder for future edit dialog
  }

  // TODO: Implement delete functionality
  function handleDelete (_permission: Permission) {
    // Placeholder for future delete confirmation
  }
</script>

<style scoped>
.permissions-card {
  padding: 24px;
  background: #ffffff;
}

.card-head,
.permission-row,
.permission-main {
  display: flex;
  align-items: center;
}

.card-head,
.permission-row {
  justify-content: space-between;
  gap: 16px;
}

.section-kicker {
  color: #FAB21A;
  font-size: 0.8rem;
  font-weight: 800;
  letter-spacing: 0.14em;
  text-transform: uppercase;
}

.card-title {
  margin: 10px 0 0;
  color: #000000;
  font-size: 1.5rem;
  font-weight: 800;
}

.search-bar {
  margin-top: 20px;
}

.permission-list {
  display: grid;
  gap: 14px;
  margin-top: 20px;
}

.permissions-state {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
  min-height: 180px;
  margin-top: 24px;
  color: #6f5a60;
  text-align: center;
}

.permissions-state--empty {
  flex-direction: column;
}

.permission-row {
  padding: 16px 0;
  border-bottom: 1px solid rgb(106 27 49 / 0.08);
}

.permission-row:last-child {
  border-bottom: 0;
}

.permission-main {
  gap: 14px;
  flex: 1;
}

.permission-name {
  color: #000000;
  font-weight: 700;
}

.permission-module {
  color: #FAB21A;
  font-size: 0.85rem;
  font-weight: 600;
}

.permission-description {
  color: #5e5e5e;
  max-width: 280px;
  text-align: center;
  font-size: 0.9rem;
}

.permission-actions {
  display: flex;
  gap: 4px;
}

.permission-count {
  margin-top: 16px;
  color: #5e5e5e;
  font-size: 0.85rem;
  text-align: right;
}

@media (max-width: 960px) {
  .card-head,
  .permission-row {
    flex-direction: column;
    align-items: flex-start;
  }

  .permission-description,
  .permission-actions {
    align-self: flex-end;
  }
}
</style>
