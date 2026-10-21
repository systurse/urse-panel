<template>
  <div class="year-view">
    <section
      v-for="month in months"
      :key="month.index"
      class="year-view__month"
    >
      <button class="year-view__month-title" type="button" @click="emit('select-month', month.index)">
        {{ month.name }}
        <span v-if="month.total > 0" class="year-view__month-total">{{ month.total }}</span>
      </button>

      <div class="year-view__grid">
        <span v-for="weekday in WEEKDAYS" :key="weekday" class="year-view__weekday">{{ weekday }}</span>

        <span v-for="blank in month.leadingBlanks" :key="`blank-${blank}`" />

        <button
          v-for="day in month.days"
          :key="day.key"
          :aria-label="`${day.number} de ${month.name}: ${day.count} ${day.count === 1 ? 'actividad' : 'actividades'}`"
          class="year-view__day"
          :class="{ 'year-view__day--today': day.key === todayKey, 'year-view__day--busy': day.count > 0 }"
          :style="day.count > 0 ? { '--busy-color': day.color } : undefined"
          type="button"
          @click="emit('select-day', day.key)"
        >
          {{ day.number }}
          <span v-if="day.count > 0" class="year-view__dot" />
        </button>
      </div>
    </section>
  </div>
</template>

<script lang="ts" setup>
  import { computed } from 'vue'
  import { MONTH_NAMES, toDateKey } from '@/modules/agenda/dates'

  const props = defineProps<{
    year: number
    /** Activities per local `YYYY-MM-DD`, with the colour of the first one. */
    days: Record<string, { count: number, color: string }>
  }>()

  const emit = defineEmits<{
    'select-day': [dateKey: string]
    'select-month': [monthIndex: number]
  }>()

  const WEEKDAYS = ['L', 'M', 'M', 'J', 'V', 'S', 'D']

  const todayKey = toDateKey(new Date())

  const months = computed(() => MONTH_NAMES.map((name, index) => {
    const first = new Date(props.year, index, 1)
    const daysInMonth = new Date(props.year, index + 1, 0).getDate()

    const days = Array.from({ length: daysInMonth }, (_, offset) => {
      const key = toDateKey(new Date(props.year, index, offset + 1))
      const info = props.days[key]
      return { key, number: offset + 1, count: info?.count ?? 0, color: info?.color ?? '' }
    })

    return {
      index,
      name,
      // Monday-first grid.
      leadingBlanks: (first.getDay() + 6) % 7,
      days,
      total: days.reduce((sum, day) => sum + day.count, 0),
    }
  }))
</script>

<style scoped>
.year-view {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
  gap: 16px;
}

.year-view__month {
  padding: 12px;
  border: 1px solid rgba(var(--v-border-color), var(--v-border-opacity));
  border-radius: 14px;
  background: rgb(var(--v-theme-surface));
}

.year-view__month-title {
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
  margin-bottom: 8px;
  padding: 2px 4px;
  border-radius: 6px;
  font-weight: 800;
  text-align: left;
  text-transform: capitalize;
}

.year-view__month-title:hover {
  background: rgba(250, 178, 26, 0.14);
}

.year-view__month-total {
  min-width: 22px;
  padding: 0 6px;
  border-radius: 999px;
  background: #FAB21A;
  color: #1a1a1a;
  font-size: 0.72rem;
  text-align: center;
}

.year-view__grid {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  gap: 2px;
  text-align: center;
}

.year-view__weekday {
  color: #8a8a8a;
  font-size: 0.68rem;
  font-weight: 700;
}

.year-view__day {
  position: relative;
  aspect-ratio: 1;
  border-radius: 8px;
  font-size: 0.78rem;
}

.year-view__day:hover {
  background: rgba(var(--v-theme-on-surface), 0.08);
}

.year-view__day--busy {
  font-weight: 800;
}

.year-view__day--today {
  outline: 2px solid #FAB21A;
  outline-offset: -2px;
}

.year-view__dot {
  position: absolute;
  bottom: 3px;
  left: 50%;
  width: 5px;
  height: 5px;
  border-radius: 50%;
  background: var(--busy-color, #FAB21A);
  transform: translateX(-50%);
}

/* Two small months per row on a phone instead of one huge one. */
@media (max-width: 600px) {
  .year-view {
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 8px;
  }

  .year-view__month {
    padding: 8px 6px;
  }

  .year-view__month-title {
    font-size: 0.85rem;
  }

  .year-view__day {
    font-size: 0.68rem;
  }

  .year-view__weekday {
    font-size: 0.6rem;
  }
}
</style>
