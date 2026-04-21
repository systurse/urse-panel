<template>
  <v-navigation-drawer
    app
    class="dashboard-drawer"
    color="#000000"
    :model-value="modelValue"
    permanent
    :rail="rail"
    rail-width="88"
    width="280"
    @update:model-value="emit('update:modelValue', $event)"
  >
    <div class="sidebar-shell">
      <div class="sidebar-brand">
        <div class="brand-mark">UR</div>
        <div v-if="!rail" class="brand-copy">
          <div class="brand-title">URSE</div>
          <div class="brand-subtitle">Panel administrativo</div>
        </div>
      </div>

      <v-list class="sidebar-nav" density="comfortable" nav>
        <template v-for="(item, index) in items" :key="'to' in item ? item.to : `divider-${index}`">
          <v-divider v-if="'divider' in item && item.divider" class="sidebar-divider" />

          <v-list-item
            v-else
            :active="route.path === (item as NavigationItem).to"
            class="sidebar-item"
            :class="{ 'sidebar-item-rail': rail, 'sidebar-item-full': !rail }"
            color="#FAB21A"
            rounded="xl"
            :to="(item as NavigationItem).to"
          >
            <template #prepend>
              <v-icon :icon="(item as NavigationItem).icon" />
            </template>

            <template v-if="!rail" #title>
              <span class="sidebar-item-label">{{ (item as NavigationItem).title }}</span>
            </template>
          </v-list-item>
        </template>
      </v-list>

      <div class="sidebar-footer">
        <v-btn
          color="#FAB21A"
          :icon="rail ? 'mdi-chevron-right' : 'mdi-chevron-left'"
          size="small"
          variant="tonal"
          @click="emit('toggle-rail')"
        />
      </div>
    </div>
  </v-navigation-drawer>
</template>

<script lang="ts" setup>
  import { useRoute } from 'vue-router'

  interface NavigationItem {
    title: string
    to: string
    icon: string
  }

  interface NavigationDivider {
    divider: boolean
    title?: string
  }

  type NavItem = NavigationItem | NavigationDivider

  defineProps<{
    items: NavItem[]
    modelValue: boolean
    rail: boolean
  }>()

  const emit = defineEmits<{
    'update:modelValue': [value: boolean]
    'toggle-rail': []
  }>()

  const route = useRoute()
</script>

<style scoped>
.dashboard-drawer {
  height: 100dvh !important;
}

:deep(.v-navigation-drawer__content) {
  height: 100%;
  overflow: hidden;
  background:
    radial-gradient(circle at top, rgb(250 178 26 / 0.18), transparent 34%),
    linear-gradient(180deg, #000000 0%, #1a1a1a 100%);
}

.sidebar-shell {
  display: flex;
  flex-direction: column;
  height: 100%;
  min-height: 0;
  padding: 18px 14px;
}

.sidebar-brand {
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 10px 8px 22px;
}

.brand-mark {
  display: grid;
  place-items: center;
  width: 48px;
  height: 48px;
  border-radius: 16px;
  background: #FAB21A;
  color: #000000;
  font-size: 1rem;
  font-weight: 800;
  letter-spacing: 0.08em;
}

.brand-copy {
  min-width: 0;
}

.brand-title {
  color: #FAB21A;
  font-size: 1rem;
  font-weight: 800;
  letter-spacing: 0.08em;
}

.brand-subtitle {
  color: rgb(255 255 255 / 0.72);
  font-size: 0.82rem;
}

.sidebar-nav {
  flex: 1;
  min-height: 0;
  background: transparent;
  overflow: auto;
}

.sidebar-item {
  color: white;
}

.sidebar-item-label {
  color: white;
}

:deep(.sidebar-item-full .v-list-item__prepend) {
  margin-inline-end: 16px;
}

:deep(.sidebar-item-rail) {
  display: flex;
  align-items: center;
  justify-content: center;
  padding-inline: 0 !important;
  min-height: 48px;
}

:deep(.sidebar-item-rail .v-list-item__prepend) {
  display: flex;
  flex: 0 0 auto;
  align-items: center;
  justify-content: center;
  width: 100%;
  margin: 0;
  padding: 0;
}

:deep(.sidebar-item-rail .v-list-item__spacer) {
  display: none !important;
  width: 0 !important;
}

:deep(.sidebar-item-rail .v-list-item__content) {
  display: none !important;
  flex: 0 0 0 !important;
  width: 0 !important;
}

:deep(.sidebar-item-rail .v-list-item__prepend > .v-icon) {
  display: block;
  margin: 0;
}

:deep(.sidebar-item-rail .v-list-item__overlay) {
  inset: 0;
}

:deep(.sidebar-item .v-list-item__prepend > .v-icon) {
  color: white;
  opacity: 1;
}

.sidebar-footer {
  display: flex;
  justify-content: center;
  margin-top: auto;
  padding-top: 16px;
}

.sidebar-divider {
  margin: 12px 8px;
  border-color: rgb(250 178 26 / 0.4);
}
</style>
