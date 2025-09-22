<template>
  <div class="h-full overflow-hidden">
    <div
      class="flex transition-transform duration-300 ease-in-out h-full"
      :style="{ transform: `translateX(${slideOffset}%)` }"
    >
      <slot />
    </div>
  </div>
</template>

<script setup lang="ts">
interface Props {
  slideOffset: number
}

defineProps<Props>()
</script>

<style scoped>
.h-screen-header {
  height: calc(100vh - 130px);
}
</style>