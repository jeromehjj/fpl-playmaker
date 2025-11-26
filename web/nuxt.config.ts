export default defineNuxtConfig({
  srcDir: 'app',
  devtools: { enabled: true },
  runtimeConfig: {
    public: {
      apiBase: 'http://localhost:3001',
    },
  },
});
