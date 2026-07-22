<template>
  <div class="cred-page">
    <ChatWidget />

    <!-- ══════════ PASOS 1 y 2: Layout split ══════════ -->
    <div v-if="step !== 3" class="split-layout">

      <!-- Panel izquierdo (solo desktop) -->
      <div class="split-left">
        <div class="split-left-inner">
          <v-img src="@/assets/logo.png" alt="URSE" width="80" class="split-logo" />
          <div class="split-university">UNIVERSIDAD REGIONAL DEL SURESTE</div>
          <div class="split-tagline">Consulta de Credenciales de Acceso</div>

          <div class="split-features">
            <div class="split-feature">
              <v-icon size="22" class="feature-icon">mdi-shield-lock-outline</v-icon>
              <span>Verificación segura con OTP</span>
            </div>
            <div class="split-feature">
              <v-icon size="22" class="feature-icon">mdi-email-fast-outline</v-icon>
              <span>Código enviado a tu correo personal</span>
            </div>
            <div class="split-feature">
              <v-icon size="22" class="feature-icon">mdi-file-account-outline</v-icon>
              <span>Accede a tus credenciales institucionales</span>
            </div>
          </div>

          <div class="split-steps">
            <div class="split-step" :class="{ active: step >= 1, done: step > 1 }">
              <div class="step-dot">{{ step > 1 ? '' : '1' }}
                <v-icon v-if="step > 1" size="14">mdi-check</v-icon>
              </div>
              <span>Verifica tu cuenta</span>
            </div>
            <div class="split-step-connector" />
            <div class="split-step" :class="{ active: step >= 2 }">
              <div class="step-dot">2</div>
              <span>Confirma tu identidad</span>
            </div>
            <div class="split-step-connector" />
            <div class="split-step" :class="{ active: step >= 3 }">
              <div class="step-dot">3</div>
              <span>Consulta tus credenciales</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Panel derecho: formularios -->
      <div class="split-right">

        <!-- Header mobile -->
        <div class="mobile-header">
          <v-img src="@/assets/logo.png" alt="URSE" width="48" class="mobile-logo" />
          <div>
            <div class="mobile-title">URSE</div>
            <div class="mobile-subtitle">Consulta de Credenciales</div>
          </div>
        </div>

        <!-- ────── PASO 1: BÚSQUEDA ────── -->
        <div v-if="step === 1" class="form-area">
          <div class="form-eyebrow">Paso 1 de 3</div>
          <h1 class="form-title">Consulta tu cuenta</h1>
          <p class="form-desc">Ingresa tu matrícula o correo personal para verificar si tu cuenta ha sido creada.</p>

          <v-alert
            v-if="notFound"
            class="mb-5"
            color="warning"
            icon="mdi-clock-outline"
            variant="tonal"
            rounded="lg"
          >
            Tu cuenta aún no está creada, regresa en 24 horas.
          </v-alert>

          <v-alert
            v-if="lookupError"
            class="mb-5"
            color="error"
            icon="mdi-alert-circle-outline"
            variant="tonal"
            rounded="lg"
            closable
            @click:close="lookupError = ''"
          >
            {{ lookupError }}
          </v-alert>

          <v-form ref="lookupFormRef" v-model="lookupValid" @submit.prevent="handleLookup">
            <v-text-field
              v-model="identifier"
              label="Matrícula o correo personal"
              placeholder="Ej: A123456 o juan@gmail.com"
              :rules="identifierRules"
              :disabled="lookupLoading"
              variant="outlined"
              prepend-inner-icon="mdi-account-search-outline"
              class="mb-1"
            />

            <p class="recaptcha-note">
              Este sitio está protegido por reCAPTCHA.
            </p>

            <v-btn
              type="submit"
              :loading="lookupLoading"
              :disabled="!lookupValid"
              color="#1e3a5f"
              size="large"
              variant="flat"
              block
              rounded="lg"
              class="mt-4"
            >
              Verificar cuenta
            </v-btn>
          </v-form>
        </div>

        <!-- ────── PASO 2: OTP ────── -->
        <div v-else-if="step === 2" class="form-area">
          <div class="form-eyebrow">Paso 2 de 3</div>
          <h1 class="form-title">Verifica tu identidad</h1>
          <p class="form-desc">
            Enviaremos un código de 6 dígitos a
            <strong>{{ emailHint }}</strong>
          </p>

          <v-alert
            v-if="otpError"
            class="mb-5"
            color="error"
            icon="mdi-alert-circle-outline"
            variant="tonal"
            rounded="lg"
            closable
            @click:close="otpError = ''"
          >
            {{ otpError }}
          </v-alert>

          <v-alert
            v-if="otpSent"
            class="mb-5"
            color="success"
            icon="mdi-check-circle-outline"
            variant="tonal"
            rounded="lg"
          >
            Código enviado. Revisa tu correo personal.
          </v-alert>

          <v-btn
            v-if="!otpSent"
            :loading="sendingOtp"
            color="#1e3a5f"
            size="large"
            variant="flat"
            block
            rounded="lg"
            class="mb-6"
            prepend-icon="mdi-email-fast-outline"
            @click="handleSendOtp"
          >
            Enviar código de verificación
          </v-btn>

          <div v-else class="resend-row mb-5">
            <span class="resend-text">¿No llegó tu código?</span>
            <v-btn
              v-if="resendCountdown === 0"
              variant="text"
              color="#1e3a5f"
              size="small"
              :loading="sendingOtp"
              @click="handleSendOtp"
            >
              Reenviar
            </v-btn>
            <span v-else class="resend-countdown">Reenviar en {{ resendCountdown }}s</span>
          </div>

          <v-form v-if="otpSent" ref="otpFormRef" v-model="otpValid" @submit.prevent="handleVerifyOtp">
            <v-text-field
              v-model="otpCode"
              label="Código de 6 dígitos"
              placeholder="123456"
              :rules="otpRules"
              :disabled="verifyingOtp"
              variant="outlined"
              maxlength="6"
              prepend-inner-icon="mdi-shield-key-outline"
              class="mb-2"
            />

            <v-btn
              type="submit"
              :loading="verifyingOtp"
              :disabled="!otpValid"
              color="#1e3a5f"
              size="large"
              variant="flat"
              block
              rounded="lg"
            >
              Confirmar código
            </v-btn>
          </v-form>

          <v-btn
            variant="text"
            size="small"
            class="mt-5"
            prepend-icon="mdi-arrow-left"
            @click="resetFlow"
          >
            Volver al inicio
          </v-btn>
        </div>

      </div><!-- /split-right -->
    </div><!-- /split-layout -->

    <!-- ══════════ PASO 3: CREDENCIALES ══════════ -->
    <div v-else class="sheet-page">

      <!-- Header de la página -->
      <div class="sheet-page-header">
        <v-img src="@/assets/logo.png" alt="URSE" width="52" class="sheet-page-logo" />
        <div>
          <div class="sheet-page-uni">UNIVERSIDAD REGIONAL DEL SURESTE</div>
          <div class="sheet-page-sub">Consulta de Credenciales de Acceso</div>
        </div>
        <div class="sheet-page-actions">
          <v-btn
            color="#1e3a5f"
            variant="flat"
            prepend-icon="mdi-file-pdf-box"
            rounded="lg"
            @click="openCredentialPDF"
          >
            Imprimir / PDF
          </v-btn>
          <v-btn
            variant="outlined"
            prepend-icon="mdi-arrow-left"
            rounded="lg"
            @click="resetFlow"
          >
            Nueva consulta
          </v-btn>
        </div>
      </div>

      <!-- Contenedor de la hoja -->
      <div class="sheet-container">
        <div class="credential-sheet" id="credential-sheet">

          <!-- Encabezado -->
          <div class="sheet-header">
            <v-img src="@/assets/logo.png" alt="URSE" width="80" class="sheet-logo" />
            <div class="sheet-header-text">
              <div class="sheet-university">UNIVERSIDAD REGIONAL DEL SURESTE</div>
              <div class="sheet-doc-title">HOJA DE CREDENCIALES DE ACCESO — ALUMNO</div>
            </div>
          </div>

          <!-- Aviso de contacto -->
          <div v-if="careerContact" class="sheet-notice">
            Si necesitas informes de tu inicio de clases llama al
            <strong>{{ careerContact.phone }}</strong> o escribe tus dudas al correo:
            <strong>{{ careerContact.email }} — {{ careerContact.career }}</strong>.
          </div>

          <!-- Datos del alumno -->
          <table class="sheet-table">
            <thead>
              <tr><th colspan="4" class="table-header">DATOS DEL ALUMNO</th></tr>
            </thead>
            <tbody>
              <tr>
                <td class="cell-label">Matrícula</td>
                <td class="cell-value">{{ student!.matricula }}</td>
                <td class="cell-label">Carrera</td>
                <td class="cell-value">{{ careerName }}</td>
              </tr>
              <tr>
                <td class="cell-label">Nombre completo</td>
                <td colspan="3" class="cell-value">{{ fullName }}</td>
              </tr>
            </tbody>
          </table>

          <!-- Correo Institucional -->
          <table class="sheet-table">
            <thead>
              <tr><th colspan="2" class="table-header">CORREO INSTITUCIONAL (OFFICE 365)</th></tr>
            </thead>
            <tbody>
              <tr>
                <td class="cell-label">Usuario</td>
                <td class="cell-value">{{ student!.institutional_email }}</td>
              </tr>
              <tr>
                <td class="cell-label">Contraseña inicial</td>
                <td class="cell-value mono">{{ student!.password }}</td>
              </tr>
            </tbody>
          </table>

          <!-- Blackboard -->
          <table class="sheet-table">
            <thead>
              <tr><th colspan="2" class="table-header">BLACKBOARD (PLATAFORMA EDUCATIVA)</th></tr>
            </thead>
            <tbody>
              <tr>
                <td class="cell-label">Usuario</td>
                <td class="cell-value">{{ student!.institutional_email }}</td>
              </tr>
              <tr>
                <td class="cell-label">Contraseña</td>
                <td class="cell-value">La misma que asignes al correo Office después de cambiarla.</td>
              </tr>
            </tbody>
          </table>

          <!-- Wi-Fi -->
          <table class="sheet-table">
            <thead>
              <tr><th colspan="2" class="table-header">WI-FI Y BIBLIOTECAS VIRTUALES</th></tr>
            </thead>
            <tbody>
              <tr>
                <td class="cell-label">Usuario</td>
                <td class="cell-value">{{ student!.institutional_username }}</td>
              </tr>
              <tr>
                <td class="cell-label">Contraseña</td>
                <td class="cell-value">
                  <span class="mono">{{ student!.wifi_password }}</span>
                  <span class="cell-note"> (esta misma contraseña se usa para Bibliotecas Virtuales)</span>
                </td>
              </tr>
            </tbody>
          </table>

          <!-- QR Codes -->
          <table class="sheet-table qr-table">
            <thead>
              <tr><th colspan="2" class="table-header">ACCESOS RÁPIDOS — ESCANEA EL CÓDIGO QR</th></tr>
            </thead>
            <tbody>
              <tr>
                <td class="qr-cell">
                  <div class="qr-label"><strong>Correo institucional (Office 365)</strong></div>
                  <canvas ref="qrOfficeRef" class="qr-canvas" />
                  <div class="qr-url">https://mail.office365.com</div>
                </td>
                <td class="qr-cell">
                  <div class="qr-label"><strong>Blackboard (Plataforma educativa)</strong></div>
                  <canvas ref="qrBlackboardRef" class="qr-canvas" />
                  <div class="qr-url">https://urse.blackboard.com</div>
                </td>
              </tr>
            </tbody>
          </table>

          <!-- Pie -->
          <div class="sheet-footer">
            Documento generado el {{ generatedDate }} — Conserva este documento en un lugar seguro. No compartas tu contraseña.
          </div>

        </div>
      </div><!-- /sheet-container -->

      <!-- Botones móvil (abajo de la hoja) -->
      <div class="sheet-mobile-actions no-print">
        <v-btn
          color="#1e3a5f"
          variant="flat"
          prepend-icon="mdi-file-pdf-box"
          rounded="lg"
          block
          class="mb-2"
          @click="openCredentialPDF"
        >
          Imprimir / Guardar PDF
        </v-btn>
        <v-btn
          variant="outlined"
          prepend-icon="mdi-arrow-left"
          rounded="lg"
          block
          @click="resetFlow"
        >
          Nueva consulta
        </v-btn>
      </div>

    </div><!-- /sheet-page -->
  </div>
