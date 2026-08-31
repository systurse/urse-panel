<template>
  <div class="contacts-page">
    <div class="contacts-toolbar">
      <v-text-field
        v-model="search"
        clearable
        density="compact"
        hide-details
        label="Buscar por nombre o correo"
        prepend-inner-icon="mdi-magnify"
        style="max-width: 340px"
        variant="outlined"
        @click:clear="clearSearch"
        @keyup.enter="loadContacts"
      />

      <v-btn
        v-if="canCreate"
        color="#1a1a1a"
        prepend-icon="mdi-account-plus-outline"
        variant="flat"
        @click="openNew"
      >
        Nuevo contacto
      </v-btn>
    </div>

    <v-alert v-if="error" rounded="xl" type="error" variant="tonal">{{ error }}</v-alert>

    <v-card rounded="xl">
      <v-data-table
        density="comfortable"
        :headers="headers"
        hover
        :items="contacts"
        :loading="loading"
        no-data-text="Sin contactos registrados"
      >
        <template #item.deals_count="{ item }">
          <v-chip size="small" variant="tonal">{{ item.deals_count ?? 0 }}</v-chip>
        </template>

        <template #item.actions="{ item }">
          <v-btn
            v-if="canEdit"
            icon="mdi-pencil-outline"
            size="small"
            variant="text"
            @click="openEdit(item)"
          />

          <v-btn
            v-if="item.phone"
            color="success"
            icon="mdi-whatsapp"
            size="small"
            variant="text"
            @click="openWhatsapp(item)"
          />
        </template>
      </v-data-table>
    </v-card>

    <v-dialog v-model="showForm" max-width="520">
      <v-card rounded="xl">
        <v-card-title class="pt-5 px-6">{{ editing ? 'Editar contacto' : 'Nuevo contacto' }}</v-card-title>

        <v-card-text class="px-6">
          <v-alert
            v-if="formError"
            class="mb-4"
            rounded="lg"
            type="error"
            variant="tonal"
          >{{ formError }}</v-alert>

          <v-row dense>
            <v-col cols="6"><v-text-field v-model="form.first_name" label="Nombre *" /></v-col>
            <v-col cols="6"><v-text-field v-model="form.last_name" label="Apellido" /></v-col>
            <v-col cols="6"><v-text-field v-model="form.email" label="Correo institucional" type="email" /></v-col>
            <v-col cols="6"><v-text-field v-model="form.phone" label="Teléfono / WhatsApp" /></v-col>
            <v-col cols="6"><v-text-field v-model="form.faculty" label="Facultad o escuela" /></v-col>

            <v-col cols="6">
              <v-select v-model="form.campus" clearable :items="CAMPUS_OPTIONS" label="Campus" />
            </v-col>

            <v-col cols="6"><v-text-field v-model="form.location" label="Aula u oficina" /></v-col>
          </v-row>
        </v-card-text>

        <v-card-actions class="px-6 pb-5">
          <v-spacer />
          <v-btn variant="text" @click="showForm = false">Cancelar</v-btn>

          <v-btn
            color="#1a1a1a"
            :disabled="!form.first_name"
            :loading="saving"
            variant="flat"
            @click="submit"
          >Guardar</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </div>
</template>

<script lang="ts" setup>
  import type { Contact } from '@/modules/crm/types'
  import { computed, onMounted, reactive, ref } from 'vue'
  import * as crm from '@/modules/crm/service'
  import { CAMPUS_OPTIONS } from '@/modules/crm/types'
  import { useAuthStore } from '@/stores/auth'

  const authStore = useAuthStore()

  const contacts = ref<Contact[]>([])
  const loading = ref(false)
  const saving = ref(false)
  const error = ref<string | null>(null)
  const formError = ref<string | null>(null)
  const search = ref('')
  const showForm = ref(false)
  const editing = ref<Contact | null>(null)

  const form = reactive({ first_name: '', last_name: '', email: '', phone: '', faculty: '', campus: null as string | null, location: '' })

  const canCreate = computed(() => authStore.isAdmin || authStore.hasPermission('crm.contacts.create'))
  const canEdit = computed(() => authStore.isAdmin || authStore.hasPermission('crm.contacts.update'))

  const headers = [
    { title: 'Nombre', key: 'full_name' },
    { title: 'Correo', key: 'email' },
    { title: 'Teléfono', key: 'phone' },
    { title: 'Facultad/Escuela', key: 'faculty' },
    { title: 'Campus', key: 'campus' },
    { title: 'Aula u oficina', key: 'location' },
    { title: 'Solicitudes', key: 'deals_count', sortable: false },
    { title: '', key: 'actions', sortable: false, width: 110 },
  ]

  async function loadContacts () {
    loading.value = true
    error.value = null

    try {
      const response = await crm.listContacts({ q: search.value || undefined, per_page: 100 })
      contacts.value = response.data
    } catch (error_: any) {
      error.value = error_?.response?.data?.message ?? 'No fue posible cargar los contactos'
    } finally {
      loading.value = false
    }
  }

  function clearSearch () {
    search.value = ''
    loadContacts()
  }

  function openNew () {
    editing.value = null
    Object.assign(form, { first_name: '', last_name: '', email: '', phone: '', faculty: '', campus: null, location: '' })
    formError.value = null
    showForm.value = true
  }

  function openEdit (contact: Contact) {
    editing.value = contact
    Object.assign(form, {
      first_name: contact.first_name,
      last_name: contact.last_name ?? '',
      email: contact.email ?? '',
      phone: contact.phone ?? '',
      faculty: contact.faculty ?? '',
      campus: contact.campus ?? null,
      location: contact.location ?? '',
    })
    formError.value = null
    showForm.value = true
  }

  async function submit () {
    saving.value = true
    formError.value = null

    const payload = {
      first_name: form.first_name,
      last_name: form.last_name || null,
      email: form.email || null,
      phone: form.phone || null,
      faculty: form.faculty || null,
      campus: form.campus,
      location: form.location || null,
    }

    try {
      await (editing.value ? crm.updateContact(editing.value.id, payload) : crm.createContact(payload))
      showForm.value = false
      await loadContacts()
    } catch (error_: any) {
      const data = error_?.response?.data
      const validation = data?.errors ? Object.values(data.errors as Record<string, string[]>).flat()[0] : null
      formError.value = validation ?? data?.message ?? 'No fue posible guardar el contacto'
    } finally {
      saving.value = false
    }
  }

  function openWhatsapp (contact: Contact) {
    const phone = contact.phone?.replace(/\D/g, '')
    if (phone) {
      window.open(`https://wa.me/${phone}`, '_blank', 'noopener')
    }
  }

  onMounted(loadContacts)
</script>

<style scoped>
.contacts-page {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.contacts-toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}
</style>
