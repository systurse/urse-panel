<template>
  <v-dialog v-model="open" max-width="520">
    <v-card rounded="xl">
      <v-card-title class="pt-5 px-6">Agregar actividad</v-card-title>

      <v-card-text class="px-6">
        <v-alert
          v-if="error"
          class="mb-4"
          rounded="lg"
          type="error"
          variant="tonal"
        >{{ error }}</v-alert>

        <v-btn-toggle
          v-model="type"
          class="mb-4"
          density="comfortable"
          mandatory
          variant="outlined"
        >
          <v-btn prepend-icon="mdi-bell-outline" value="reminder">Recordatorio</v-btn>
          <v-btn prepend-icon="mdi-comment-text-outline" value="comment">Comentario</v-btn>
        </v-btn-toggle>

        <v-textarea v-model="body" auto-grow :label="type === 'reminder' ? 'Pendiente para comunicarte con el cliente *' : 'Comentario *'" rows="3" />

        <v-text-field
          v-if="type === 'reminder'"
          v-model="remindAt"
          label="Recordar el *"
          type="datetime-local"
        />

        <v-file-input
          v-if="type === 'comment'"
          v-model="files"
          accept=".pdf,.docx,.jpg,.jpeg,.png"
          chips
          density="comfortable"
          label="Adjuntar archivos (pdf, docx, jpg, png)"
          multiple
          prepend-icon="mdi-paperclip"
          show-size
        />
      </v-card-text>

      <v-card-actions class="px-6 pb-5">
        <v-spacer />
        <v-btn variant="text" @click="open = false">Cancelar</v-btn>

        <v-btn
          color="#1a1a1a"
          :disabled="!body || (type === 'reminder' && !remindAt)"
          :loading="saving"
          variant="flat"
          @click="submit"
        >Guardar</v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script lang="ts" setup>
  import { ref } from 'vue'

  defineProps<{ saving?: boolean, error?: string | null }>()

  const emit = defineEmits<{
    submit: [payload: { type: 'reminder' | 'comment', body: string, remind_at?: string | null, attachments?: File[] }]
  }>()

  const open = defineModel<boolean>({ default: false })

  const type = ref<'reminder' | 'comment'>('comment')
  const body = ref('')
  const remindAt = ref('')
  const files = ref<File[]>([])

  function submit () {
    emit('submit', {
      type: type.value,
      body: body.value,
      remind_at: type.value === 'reminder' ? remindAt.value : null,
      attachments: type.value === 'comment' ? files.value : [],
    })
  }

  function reset () {
    body.value = ''
    remindAt.value = ''
    files.value = []
  }

  defineExpose({ reset })
</script>
