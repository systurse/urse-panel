<template>
  <div class="import-page">
    <StudentBulkImportForm />
  </div>
</template>

<script setup lang="ts">
  import StudentBulkImportForm from '@/modules/students/components/StudentBulkImportForm.vue'
</script>

<style scoped>
.import-page {
  display: grid;
  gap: 24px;
}
</style>
