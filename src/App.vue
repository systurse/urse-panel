<template>
  <v-app>
    <router-view />
  </v-app>
</template>

<script lang="ts" setup>
  import { useAccessSync } from '@/modules/core/hooks/useAccessSync'

  useAccessSync()
</script>
