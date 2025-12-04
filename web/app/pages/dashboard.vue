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

        <!-- Current squad -->
        <UCard>
          <template #header>
            <div class="flex items-center justify-between">
              <h2 class="text-lg font-semibold">Current Squad</h2>
              <p v-if="squad" class="text-xs text-white">
                GW {{ squad.event }} ·
                Value £{{ (squad.value / 10).toFixed(1) }}m ·
                Bank £{{ (squad.bank / 10).toFixed(1) }}m
              </p>
            </div>
          </template>

          <div v-if="squadLoading" class="text-sm text-gray-500">
            Loading squad...
          </div>
          <div v-else-if="!squad && squadError" class="text-sm text-red-500">
            {{ squadError }}
          </div>
          <div v-else-if="!squad" class="text-sm text-gray-500">
            Squad not available.
          </div>
          <div v-else class="space-y-4">
            <!-- Starting XI -->
            <div>
              <h3 class="text-sm font-semibold mb-2">Starting XI</h3>
              <div class="overflow-x-auto">
                <table class="min-w-full text-xs">
                  <thead>
                    <tr class="text-left border-b border-gray-200">
                      <th class="py-1.5 pr-3">Pos</th>
                      <th class="py-1.5 pr-3">Player</th>
                      <th class="py-1.5 pr-3">Status</th>
                      <th class="py-1.5 pr-3">Club</th>
                      <th class="py-1.5 pr-3">Price</th>
                      <th class="py-1.5 pr-3">Role</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr
                      v-for="p in sortedStarting"
                      :key="p.externalId"
                      class="border-b border-gray-100 last:border-b-0"
                    >
                      <td class="py-1.5 pr-3">
                        {{ p.position }}
                      </td>
                      <td class="py-1.5 pr-3">
                        <span class="font-medium">{{ p.webName }}</span>
                        <span
                          v-if="p.fullName"
                          class="ml-1 text-[10px] text-gray-500"
                        >
                          ({{ p.fullName }})
                        </span>
                      </td>
                      <td class="py-1.5 pr-3">
                        <span
                          :class="[
                            'text-xs font-medium',
                            p.availability === 'AVAILABLE'
                              ? 'text-green-500'
                              : p.availability === 'RISKY'
                              ? 'text-amber-500'
                              : 'text-red-500',
                          ]"
                        >
                          {{ p.availability === 'AVAILABLE'
                            ? 'Available'
                            : p.availability === 'RISKY'
                            ? 'Risky'
                            : 'Unavailable' }}
                        </span>
                      </td>
                      <td class="py-1.5 pr-3">
                        {{ p.club.shortName }}
                      </td>
                      <td class="py-1.5 pr-3">
                        £{{ (p.nowCost / 10).toFixed(1) }}m
                      </td>
                      <td class="py-1.5 pr-3">
                        <span
                          v-if="p.pick.isCaptain"
                          class="text-xs font-semibold text-amber-400 mr-1"
                        >
                          C
                        </span>
                        <span
                          v-else-if="p.pick.isViceCaptain"
                          class="text-xs font-semibold text-sky-400 mr-1"
                        >
                          VC
                        </span>
                        <span v-else class="text-xs text-gray-500">
                          x{{ p.pick.multiplier }}
                        </span>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            <!-- Bench -->
            <div>
              <h3 class="text-sm font-semibold mb-2">Bench</h3>
              <div class="overflow-x-auto">
                <table class="min-w-full text-xs">
                  <thead>
                    <tr class="text-left border-b border-gray-200">
                      <th class="py-1.5 pr-3">Pos</th>
                      <th class="py-1.5 pr-3">Player</th>
                      <th class="py-1.5 pr-3">Status</th>
                      <th class="py-1.5 pr-3">Club</th>
                      <th class="py-1.5 pr-3">Price</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr
                      v-for="p in sortedBench"
                      :key="p.externalId"
                      class="border-b border-gray-100 last:border-b-0"
                    >
                      <td class="py-1.5 pr-3">
                        {{ p.position }}
                      </td>
                      <td class="py-1.5 pr-3">
                        <span class="font-medium">{{ p.webName }}</span>
                        <span
                          v-if="p.fullName"
                          class="ml-1 text-[10px] text-gray-500"
                        >
                          ({{ p.fullName }})
                        </span>
                      </td>
                      <td class="py-1.5 pr-3">
                        <span
                          :class="[
                            'text-xs font-medium',
                            p.availability === 'AVAILABLE'
                              ? 'text-green-500'
                              : p.availability === 'RISKY'
                              ? 'text-amber-500'
                              : 'text-red-500',
                          ]"
                        >
                          {{ p.availability === 'AVAILABLE'
                            ? 'Available'
                            : p.availability === 'RISKY'
                            ? 'Risky'
                            : 'Unavailable' }}
                        </span>
                      </td>
                      <td class="py-1.5 pr-3">
                        {{ p.club.shortName }}
                      </td>
                      <td class="py-1.5 pr-3">
                        £{{ (p.nowCost / 10).toFixed(1) }}m
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </UCard>

        <UCard>
          <template #header>
            <div class="flex items-center justify-between">
              <h2 class="text-lg font-semibold">Transfer Suggestions</h2>
              <p v-if="squad" class="text-xs text-white">
                Bank: £{{ (squad.bank / 10).toFixed(1) }}m
              </p>
            </div>
          </template>

          <div v-if="suggestionsLoading" class="text-sm text-gray-500">
            Calculating suggestions...
          </div>
          <div v-else-if="suggestionsError" class="text-sm text-red-500">
            {{ suggestionsError }}
          </div>
          <div v-else-if="!suggestions.length" class="text-sm text-gray-500">
            No clear upgrades found within your budget.
          </div>
          
          <div v-else>
            <UTable
              :data="suggestions"
              :columns="suggestionColumns"
              class="min-w-full text-xs"
            />
          </div>
        </UCard>
      </section>
    </section>
  </main>
