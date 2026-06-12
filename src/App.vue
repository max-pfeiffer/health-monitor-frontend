<script setup lang="ts">
import { ref } from 'vue'

const drawer = ref(true)

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
    </v-app-bar>

    <v-main>
      <v-container fluid>
        <router-view />
      </v-container>
    </v-main>
  </v-app>
</template>
