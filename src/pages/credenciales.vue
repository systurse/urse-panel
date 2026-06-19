<template>
  <div class="cred-page">
    <!-- Header -->
    <div class="cred-header">
      <v-img src="@/assets/logo.png" alt="URSE" width="72" class="cred-logo" />
      <div class="cred-header-text">
        <div class="cred-title">UNIVERSIDAD REGIONAL DEL SURESTE</div>
        <div class="cred-subtitle">Consulta de Credenciales de Acceso</div>
      </div>
    </div>

    <div class="cred-content">

      <!-- ══════════════ PASO 1: BÚSQUEDA ══════════════ -->
      <div v-if="step === 1" class="step-card">
        <h2 class="step-title">Consulta tu cuenta</h2>
        <p class="step-desc">Ingresa tu matrícula o correo personal para verificar si tu cuenta ha sido creada.</p>

        <v-alert
          v-if="notFound"
          class="mb-4"
          color="warning"
          icon="mdi-clock-outline"
          variant="tonal"
          rounded="lg"
        >
          Tu cuenta aún no está creada, regresa en 24hrs.
        </v-alert>

        <v-alert
          v-if="lookupError"
          class="mb-4"
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
            class="mb-2"
          />

          <p class="recaptcha-note">
            Este sitio está protegido por reCAPTCHA.
          </p>

          <v-btn
            type="submit"
            :loading="lookupLoading"
            :disabled="!lookupValid"
            color="primary"
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

      <!-- ══════════════ PASO 2: OTP ══════════════ -->
      <div v-else-if="step === 2" class="step-card">
        <h2 class="step-title">Verifica tu identidad</h2>
        <p class="step-desc">
          Enviaremos un código de verificación a
          <strong>{{ emailHint }}</strong>
        </p>

        <v-alert
          v-if="otpError"
          class="mb-4"
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
          class="mb-4"
          color="success"
          icon="mdi-check-circle-outline"
          variant="tonal"
          rounded="lg"
        >
          Código enviado. Revisa tu correo personal.
        </v-alert>

        <!-- Botón enviar / reenviar OTP -->
        <v-btn
          v-if="!otpSent"
          :loading="sendingOtp"
          color="secondary"
          size="large"
          variant="flat"
          block
          rounded="lg"
          class="mb-6"
          prepend-icon="mdi-email-fast-outline"
          @click="handleSendOtp"
        >
          Enviar código
        </v-btn>

        <div v-else class="resend-row mb-6">
          <span class="resend-text">¿No llegó tu código?</span>
          <v-btn
            v-if="resendCountdown === 0"
            variant="text"
            color="primary"
            size="small"
            :loading="sendingOtp"
            @click="handleSendOtp"
          >
            Reenviar
          </v-btn>
          <span v-else class="resend-countdown">Reenviar en {{ resendCountdown }}s</span>
        </div>

        <!-- Input OTP -->
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
            color="primary"
            size="large"
            variant="flat"
            block
            rounded="lg"
            class="mt-2"
          >
            Confirmar código
          </v-btn>
        </v-form>

        <v-btn
          variant="text"
          size="small"
          class="mt-4"
          prepend-icon="mdi-arrow-left"
          @click="resetFlow"
        >
          Volver
        </v-btn>
      </div>

      <!-- ══════════════ PASO 3: CREDENCIALES ══════════════ -->
      <div v-else-if="step === 3" class="credentials-wrapper">

        <div class="print-actions no-print mb-4">
          <v-btn
            color="primary"
            variant="flat"
            prepend-icon="mdi-file-pdf-box"
            rounded="lg"
            @click="openCredentialPDF"
          >
            Imprimir / Guardar PDF
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

        <!-- ─── Hoja de credenciales ─── -->
        <div class="credential-sheet" id="credential-sheet">

          <!-- Encabezado de la hoja -->
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
                <td class="cell-label"><strong>Carrera</strong></td>
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

          <!-- Pie de página -->
          <div class="sheet-footer">
            Documento generado el {{ generatedDate }} — Conserva este documento en un lugar seguro. No compartas tu contraseña.
          </div>

        </div><!-- /credential-sheet -->
      </div>

    </div><!-- /cred-content -->
  </div>
</template>

