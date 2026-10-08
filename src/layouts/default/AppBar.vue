<template>
  <v-app-bar :elevation="5">
    <v-icon v-if="isMobile" icon="mdi-menu" @click="$emit('toggleDrawer')" />
    <span v-else style="width: 24px"></span>
    <v-app-bar-title :text="$t(<string>route.name)" class="align-center text-center " />
    <v-menu v-if="servers.length > 0 || currentServer">
      <template v-slot:activator="{ props }">
        <v-btn v-bind="props" variant="tonal" size="small" class="me-1"
          :color="currentServer ? 'warning' : 'primary'"
          prepend-icon="mdi-server-network">
          {{ currentServerName || $t('server.local') }}
        </v-btn>
      </template>
      <v-list density="compact" nav>
        <v-list-item @click="selectServer('')" :active="currentServer === ''">
          <template v-slot:prepend><v-icon icon="mdi-home"></v-icon></template>
          <v-list-item-title>{{ $t('server.local') }}</v-list-item-title>
        </v-list-item>
        <v-divider></v-divider>
        <v-list-item v-for="s in servers" :key="s.id" @click="selectServer(String(s.id))" :active="currentServer === String(s.id)">
          <template v-slot:prepend><v-icon icon="mdi-server"></v-icon></template>
          <v-list-item-title>{{ s.name }}</v-list-item-title>
        </v-list-item>
      </v-list>
    </v-menu>
    <v-menu>
      <template v-slot:activator="{ props }">
        <v-btn icon v-bind="props" :aria-label="$t('language')">
          <v-icon>mdi-translate</v-icon>
        </v-btn>
      </template>
      <v-list>
        <v-list-item
          v-for="lang in languages"
          :key="lang.value"
          @click="changeLocale(lang.value)"
          :active="isActiveLocale(lang.value)"
        >
          <v-list-item-title>{{ lang.title }}</v-list-item-title>
        </v-list-item>
      </v-list>
    </v-menu>
    <ThemeMenu />
  </v-app-bar>
</template>

<script lang="ts" setup>
import { useLocale } from 'vuetify'
import { useRoute } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { computed } from 'vue'
import { languages, normalizeLocale } from '@/locales'
import Data from '@/store/modules/data'
import ThemeMenu from '@/components/ThemeMenu.vue'

defineProps(['isMobile'])

const servers = computed((): any[] => Data().servers ?? [])
const currentServer = computed((): string => Data().currentServer)
const currentServerName = computed((): string => {
  const id = Data().currentServer
  if (!id) return ''
  const s = (Data().servers || []).find((x: any) => String(x.id) === id)
  return s?.name ?? id
})
const selectServer = (id: string) => Data().setCurrentServer(id)

const route = useRoute()
const { locale: i18nLocale } = useI18n()
const vuetifyLocale = useLocale()

const changeLocale = (l: string) => {
  l = normalizeLocale(l)
  i18nLocale.value = l
  vuetifyLocale.current.value = l
  localStorage.setItem('locale', l)
  window.location.reload()
}
const isActiveLocale = (l: string) => i18nLocale.value === l
</script>
