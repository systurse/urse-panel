<template>
  <div class="verify-page">
    <div class="verify-shell">
      <div class="verify-brand">
        <v-img alt="URSE" class="verify-logo" src="@/assets/logo.png" width="56" />

        <div>
          <div class="verify-brand__name">Universidad Regional del Sureste</div>
          <div class="verify-brand__tag">Verificación de firma electrónica</div>
        </div>
      </div>

      <v-card class="verify-card" rounded="xl" variant="flat">
        <div v-if="loading" class="verify-state">
          <v-progress-circular color="#c89215" indeterminate />
          <span>Verificando documento...</span>
        </div>

        <div v-else-if="notFound" class="verify-state verify-state--error">
          <v-icon color="error" icon="mdi-file-remove-outline" size="44" />
          <h1 class="verify-state__title">Documento no encontrado</h1>

          <p class="verify-state__text">
            El código de verificación no existe o la firma fue anulada. Revisa que el código del
            documento se haya capturado completo.
          </p>
        </div>

        <div v-else-if="errorMessage" class="verify-state verify-state--error">
          <v-icon color="error" icon="mdi-alert-circle-outline" size="44" />
          <h1 class="verify-state__title">No fue posible verificar</h1>
          <p class="verify-state__text">{{ errorMessage }}</p>

          <v-btn
            class="mt-2"
            :loading="loading"
            prepend-icon="mdi-refresh"
            variant="tonal"
            @click="loadVerification"
          >
            Reintentar
          </v-btn>
        </div>

        <template v-else-if="result">
          <div class="verify-banner" :class="`verify-banner--${result.status}`">
            <v-icon :icon="statusIcon" size="40" />

            <div>
              <div class="verify-banner__title">{{ statusTitle }}</div>
              <div class="verify-banner__text">{{ result.message }}</div>
            </div>
          </div>

          <dl class="verify-facts">
            <div class="verify-fact">
              <dt>Documento</dt>
              <dd>{{ result.document.type || '—' }}</dd>
            </div>

            <div class="verify-fact">
              <dt>Folio</dt>
              <dd>{{ result.document.folio || '—' }}</dd>
            </div>

            <div class="verify-fact">
              <dt>Fecha de emisión</dt>
              <dd>{{ formatDate(result.document.issuedOn) }}</dd>
            </div>
          </dl>

          <v-divider class="my-4" />

          <div class="verify-section-title">
            Firmas ({{ result.signatures.length }})
          </div>

          <div v-if="result.signatures.length === 0" class="text-medium-emphasis">
            El documento aún no registra firmas.
          </div>

          <div v-for="(signature, index) in result.signatures" v-else :key="index" class="verify-signature">
            <v-icon color="success" icon="mdi-check-decagram" size="20" />

            <div>
              <div class="verify-signature__who">
                {{ signature.signerDisplay }}
                <span class="verify-signature__role">· {{ signature.roleLabel }}</span>
              </div>

              <div class="verify-signature__meta">{{ formatDateTime(signature.signedAt) }}</div>
              <div class="verify-signature__method">{{ signature.method }}</div>
            </div>
          </div>

          <v-divider class="my-4" />

          <div class="verify-integrity">
            <div class="verify-integrity__row">
              <v-icon
                :color="result.integrity.contentUnchanged ? 'success' : 'error'"
                :icon="result.integrity.contentUnchanged ? 'mdi-check-circle-outline' : 'mdi-close-circle-outline'"
                size="18"
              />

              <span>
                {{ result.integrity.contentUnchanged
                  ? 'El contenido no ha cambiado desde que se firmó.'
                  : 'El contenido cambió después de firmarse.' }}
              </span>
            </div>

            <div class="verify-integrity__row">
              <v-icon
                :color="result.integrity.evidenceUnchanged ? 'success' : 'error'"
                :icon="result.integrity.evidenceUnchanged ? 'mdi-check-circle-outline' : 'mdi-close-circle-outline'"
                size="18"
              />

              <span>
                {{ result.integrity.evidenceUnchanged
                  ? 'La evidencia de la firma está íntegra.'
                  : 'La evidencia de la firma fue alterada.' }}
              </span>
            </div>
          </div>

          <div class="verify-footer">
            <div>
              <span class="verify-footer__label">Huella del documento</span>
              <code class="verify-footer__hash">{{ result.documentHash || '—' }}</code>
            </div>

            <div class="verify-footer__stamp">
              Verificado el {{ formatDateTime(result.verifiedAt) }}
            </div>
          </div>
        </template>
      </v-card>
    </div>
  </div>
</template>

