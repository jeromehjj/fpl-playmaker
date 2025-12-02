<template>
  <main class="min-h-screen bg-gray-100 p-6">
    <section class="max-w-2xl mx-auto space-y-6">
      <header>
        <h1 class="text-2xl font-bold text-emerald-400">Profile</h1>
        <p class="text-sm text-gray-700">
          Manage your account and FPL team settings
        </p>
      </header>

      <!-- Loading auth user -->
      <section v-if="authLoading">
        <UCard>
          <div class="space-y-2 text-sm">
            <p>Loading your profile...</p>
            <USkeleton class="h-4 w-1/2" />
            <USkeleton class="h-4 w-1/3" />
          </div>
        </UCard>
      </section>

      <!-- Not logged in (edge case) -->
      <section v-else-if="!user">
        <UAlert
          color="error"
          title="Not logged in"
          description="Please log in again to manage your profile."
        />
      </section>

      <!-- Actual profile form -->
      <section v-else class="space-y-4">
        <!-- Account info -->
        <UCard>
          <template #header>
            <div class="flex items-center justify-between">
              <h2 class="text-lg font-semibold">Account</h2>
            </div>
          </template>

          <div class="space-y-2 text-sm">
            <div>
              <p class="font-medium text-gray-400">Email</p>
              <p class="text-white">{{ user.email }}</p>
            </div>
          </div>
        </UCard>

        <!-- FPL settings -->
        <UCard>
          <template #header>
            <div class="flex items-center justify-between">
              <h2 class="text-lg font-semibold">FPL Team</h2>
            </div>
          </template>

          <div class="space-y-4 text-sm">
            <p class="text-gray-400">
              Enter your FPL Team ID (the number in the URL when you view your
              team on fantasy.premierleague.com). This lets FPL Playmaker sync
              your team and leagues.
            </p>

            <form @submit.prevent="saveFplTeam" class="space-y-3">
              <UFormGroup
                label="FPL Team ID"
                help="Leave this blank and save if you want to clear your FPL team from your account."
              >
                <UInput
                  v-model="fplTeamIdInput"
                  placeholder="e.g. 1234567"
                />
              </UFormGroup>

              <div class="flex items-center gap-3">
                <UButton
                  class="mt-3"
                  type="submit"
                  color="primary"
                  :loading="saving"
                  :disabled="saving"
                >
                  Save changes
                </UButton>

                <p v-if="successMessage" class="text-xs text-emerald-600">
                  {{ successMessage }}
                </p>
                <p v-if="errorMessage" class="text-xs text-red-600">
                  {{ errorMessage }}
                </p>
              </div>
            </form>
          </div>
        </UCard>
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
