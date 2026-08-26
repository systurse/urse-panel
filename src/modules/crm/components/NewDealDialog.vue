<template>
  <v-dialog v-model="open" max-width="640">
    <v-card rounded="xl">
      <v-card-title class="pt-5 px-6">Nueva negociación</v-card-title>

      <v-card-text class="px-6">
        <v-alert
          v-if="error"
          class="mb-4"
          rounded="lg"
          type="error"
          variant="tonal"
        >{{ error }}</v-alert>

        <v-form @submit.prevent="submit">
          <v-textarea v-model="form.title" auto-grow label="Solicitud o reporte *" rows="2" />

          <v-select
            v-model="form.channel"
            item-title="label"
            item-value="value"
            :items="channels"
            label="Origen del canal *"
          />

          <v-select
            v-model="form.assigned_to"
            clearable
            item-title="name"
            item-value="id"
            :items="assignables"
            label="Responsable"
          />

          <p class="section-label">Contacto</p>

          <v-row dense>
            <v-col cols="6"><v-text-field v-model="form.contact.first_name" density="comfortable" label="Nombre *" /></v-col>
            <v-col cols="6"><v-text-field v-model="form.contact.last_name" density="comfortable" label="Apellido" /></v-col>
            <v-col cols="6"><v-text-field v-model="form.contact.email" density="comfortable" label="Correo institucional" type="email" /></v-col>
            <v-col cols="6"><v-text-field v-model="form.contact.phone" density="comfortable" label="Teléfono / WhatsApp" /></v-col>
            <v-col cols="6"><v-text-field v-model="form.contact.faculty" density="comfortable" label="Facultad o escuela" /></v-col>
            <v-col cols="6"><v-text-field v-model="form.contact.location" density="comfortable" label="Aula u oficina" /></v-col>
          </v-row>
        </v-form>
      </v-card-text>

      <v-card-actions class="px-6 pb-5">
        <v-spacer />
        <v-btn variant="text" @click="open = false">Cancelar</v-btn>

        <v-btn
          color="#1a1a1a"
          :disabled="!form.title || !form.contact.first_name"
          :loading="saving"
          variant="flat"
          @click="submit"
        >
          Crear negociación
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script lang="ts" setup>
  import type { CrmUser, Deal, DealChannel } from '@/modules/crm/types'
  import { reactive, ref } from 'vue'
  import * as crm from '@/modules/crm/service'

  const props = defineProps<{
    pipelineId: number | null
    assignables: CrmUser[]
  }>()

  const emit = defineEmits<{ created: [deal: Deal] }>()

  const open = defineModel<boolean>({ default: false })

  const channels: Array<{ value: DealChannel, label: string }> = [
    { value: 'manual', label: 'Registro manual' },
    { value: 'whatsapp', label: 'WhatsApp' },
    { value: 'email', label: 'Correo electrónico' },
    { value: 'contact_form', label: 'Formulario de contacto' },
  ]

  const saving = ref(false)
  const error = ref<string | null>(null)

  const form = reactive({
    title: '',
    channel: 'manual' as DealChannel,
    assigned_to: null as number | null,
    contact: {
      first_name: '',
      last_name: '',
      email: '',
      phone: '',
      faculty: '',
      location: '',
    },
  })

  async function submit () {
    saving.value = true
    error.value = null

    try {
      const deal = await crm.createDeal({
        title: form.title,
        description: form.title,
        channel: form.channel,
        assigned_to: form.assigned_to,
        pipeline_id: props.pipelineId ?? undefined,
        contact: {
          first_name: form.contact.first_name,
          last_name: form.contact.last_name || null,
          email: form.contact.email || null,
          phone: form.contact.phone || null,
          faculty: form.contact.faculty || null,
          location: form.contact.location || null,
        },
      })

      emit('created', deal)
      open.value = false
      form.title = ''
      form.assigned_to = null
      Object.assign(form.contact, { first_name: '', last_name: '', email: '', phone: '', faculty: '', location: '' })
    } catch (error_: any) {
      const data = error_?.response?.data
      const validation = data?.errors ? Object.values(data.errors as Record<string, string[]>).flat()[0] : null
      error.value = validation ?? data?.message ?? 'No fue posible crear la negociación'
    } finally {
      saving.value = false
    }
  }
</script>

<style scoped>
.section-label {
  font-size: 12px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  color: rgba(0, 0, 0, 0.5);
  margin: 8px 0;
}
</style>
