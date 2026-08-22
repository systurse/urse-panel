<template>
  <div class="support-page" :class="{ 'support-page--embed': embedded }">
    <div ref="container" class="support-container">
      <header v-if="!embedded" class="support-header">
        <h1>Atención al usuario</h1>
        <p>Solicita atención o soporte por cualquiera de nuestros canales.</p>
      </header>

      <!-- Los 3 canales de comunicación -->
      <div class="channels-grid">
        <button class="channel-card channel-card--active" type="button">
          <v-icon icon="mdi-form-select" size="28" />
          <span>Formulario de contacto</span>
        </button>

        <a
          v-if="config?.whatsapp_link"
          class="channel-card"
          :href="config.whatsapp_link"
          rel="noopener"
          target="_blank"
        >
          <v-icon color="success" icon="mdi-whatsapp" size="28" />
          <span>WhatsApp</span>
        </a>

        <a
          v-if="config?.support_mailbox"
          class="channel-card"
          :href="`mailto:${config.support_mailbox}`"
        >
          <v-icon color="primary" icon="mdi-email-outline" size="28" />
          <span>Correo electrónico</span>
        </a>
      </div>

      <v-card class="form-card" rounded="xl">
        <v-card-text class="pa-6">
          <template v-if="submitted">
            <div class="success-block">
              <v-icon color="success" icon="mdi-check-circle-outline" size="56" />
              <h2>¡Solicitud registrada!</h2>

              <p>
                Tu folio es <strong>#{{ folio }}</strong>. Un agente te contactará en breve al correo
                que registraste.
              </p>

              <v-btn variant="outlined" @click="reset">Levantar otra solicitud</v-btn>
            </div>
          </template>

          <template v-else>
            <v-alert
              v-if="error"
              class="mb-4"
              rounded="lg"
              type="error"
              variant="tonal"
            >{{ error }}</v-alert>

            <v-alert
              v-if="known"
              class="mb-4"
              density="compact"
              icon="mdi-account-check-outline"
              rounded="lg"
              type="info"
              variant="tonal"
            >
              Ya te tenemos registrado: tu nueva solicitud se ligará a tu expediente de contacto.
            </v-alert>

            <v-form @submit.prevent="submit">
              <v-row dense>
                <v-col cols="12" sm="6">
                  <v-text-field v-model="form.first_name" label="Nombre *" @blur="checkKnown" />
                </v-col>

                <v-col cols="12" sm="6">
                  <v-text-field v-model="form.last_name" label="Apellido *" @blur="checkKnown" />
                </v-col>

                <v-col cols="12">
                  <v-text-field v-model="form.email" label="Correo institucional *" type="email" @blur="checkKnown" />
                </v-col>

                <v-col cols="12" sm="6">
                  <v-text-field v-model="form.faculty" label="Facultad o escuela *" />
                </v-col>

                <v-col cols="12" sm="6">
                  <v-text-field v-model="form.location" label="Aula u oficina *" />
                </v-col>

                <v-col cols="12">
                  <v-textarea v-model="form.request" auto-grow label="Solicitud o reporte *" rows="4" />
                </v-col>
              </v-row>

              <v-checkbox v-model="form.terms_accepted" density="comfortable">
                <template #label>
                  <span>Acepto los términos y condiciones del tratamiento de mis datos personales.</span>
                </template>
              </v-checkbox>

              <v-btn
                block
                color="#1a1a1a"
                :disabled="!formValid"
                :loading="sending"
                size="large"
                type="submit"
                variant="flat"
              >Enviar</v-btn>

              <p class="recaptcha-note">Este sitio está protegido por reCAPTCHA.</p>
            </v-form>
          </template>
        </v-card-text>
      </v-card>
    </div>
  </div>
</template>

