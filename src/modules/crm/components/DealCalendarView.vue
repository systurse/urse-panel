<template>
  <v-card class="calendar-card" rounded="xl">
    <div class="calendar-toolbar">
      <v-btn icon="mdi-chevron-left" size="small" variant="text" @click="previousMonth" />
      <span class="calendar-month">{{ monthLabel }}</span>
      <v-btn icon="mdi-chevron-right" size="small" variant="text" @click="nextMonth" />
    </div>

    <div class="calendar-grid calendar-grid--head">
      <span v-for="day in weekDays" :key="day" class="calendar-weekday">{{ day }}</span>
    </div>

    <div class="calendar-grid">
      <div
        v-for="cell in cells"
        :key="cell.key"
        class="calendar-cell"
        :class="{ 'calendar-cell--muted': !cell.inMonth, 'calendar-cell--today': cell.isToday }"
      >
        <span class="calendar-day">{{ cell.day }}</span>

        <button
          v-for="deal in cell.deals"
          :key="deal.id"
          class="calendar-deal"
          :style="{ background: deal.stage?.color ?? '#9e9e9e' }"
          type="button"
          @click="emit('open', deal)"
        >
          #{{ deal.id }} {{ deal.title }}
        </button>
      </div>
    </div>

    <p class="calendar-hint">
      Las negociaciones se ubican por su fecha final; sin fecha final, por la fecha de solicitud.
    </p>
  </v-card>
</template>

<script lang="ts" setup>
  import type { Deal } from '@/modules/crm/types'
  import { computed, ref } from 'vue'

  const props = defineProps<{ deals: Deal[] }>()

  const emit = defineEmits<{ open: [deal: Deal] }>()

  const weekDays = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom']

  const cursor = ref(new Date())

  const monthLabel = computed(() =>
    cursor.value.toLocaleDateString('es-MX', { month: 'long', year: 'numeric' }),
  )

  function dealDateKey (deal: Deal): string | null {
    const raw = deal.due_date ?? deal.requested_at
    if (!raw) {
      return null
    }
    const date = new Date(raw)
    return `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`
  }

  const dealsByDay = computed<Record<string, Deal[]>>(() => {
    const groups: Record<string, Deal[]> = {}

    for (const deal of props.deals) {
      const key = dealDateKey(deal)
      if (key) {
        (groups[key] ??= []).push(deal)
      }
    }

    return groups
  })

  const cells = computed(() => {
    const year = cursor.value.getFullYear()
    const month = cursor.value.getMonth()
    const firstDay = new Date(year, month, 1)
    // Lunes como primer día de la semana
    const offset = (firstDay.getDay() + 6) % 7
    const start = new Date(year, month, 1 - offset)
    const today = new Date()

    return Array.from({ length: 42 }, (_, index) => {
      const date = new Date(start.getFullYear(), start.getMonth(), start.getDate() + index)
      const key = `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`

      return {
        key,
        day: date.getDate(),
        inMonth: date.getMonth() === month,
        isToday: date.toDateString() === today.toDateString(),
        deals: dealsByDay.value[key] ?? [],
      }
    })
  })

  function previousMonth () {
    cursor.value = new Date(cursor.value.getFullYear(), cursor.value.getMonth() - 1, 1)
  }

  function nextMonth () {
    cursor.value = new Date(cursor.value.getFullYear(), cursor.value.getMonth() + 1, 1)
  }
</script>

<style scoped>
.calendar-card {
  padding: 16px;
}

.calendar-toolbar {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
  margin-bottom: 12px;
}

.calendar-month {
  font-weight: 700;
  text-transform: capitalize;
  min-width: 180px;
  text-align: center;
}

.calendar-grid {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  gap: 4px;
}

.calendar-grid--head {
  margin-bottom: 4px;
}

.calendar-weekday {
  font-size: 11px;
  font-weight: 700;
  text-align: center;
  color: rgba(0, 0, 0, 0.5);
}

.calendar-cell {
  min-height: 92px;
  border: 1px solid rgba(0, 0, 0, 0.07);
  border-radius: 8px;
  padding: 4px;
  display: flex;
  flex-direction: column;
  gap: 3px;
  overflow: hidden;
}

.calendar-cell--muted {
  opacity: 0.45;
}

.calendar-cell--today {
  border-color: #1a1a1a;
  border-width: 2px;
}

.calendar-day {
  font-size: 11px;
  font-weight: 600;
}

.calendar-deal {
  border: none;
  color: white;
  font-size: 10px;
  border-radius: 4px;
  padding: 2px 4px;
  text-align: left;
  cursor: pointer;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.calendar-hint {
  font-size: 11px;
  color: rgba(0, 0, 0, 0.45);
  margin: 10px 0 0;
}
</style>
