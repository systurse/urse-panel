<template>
  <div class="login-bg">
    <div class="login-card-wrapper">

      <v-card elevation="12" rounded="xl">

        <!-- Banda superior con logo -->
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
        <div class="text-center px-8 pt-6 pb-2">
          <div class="text-subtitle-1 font-weight-bold login-subtitle">
            Plataforma URSE
          </div>
          <div class="text-caption text-medium-emphasis mt-1">
            Acceso al panel administrativo
          </div>
        </div>

        <v-card-text class="px-8 pt-4 pb-2">

          <!-- Alerta de error global -->
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

          <!-- CTA PRINCIPAL: Microsoft -->
          <v-btn
            block
            class="microsoft-btn font-weight-bold"
            :disabled="authStore.loading"
            :loading="authStore.loading && !showEmailForm"
            rounded="lg"
            size="x-large"
            variant="flat"
            @click="handleMicrosoftLogin"
          >
            <template #prepend>
              <svg
                aria-hidden="true"
                class="microsoft-icon"
                viewBox="0 0 23 23"
                xmlns="http://www.w3.org/2000/svg"
              >
                <rect
                  fill="#F25022"
                  height="10"
                  width="10"
                  x="1"
                  y="1"
                />
                <rect
                  fill="#7FBA00"
                  height="10"
                  width="10"
                  x="12"
                  y="1"
                />
                <rect
                  fill="#00A4EF"
                  height="10"
                  width="10"
                  x="1"
                  y="12"
                />
                <rect
                  fill="#FFB900"
                  height="10"
                  width="10"
                  x="12"
                  y="12"
                />
              </svg>
            </template>
            Iniciar sesión con Microsoft
          </v-btn>

          <div class="text-caption text-medium-emphasis text-center mt-3">
            Usa tu cuenta institucional @urse.edu.mx
          </div>

          <!-- Formulario de correo (oculto por defecto) -->
          <Transition name="slide-fade">
            <div v-if="showEmailForm" class="email-form-wrapper mt-5">
              <v-divider class="mb-4" />

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

                <div class="d-flex justify-end mt-1 mb-4">
                  <v-btn class="text-caption px-1" color="primary" size="small" variant="text">
                    ¿Olvidó su contraseña?
                  </v-btn>
                </div>

                <v-btn
                  block
                  class="font-weight-bold"
                  color="primary"
                  :disabled="!formValid || authStore.loading"
                  :loading="authStore.loading && showEmailForm"
                  rounded="lg"
                  size="large"
                  type="submit"
                  variant="elevated"
                >
                  Ingresar al sistema
                </v-btn>
              </v-form>
            </div>
          </Transition>

        </v-card-text>

        <!-- Footer con acceso "secreto" a correo -->
        <v-card-text class="text-center pt-3 pb-6">
          <v-btn
            class="text-caption toggle-email-btn"
            :disabled="authStore.loading"
            size="small"
            variant="text"
            @click="toggleEmailForm"
          >
            <v-icon class="mr-1" size="14">
              {{ showEmailForm ? 'mdi-chevron-up' : 'mdi-email-lock-outline' }}
            </v-icon>
            {{ showEmailForm ? 'Ocultar acceso por correo' : 'Continuar con correo' }}
          </v-btn>

          <div class="text-caption text-medium-emphasis mt-2">
            Acceso restringido al personal autorizado por la URSE
          </div>
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
  import { computed, nextTick, onMounted, ref } from 'vue'
  import { useRoute, useRouter } from 'vue-router'
  import { useAuthStore } from '@/stores/auth'

  const route = useRoute()
  const router = useRouter()
  const authStore = useAuthStore()

  const formRef = ref()
  const formValid = ref(false)
  const showPassword = ref(false)
  const showEmailForm = ref(false)

  const form = ref({ email: '', password: '' })

  const currentYear = computed(() => new Date().getFullYear())

  onMounted(() => {
    const queryError = route.query.error
    const errorMessage = Array.isArray(queryError) ? queryError[0] : queryError
    if (errorMessage) {
      authStore.error = String(errorMessage)
      router.replace({ path: '/login' })
    }
  })

  const emailRules = [
    (v: string) => !!v || 'El correo es requerido',
    (v: string) => /.+@.+\..+/.test(v) || 'Ingrese un correo válido',
  ]

  const passwordRules = [
    (v: string) => !!v || 'La contraseña es requerida',
    (v: string) => v.length >= 6 || 'Mínimo 6 caracteres',
  ]

  async function toggleEmailForm () {
    const willShow = !showEmailForm.value
    authStore.clearError()

    if (!willShow) {
      // Limpiamos estado y validación antes de ocultar para evitar
      // que el blur de los inputs muestre errores durante la animación.
      formRef.value?.resetValidation()
      form.value = { email: '', password: '' }
      showPassword.value = false
    }

    showEmailForm.value = willShow

    if (willShow) {
      await nextTick()
      const emailInput = document.querySelector<HTMLInputElement>(
        '.email-form-wrapper input[type="email"]',
      )
      emailInput?.focus()
    }
  }

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

  async function handleMicrosoftLogin () {
    try {
      await authStore.loginWithMicrosoft()
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

/* Botón Microsoft — CTA principal */
.microsoft-btn {
  background: linear-gradient(135deg, #1a1a1a 0%, #2F2F2F 100%) !important;
  color: #ffffff !important;
  letter-spacing: 0.3px;
  box-shadow: 0 6px 18px rgba(0, 0, 0, 0.25);
  transition: transform 0.15s ease, box-shadow 0.2s ease;
}

.microsoft-btn:hover {
  transform: translateY(-1px);
  box-shadow: 0 10px 24px rgba(0, 0, 0, 0.32);
}

.microsoft-btn:active {
  transform: translateY(0);
}

.microsoft-icon {
  width: 22px;
  height: 22px;
}

/* Botón "Continuar con correo" */
.toggle-email-btn {
  color: rgba(0, 0, 0, 0.55) !important;
  letter-spacing: 0.3px;
  opacity: 0.85;
  transition: opacity 0.2s ease, color 0.2s ease;
}

.toggle-email-btn:hover {
  opacity: 1;
  color: #FAB21A !important;
}

/* Animación del formulario de correo */
.email-form-wrapper {
  overflow: hidden;
  transform-origin: top center;
}

.slide-fade-enter-active {
  transition:
    opacity 0.35s ease,
    transform 0.35s cubic-bezier(0.2, 0.8, 0.2, 1),
    max-height 0.4s ease;
}

.slide-fade-leave-active {
  transition:
    opacity 0.22s ease,
    transform 0.22s ease,
    max-height 0.28s ease;
}

.slide-fade-enter-from,
.slide-fade-leave-to {
  opacity: 0;
  transform: translateY(-12px) scaleY(0.96);
  max-height: 0;
}

.slide-fade-enter-to,
.slide-fade-leave-from {
  opacity: 1;
  transform: translateY(0) scaleY(1);
  max-height: 600px;
}
</style>
