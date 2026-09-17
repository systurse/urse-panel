<template>
  <v-dialog v-model="open" max-width="560">
    <v-card rounded="xl">
      <v-card-title class="pt-5 px-6">Cambiar contacto de la solicitud</v-card-title>

      <v-card-text class="px-6">
        <v-alert
          v-if="error"
          class="mb-4"
          rounded="lg"
          type="error"
          variant="tonal"
        >{{ error }}</v-alert>

        <v-btn-toggle
          v-model="mode"
          class="mb-4"
          density="comfortable"
          mandatory
          variant="outlined"
        >
          <v-btn prepend-icon="mdi-account-search-outline" value="existing">Contacto existente</v-btn>
          <v-btn prepend-icon="mdi-account-plus-outline" value="new">Nuevo contacto</v-btn>
        </v-btn-toggle>

        <template v-if="mode === 'existing'">
          <v-autocomplete
            v-model="selectedId"
            v-model:search="search"
            clearable
            :item-title="contactTitle"
            item-value="id"
            :items="results"
            label="Buscar por nombre o correo"
            :loading="searching"
            no-data-text="Escribe para buscar contactos"
            no-filter
          />
        </template>

        <v-row v-else dense>
          <v-col cols="6"><v-text-field v-model="form.first_name" density="comfortable" label="Nombre *" /></v-col>
          <v-col cols="6"><v-text-field v-model="form.last_name" density="comfortable" label="Apellido" /></v-col>
          <v-col cols="6"><v-text-field v-model="form.email" density="comfortable" label="Correo institucional" type="email" /></v-col>
          <v-col cols="6"><v-text-field v-model="form.phone" density="comfortable" label="Teléfono / WhatsApp" /></v-col>
          <v-col cols="6"><v-text-field v-model="form.faculty" density="comfortable" label="Facultad o escuela" /></v-col>

          <v-col cols="6">
            <v-select
              v-model="form.campus"
              clearable
              density="comfortable"
              :items="CAMPUS_OPTIONS"
              label="Campus"
            />
          </v-col>

          <v-col cols="12"><v-text-field v-model="form.location" density="comfortable" label="Aula u oficina" /></v-col>
        </v-row>

        <v-alert
          class="mt-2"
          density="compact"
          rounded="lg"
          type="info"
          variant="tonal"
        >
          Al re-atribuir la solicitud, su facultad, campus y aula se actualizan a los del nuevo contacto.
        </v-alert>
      </v-card-text>

      <v-card-actions class="px-6 pb-5">
        <v-spacer />
        <v-btn variant="text" @click="open = false">Cancelar</v-btn>

        <v-btn
          color="#1a1a1a"
          :disabled="!canSave"
          :loading="saving"
          variant="flat"
          @click="save"
        >
          Cambiar contacto
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script lang="ts" setup>
  import type { Contact } from '@/modules/crm/types'
  import { computed, reactive, ref, watch } from 'vue'
  import * as crm from '@/modules/crm/service'
  import { CAMPUS_OPTIONS } from '@/modules/crm/types'

  const props = defineProps<{ dealId: number }>()

  const emit = defineEmits<{ saved: [] }>()

  const open = defineModel<boolean>({ default: false })

  const mode = ref<'existing' | 'new'>('existing')
  const search = ref('')
  const searching = ref(false)
  const results = ref<Contact[]>([])
  const selectedId = ref<number | null>(null)
  const saving = ref(false)
  const error = ref<string | null>(null)

  const form = reactive({
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
    faculty: '',
    campus: null as string | null,
    location: '',
  })

  const canSave = computed(() =>
    mode.value === 'existing' ? selectedId.value !== null : form.first_name.trim() !== '',
  )

  function contactTitle (contact: Contact | number) {
    if (typeof contact === 'number') {
      return String(contact)
    }
    return contact.email ? `${contact.full_name} — ${contact.email}` : contact.full_name
  }

  let searchTimer: ReturnType<typeof setTimeout> | null = null

  watch(search, value => {
    if (searchTimer) {
      clearTimeout(searchTimer)
    }
    searchTimer = setTimeout(async () => {
      searching.value = true
      try {
        const response = await crm.listContacts({ q: value || undefined, per_page: 20 })
        results.value = response.data
      } catch {
        results.value = []
      } finally {
        searching.value = false
      }
    }, 300)
  }, { immediate: true })

  watch(open, isOpen => {
    if (isOpen) {
      error.value = null
      selectedId.value = null
      mode.value = 'existing'
      Object.assign(form, { first_name: '', last_name: '', email: '', phone: '', faculty: '', campus: null, location: '' })
    }
  })

  async function save () {
    saving.value = true
    error.value = null

    try {
      await (mode.value === 'existing'
        ? crm.updateDeal(props.dealId, { contact_id: selectedId.value })
        : crm.updateDeal(props.dealId, {
          contact: {
            first_name: form.first_name,
            last_name: form.last_name || null,
            email: form.email || null,
            phone: form.phone || null,
            faculty: form.faculty || null,
            campus: form.campus,
            location: form.location || null,
          },
        }))

      emit('saved')
      open.value = false
    } catch (error_: any) {
      const data = error_?.response?.data
      const validation = data?.errors ? Object.values(data.errors as Record<string, string[]>).flat()[0] : null
      error.value = validation ?? data?.message ?? 'No fue posible cambiar el contacto'
    } finally {
      saving.value = false
    }
  }
</script>
