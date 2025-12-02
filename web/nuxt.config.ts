export default defineNuxtConfig({
  devtools: { enabled: true },

  runtimeConfig: {
    public: {
      apiBaseUrl:
        process.env.NUXT_PUBLIC_API_BASE_URL || 'http://localhost:3001',
    },
  },

  modules: ['@nuxt/ui'],
  css: ['~/assets/css/main.css'],
});
