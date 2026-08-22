<template>
  <v-dialog v-model="open" max-width="460">
    <v-card rounded="xl">
      <v-card-title class="pt-5 px-6">Cerrar negociación</v-card-title>

      <v-card-text class="px-6">
        <v-alert
          v-if="error"
          class="mb-4"
          rounded="lg"
          type="error"
          variant="tonal"
        >{{ error }}</v-alert>

        <v-radio-group v-model="result">
          <v-radio label="Ganada — el servicio se atendió" value="won" />
          <v-radio label="Perdida — no se concretó la atención" value="lost" />
        </v-radio-group>

        <v-checkbox
          v-if="result === 'won'"
          v-model="generateOrder"
          density="comfortable"
          hint="Requiere solución, diagnóstico, requerimientos, tipo de servicio y responsable de equipo capturados."
          label="Generar orden de servicio con los datos capturados"
          persistent-hint
        />
      </v-card-text>

      <v-card-actions class="px-6 pb-5">
        <v-spacer />
        <v-btn variant="text" @click="open = false">Cancelar</v-btn>
        <v-btn color="#1a1a1a" :loading="closing" variant="flat" @click="confirm">Cerrar negociación</v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script lang="ts" setup>
  import { ref } from 'vue'

  defineProps<{ closing?: boolean, error?: string | null }>()

  const emit = defineEmits<{ confirm: [result: 'won' | 'lost', generateServiceOrder: boolean] }>()

  const open = defineModel<boolean>({ default: false })

  const result = ref<'won' | 'lost'>('won')
  const generateOrder = ref(false)

  function confirm () {
    emit('confirm', result.value, result.value === 'won' && generateOrder.value)
  }
</script>
