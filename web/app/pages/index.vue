<template>
  <main class="min-h-screen flex items-center justify-center bg-gray-100">
    <section class="bg-white shadow-md rounded-lg p-8 w-full max-w-md space-y-6">
      <h1 class="text-2xl font-bold text-center">FPL Playmaker</h1>
      <p class="text-sm text-gray-600 text-center">
        Sign in to continue
      </p>

      <!-- Login form -->
      <form class="space-y-4" @submit.prevent="onSubmit">
        <div>
          <label class="block text-sm font-medium mb-1" for="email">
            Email
          </label>
          <input
            id="email"
            v-model="email"
            type="email"
            required
            class="w-full border rounded px-3 py-2 text-sm"
          />
        </div>

        <div>
          <label class="block text-sm font-medium mb-1" for="password">
            Password
          </label>
          <input
            id="password"
            v-model="password"
            type="password"
            required
            class="w-full border rounded px-3 py-2 text-sm"
          />
        </div>

        <p v-if="error" class="text-sm text-red-600">
          {{ error }}
        </p>

        <button
          type="submit"
          class="w-full py-2 px-4 rounded bg-black text-white text-sm font-semibold"
          :disabled="loading"
        >
          <span v-if="!loading">Log in</span>
          <span v-else>Logging in...</span>
        </button>
      </form>

      <!-- Register link -->
      <div class="pt-2 border-t text-center text-sm text-gray-600">
        <span>Don't have an account?</span>
        <NuxtLink to="/register" class="ml-1 text-blue-600 underline">
          Register
        </NuxtLink>
      </div>
    </section>
  </main>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import { useApi } from '../composables/useApi';

const email = ref('');
const password = ref('');
const loading = ref(false);
const error = ref<string | null>(null);

const router = useRouter();
const { post } = useApi();

const isClient = typeof window !== 'undefined';

interface LoginResponse {
  user: { id: number; email: string };
  token: string;
}

const onSubmit = async () => {
  loading.value = true;
  error.value = null;

  try {
    await post(
      '/auth/login',
      { email: email.value, password: password.value },
    );

    // No localStorage token needed; cookie is set by backend
    router.push('/dashboard');
  } catch (e: any) {
    console.error('Login error:', e);
    error.value =
      e?.data?.message ?? 'Login failed. Please check your credentials.';
  } finally {
    loading.value = false;
  }
};
</script>
