<template>
  <div class="login-bg">
    <div class="login-card-wrapper">

      <v-card elevation="12" rounded="xl">

        <!-- Banda superior de color -->
        <div class="login-header-band">
          <div class="login-logo-box">
            <v-img
              alt="URSE - Universidad Regional del Sureste"
              class="login-logo"
              contain
              src="@/assets/logo.png"
            />
          </div>
        </div>

        <!-- Identidad -->
        <div class="text-center px-8 pt-6 pb-4">
          <div class="text-subtitle-1 font-weight-bold login-subtitle">
            Plataforma URSE
          </div>
          <div class="text-caption text-medium-emphasis mt-1">
            Acceso al panel administrativo
          </div>
        </div>

        <v-divider class="mx-6" />

        <!-- Formulario -->
        <v-card-text class="px-8 pt-6 pb-2">
          <v-form ref="formRef" v-model="formValid" @submit.prevent="handleLogin">

            <div class="text-body-2 font-weight-medium mb-1 text-medium-emphasis">
              Correo institucional
            </div>
            <v-text-field
              v-model="form.email"
              autocomplete="username"
              class="mb-4"
              density="comfortable"
              :disabled="authStore.loading"
              hide-details="auto"
              placeholder="usuario@urse.mx"
              prepend-inner-icon="mdi-email-outline"
              rounded="lg"
              :rules="emailRules"
              type="email"
              variant="outlined"
            />

            <div class="text-body-2 font-weight-medium mb-1 text-medium-emphasis">
              Contraseña
            </div>
            <v-text-field
              v-model="form.password"
              :append-inner-icon="showPassword ? 'mdi-eye-off-outline' : 'mdi-eye-outline'"
              autocomplete="current-password"
              density="comfortable"
              :disabled="authStore.loading"
              hide-details="auto"
              placeholder="••••••••"
              prepend-inner-icon="mdi-lock-outline"
              rounded="lg"
              :rules="passwordRules"
              :type="showPassword ? 'text' : 'password'"
              variant="outlined"
              @click:append-inner="showPassword = !showPassword"
            />

            <div class="d-flex justify-end mt-1 mb-5">
              <v-btn class="text-caption px-1" color="primary" size="small" variant="text">
                ¿Olvidó su contraseña?
              </v-btn>
            </div>

            <v-alert
              v-if="authStore.error"
              class="mb-4"
              closable
              density="compact"
              rounded="lg"
              type="error"
              variant="tonal"
              @click:close="authStore.clearError()"
            >
              {{ authStore.error }}
            </v-alert>

            <v-btn
              block
              class="font-weight-bold"
              color="primary"
              :disabled="!formValid || authStore.loading"
              :loading="authStore.loading"
              rounded="lg"
              size="large"
              type="submit"
              variant="elevated"
            >
              Ingresar al sistema
            </v-btn>

          </v-form>
        </v-card-text>

        <!-- Footer -->
        <v-card-text class="text-center pt-3 pb-6">
          <span class="text-caption text-medium-emphasis">
            Acceso restringido al personal autorizado por la URSE
          </span>
        </v-card-text>

      </v-card>

      <!-- Copyright -->
      <div class="text-center mt-5">
        <span class="text-caption" style="color: rgba(255,255,255,0.75);">
          &copy; {{ currentYear }} URSE &mdash; Todos los derechos reservados
        </span>
      </div>

    </div>
  </div>
</template>

<script setup lang="ts">
  import { computed, ref } from 'vue'
  import { useRouter } from 'vue-router'
  import { useAuthStore } from '@/stores/auth'

  const router = useRouter()
  const authStore = useAuthStore()

  const formRef = ref()
  const formValid = ref(false)
  const showPassword = ref(false)

  const form = ref({ email: '', password: '' })

  const currentYear = computed(() => new Date().getFullYear())

  const emailRules = [
    (v: string) => !!v || 'El correo es requerido',
    (v: string) => /.+@.+\..+/.test(v) || 'Ingrese un correo válido',
  ]

  const passwordRules = [
    (v: string) => !!v || 'La contraseña es requerida',
    (v: string) => v.length >= 6 || 'Mínimo 6 caracteres',
  ]

  async function handleLogin () {
    const { valid } = await formRef.value.validate()
    if (!valid) return
    try {
      await authStore.login(form.value.email, form.value.password)
      router.push('/')
    } catch {
    // El error ya lo maneja el store
    }
  }
</script>

<style scoped>
.login-bg {
  position: fixed;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #000000 0%, #1a1a1a 50%, #FAB21A 50%, #FAB21A 100%);
  padding: 24px 16px;
  box-sizing: border-box;
  overflow-y: auto;
}

.login-card-wrapper {
  width: 100%;
  max-width: 440px;
}

.login-header-band {
  background: #ffffff;
  border-bottom: 3px solid #FAB21A;
  border-radius: 12px 12px 0 0;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 28px 24px;
}

.login-logo-box {
  width: min(320px, 85%);
  aspect-ratio: 595 / 151;
  display: flex;
  align-items: center;
  justify-content: center;
}

.login-logo {
  width: 100%;
  height: 100%;
}

.login-subtitle {
  color: #FAB21A;
  letter-spacing: 2px;
  text-transform: uppercase;
}
</style>
