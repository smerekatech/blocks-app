export default defineNuxtConfig({
  modules: [
    '@nuxt/eslint',
    '@nuxt/ui',
    '@vueuse/nuxt',
    'nuxt-auth-utils'
  ],

  devtools: { enabled: true },

  css: ['~/assets/css/main.css'],

  compatibilityDate: '2025-01-15',

  runtimeConfig: {
    databaseUrl: process.env.DATABASE_URL || '',
    session: {
      password: process.env.NUXT_SESSION_PASSWORD || '',
      maxAge: 60 * 60 * 24 * 30 // 30 days
    }
  },

  eslint: {
    config: {
      stylistic: { commaDangle: 'never', braceStyle: '1tbs' }
    }
  },

  nitro: {
    experimental: {
      tasks: true
    },
    scheduledTasks: {
      // Every minute — tick is idempotent and only touches rows past their 45m mark.
      '* * * * *': ['timers:tick']
    }
  }
})