</template>

<script setup lang="ts">
  import { ref, computed, nextTick } from 'vue'
  import ChatWidget from '@/components/ChatWidget.vue'
  import QRCode from 'qrcode'
  import { useReCaptcha } from 'vue-recaptcha-v3'
  import { credencialesService, type StudentCredentials } from '@/services/credencialesService'

  const { executeRecaptcha } = useReCaptcha()!

  const step = ref<1 | 2 | 3>(1)
  const studentId = ref<number | null>(null)
  const emailHint = ref('')
  const student = ref<StudentCredentials | null>(null)

  const lookupFormRef = ref()
  const lookupValid = ref(false)
  const lookupLoading = ref(false)
  const identifier = ref('')
  const notFound = ref(false)
  const lookupError = ref('')

  const otpFormRef = ref()
  const otpValid = ref(false)
  const otpCode = ref('')
  const otpSent = ref(false)
  const sendingOtp = ref(false)
  const verifyingOtp = ref(false)
  const otpError = ref('')
  const resendCountdown = ref(0)
  let countdownTimer: ReturnType<typeof setInterval> | null = null

  const qrOfficeRef = ref<HTMLCanvasElement | null>(null)
  const qrBlackboardRef = ref<HTMLCanvasElement | null>(null)

  const identifierRules = [
    (v: string) => !!v || 'Ingresa tu matrícula o correo',
    (v: string) => v.length >= 3 || 'Mínimo 3 caracteres',
  ]
  const otpRules = [
    (v: string) => !!v || 'Ingresa el código',
    (v: string) => /^\d{6}$/.test(v) || 'El código debe tener 6 dígitos',
  ]

  const fullName = computed(() => {
    if (!student.value) return ''
    return `${student.value.first_last_name} ${student.value.second_last_name} ${student.value.name}`.trim().toUpperCase()
  })

  const careerName = computed(() => {
    if (!student.value) return ''
    const c = student.value.career
    return typeof c === 'object' ? c.name : c ?? ''
  })

  const careerContact = computed(() => {
    if (!student.value) return null
    const c = student.value.career
    if (typeof c !== 'object' || !c) return null
    return { phone: '951-514-1410', email: c.email ?? '', career: c.name ?? '' }
  })

  const generatedDate = computed(() => {
    return new Date().toLocaleString('es-MX', {
      day: '2-digit', month: '2-digit', year: 'numeric',
      hour: '2-digit', minute: '2-digit',
    })
  })

  async function handleLookup () {
    const { valid } = await lookupFormRef.value.validate()
    if (!valid) return
    lookupLoading.value = true
    notFound.value = false
    lookupError.value = ''
    try {
      let token = 'disabled'
      try { token = await executeRecaptcha('lookup') } catch { }
      const res = await credencialesService.lookup(identifier.value.trim(), token)
      if (!res.exists) { notFound.value = true; return }
      studentId.value = res.student_id!
      emailHint.value = res.email_hint!
      step.value = 2
    } catch (err: any) {
      lookupError.value = err.response?.data?.message || 'Error al verificar. Intenta nuevamente.'
    } finally {
      lookupLoading.value = false
    }
  }

  async function handleSendOtp () {
    if (!studentId.value) return
    sendingOtp.value = true
    otpError.value = ''
    try {
      await credencialesService.sendOtp(studentId.value)
      otpSent.value = true
      startCountdown(60)
    } catch (err: any) {
      otpError.value = err.response?.data?.message || 'Error al enviar el código.'
    } finally {
      sendingOtp.value = false
    }
  }

  function startCountdown (seconds: number) {
    resendCountdown.value = seconds
    if (countdownTimer) clearInterval(countdownTimer)
    countdownTimer = setInterval(() => {
      resendCountdown.value--
      if (resendCountdown.value <= 0) { clearInterval(countdownTimer!); countdownTimer = null }
    }, 1000)
  }

  async function handleVerifyOtp () {
    const { valid } = await otpFormRef.value.validate()
    if (!valid || !studentId.value) return
    verifyingOtp.value = true
    otpError.value = ''
    try {
      const res = await credencialesService.verifyOtp(studentId.value, otpCode.value)
      student.value = res.student
      step.value = 3
      await nextTick()
      renderQRCodes()
    } catch (err: any) {
      otpError.value = err.response?.data?.message || 'Código incorrecto o expirado.'
    } finally {
      verifyingOtp.value = false
    }
  }

  async function renderQRCodes () {
    const opts = { width: 150, margin: 1 }
    if (qrOfficeRef.value) await QRCode.toCanvas(qrOfficeRef.value, 'https://mail.office365.com', opts)
    if (qrBlackboardRef.value) await QRCode.toCanvas(qrBlackboardRef.value, 'https://urse.blackboard.com', opts)
  }

  function openCredentialPDF () {
    const apiUrl = import.meta.env.VITE_API_SOPORTE_URL
    window.open(`${apiUrl}/api/v1/students/${student.value!.id}/credential-sheet`, '_blank')
  }

  function resetFlow () {
    step.value = 1
    identifier.value = ''
    notFound.value = false
    lookupError.value = ''
    otpCode.value = ''
    otpSent.value = false
    otpError.value = ''
    resendCountdown.value = 0
    studentId.value = null
    emailHint.value = ''
    student.value = null
    if (countdownTimer) clearInterval(countdownTimer)
  }
