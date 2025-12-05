<template>
  <main class="min-h-screen bg-gray-100 p-6">
    <section class="mx-auto space-y-6 lg:max-w-8xl">
      <!-- Header -->
      <header class="flex justify-between items-center gap-3">
        <div>
          <h1 class="text-2xl font-bold text-emerald-400">Dashboard</h1>
          <p class="text-sm text-gray-600">
            Overview for your FPL team
          </p>
          <p
            v-if="team?.lastSyncedAt"
            class="text-xs text-gray-500 mt-1"
          >
            Last synced:
            {{ new Date(team.lastSyncedAt).toLocaleString() }}
          </p>
        </div>

        <UButton
          size="xs"
          variant="outline"
          :loading="syncing"
          :disabled="syncing"
          @click="refreshTeam"
        >
          Refresh from FPL
        </UButton>
      </header>

      <!-- Loading state -->
      <section v-if="loading" class="text-sm text-gray-600">
        <UCard>
          <div class="space-y-2">
            <p>Loading team data...</p>
            <USkeleton class="h-4 w-1/2" />
            <USkeleton class="h-4 w-1/3" />
          </div>
        </UCard>
      </section>

      <!-- No team synced yet -->
      <section v-else-if="noTeam">
        <UAlert
          color="warning"
          title="No FPL team found yet"
          description="Go to your profile and enter your FPL Team ID. Then come back here and refresh from FPL."
        >
          <template #description>
            <p class="text-sm">
              To get started, go to your
              <NuxtLink to="/profile" class="text-emerald-700 underline">
                profile
              </NuxtLink>
              and enter your FPL Team ID. Then come back here and click
              <span class="font-semibold">“Refresh from FPL”</span>.
            </p>
          </template>
        </UAlert>
      </section>

      <!-- Error state -->
      <section v-else-if="error">
        <UAlert
          color="error"
          title="Something went wrong"
          :description="error"
        />
      </section>
      <section v-else-if="team" class="space-y-4">
        <DashboardTeamOverview :team="team" />

        <DashboardLeagues :leagues="team.leagues" />

        <DashboardSquad
          :squad="squad"
          :loading="squadLoading"
          :error="squadError"
          :next-fixtures-for-club="nextFixturesForClub"
          :difficulty-badge-color="difficultyBadgeColor"
        />

        <DashboardSuggestions
          :squad="squad"
          :suggestions="suggestions"
          :loading="suggestionsLoading"
          :error="suggestionsError"
          :next-fixtures-for-club="nextFixturesForClub"
          :difficulty-badge-color="difficultyBadgeColor"
        />
      </section>
    </section>
  </main>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue';
import { useRouter } from 'vue-router';
import { useApi } from '../composables/useApi';
import type {
  TeamOverview,
  Squad,
  TransferSuggestion,
} from '../types/fpl-dashboard';
import type {
  TickerFixture,
  FixtureTicker,
} from '../types/fpl-common';
import { difficultyBadgeColor } from '../utils/fpl-ui';

const router = useRouter();
const { get, post } = useApi();

const fixtureTicker = ref<FixtureTicker | null>(null);
const fixtureTickerLoading = ref(false);
const fixtureTickerError = ref<string | null>(null);


const noTeam = ref(false);
const team = ref<TeamOverview | null>(null);
const loading = ref(true);
const error = ref<string | null>(null);
const syncing = ref(false);

const squad = ref<Squad | null>(null);
const squadLoading = ref(false);
const squadError = ref<string | null>(null);

const suggestions = ref<TransferSuggestion[]>([]);
const suggestionsLoading = ref(false);
const suggestionsError = ref<string | null>(null);

const fetchFixtureTicker = async () => {
  fixtureTickerLoading.value = true;
  fixtureTickerError.value = null;

  try {
    fixtureTicker.value = await get<FixtureTicker>('/fpl/fixture-ticker', {
      events: 5, // enough for your “next 3/5” context
    });
  } catch (e: any) {
    console.error('fetchFixtureTicker error:', e);
    fixtureTicker.value = null;
    fixtureTickerError.value =
      e?.data?.message ?? 'Failed to load fixtures.';
  } finally {
    fixtureTickerLoading.value = false;
  }
};

const nextFixturesForClub = (clubExternalId: number, limit = 3): TickerFixture[] => {
  const tickerValue = fixtureTicker.value;
  if (!tickerValue) return [];
  const row = tickerValue.rows.find(r => r.clubExternalId === clubExternalId);
  if (!row) return [];
  return row.fixtures.slice(0, limit);
};


const fetchSquad = async () => {
  squadLoading.value = true;
  squadError.value = null;

  try {
    squad.value = await get<Squad>('/fpl/squad');
  } catch (e: any) {
    console.error('fetchSquad error:', e);
    squad.value = null;
    squadError.value =
      e?.data?.message ?? 'Failed to load current squad.';
  } finally {
    squadLoading.value = false;
  }
};


const fetchTeam = async () => {
  loading.value = true;
  error.value = null;
  noTeam.value = false;

  try {
    team.value = await get<TeamOverview>('/fpl/team');

    if (team.value) {
      await fetchSquad();
      await fetchTransferSuggestions();
    }
  } catch (e: any) {
    if (e?.status === 401) {
      router.push('/');
      return;
    }

    // No FPL team synced yet
    if (e?.status === 400 && e?.data?.code === 'NO_FPL_TEAM') {
      team.value = null;
      noTeam.value = true;
      squad.value = null;
      suggestions.value = [];
      return;
    }

    console.error('fetchTeam error:', e);
    error.value = e?.data?.message ?? 'Failed to load team data.';
  } finally {
    loading.value = false;
  }
};

const fetchTransferSuggestions = async () => {
  suggestionsLoading.value = true;
  suggestionsError.value = null;

  try {
    suggestions.value = await get<TransferSuggestion[]>(
      '/fpl/transfer-suggestions',
    );
  } catch (e: any) {
    console.error('fetchTransferSuggestions error:', e);
    suggestions.value = [];
    suggestionsError.value =
      e?.data?.message ?? 'Failed to load transfer suggestions.';
  } finally {
    suggestionsLoading.value = false;
  }
};

const refreshTeam = async () => {
  syncing.value = true;
  error.value = null;
  try {
    await post('/fpl/sync-team');
    await fetchTeam();
  } catch (e: any) {
    console.error('refreshTeam error:', e);
    error.value = e?.data?.message ?? 'Failed to refresh team data.';
  } finally {
    syncing.value = false;
  }
};

onMounted(() => {
  fetchTeam();
  fetchFixtureTicker();
});
</script>
