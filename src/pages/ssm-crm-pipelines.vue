<template>
  <div class="pipelines-page">
    <div class="pipelines-toolbar">
      <v-select
        density="compact"
        hide-details
        item-title="name"
        item-value="id"
        :items="pipelines"
        label="Pipeline"
        :model-value="activeId"
        style="max-width: 280px"
        variant="outlined"
        @update:model-value="activeId = $event as number"
      />

      <v-btn color="#1a1a1a" prepend-icon="mdi-plus" variant="flat" @click="openNewPipeline">Nuevo pipeline</v-btn>
    </div>

    <v-alert
      v-if="error"
      closable
      rounded="xl"
      type="error"
      variant="tonal"
      @click:close="error = null"
    >{{ error }}</v-alert>

    <v-card v-if="active" rounded="xl">
      <v-card-text>
        <div class="pipeline-head">
          <div>
            <h2 class="pipeline-name">{{ active.name }}</h2>
            <p class="pipeline-desc">{{ active.description }}</p>
          </div>

          <div class="pipeline-head-actions">
            <v-chip v-if="active.is_default" color="success" size="small" variant="tonal">Pipeline del widget</v-chip>
            <v-btn v-else size="small" variant="outlined" @click="makeDefault">Usar para el widget</v-btn>

            <v-btn
              color="error"
              :disabled="pipelines.length <= 1"
              icon="mdi-delete-outline"
              size="small"
              variant="text"
              @click="removePipeline"
            />
          </div>
        </div>

        <v-divider class="my-4" />

        <h3 class="stages-title">Etapas del funnel</h3>

        <div v-for="(stage, index) in stages" :key="stage.id" class="stage-row">
          <span class="stage-position">{{ index + 1 }}</span>
          <input v-model="stage.color" class="stage-color" type="color">
          <v-text-field v-model="stage.name" density="compact" hide-details variant="outlined" />

          <v-btn
            density="comfortable"
            :disabled="index === 0"
            icon="mdi-arrow-up"
            size="small"
            variant="text"
            @click="moveStage(index, -1)"
          />

          <v-btn
            density="comfortable"
            :disabled="index === stages.length - 1"
            icon="mdi-arrow-down"
            size="small"
            variant="text"
            @click="moveStage(index, 1)"
          />

          <v-btn
            color="primary"
            density="comfortable"
            icon="mdi-content-save-outline"
            size="small"
            variant="text"
            @click="saveStage(stage)"
          />

          <v-btn
            color="error"
            density="comfortable"
            icon="mdi-delete-outline"
            size="small"
            variant="text"
            @click="removeStage(stage)"
          />
        </div>

        <div class="new-stage-row">
          <v-text-field
            v-model="newStageName"
            density="compact"
            hide-details
            label="Nueva etapa"
            variant="outlined"
            @keyup.enter="addStage"
          />

          <v-btn color="#1a1a1a" :disabled="!newStageName" variant="flat" @click="addStage">Agregar etapa</v-btn>
        </div>
      </v-card-text>
    </v-card>

    <v-dialog v-model="showNewPipeline" max-width="460">
      <v-card rounded="xl">
        <v-card-title class="pt-5 px-6">Nuevo pipeline</v-card-title>

        <v-card-text class="px-6">
          <v-text-field v-model="pipelineForm.name" label="Nombre *" />
          <v-text-field v-model="pipelineForm.description" label="Descripción" />
          <v-switch v-model="pipelineForm.is_default" color="#1a1a1a" hide-details label="Asignarlo al widget de contacto" />
        </v-card-text>

        <v-card-actions class="px-6 pb-5">
          <v-spacer />
          <v-btn variant="text" @click="showNewPipeline = false">Cancelar</v-btn>
          <v-btn color="#1a1a1a" :disabled="!pipelineForm.name" variant="flat" @click="submitPipeline">Crear</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </div>
</template>