</script>

<style scoped>
/* ══════════════════════════════════════
   LAYOUT BASE
══════════════════════════════════════ */
.cred-page {
  min-height: 100vh;
  background: #f0f2f5;
}

/* ══════════════════════════════════════
   SPLIT LAYOUT (pasos 1 y 2)
══════════════════════════════════════ */
.split-layout {
  display: flex;
  min-height: 100vh;
}

/* Panel izquierdo */
.split-left {
  width: 420px;
  flex-shrink: 0;
  background: #1e3a5f;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 48px 40px;
}
.split-left-inner {
  color: #fff;
  width: 100%;
}
.split-logo {
  filter: brightness(0) invert(1);
  margin-bottom: 28px;
}
.split-university {
  font-size: 0.85rem;
  font-weight: 800;
  letter-spacing: 0.08em;
  color: #FAB21A;
  margin-bottom: 8px;
  line-height: 1.3;
}
.split-tagline {
  font-size: 1.5rem;
  font-weight: 700;
  color: #fff;
  margin-bottom: 40px;
  line-height: 1.3;
}

.split-features {
  display: flex;
  flex-direction: column;
  gap: 20px;
  margin-bottom: 48px;
}
.split-feature {
  display: flex;
  align-items: center;
  gap: 14px;
  font-size: 0.9rem;
  color: rgba(255, 255, 255, 0.85);
}
.feature-icon {
  color: #FAB21A !important;
  flex-shrink: 0;
}