<script lang="ts" setup>
  import type { WidgetConfig } from '@/modules/crm/types'
  import { computed, onBeforeUnmount, onMounted, reactive, ref } from 'vue'
  import { useReCaptcha } from 'vue-recaptcha-v3'
  import { useRoute } from 'vue-router'
  import { getWidgetConfig, matchPublicContact, submitPublicLead } from '@/modules/crm/service'

  const recaptcha = useReCaptcha()
  const route = useRoute()

  /**
   * Modo embebido (?embed=1): sin encabezado ni fondo propios, pensado para
   * incrustarse en sitios externos vía iframe con public/widget-ssm.js.
   */
  const embedded = route.query.embed === '1'
  const container = ref<HTMLElement | null>(null)

  let resizeObserver: ResizeObserver | null = null

  function reportHeight () {
    if (!embedded || !container.value) {
      return
    }
    window.parent.postMessage(
      { type: 'ssm-widget:height', height: container.value.offsetHeight + 32 },
      '*',
    )
  }

  const config = ref<WidgetConfig | null>(null)
  const sending = ref(false)
  const submitted = ref(false)
  const folio = ref<number | null>(null)
  const error = ref<string | null>(null)
  const known = ref(false)

  const form = reactive({
    first_name: '',
    last_name: '',
    email: '',
    faculty: '',
    location: '',
    request: '',
    terms_accepted: false,
  })

  const formValid = computed(() =>
    form.first_name.trim() !== ''
    && form.last_name.trim() !== ''
    && form.email.trim() !== ''
    && form.faculty.trim() !== ''
    && form.location.trim() !== ''
    && form.request.trim() !== ''
    && form.terms_accepted,
  )

  /**
   * Detección de contacto recurrente: al escribir nombre y apellido (o el
   * correo) se consulta si ya existe; el backend solo devuelve un booleano.
   */
  async function checkKnown () {
    if (!form.email && (!form.first_name || !form.last_name)) {
      return
    }

    try {
      const response = await matchPublicContact({
        first_name: form.first_name || undefined,
        last_name: form.last_name || undefined,
        email: form.email || undefined,
      })
      known.value = response.known
    } catch {
      // la detección es informativa; el envío no depende de ella
    }
  }

  async function submit () {
    sending.value = true
    error.value = null

    try {
      let token = ''
      try {
        await recaptcha?.recaptchaLoaded()
        token = await recaptcha!.executeRecaptcha('crm_lead') ?? ''
      } catch {
        // sin token el backend responderá 422
      }

      const response = await submitPublicLead({
        first_name: form.first_name,
        last_name: form.last_name,
        email: form.email,
        faculty: form.faculty,
        location: form.location,
        request: form.request,
        terms_accepted: form.terms_accepted,
        recaptcha_token: token,
      })

      folio.value = response.folio
      submitted.value = true
    } catch (error_: any) {
      const data = error_?.response?.data
      const validation = data?.errors ? Object.values(data.errors as Record<string, string[]>).flat()[0] : null
      error.value = validation ?? data?.message ?? 'No fue posible enviar tu solicitud. Intenta de nuevo.'
    } finally {
      sending.value = false
    }
  }

  function reset () {
    submitted.value = false
    folio.value = null
    known.value = false
    Object.assign(form, {
      first_name: '',
      last_name: '',
      email: '',
      faculty: '',
      location: '',
      request: '',
      terms_accepted: false,
    })
  }

  onMounted(async () => {
    if (embedded && container.value) {
      resizeObserver = new ResizeObserver(reportHeight)
      resizeObserver.observe(container.value)
      reportHeight()
    }

    try {
      config.value = await getWidgetConfig()
    } catch {
      // los canales alternos simplemente no se muestran
    }
  })

  onBeforeUnmount(() => {
    resizeObserver?.disconnect()
  })
</script>

<style scoped>
.support-page {
  min-height: 100vh;
  background: #efe7de;
  display: flex;
  justify-content: center;
  padding: 32px 16px;
}

.support-page--embed {
  min-height: 0;
  background: transparent;
  padding: 16px 8px;
}

.support-container {
  width: 100%;
  max-width: 640px;
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.support-header h1 {
  font-size: 26px;
  margin: 0;
}

.support-header p {
  color: rgba(0, 0, 0, 0.6);
  margin: 6px 0 0;
}

.channels-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
  gap: 10px;
}

.channel-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  background: white;
  border: 2px solid transparent;
  border-radius: 16px;
  padding: 16px 12px;
  font-size: 13px;
  font-weight: 600;
  color: inherit;
  text-decoration: none;
  cursor: pointer;
  transition: border-color 0.15s ease;
}

.channel-card:hover {
  border-color: rgba(0, 0, 0, 0.25);
}

.channel-card--active {
  border-color: #1a1a1a;
}

.success-block {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
  text-align: center;
  padding: 24px 0;
}

.recaptcha-note {
  font-size: 11px;
  color: rgba(0, 0, 0, 0.45);
  text-align: center;
  margin: 12px 0 0;
}
</style>
