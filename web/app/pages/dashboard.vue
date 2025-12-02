<template>
  <main class="min-h-screen bg-gray-100 p-6">
    <section class="max-w-4xl mx-auto space-y-6">
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

      <!-- Team overview + leagues -->
      <section v-else-if="team" class="space-y-4">
        <!-- Team overview -->
        <UCard>
          <template #header>
            <div class="flex items-center justify-between gap-2">
              <div>
                <h2 class="text-lg font-semibold">
                  {{ team.teamName }}
                </h2>
                <p class="text-sm text-white">
                  Manager: {{ team.managerName }} • Region:
                  {{ team.region }} ({{ team.regionCode }})
                </p>
              </div>
            </div>
          </template>

          <div class="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
            <div>
              <p class="font-medium text-white">Overall Points</p>
              <p class="text-white">{{ team.overallPoints }}</p>
            </div>
            <div>
              <p class="font-medium text-white">Overall Rank</p>
              <p class="text-white">
                #{{ team.overallRank.toLocaleString() }}
              </p>
            </div>
            <div>
              <p class="font-medium text-white">
                GW{{ team.currentEvent }} Points
              </p>
              <p class="text-white">{{ team.gwPoints }}</p>
            </div>
            <div>
              <p class="font-medium text-white">
                GW{{ team.currentEvent }} Rank
              </p>
              <p class="text-white">
                #{{ team.gwRank.toLocaleString() }}
              </p>
            </div>
          </div>
        </UCard>

        <!-- Leagues -->
        <UCard>
          <template #header>
            <div class="flex items-center justify-between">
              <h2 class="text-lg font-semibold">Leagues</h2>
              <p class="text-xs text-white">
                {{ team.leagues.length }} joined
              </p>
            </div>
          </template>

          <div class="overflow-x-auto">
            <table class="min-w-full text-xs">
              <thead>
                <tr class="text-left border-b border-gray-200">
                  <th class="py-1.5 pr-4 font-medium text-gray-400">
                    Name
                  </th>
                  <th class="py-1.5 pr-4 font-medium text-gray-400">
                    Scoring
                  </th>
                  <th class="py-1.5 pr-4 font-medium text-gray-400">
                    Type
                  </th>
                  <th class="py-1.5 pr-4 font-medium text-gray-400">
                    Rank
                  </th>
                  <th class="py-1.5 pr-4 font-medium text-gray-400">
                    Teams
                  </th>
                </tr>
              </thead>
              <tbody>
                <tr
                  v-for="lg in team.leagues"
                  :key="`${lg.category}-${lg.id}`"
                  class="border-b border-gray-100 last:border-b-0"
                >
                  <td class="py-1.5 pr-4">
                    {{ lg.name }}
                  </td>
                  <td class="py-1.5 pr-4">
                    {{ lg.scoring === 'classic' ? 'Classic' : 'Head to head' }}
                  </td>
                  <td class="py-1.5 pr-4">
                    {{ lg.leagueType }}
                  </td>
                  <td class="py-1.5 pr-4">
                    <span v-if="lg.entryRank !== null">
                      #{{ lg.entryRank.toLocaleString() }}
                    </span>
                    <span v-else>-</span>
                  </td>
                  <td class="py-1.5 pr-4">
                    <span v-if="lg.rankCount !== null">
                      {{ lg.rankCount.toLocaleString() }}
                    </span>
                    <span v-else>-</span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </UCard>
      </section>
    </section>
  </main>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue';
import { useRouter } from 'vue-router';
import { useApi } from '../composables/useApi';

const router = useRouter();
const { get, post } = useApi();

interface League {
  id: number;
  name: string;
  shortName: string | null;
  scoring: 'classic' | 'h2h';
  leagueType: string;
  rawLeagueType: string;
  closed: boolean;
  isAdmin: boolean;
  canLeave: boolean;
  entryRank: number | null;
  entryLastRank: number | null;
  rankCount: number | null;
  entryPercentileRank: number | null;
  category: 'classic-array' | 'h2h-array';
}

interface TeamOverview {
  teamId: string;
  teamName: string;
  managerName: string;
  region: string;
  regionCode: string;
  overallPoints: number;
  overallRank: number;
  gwPoints: number;
  gwRank: number;
  currentEvent: number;
  leagues: League[];
  lastSyncedAt: string | null;
}

const noTeam = ref(false);
const team = ref<TeamOverview | null>(null);
const loading = ref(true);
const error = ref<string | null>(null);
const syncing = ref(false);

const fetchTeam = async () => {
  loading.value = true;
  error.value = null;
  noTeam.value = false;

  try {
    team.value = await get<TeamOverview>('/fpl/team');
  } catch (e: any) {
    if (e?.status === 401) {
      router.push('/');
      return;
    }

    // No FPL team synced yet
    if (e?.status === 400 && e?.data?.code === 'NO_FPL_TEAM') {
      team.value = null;
      noTeam.value = true;
      return;
    }

    console.error('fetchTeam error:', e);
    error.value = e?.data?.message ?? 'Failed to load team data.';
  } finally {
    loading.value = false;
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
});
</script>