/* Indicador de pasos */
.split-steps {
  display: flex;
  flex-direction: column;
  gap: 0;
}
.split-step {
  display: flex;
  align-items: center;
  gap: 14px;
  font-size: 0.88rem;
  color: rgba(255, 255, 255, 0.45);
  transition: color 0.2s;
}
.split-step.active {
  color: #fff;
}
.split-step.done {
  color: rgba(255, 255, 255, 0.7);
}
.step-dot {
  width: 28px;
  height: 28px;
  border-radius: 50%;
  border: 2px solid rgba(255, 255, 255, 0.25);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.8rem;
  font-weight: 700;
  flex-shrink: 0;
  transition: all 0.2s;
}
.split-step.active .step-dot {
  background: #FAB21A;
  border-color: #FAB21A;
  color: #1e3a5f;
}
.split-step.done .step-dot {
  background: rgba(255, 255, 255, 0.2);
  border-color: rgba(255, 255, 255, 0.3);
  color: #fff;
}
.split-step-connector {
  width: 2px;
  height: 24px;
  background: rgba(255, 255, 255, 0.15);
  margin-left: 13px;
}

/* Panel derecho */
.split-right {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 48px 32px;
  overflow-y: auto;
}

/* Header solo en móvil */
.mobile-header {
  display: none;
  align-items: center;
  gap: 14px;
  margin-bottom: 36px;
  align-self: flex-start;
  width: 100%;
}
.mobile-logo {
  filter: none;
  flex-shrink: 0;
}
.mobile-title {
  font-size: 1rem;
  font-weight: 800;
  color: #1e3a5f;
}
.mobile-subtitle {
  font-size: 0.82rem;
  color: #777;
}

