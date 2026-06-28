<script setup lang="ts">
import { computed, ref } from 'vue'
import { useTheme } from 'vuetify'
import { useBloodGlucoseChart } from '@/composables/useCharts'
import type { ChartTheme, SimpleChartParams } from '@/composables/useCharts'

const theme = useTheme()

const chartParams = ref<Omit<SimpleChartParams, 'theme'>>({ start: null, end: null })
const {
  data: chartSvg,
  isLoading: chartLoading,
  isError: chartError,
} = useBloodGlucoseChart(
  computed(() => ({ ...chartParams.value, theme: theme.global.name.value as ChartTheme })),
)
</script>

<template>
  <div>
    <div class="d-flex align-center mb-4 ga-2">
      <v-btn icon="mdi-arrow-left" variant="text" to="/blood-glucose" />
      <h1 class="text-h4">Blood Glucose Chart</h1>
    </div>

    <v-card>
      <v-card-text>
        <v-row>
          <v-col cols="12" sm="6">
            <v-text-field
              v-model="chartParams.start"
              label="From"
              type="date"
              clearable
              hide-details
            />
          </v-col>
          <v-col cols="12" sm="6">
            <v-text-field v-model="chartParams.end" label="To" type="date" clearable hide-details />
          </v-col>
        </v-row>
        <div v-if="chartLoading" class="d-flex justify-center pa-8">
          <v-progress-circular indeterminate color="primary" />
        </div>
        <v-alert v-else-if="chartError" type="error" variant="tonal" class="mt-4">
          Failed to load chart. Check your connection.
        </v-alert>
        <!-- SVG from authenticated backend is safe to render directly -->
        <div v-else-if="chartSvg" class="overflow-x-auto mt-4" v-html="chartSvg" />
        <p v-else class="text-medium-emphasis text-center pa-8">No chart data yet.</p>
      </v-card-text>
    </v-card>
  </div>
</template>
