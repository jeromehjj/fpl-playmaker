<template>
  <main class="min-h-screen bg-gray-100 p-6">
    <section class="max-w-4xl mx-auto space-y-6">
      <header class="flex justify-between items-center">
        <div>
          <h1 class="text-2xl font-bold">FPL Dashboard</h1>
          <p class="text-sm text-gray-600">
            Overview for your FPL team
          </p>
        </div>

        <div class="flex items-center gap-3">
            <NuxtLink to="/profile" class="text-sm text-blue-600 underline">
            Profile
            </NuxtLink>

            <button
            class="text-sm text-red-600 underline"
            @click="logout">
            Log out
            </button>
        </div>
      </header>

      <section v-if="loading" class="text-sm text-gray-600">
        Loading team data...
      </section>

      <section v-else-if="error" class="text-sm text-red-600">
        {{ error }}
      </section>

      <section v-else-if="team" class="space-y-4">
        <div class="bg-white rounded-lg shadow p-4">
          <h2 class="text-lg font-semibold">
            {{ team.teamName }}
          </h2>
          <p class="text-sm text-gray-700">
            Manager: {{ team.managerName }} • Region: {{ team.region }} ({{ team.regionCode }})
          </p>

          <div class="mt-4 grid grid-cols-2 gap-4 text-sm">
            <div>
              <p class="font-medium">Overall Points</p>
              <p>{{ team.overallPoints }}</p>
            </div>
            <div>
              <p class="font-medium">Overall Rank</p>
              <p>#{{ team.overallRank.toLocaleString() }}</p>
            </div>
            <div>
              <p class="font-medium">GW{{ team.currentEvent }} Points</p>
              <p>{{ team.gwPoints }}</p>
            </div>
            <div>
              <p class="font-medium">GW{{ team.currentEvent }} Rank</p>
              <p>#{{ team.gwRank.toLocaleString() }}</p>
            </div>
          </div>
        </div>

        <div class="bg-white rounded-lg shadow p-4">
          <h2 class="text-lg font-semibold mb-2">Leagues</h2>
          <div class="overflow-x-auto">
            <table class="min-w-full text-xs">
              <thead>
                <tr class="text-left border-b">
                  <th class="py-1 pr-4">Name</th>
                  <th class="py-1 pr-4">Scoring</th>
                  <th class="py-1 pr-4">Type</th>
                  <th class="py-1 pr-4">Rank</th>
                  <th class="py-1 pr-4">Teams</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="lg in team.leagues" :key="`${lg.category}-${lg.id}`" class="border-b last:border-b-0">
                  <td class="py-1 pr-4">{{ lg.name }}</td>
                  <td class="py-1 pr-4">
                    {{ lg.scoring === 'classic' ? 'Classic' : 'Head to head' }}
                  </td>
                  <td class="py-1 pr-4">
                    {{ lg.leagueType }}
                  </td>
                  <td class="py-1 pr-4">
                    <span v-if="lg.entryRank !== null">
                      #{{ lg.entryRank.toLocaleString() }}
                    </span>
                    <span v-else>-</span>
                  </td>
                  <td class="py-1 pr-4">
                    <span v-if="lg.rankCount !== null">
                      {{ lg.rankCount.toLocaleString() }}
                    </span>
                    <span v-else>-</span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
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
const { get, post } = useApi();

const isClient = typeof window !== 'undefined';

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
}

const team = ref<TeamOverview | null>(null);
const loading = ref(true);
const error = ref<string | null>(null);

const fetchTeam = async () => {
  loading.value = true;
  error.value = null;
  try {
    team.value = await get<TeamOverview>('/fpl/team');
  } catch (e: any) {
    if (e?.status === 401) {
      router.push('/');
      return;
    }
    error.value = e?.data?.message ?? 'Failed to load team data.';
  } finally {
    loading.value = false;
  }
};

const logout = async () => {
    try {
        await post('/auth/logout');
    } catch (e) {
        console.log('Log out error: ', e);
    } finally {
        router.push('/');
    }
};

onMounted(() => {
  fetchTeam();
});
</script>

