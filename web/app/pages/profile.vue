<template>
  <main class="min-h-screen bg-gray-100 p-6">
    <section class="max-w-2xl mx-auto space-y-6">
      <header>
        <h1 class="text-2xl font-bold">Profile</h1>
        <p class="text-sm text-gray-600">
          Manage your account and FPL team settings
        </p>
      </header>

      <!-- Loading auth user -->
      <section v-if="authLoading" class="text-sm text-gray-600">
        Loading your profile...
      </section>

      <!-- No user (somehow) -->
      <section v-else-if="!user" class="text-sm text-red-600">
        You are not logged in.
      </section>

      <!-- Actual profile form -->
      <section v-else class="space-y-4">
        <!-- Account info -->
        <div class="bg-white rounded-lg shadow p-4 space-y-3">
          <h2 class="text-lg font-semibold">Account</h2>

          <div class="text-sm">
            <p class="font-medium">Email</p>
            <p class="text-gray-700">{{ user.email }}</p>
          </div>
        </div>

        <!-- FPL settings -->
        <div class="bg-white rounded-lg shadow p-4 space-y-4">
          <h2 class="text-lg font-semibold">FPL Team</h2>

          <p class="text-xs text-gray-500">
            Enter your FPL Team ID (the number in the URL when you view your team
            on fantasy.premierleague.com). This allows FPL Playmaker to sync your
            team and leagues.
          </p>

          <form @submit.prevent="saveFplTeam" class="space-y-3">
            <div class="space-y-1 text-sm">
              <label for="fpl-team-id" class="font-medium">
                FPL Team ID
              </label>
              <input
                id="fpl-team-id"
                v-model="fplTeamIdInput"
                type="text"
                class="w-full border rounded px-3 py-2 text-sm"
                placeholder="e.g. 1234567"
              />
              <p class="text-xs text-gray-500">
                Leave this blank and save if you want to clear your FPL team from your account.
              </p>
            </div>

            <div class="flex items-center gap-3">
              <button
                type="submit"
                class="px-4 py-2 text-sm rounded bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-60"
                :disabled="saving"
              >
                <span v-if="!saving">Save changes</span>
                <span v-else>Saving...</span>
              </button>

              <p v-if="successMessage" class="text-xs text-green-600">
                {{ successMessage }}
              </p>
              <p v-if="errorMessage" class="text-xs text-red-600">
                {{ errorMessage }}
              </p>
            </div>
          </form>
        </div>
      </section>
    </section>
  </main>
</template>

<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue';
import { useApi } from '../composables/useApi';
import { useAuth } from '../composables/useAuth';

const { put } = useApi();
const { user, loading: authLoading, fetchUser } = useAuth();

const fplTeamIdInput = ref('');
const saving = ref(false);
const successMessage = ref<string | null>(null);
const errorMessage = ref<string | null>(null);

// Keep input in sync with auth user
watch(
  () => user?.value?.fplTeamId,
  (newVal) => {
    fplTeamIdInput.value = newVal ?? '';
  },
  { immediate: true },
);

const saveFplTeam = async () => {
  if (!user.value) return;

  saving.value = true;
  successMessage.value = null;
  errorMessage.value = null;

  try {
    const payload = {
      // If input is empty, send null to clear; otherwise send the string value
      fplTeamId: fplTeamIdInput.value.trim() === '' ? null : fplTeamIdInput.value.trim(),
    };

    await put('/users/me', payload);

    // Refresh auth user so everyone sees the updated fplTeamId
    await fetchUser();

    successMessage.value = 'FPL Team ID updated successfully.';
  } catch (e: any) {
    console.error('saveFplTeam error:', e);
    errorMessage.value =
      e?.data?.message ?? 'Failed to update FPL Team ID.';
  } finally {
    saving.value = false;
  }
};

// Ensure we have user data when landing on this page
onMounted(async () => {
  if (!user.value) {
    await fetchUser();
  }
});
</script>
