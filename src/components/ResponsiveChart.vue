<script setup lang="ts">
import { useResponsiveSvg } from '@/composables/useResponsiveSvg'

const props = defineProps<{ svg: string | null | undefined }>()

const responsiveSvg = useResponsiveSvg(() => props.svg)
</script>

<template>
  <!-- SVG comes from the authenticated backend and is safe to render directly -->
  <div class="responsive-chart" v-html="responsiveSvg" />
</template>

<style scoped>
.responsive-chart {
  width: 100%;
}

.responsive-chart :deep(svg) {
  display: block;
  width: 100%;
  height: auto;
  max-width: 100%;
}
</style>
