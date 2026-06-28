<script setup lang="ts">
import { computed, ref } from 'vue'
import { useTheme } from 'vuetify'
import { useBloodPressureChart } from '@/composables/useCharts'
import type { BloodPressureChartParams, ChartTheme } from '@/composables/useCharts'

const theme = useTheme()

const chartParams = ref<Omit<BloodPressureChartParams, 'theme'>>({
  start: null,
  end: null,
  systolic_top: 135,
  diastolic_top: 85,
  show_systolic: true,
  show_diastolic: true,
  show_pulse: true,
})

const {
  data: chartSvg,
  isLoading: chartLoading,
  isError: chartError,
} = useBloodPressureChart(
  computed(() => ({ ...chartParams.value, theme: theme.global.name.value as ChartTheme })),
)
</script>

<template>
  <div>
    <div class="d-flex align-center mb-4 ga-2">
      <v-btn icon="mdi-arrow-left" variant="text" to="/blood-pressure" />
      <h1 class="text-h4">Blood Pressure Chart</h1>
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
          <v-col cols="6" sm="3">
            <v-text-field
              v-model.number="chartParams.systolic_top"
              label="Systolic limit"
              type="number"
              hide-details
            />
          </v-col>
          <v-col cols="6" sm="3">
            <v-text-field
              v-model.number="chartParams.diastolic_top"
              label="Diastolic limit"
              type="number"
              hide-details
            />
          </v-col>
          <v-col cols="4" sm="2">
            <v-switch
              v-model="chartParams.show_systolic"
              label="Systolic"
              color="primary"
              hide-details
            />
          </v-col>
          <v-col cols="4" sm="2">
            <v-switch
              v-model="chartParams.show_diastolic"
              label="Diastolic"
              color="primary"
              hide-details
            />
          </v-col>
          <v-col cols="4" sm="2">
            <v-switch v-model="chartParams.show_pulse" label="Pulse" color="primary" hide-details />
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