<script setup lang="ts">
  import { ref, computed, nextTick } from 'vue'
  import QRCode from 'qrcode'
  import { useReCaptcha } from 'vue-recaptcha-v3'
  import { credencialesService, type StudentCredentials } from '@/services/credencialesService'

  const { executeRecaptcha } = useReCaptcha()!

  // ── Estado del flujo ──
  const step = ref<1 | 2 | 3>(1)
  const studentId = ref<number | null>(null)
  const emailHint = ref('')
  const student = ref<StudentCredentials | null>(null)

  // ── Paso 1 ──
  const lookupFormRef = ref()
  const lookupValid = ref(false)
  const lookupLoading = ref(false)
  const identifier = ref('')
  const notFound = ref(false)
  const lookupError = ref('')

  // ── Paso 2 ──
  const otpFormRef = ref()
  const otpValid = ref(false)
  const otpCode = ref('')
  const otpSent = ref(false)
  const sendingOtp = ref(false)
  const verifyingOtp = ref(false)
  const otpError = ref('')
  const resendCountdown = ref(0)
  let countdownTimer: ReturnType<typeof setInterval> | null = null

  // ── Paso 3 ──
  const qrOfficeRef = ref<HTMLCanvasElement | null>(null)
  const qrBlackboardRef = ref<HTMLCanvasElement | null>(null)

  // ── Reglas ──
  const identifierRules = [
    (v: string) => !!v || 'Ingresa tu matrícula o correo',
    (v: string) => v.length >= 3 || 'Mínimo 3 caracteres',
  ]
  const otpRules = [
    (v: string) => !!v || 'Ingresa el código',
    (v: string) => /^\d{6}$/.test(v) || 'El código debe tener 6 dígitos',
  ]

  // ── Computed ──
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
    return {
      phone: '951-514-1410',
      email: c.email ?? '',
      career: c.name ?? '',
    }
  })

  const generatedDate = computed(() => {
    return new Date().toLocaleString('es-MX', {
      day: '2-digit', month: '2-digit', year: 'numeric',
      hour: '2-digit', minute: '2-digit',
    })
  })

  // ── Paso 1: lookup ──
  async function handleLookup () {
    const { valid } = await lookupFormRef.value.validate()
    if (!valid) return

    lookupLoading.value = true
    notFound.value = false
    lookupError.value = ''

    try {
      let token = 'disabled'
      try {
        token = await executeRecaptcha('lookup')
      } catch {
        // reCAPTCHA no configurado en dev, continuar
      }

      const res = await credencialesService.lookup(identifier.value.trim(), token)

      if (!res.exists) {
        notFound.value = true
        return
      }

      studentId.value = res.student_id!
      emailHint.value = res.email_hint!
      step.value = 2
    } catch (err: any) {
      lookupError.value = err.response?.data?.message || 'Error al verificar. Intenta nuevamente.'
    } finally {
      lookupLoading.value = false
    }
  }

  // ── Paso 2: enviar OTP ──
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
      if (resendCountdown.value <= 0) {
        clearInterval(countdownTimer!)
        countdownTimer = null
      }
    }, 1000)
  }

  // ── Paso 2: verificar OTP ──
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

  // ── Paso 3: generar QR ──
  async function renderQRCodes () {
    const opts = { width: 150, margin: 1 }
    if (qrOfficeRef.value) {
      await QRCode.toCanvas(qrOfficeRef.value, 'https://mail.office365.com', opts)
    }
    if (qrBlackboardRef.value) {
      await QRCode.toCanvas(qrBlackboardRef.value, 'https://urse.blackboard.com', opts)
    }
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
/* ── Layout general ── */
.cred-page {
  min-height: 100vh;
  background: #f4f6f9;
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 0 0 48px;
}

/* ── Header ── */
.cred-header {
  width: 100%;
  background: #1e3a5f;
  color: #fff;
  display: flex;
  align-items: center;
  gap: 20px;
  padding: 20px 40px;
}
.cred-logo {
  flex-shrink: 0;
  filter: brightness(0) invert(1);
}
.cred-title {
  font-size: 1.3rem;
  font-weight: 800;
  letter-spacing: 0.03em;
}
.cred-subtitle {
  font-size: 0.9rem;
  opacity: 0.8;
  margin-top: 4px;
}

/* ── Contenedor central ── */
.cred-content {
  width: 100%;
  max-width: 680px;
  padding: 32px 16px 0;
}

/* ── Tarjeta de paso ── */
.step-card {
  background: #fff;
  border-radius: 16px;
  padding: 36px 32px;
  box-shadow: 0 2px 16px rgb(0 0 0 / 0.08);
}
.step-title {
  font-size: 1.4rem;
  font-weight: 800;
  color: #1e3a5f;
  margin: 0 0 8px;
}
.step-desc {
  color: #5e5e5e;
  margin: 0 0 24px;
  font-size: 0.95rem;
}
.recaptcha-note {
  font-size: 0.75rem;
  color: #9e9e9e;
  margin: 0;
}
.resend-row {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 0.9rem;
}
.resend-text { color: #5e5e5e; }
.resend-countdown { color: #9e9e9e; font-weight: 600; }

/* ── Botones de impresión ── */
.print-actions {
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
}

/* ══════════════════════════════════════
   HOJA DE CREDENCIALES
══════════════════════════════════════ */
.credentials-wrapper {
  width: 100%;
  max-width: 860px;
}
.credential-sheet {
  background: #fff;
  border-radius: 8px;
  box-shadow: 0 2px 16px rgb(0 0 0 / 0.1);
  padding: 32px;
  font-family: Arial, Helvetica, sans-serif;
}

/* Encabezado de la hoja */
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
  font-size: 1.2rem;
  font-weight: 800;
  color: #1e3a5f;
  letter-spacing: 0.02em;
}
.sheet-doc-title {
  font-size: 0.85rem;
  color: #444;
  margin-top: 4px;
}

/* Aviso */
.sheet-notice {
  border: 1px solid #ccc;
  border-radius: 4px;
  padding: 12px 16px;
  font-size: 0.85rem;
  color: #333;
  margin-bottom: 16px;
  line-height: 1.5;
}

/* Tablas */
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

/* QR */
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

/* Pie de página */
.sheet-footer {
  text-align: center;
  font-size: 0.78rem;
  color: #888;
  border-top: 1px solid #eee;
  padding-top: 12px;
  margin-top: 8px;
}

/* ══════════════════════════════════════
   ESTILOS DE IMPRESIÓN
══════════════════════════════════════ */
@media print {
  .no-print { display: none !important; }
  .cred-page {
    background: #fff;
    padding: 0;
  }
  .cred-header { display: none; }
  .cred-content {
    max-width: 100%;
    padding: 0;
  }
  .credentials-wrapper { max-width: 100%; }
  .credential-sheet {
    box-shadow: none;
    border-radius: 0;
    padding: 16px;
  }
}

@media (max-width: 600px) {
  .cred-header {
    flex-direction: column;
    align-items: flex-start;
    padding: 16px 20px;
    gap: 12px;
  }
  .cred-title { font-size: 1rem; }
  .step-card { padding: 24px 16px; }
  .credential-sheet { padding: 16px; }
  .cell-label { width: 120px; }
}
</style>
