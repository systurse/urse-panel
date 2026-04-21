<template>
  <div class="auth-callback-bg">
    <v-card class="auth-callback-card" elevation="12" rounded="xl">
      <v-card-text class="text-center pa-8">
        <template v-if="errorMessage">
          <v-icon class="mb-3" color="error" size="48">
            mdi-alert-circle-outline
          </v-icon>
          <div class="text-h6 font-weight-bold mb-2">
            No se pudo iniciar sesión
          </div>
          <div class="text-body-2 text-medium-emphasis mb-5">
            {{ errorMessage }}
          </div>
          <v-btn color="primary" rounded="lg" @click="goToLogin">
            Volver al inicio de sesión
          </v-btn>
        </template>

        <template v-else>
          <v-progress-circular
            class="mb-4"
            color="primary"
            indeterminate
            size="48"
            width="4"
          />
          <div class="text-h6 font-weight-bold">
            Validando sesión…
          </div>
          <div class="text-body-2 text-medium-emphasis mt-1">
            Estamos verificando tus credenciales con Microsoft.
          </div>
        </template>
      </v-card-text>
    </v-card>
  </div>
</template>

<script setup lang="ts">
  import { onMounted, ref } from 'vue'
  import { useRoute, useRouter } from 'vue-router'
  import { useAuthStore } from '@/stores/auth'

  const route = useRoute()
  const router = useRouter()
  const authStore = useAuthStore()

  const errorMessage = ref<string | null>(null)

  function pickQueryParam (value: string | string[] | null | undefined) {
    if (!value) return null
    return Array.isArray(value) ? value[0] ?? null : value
  }

  function goToLogin () {
    router.replace({ path: '/login' })
  }

  onMounted(async () => {
    const token = pickQueryParam(route.query.token)
    const error = pickQueryParam(route.query.error)

    if (error) {
      errorMessage.value = error
      router.replace({ path: '/login', query: { error } })
      return
    }

    if (!token) {
      errorMessage.value = 'No se recibió un token válido.'
      return
    }

    try {
      await authStore.handleAuthCallback(token)
      router.replace('/')
    } catch {
      errorMessage.value = authStore.error ?? 'No se pudo completar el inicio de sesión.'
    }
  })
</script>

<style scoped>
.auth-callback-bg {
  position: fixed;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #000000 0%, #1a1a1a 50%, #FAB21A 50%, #FAB21A 100%);
  padding: 24px 16px;
  box-sizing: border-box;
}

.auth-callback-card {
  width: 100%;
  max-width: 420px;
}
</style>
