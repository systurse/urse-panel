<template>
  <div class="backup-page">
    <v-card class="backup-card" rounded="xl" variant="flat">
      <div class="card-head">
        <div>
          <div class="section-kicker">Pases de salida</div>
          <h2 class="card-title">Código de regreso — respaldo</h2>
          <p class="card-subtitle">Pase #{{ passId }}</p>
        </div>

        <v-btn prepend-icon="mdi-arrow-left" :to="`/sps/pases/${passId}`" variant="text">
          Volver al pase
        </v-btn>
      </div>

      <v-alert
        v-if="errorMessage"
        class="mt-4"
        closable
        color="error"
        variant="tonal"
        @click:close="errorMessage = null"
      >
        {{ errorMessage }}
      </v-alert>

      <div v-if="!canView" class="state-box">
        <v-icon color="#c89215" icon="mdi-lock-outline" size="32" />
        <span>Solo el supervisor del área o un administrador puede ver este código.</span>
      </div>

      <div v-else-if="loading" class="state-box">
        <v-progress-circular color="#c89215" indeterminate />
        <span>Consultando código vigente...</span>
      </div>

      <div v-else-if="!code" class="state-box">
        <v-icon color="#c89215" icon="mdi-key-off" size="32" />
        <span>Sin código vigente por el momento.</span>
      </div>

      <div v-else class="mt-4 code-block">
        <div class="code-value">{{ code }}</div>

        <div v-if="expiresAt" class="text-body-2 text-medium-emphasis">
          Vigente hasta {{ formatDateTime(expiresAt) }}
        </div>
      </div>

      <v-btn
        class="mt-4"
        :loading="loading"
        prepend-icon="mdi-refresh"
        variant="text"
        @click="loadCode"
      >
        Actualizar
      </v-btn>
    </v-card>
  </div>
</template>

<script lang="ts" setup>
  import type { AxiosError } from 'axios'
  import { computed, onMounted, ref } from 'vue'
  import { useRoute } from 'vue-router'
  import { httpClient } from '@/services/http'
  import { useAuthStore } from '@/stores/auth'

  const route = useRoute()
  const authStore = useAuthStore()
  const passId = String(route.params.id)

  const loading = ref(false)
  const errorMessage = ref<string | null>(null)
  const code = ref<string | null>(null)
  const expiresAt = ref<string | null>(null)

  const canView = computed(() => authStore.isAdmin || authStore.hasRole('supervisor'))

  function resolveMessage (error: unknown, fallback: string) {
    const axiosError = error as AxiosError<{ message?: string }>
    return axiosError?.response?.data?.message ?? axiosError?.message ?? fallback
  }

  function formatDateTime (value: string) {
    const date = new Date(value)
    if (Number.isNaN(date.getTime())) return value
    return date.toLocaleString('es-MX')
  }

  function unwrapSingle (response: unknown): Record<string, unknown> {
    if (response && typeof response === 'object' && 'data' in response) {
      const data = (response as { data?: unknown }).data
      return data && typeof data === 'object' ? data as Record<string, unknown> : {}
    }
    return response && typeof response === 'object' ? response as Record<string, unknown> : {}
  }

  async function loadCode () {
    if (!canView.value) return

    loading.value = true
    errorMessage.value = null

    try {
      const response = await httpClient.get<unknown>(`/api/v1/exit-passes/${passId}/return/otp`)
      const data = unwrapSingle(response)
      code.value = typeof data.code === 'string' && data.code.trim().length > 0 ? data.code : null
      expiresAt.value = typeof data.expires_at === 'string' ? data.expires_at : null
    } catch (error) {
      errorMessage.value = resolveMessage(error, 'No fue posible consultar el código de regreso.')
    } finally {
      loading.value = false
    }
  }

  onMounted(() => {
    void loadCode()
  })
</script>

<style scoped>
.backup-page {
  display: grid;
}

.backup-card {
  padding: 24px;
  background: #ffffff;
}

.card-head {
  display: flex;
  justify-content: space-between;
  gap: 16px;
  align-items: flex-start;
}

.section-kicker {
  color: #c89215;
  font-size: 0.8rem;
  font-weight: 800;
  letter-spacing: 0.14em;
  text-transform: uppercase;
}

.card-title {
  margin: 8px 0 0;
  font-size: 1.4rem;
  font-weight: 800;
  color: #000000;
}

.card-subtitle {
  margin: 4px 0 0;
  color: #5e5e5e;
}

.state-box {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
  min-height: 160px;
  margin-top: 16px;
  color: #5e5e5e;
  text-align: center;
}

.code-block {
  text-align: center;
  padding: 24px;
  border-radius: 12px;
  background: rgb(250 178 26 / 0.08);
}

.code-value {
  font-family: 'SF Mono', 'Cascadia Code', Consolas, monospace;
  font-size: 2.4rem;
  font-weight: 800;
  letter-spacing: 0.12em;
  color: #000000;
}

@media (max-width: 900px) {
  .card-head {
    flex-direction: column;
  }
}
</style>
