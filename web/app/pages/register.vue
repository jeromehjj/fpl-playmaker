<!-- web/app/pages/register.vue -->
<template>
  <main class="min-h-screen flex items-center justify-center bg-gray-100">
    <section class="bg-white shadow-md rounded-lg p-8 w-full max-w-md space-y-6">
      <h1 class="text-2xl font-bold text-center">Create an account</h1>

      <form class="space-y-4" @submit.prevent="onRegister">
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

        <div>
          <label class="block text-sm font-medium mb-1" for="password-confirm">
            Confirm password
          </label>
          <input
            id="password-confirm"
            v-model="passwordConfirm"
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
          <span v-if="!loading">Register</span>
          <span v-else>Registering...</span>
        </button>

        <div class="pt-2 text-center text-sm text-gray-600">
          <span>Already have an account?</span>
          <NuxtLink to="/" class="ml-1 text-blue-600 underline">
            Sign in
          </NuxtLink>
        </div>
      </form>
    </section>
  </main>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import { useApi } from '../composables/useApi';

const email = ref('');
const password = ref('');
const passwordConfirm = ref('');
const loading = ref(false);
const error = ref<string | null>(null);

const router = useRouter();
const { post } = useApi();

const isClient = typeof window !== 'undefined';

interface LoginResponse {
  user: { id: number; email: string };
  token: string;
}

const onRegister = async () => {
  loading.value = true;
  error.value = null;

  if (password.value.length < 8) {
    error.value = 'Password must be at least 8 characters.';
    loading.value = false;
    return;
  }

  if (password.value !== passwordConfirm.value) {
    error.value = 'Passwords do not match.';
    loading.value = false;
    return;
  }

  try {
    // create account
    await post('/auth/register', {
      email: email.value,
      password: password.value,
    });

    // auto-login after registration
    const res = await post<LoginResponse>(
      '/auth/login',
      { email: email.value, password: password.value },
    );

    if (isClient) {
      window.localStorage.setItem('auth_token', res.token);
    }

    router.push('/dashboard');
  } catch (e: any) {
    console.error('Register error:', e);
    error.value =
      e?.data?.message ?? 'Registration failed. Please try again.';
  } finally {
    loading.value = false;
  }
};
</script>