<script lang="ts" setup>
  import type { PublicVerification } from '@/modules/exit-pass-signatures/port'
  import { computed, onMounted, ref } from 'vue'
  import { useRoute } from 'vue-router'
  import { exitPassSignaturesAdapter } from '@/modules/exit-pass-signatures/adapter'

  const route = useRoute()
  const code = String(route.params.code ?? '')

  const loading = ref(true)
  const notFound = ref(false)
  const errorMessage = ref<string | null>(null)
  const result = ref<PublicVerification | null>(null)

  const STATUS_TITLES: Record<PublicVerification['status'], string> = {
    altered: 'Documento alterado',
    incomplete: 'Faltan firmas',
    valid: 'Documento válido',
  }

  const STATUS_ICONS: Record<PublicVerification['status'], string> = {
    altered: 'mdi-shield-alert-outline',
    incomplete: 'mdi-shield-half-full',
    valid: 'mdi-shield-check-outline',
  }

  const statusTitle = computed(() => (result.value ? STATUS_TITLES[result.value.status] : ''))
  const statusIcon = computed(() => (result.value ? STATUS_ICONS[result.value.status] : ''))

  // `issued_on` is a plain date. `new Date('2026-08-14')` is parsed as UTC
  // midnight, which renders as the previous day in any negative offset, so the
  // parts are read directly instead.
  function formatDate (value: string) {
    if (!value) return '—'

    const dateOnly = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value)
    const date = dateOnly
      ? new Date(Number(dateOnly[1]), Number(dateOnly[2]) - 1, Number(dateOnly[3]))
      : new Date(value)

    return Number.isNaN(date.getTime())
      ? value
      : date.toLocaleDateString('es-MX', { day: '2-digit', month: 'long', year: 'numeric' })
  }

  function formatDateTime (value: string) {
    if (!value) return '—'
    const date = new Date(value)
    return Number.isNaN(date.getTime()) ? value : date.toLocaleString('es-MX')
  }

  async function loadVerification () {
    loading.value = true
    notFound.value = false
    errorMessage.value = null

    if (!code) {
      notFound.value = true
      loading.value = false
      return
    }

    try {
      result.value = await exitPassSignaturesAdapter.verify(code)
    } catch (error) {
      const status = (error as { response?: { status?: number } })?.response?.status

      // The API deliberately returns the same 404 for an unknown code and a
      // revoked signature, so this screen must not distinguish them either.
      if (status === 404) {
        notFound.value = true
      } else {
        errorMessage.value = 'Ocurrió un problema al consultar el documento. Inténtalo de nuevo.'
      }
    } finally {
      loading.value = false
    }
  }

  onMounted(() => {
    void loadVerification()
  })
</script>

<style scoped>
.verify-page {
  display: flex;
  justify-content: center;
  min-height: 100vh;
  padding: 24px 16px 48px;
  background: #f7f7f7;
}

.verify-shell {
  width: 100%;
  max-width: 640px;
}

.verify-brand {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 16px;
}

.verify-logo {
  flex: 0 0 auto;
}

.verify-brand__name {
  color: #000000;
  font-weight: 800;
  line-height: 1.2;
}

.verify-brand__tag {
  color: #c89215;
  font-size: 0.78rem;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.verify-card {
  padding: 20px;
  background: #ffffff;
}

.verify-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 10px;
  min-height: 220px;
  color: #5e5e5e;
  text-align: center;
}

.verify-state__title {
  margin: 4px 0 0;
  color: #000000;
  font-size: 1.25rem;
  font-weight: 800;
}

.verify-state__text {
  margin: 0;
  max-width: 46ch;
}

.verify-banner {
  display: flex;
  align-items: flex-start;
  gap: 14px;
  padding: 16px;
  border-radius: 12px;
  border-inline-start: 6px solid currentcolor;
}

.verify-banner--valid {
  color: #1b5e3f;
  background: rgb(76 175 80 / 0.12);
}

.verify-banner--incomplete {
  color: #8a5a00;
  background: rgb(251 140 0 / 0.14);
}

.verify-banner--altered {
  color: #a3132b;
  background: rgb(176 0 32 / 0.12);
}

.verify-banner__title {
  font-size: 1.15rem;
  font-weight: 800;
}

.verify-banner__text {
  margin-top: 2px;
  font-size: 0.9rem;
}

.verify-facts {
  display: grid;
  gap: 12px;
  margin: 20px 0 0;
  grid-template-columns: repeat(3, minmax(0, 1fr));
}

.verify-fact dt {
  color: #5e5e5e;
  font-size: 0.75rem;
  font-weight: 700;
  letter-spacing: 0.06em;
  text-transform: uppercase;
}

.verify-fact dd {
  margin: 2px 0 0;
  color: #000000;
  font-weight: 600;
}

.verify-section-title {
  margin-bottom: 10px;
  color: #000000;
  font-weight: 800;
}

.verify-signature {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  padding: 8px 0;
}

.verify-signature__who {
  color: #000000;
  font-weight: 700;
}

.verify-signature__role {
  color: #5e5e5e;
  font-weight: 500;
}

.verify-signature__meta,
.verify-signature__method {
  color: #5e5e5e;
  font-size: 0.82rem;
}

.verify-integrity {
  display: grid;
  gap: 8px;
}

.verify-integrity__row {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 0.88rem;
}

.verify-footer {
  display: flex;
  flex-wrap: wrap;
  justify-content: space-between;
  gap: 10px;
  margin-top: 20px;
  padding-top: 14px;
  border-top: 1px solid rgb(0 0 0 / 0.08);
}

.verify-footer__label {
  display: block;
  color: #5e5e5e;
  font-size: 0.72rem;
  font-weight: 700;
  letter-spacing: 0.06em;
  text-transform: uppercase;
}

.verify-footer__hash {
  display: block;
  max-width: 100%;
  color: #1a1a1a;
  font-family: 'Roboto Mono', 'SF Mono', Consolas, monospace;
  font-size: 0.78rem;
  overflow-wrap: anywhere;
}

.verify-footer__stamp {
  color: #5e5e5e;
  font-size: 0.78rem;
}

@media (max-width: 600px) {
  .verify-facts {
    grid-template-columns: 1fr;
    gap: 10px;
  }
}
</style>