<script lang="ts" setup>
  import type { Pipeline, Stage } from '@/modules/crm/types'
  import { computed, onMounted, reactive, ref, watch } from 'vue'
  import * as crm from '@/modules/crm/service'

  const pipelines = ref<Pipeline[]>([])
  const activeId = ref<number | null>(null)
  const stages = ref<Stage[]>([])
  const error = ref<string | null>(null)
  const showNewPipeline = ref(false)
  const newStageName = ref('')

  const pipelineForm = reactive({ name: '', description: '', is_default: false })

  const active = computed(() => pipelines.value.find(pipeline => pipeline.id === activeId.value) ?? null)

  watch(active, value => {
    stages.value = (value?.stages ?? []).map(stage => ({ ...stage }))
  })

  async function load () {
    try {
      pipelines.value = await crm.listPipelines()
      activeId.value ??= pipelines.value.find(pipeline => pipeline.is_default)?.id ?? pipelines.value[0]?.id ?? null
      stages.value = (active.value?.stages ?? []).map(stage => ({ ...stage }))
    } catch (error_: any) {
      error.value = error_?.response?.data?.message ?? 'No fue posible cargar los pipelines'
    }
  }

  function extractError (error_: any, fallback: string) {
    return error_?.response?.data?.message ?? fallback
  }

  function openNewPipeline () {
    Object.assign(pipelineForm, { name: '', description: '', is_default: false })
    showNewPipeline.value = true
  }

  async function submitPipeline () {
    try {
      const pipeline = await crm.createPipeline({ ...pipelineForm })
      showNewPipeline.value = false
      await load()
      activeId.value = pipeline.id
    } catch (error_: any) {
      error.value = extractError(error_, 'No fue posible crear el pipeline')
    }
  }

  async function makeDefault () {
    if (!active.value) {
      return
    }

    try {
      await crm.updatePipeline(active.value.id, { is_default: true })
      await load()
    } catch (error_: any) {
      error.value = extractError(error_, 'No fue posible actualizar el pipeline')
    }
  }

  async function removePipeline () {
    if (!active.value) {
      return
    }

    try {
      await crm.deletePipeline(active.value.id)
      activeId.value = null
      await load()
    } catch (error_: any) {
      error.value = extractError(error_, 'No se puede eliminar un pipeline con negociaciones')
    }
  }

  async function addStage () {
    if (!active.value || !newStageName.value) {
      return
    }

    try {
      await crm.createStage(active.value.id, { name: newStageName.value })
      newStageName.value = ''
      await load()
    } catch (error_: any) {
      error.value = extractError(error_, 'No fue posible crear la etapa')
    }
  }

  async function saveStage (stage: Stage) {
    try {
      await crm.updateStage(stage.id, { name: stage.name, color: stage.color })
      await load()
    } catch (error_: any) {
      error.value = extractError(error_, 'No fue posible guardar la etapa')
    }
  }

  async function removeStage (stage: Stage) {
    try {
      await crm.deleteStage(stage.id)
      await load()
    } catch (error_: any) {
      error.value = extractError(error_, 'No se puede eliminar una etapa con negociaciones')
    }
  }

  async function moveStage (index: number, direction: number) {
    if (!active.value) {
      return
    }

    const ids = stages.value.map(stage => stage.id)
    const [moved] = ids.splice(index, 1)
    ids.splice(index + direction, 0, moved)

    try {
      await crm.reorderStages(active.value.id, ids)
      await load()
    } catch (error_: any) {
      error.value = extractError(error_, 'No fue posible reordenar las etapas')
    }
  }

  onMounted(load)
</script>

<style scoped>
.pipelines-page {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.pipelines-toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.pipeline-head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
}

.pipeline-name {
  font-size: 18px;
  margin: 0;
}

.pipeline-desc {
  font-size: 13px;
  color: rgba(0, 0, 0, 0.55);
  margin: 4px 0 0;
}

.pipeline-head-actions {
  display: flex;
  align-items: center;
  gap: 8px;
}

.stages-title {
  font-size: 13px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  margin-bottom: 12px;
}

.stage-row {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 8px;
}

.stage-position {
  width: 22px;
  font-size: 12px;
  font-weight: 700;
  color: rgba(0, 0, 0, 0.5);
  text-align: center;
}

.stage-color {
  width: 34px;
  height: 34px;
  border: none;
  border-radius: 8px;
  padding: 0;
  background: none;
  cursor: pointer;
}

.stage-row .v-text-field {
  flex: 1;
}

.new-stage-row {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-top: 16px;
}

.new-stage-row .v-text-field {
  max-width: 320px;
}
</style>
