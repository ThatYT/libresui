<template>
    <v-app>
    <v-container class="fill-height" style="margin-top: 100px;">
      <v-row justify="center" align="center">
        <v-col cols="12" sm="8" md="4">
          <v-card>
            <v-card-title class="headline" v-text="$t('login.title')"></v-card-title>
            <v-card-text>
              <v-form @submit.prevent="login" ref="form">
                <v-text-field v-model="username" :label="$t('login.username')" :rules="usernameRules" required></v-text-field>
                <v-text-field v-model="password" :label="$t('login.password')" :rules="passwordRules" type="password" required></v-text-field>
                <v-btn :loading="loading" type="submit" color="primary" block class="mt-2" v-text="$t('actions.submit')"></v-btn>
              </v-form>
              <v-select
                density="compact"
                class="mt-2"
                hide-details
                variant="solo"
                :items="languages"
                v-model="$i18n.locale"
                :label="$t('language')"
                @update:modelValue="changeLocale">
                <template v-slot:append>
                  <ThemeMenu />
                </template>
              </v-select>
              <div class="text-center mt-3">
                <a href="https://3yuedaohang.com" target="_blank" rel="noopener noreferrer"
                  class="text-caption text-decoration-none text-primary">🌐 {{ $t('menu.site') }} · 3yuedaohang.com</a>
                <br>
                <a href="https://www.youtube.com/@zhanzhang3yue" target="_blank" rel="noopener noreferrer"
                  class="text-caption text-decoration-none text-primary">📺 {{ $t('menu.youtube') }} · @zhanzhang3yue</a>
                <br>
                <a href="https://3yuedaohang.com/cn2/banwagong" target="_blank" rel="noopener noreferrer"
                  class="text-caption text-decoration-none text-primary">🖥️ {{ $t('menu.vps') }}</a>
              </div>
            </v-card-text>
          </v-card>
        </v-col>
      </v-row>
    </v-container>
    </v-app>
  </template>

<script lang="ts" setup>
import { ref } from "vue"
import { useLocale } from 'vuetify'
import { i18n, languages, normalizeLocale } from '@/locales'
import { useRouter } from 'vue-router'
import HttpUtil from '@/plugins/httputil'
import ThemeMenu from '@/components/ThemeMenu.vue'


const locale = useLocale()

const username = ref('')
const usernameRules = [
  (value: string) => {
    if (value?.length > 0) return true
    return i18n.global.t('login.unRules')
  },
]

const password = ref('')
const passwordRules = [
  (value: string) => {
    if (value?.length > 0) return true
    return i18n.global.t('login.pwRules')
  },
]

const loading = ref(false)
const router = useRouter()

const login = async () => {
  if (username.value == '' || password.value == '') return
  loading.value=true
  const response = await HttpUtil.post('api/login',{user: username.value, pass: password.value})
  if(response.success){
    setTimeout(() => {
      loading.value=false
      router.push('/')
    }, 500)
  } else {
    loading.value=false
  }
}
const changeLocale = (l: any) => {
  const value = normalizeLocale(l)
  i18n.global.locale.value = value
  locale.current.value = value
  localStorage.setItem('locale', locale.current.value)
}
</script>

<style>
.v-overlay .v-list-item,
.v-field__input {
  direction: ltr;
}
</style>
