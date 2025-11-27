<template>
  <main class="min-h-screen bg-gray-100 p-6">
    <section class="max-w-xl mx-auto space-y-6">
      <header class="flex justify-between items-center">
        <div>
          <h1 class="text-2xl font-bold">Profile</h1>
          <p class="text-sm text-gray-600">
            Manage your account and FPL team ID
          </p>
        </div>

        <NuxtLink
          to="/dashboard"
          class="text-sm text-blue-600 underline"
        >
          Back to dashboard
        </NuxtLink>
      </header>

      <section class="bg-white rounded-lg shadow p-4 space-y-4">
        <div v-if="loading" class="text-sm text-gray-600">
          Loading profile...
        </div>

        <div v-else>
          <div class="mb-4">
            <p class="text-sm text-gray-500">Email</p>
            <p class="text-sm font-medium">{{ profile?.email }}</p>
          </div>

          <form class="space-y-4" @submit.prevent="onSave">
            <div>
              <label class="block text-sm font-medium mb-1" for="fplTeamId">
                FPL Team ID
              </label>
              <input
                id="fplTeamId"
                v-model="fplTeamId"
                type="text"
                placeholder="e.g. 213852"
                class="w-full border rounded px-3 py-2 text-sm"
              />
              <p class="mt-1 text-xs text-gray-500">
                You can find this in the URL on the official FPL site (…/entry/<strong>213852</strong>/).
              </p>
            </div>

            <p v-if="error" class="text-sm text-red-600">
              {{ error }}
            </p>
            <p v-if="success" class="text-sm text-green-600">
              {{ success }}
            </p>

            <button
              type="submit"
              class="py-2 px-4 rounded bg-black text-white text-sm font-semibold"
              :disabled="saving"
            >
              <span v-if="!saving">Save</span>
              <span v-else>Saving...</span>
            </button>
          </form>
        </div>
      </section>
    </section>
  </main>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue';
import { useRouter } from 'vue-router';
import { useApi } from '../composables/useApi';

const router = useRouter();
const { get, put } = useApi();

const isClient = typeof window !== 'undefined';

interface UserProfile {
  id: number;
  email: string;
  fplTeamId: string | null;
  createdAt: string;
}

const profile = ref<UserProfile | null>(null);
const fplTeamId = ref<string>('');
const loading = ref(true);
const saving = ref(false);
const error = ref<string | null>(null);
const success = ref<string | null>(null);

const fetchProfile = async () => {
  loading.value = true;
  error.value = null;
  success.value = null;

  try {
    const res = await get<UserProfile>('/users/me', { auth: true });
    profile.value = res;
    fplTeamId.value = res.fplTeamId ?? '';
  } catch (e: any) {
    console.error('fetchProfile error:', e);
    if (e?.status === 401) {
      if (isClient) {
        window.localStorage.removeItem('auth_token');
      }
      router.push('/');
      return;
    }
    error.value = e?.data?.message ?? 'Failed to load profile.';
  } finally {
    loading.value = false;
  }
};

const onSave = async () => {
  saving.value = true;
  error.value = null;
  success.value = null;

  try {
    const body = {
      fplTeamId: fplTeamId.value.trim() === '' ? null : fplTeamId.value.trim(),
    };

    const updated = await put<UserProfile>('/users/me', body, { auth: true });
    profile.value = updated;
    fplTeamId.value = updated.fplTeamId ?? '';
    success.value = 'Profile updated.';
  } catch (e: any) {
    console.error('updateMe error:', e);
    if (e?.status === 401) {
      if (isClient) {
        window.localStorage.removeItem('auth_token');
      }
      router.push('/');
      return;
    }
    error.value = e?.data?.message ?? 'Failed to update profile.';
  } finally {
    saving.value = false;
  }
};

onMounted(() => {
  fetchProfile();
});
</script>