/* Área del formulario */
.form-area {
  width: 100%;
  max-width: 440px;
}
.form-eyebrow {
  font-size: 0.78rem;
  font-weight: 700;
  letter-spacing: 0.1em;
  color: #FAB21A;
  text-transform: uppercase;
  margin-bottom: 8px;
}
.form-title {
  font-size: 1.75rem;
  font-weight: 800;
  color: #1e3a5f;
  margin: 0 0 10px;
  line-height: 1.2;
}
.form-desc {
  color: #666;
  margin: 0 0 28px;
  font-size: 0.95rem;
  line-height: 1.5;
}
.recaptcha-note {
  font-size: 0.75rem;
  color: #aaa;
  margin: 0;
}
.resend-row {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 0.9rem;
}
.resend-text { color: #666; }
.resend-countdown { color: #aaa; font-weight: 600; }

/* ══════════════════════════════════════
   PASO 3: HOJA DE CREDENCIALES
══════════════════════════════════════ */
.sheet-page {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}

.sheet-page-header {
  background: #1e3a5f;
  padding: 16px 40px;
  display: flex;
  align-items: center;
  gap: 20px;
  color: #fff;
}
.sheet-page-logo {
  filter: brightness(0) invert(1);
  flex-shrink: 0;
}
.sheet-page-uni {
  font-size: 0.88rem;
  font-weight: 800;
  letter-spacing: 0.04em;
}
.sheet-page-sub {
  font-size: 0.78rem;
  opacity: 0.7;
  margin-top: 2px;
}
.sheet-page-actions {
  margin-left: auto;
  display: flex;
  gap: 12px;
  flex-shrink: 0;
}

.sheet-container {
  flex: 1;
  display: flex;
  align-items: flex-start;
  justify-content: center;
  padding: 40px 24px 48px;
}

.credential-sheet {
  background: #fff;
  border-radius: 8px;
  box-shadow: 0 4px 24px rgb(0 0 0 / 0.1);
  padding: 36px 40px;
  font-family: Arial, Helvetica, sans-serif;
  width: 100%;
  max-width: 860px;
}

.sheet-header {
  display: flex;
  align-items: center;
  gap: 20px;
  margin-bottom: 20px;
  border-bottom: 2px solid #1e3a5f;
  padding-bottom: 16px;
}
.sheet-logo { flex-shrink: 0; }
.sheet-university {
  font-size: 1.15rem;
  font-weight: 800;
  color: #1e3a5f;
  letter-spacing: 0.02em;
}
.sheet-doc-title {
  font-size: 0.82rem;
  color: #555;
  margin-top: 4px;
}

.sheet-notice {
  border: 1px solid #ccc;
  border-radius: 4px;
  padding: 12px 16px;
  font-size: 0.85rem;
  color: #333;
  margin-bottom: 16px;
  line-height: 1.5;
}

.sheet-table {
  width: 100%;
  border-collapse: collapse;
  margin-bottom: 16px;
  font-size: 0.88rem;
}
.table-header {
  background: #1e3a5f;
  color: #fff;
  font-size: 0.82rem;
  font-weight: 700;
  letter-spacing: 0.05em;
  padding: 8px 12px;
  text-align: left;
}
.cell-label {
  background: #eef1f5;
  font-weight: 700;
  color: #333;
  padding: 8px 12px;
  width: 180px;
  border: 1px solid #ddd;
  vertical-align: top;
}
.cell-value {
  padding: 8px 12px;
  border: 1px solid #ddd;
  color: #111;
  vertical-align: top;
}
.cell-note {
  color: #666;
  font-size: 0.82rem;
}
.mono {
  font-family: 'Courier New', Courier, monospace;
  font-weight: 600;
  letter-spacing: 0.05em;
}

.qr-table .qr-cell {
  padding: 20px;
  text-align: center;
  border: 1px solid #ddd;
  width: 50%;
  vertical-align: top;
}
.qr-label {
  font-size: 0.88rem;
  margin-bottom: 12px;
  color: #1e3a5f;
}
.qr-canvas {
  display: block;
  margin: 0 auto 8px;
}
.qr-url {
  font-size: 0.78rem;
  color: #666;
}

.sheet-footer {
  text-align: center;
  font-size: 0.78rem;
  color: #999;
  border-top: 1px solid #eee;
  padding-top: 12px;
  margin-top: 8px;
}

/* Botones móvil (ocultos en desktop) */
.sheet-mobile-actions {
  display: none;
  padding: 0 16px 32px;
}

/* ══════════════════════════════════════
   IMPRESIÓN
══════════════════════════════════════ */
@media print {
  .no-print { display: none !important; }
  .sheet-page-header { display: none; }
  .sheet-container { padding: 0; }
  .credential-sheet {
    box-shadow: none;
    border-radius: 0;
    padding: 16px;
  }
}

/* ══════════════════════════════════════
   RESPONSIVE: tablet (< 960px)
══════════════════════════════════════ */
@media (max-width: 959px) {
  .split-left {
    width: 320px;
    padding: 40px 28px;
  }
  .split-tagline { font-size: 1.2rem; }
  .sheet-page-header {
    padding: 14px 20px;
  }
  .sheet-page-actions {
    gap: 8px;
  }
}

/* ══════════════════════════════════════
   RESPONSIVE: móvil (< 600px)
══════════════════════════════════════ */
@media (max-width: 599px) {
  /* Split: colapsa a columna */
  .split-layout {
    flex-direction: column;
  }
  .split-left {
    display: none;
  }
  .split-right {
    justify-content: flex-start;
    padding: 24px 20px 40px;
    align-items: stretch;
  }
  .mobile-header {
    display: flex;
  }
  .form-area {
    max-width: 100%;
  }
  .form-title { font-size: 1.4rem; }

  /* Paso 3 */
  .sheet-page-header {
    padding: 14px 16px;
    flex-wrap: wrap;
  }
  .sheet-page-actions {
    display: none;
  }
  .sheet-mobile-actions {
    display: block;
  }
  .sheet-container {
    padding: 16px 12px 24px;
  }
  .credential-sheet {
    padding: 16px;
  }
  .cell-label { width: 110px; }
}
</style>
