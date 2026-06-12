<script setup lang="ts">
import { ref } from 'vue'
import { useAuthStore } from '@/stores/auth'

const drawer = ref(true)
const authStore = useAuthStore()

const navItems = [
  { title: 'Blood Pressure', to: '/blood-pressure', icon: 'mdi-heart-pulse' },
  { title: 'Blood Glucose', to: '/blood-glucose', icon: 'mdi-water' },
  { title: 'Ketones', to: '/ketones', icon: 'mdi-flask' },
]
</script>

<template>
  <v-app>
    <v-navigation-drawer v-model="drawer">
      <v-list nav density="compact">
        <v-list-item
          v-for="item in navItems"
          :key="item.to"
          :to="item.to"
          :prepend-icon="item.icon"
          :title="item.title"
        />
      </v-list>
    </v-navigation-drawer>

    <v-app-bar>
      <v-app-bar-nav-icon @click="drawer = !drawer" />
      <v-app-bar-title>Health Monitor</v-app-bar-title>
      <template #append>
        <span v-if="authStore.username" class="text-body-2 mr-2">{{ authStore.username }}</span>
        <v-btn icon="mdi-logout" @click="authStore.logout()" />
      </template>
    </v-app-bar>

    <v-main>
      <v-container fluid>
        <router-view />
      </v-container>
    </v-main>
  </v-app>
</template>
