<template>
  <div class="content-shell">
    <slot />
  </div>
</template>

<style scoped>
.content-shell {
  flex: 1;
  padding: 28px;
  min-width: 0;
  min-height: 0;
  background:
    radial-gradient(circle at top right, rgb(177 122 69 / 0.1), transparent 28%),
    linear-gradient(180deg, #f7f2ed 0%, #f3eee8 100%);
}

@media (max-width: 960px) {
  .content-shell {
    padding: 20px;
  }
}
</style>
