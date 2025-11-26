<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useApi } from '../composables/useApi';

const { get } = useApi();

const health = ref<any>(null);
const error = ref<string | null>(null);

onMounted(async () => {
  try {
    health.value = await get('/health'); // calls http://localhost:3001/health
  } catch (e: any) {
    error.value = e?.message ?? 'Failed to reach API';
  }
});
</script>

<template>
  <div class="p-6">
    <h1 class="text-2xl font-bold mb-4">FPL Playmaker – Dev Check</h1>

    <div v-if="health">
      <p>API status: <strong>{{ health.status }}</strong></p>
      <p>Timestamp: {{ health.timestamp }}</p>
    </div>
    <div v-else-if="error">
      <p class="text-red-600">Error: {{ error }}</p>
    </div>
    <div v-else>
      <p>Checking API health...</p>
    </div>
  </div>
</template>
