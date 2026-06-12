import { createRouter, createWebHistory } from 'vue-router'
import BloodPressurePage from '@/pages/BloodPressurePage.vue'
import BloodGlucosePage from '@/pages/BloodGlucosePage.vue'
import KetonesPage from '@/pages/KetonesPage.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    { path: '/', redirect: '/blood-pressure' },
    { path: '/blood-pressure', component: BloodPressurePage },
    { path: '/blood-glucose', component: BloodGlucosePage },
    { path: '/ketones', component: KetonesPage },
  ],
})

export default router
