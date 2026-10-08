<template>
  <v-menu>
    <template #activator="{ props }">
      <v-btn icon v-bind="props" :aria-label="$t('theme.title')">
        <v-icon>mdi-theme-light-dark</v-icon>
      </v-btn>
    </template>
    <v-list density="compact">
      <v-list-item v-for="mode in themeModes" :key="mode"
        :active="theme.global.name.value === mode" @click="changeTheme(mode)"
        :prepend-icon="mode === 'light' ? 'mdi-white-balance-sunny' : 'mdi-weather-night'">
        <v-list-item-title>{{ $t(`theme.${mode}`) }}</v-list-item-title>
      </v-list-item>
    </v-list>
  </v-menu>
</template>

<script setup lang="ts">
import { useTheme } from 'vuetify'
import { themeModes, type ThemeMode } from '@/plugins/theme'

const theme = useTheme()
const changeTheme = (mode: ThemeMode) => {
  theme.change(mode)
  localStorage.setItem('theme', mode)
}
</script>
