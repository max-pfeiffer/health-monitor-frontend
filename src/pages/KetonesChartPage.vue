<script setup lang="ts">
import { ref } from 'vue'
import { useKetonesChart } from '@/composables/useCharts'
import type { SimpleChartParams } from '@/composables/useCharts'
import ResponsiveChart from '@/components/ResponsiveChart.vue'

const chartParams = ref<SimpleChartParams>({ start: null, end: null })

const {
  data: chartSvg,
  isLoading: chartLoading,
  isError: chartError,
} = useKetonesChart(chartParams)
</script>

<template>
  <div>
    <div class="d-flex align-center mb-4 ga-2">
      <h1 class="text-h4">Ketones Chart</h1>
      <v-spacer />
      <v-btn variant="text" prepend-icon="mdi-table" to="/ketones">Records</v-btn>
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
        <ResponsiveChart v-else-if="chartSvg" :svg="chartSvg" class="mt-4" />
        <p v-else class="text-medium-emphasis text-center pa-8">No chart data yet.</p>
      </v-card-text>
    </v-card>
  </div>
</template>
