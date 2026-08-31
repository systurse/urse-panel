<template>
  <v-dialog v-model="open" max-width="420">
    <v-card v-if="contact" rounded="xl">
      <v-card-title class="pt-5 px-6">
        <v-icon class="mr-2" icon="mdi-account-circle-outline" />
        {{ contact.full_name }}
      </v-card-title>

      <v-card-text class="px-6">
        <v-list density="compact">
          <v-list-item prepend-icon="mdi-email-outline" :subtitle="contact.email ?? 'Sin correo'" title="Correo institucional" />
          <v-list-item prepend-icon="mdi-phone-outline" :subtitle="contact.phone ?? 'Sin teléfono'" title="Teléfono / WhatsApp" />
          <v-list-item prepend-icon="mdi-school-outline" :subtitle="contact.faculty ?? 'Sin registrar'" title="Facultad o escuela" />
          <v-list-item prepend-icon="mdi-office-building-marker-outline" :subtitle="contact.campus ?? 'Sin registrar'" title="Campus" />
          <v-list-item prepend-icon="mdi-map-marker-outline" :subtitle="contact.location ?? 'Sin registrar'" title="Aula u oficina" />
        </v-list>
      </v-card-text>

      <v-card-actions class="px-6 pb-5">
        <v-btn
          v-if="contact.phone"
          color="success"
          prepend-icon="mdi-whatsapp"
          variant="tonal"
          @click="openWhatsapp"
        >WhatsApp</v-btn>

        <v-spacer />
        <v-btn variant="text" @click="open = false">Cerrar</v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script lang="ts" setup>
  import type { Contact } from '@/modules/crm/types'

  const props = defineProps<{ contact: Contact | null }>()

  const open = defineModel<boolean>({ default: false })

  function openWhatsapp () {
    const phone = props.contact?.phone?.replace(/\D/g, '')
    if (phone) {
      window.open(`https://wa.me/${phone}`, '_blank', 'noopener')
    }
  }
</script>
