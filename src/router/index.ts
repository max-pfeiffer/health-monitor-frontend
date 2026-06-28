import { createRouter, createWebHistory } from 'vue-router'
import BloodPressurePage from '@/pages/BloodPressurePage.vue'
import BloodPressureChartPage from '@/pages/BloodPressureChartPage.vue'
import BloodGlucosePage from '@/pages/BloodGlucosePage.vue'
import BloodGlucoseChartPage from '@/pages/BloodGlucoseChartPage.vue'
import KetonesPage from '@/pages/KetonesPage.vue'
import KetonesChartPage from '@/pages/KetonesChartPage.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    { path: '/', redirect: '/blood-pressure' },
    { path: '/blood-pressure', component: BloodPressurePage },
    { path: '/blood-pressure/chart', component: BloodPressureChartPage },
    { path: '/blood-glucose', component: BloodGlucosePage },
    { path: '/blood-glucose/chart', component: BloodGlucoseChartPage },
    { path: '/ketones', component: KetonesPage },
    { path: '/ketones/chart', component: KetonesChartPage },
  ],
})

export default router