</template>

<script setup lang="ts">
import { computed, h, onMounted, ref, resolveComponent } from 'vue';
import type { TableColumn } from '@nuxt/ui';
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

type Position = 'GK' | 'DEF' | 'MID' | 'FWD';
type Availability = 'AVAILABLE' | 'RISKY' | 'UNAVAILABLE';

interface SquadPlayer {
  id: number;
  externalId: number;
  webName: string;
  fullName: string | null;
  position: Position;
  nowCost: number;
  valueMillions: number;
  totalPoints: number | null;
  pointsPerGame: number | null;
  pointsPerMillion: number | null;
  minutes: number | null;
  availability: Availability;
  club: {
    id: number;
    externalId: number;
    name: string;
    shortName: string;
  };
  pick: {
    position: number;
    multiplier: number;
    isCaptain: boolean;
    isViceCaptain: boolean;
    isStarting: boolean;
  };
}

interface Squad {
  event: number;
  teamId: string;
  value: number; // tenths of a million
  bank: number;  // tenths of a million
  starting: SquadPlayer[];
  bench: SquadPlayer[];
}

interface TransferDelta {
  cost: number;
  bankRemaining: number;
  pointsPerNinetyDiff: number | null;
  pointsPerMillionDiff: number | null;
}

interface TransferSuggestion {
  from: SquadPlayer;
  to: {
    id: number;
    externalId: number;
    webName: string;
    fullName: string | null;
    position: Position;
    nowCost: number;
    next3DifficultySum: number | null;
    next5DifficultySum: number | null;
    valueMillions: number;
    totalPoints: number | null;
    pointsPerGame: number | null;
    pointsPerMillion: number | null;
    pointsPerNinety: number | null;
    minutes: number | null;
    availability: Availability;
    club: {
      id: number;
      externalId: number;
      name: string;
      shortName: string;
    };
  };
  delta: TransferDelta;
}

interface TickerFixture {
  event: number;
  kickoffTime: string | null;
  isHome: boolean;
  opponentExternalId: number;
  opponentShortName: string | null;
  difficulty: number;
}

interface TickerRow {
  clubExternalId: number;
  clubShortName: string;
  fixtures: TickerFixture[];
}

interface FixtureTicker {
  events: number[];
  rows: TickerRow[];
}

const UBadge = resolveComponent('UBadge');


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

const sortedStarting = computed(() =>
  squad.value
    ? [...squad.value.starting].sort(
        (a, b) => a.pick.position - b.pick.position,
      )
    : [],
);

const sortedBench = computed(() =>
  squad.value
    ? [...squad.value.bench].sort((a, b) => a.pick.position - b.pick.position)
    : [],
);

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

const suggestionColumns: TableColumn<TransferSuggestion>[] = [
  {
    id: 'from',
    header: 'From',
    cell: ({ row }) => {
      const s = row.original as TransferSuggestion;
      return h('span', [
        s.from.webName,
        ' ',
        h(
          'span',
          { class: 'text-[10px] text-gray-500' },
          `(${s.from.position})`,
        ),
      ]);
    },
  },
  {
    id: 'to',
    header: 'To',
    cell: ({ row }) => {
      const s = row.original as TransferSuggestion;
      return h('span', [
        s.to.webName,
        ' ',
        h(
          'span',
          { class: 'text-[10px] text-gray-500' },
          `(${s.to.position})`,
        ),
      ]);
    },
  },
  {
    id: 'pp90',
    header: '↑ Pts/90',
    cell: ({ row }) => {
      const diff = row.original.delta.pointsPerNinetyDiff ?? 0;
      return `+${diff.toFixed(2)}`;
    },
  },
  {
    id: 'cost',
    header: '↑ Cost',
    cell: ({ row }) => {
      const cost = row.original.delta.cost;
      const sign = cost >= 0 ? '+' : '-';
      return `${sign}£${(Math.abs(cost) / 10).toFixed(1)}m`;
    },
  },
  {
    id: 'bank',
    header: 'Bank left',
    cell: ({ row }) => {
      const bank = row.original.delta.bankRemaining;
      return `£${(bank / 10).toFixed(1)}m`;
    },
  },
  {
    id: 'fixtures',
    header: 'Next 3 fixtures',
    cell: ({ row }) => {
      const s = row.original as TransferSuggestion;
      const fixtures = nextFixturesForClub(s.to.club.externalId, 3);
      if (!fixtures.length) {
        return h('span', { class: 'text-gray-400' }, '–');
      }

      return h(
        'div',
        { class: 'flex flex-wrap gap-1' },
        fixtures.map((fx) =>
          h(
            UBadge,
            {
              key: `${fx.event}-${fx.opponentExternalId}`,
              class: 'whitespace-nowrap',
              variant: 'subtle',
              color: difficultyBadgeColor(fx.difficulty),
            },
            () =>
              `${fx.isHome ? 'H' : 'A'} ${fx.opponentShortName} (${
                fx.difficulty
              })`,
          ),
        ),
      );
    },
  },
];


const difficultyBadgeColor = (d: number): "error" | "primary" | "secondary" | "success" | "info" | "warning" | "neutral" | undefined => {
  switch (d) {
    case 1:
      return 'success';
    case 2:
      return 'primary';
    case 3:
      return 'neutral';
    case 4:
      return 'warning';
    case 5:
      return 'error';
    default:
      return 'neutral';
  }
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
