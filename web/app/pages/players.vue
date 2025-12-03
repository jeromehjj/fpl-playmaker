<template>
  <main class="min-h-screen bg-gray-100 p-6">
    <section class="max-w-5xl mx-auto space-y-4">
      <header class="flex flex-wrap items-center gap-3 justify-between">
        <div>
          <h1 class="text-2xl font-bold text-emerald-500">Players</h1>
          <p class="text-sm text-gray-600">Browse FPL players with filters</p>
        </div>

        <div class="flex flex-wrap gap-2 items-center">
          <USelect
            v-model="filters.position"
            :items="positionOptions"
            value-key="value"
            label-key="label"
            placeholder="All positions"
            class="w-32"
            size="sm"
          />

          <UInput
            v-model="filters.search"
            placeholder="Search name"
            size="sm"
            class="w-48"
            @keyup.enter="resetAndFetch"
          />

          <UInput
            v-model.number="filters.minMinutes"
            type="number"
            placeholder="Min mins"
            size="sm"
            class="w-24"
            @keyup.enter="resetAndFetch"
          />

          <USelect
            v-model="sortKey"
            :items="sortKeyOptions"
            value-key="value"
            label-key="label"
            placeholder="Sort by"
            class="w-32"
            size="sm"
          />

          <USelect
            v-model="sortDirection"
            :items="sortDirectionOptions"
            value-key="value"
            label-key="label"
            class="w-32"
            size="sm"
          />


          <UButton size="sm" :loading="loading" @click="resetAndFetch">
            Apply
          </UButton>
        </div>
      </header>

      <UCard>
        <div v-if="loading" class="py-4 text-center text-gray-500 text-sm">
          Loading...
        </div>

        <div
          v-else-if="players.length === 0"
          class="py-4 text-center text-gray-500 text-sm"
        >
          No players found
        </div>

        <UTable
          v-else
          :data="players"
          :columns="columns"
          class="min-w-full text-sm"
        />
      </UCard>

      <div class="flex items-center justify-end">
        <UPagination
          :page="page"
          :items-per-page="pageSize"
          :total="approxTotal"
          :disabled="loading"
          @update:page="onPageChange"
        />
      </div>
    </section>
  </main>
</template>

<script setup lang="ts">
import { h, onMounted, reactive, ref, computed, watch } from 'vue';
import type { TableColumn } from '@nuxt/ui';
import { useApi } from '../composables/useApi';

type Position = 'GK' | 'DEF' | 'MID' | 'FWD';
type Availability = 'AVAILABLE' | 'RISKY' | 'UNAVAILABLE';

type SortKey =
  | 'PRICE'
  | 'TOTAL_POINTS'
  | 'POINTS_PER_GAME'
  | 'POINTS_PER_90'
  | 'POINTS_PER_MILLION'
  | 'MINUTES';

const sortKey = ref<SortKey>('POINTS_PER_90');
const sortDirection = ref<'DESC' | 'ASC'>('DESC');

const sortKeyOptions = [
  { label: 'Price', value: 'PRICE' },
  { label: 'Total points', value: 'TOTAL_POINTS' },
  { label: 'Pts/G', value: 'POINTS_PER_GAME' },
  { label: 'Pts/90', value: 'POINTS_PER_90' },
  { label: 'Pts/mil', value: 'POINTS_PER_MILLION' },
  { label: 'Minutes', value: 'MINUTES' },
];

const sortDirectionOptions = [
  { label: 'High → Low', value: 'DESC' },
  { label: 'Low → High', value: 'ASC' },
];


interface Player {
  id: number;
  externalId: number;
  webName: string;
  fullName: string | null;
  position: Position;
  nowCost: number;
  // Metric values from API
  valueMillions: number;
  totalPoints: number | null;
  pointsPerGame: number | null;
  pointsPerMillion: number | null;
  minutes: number | null;
  pointsPerNinety: number | null;
  availability: Availability;
  club: {
    id: number;
    externalId: number;
    name: string;
    shortName: string;
  };
}

const { get } = useApi();

const players = ref<Player[]>([]);
const loading = ref(false);

// Server-side pagination state
const page = ref(1);
const pageSize = 20;
const hasNext = ref(false);

type PositionFilter = Position | 'ALL';

const filters = reactive({
  position: 'ALL' as PositionFilter,
  search: '',
  minMinutes: 0,
});


const positionOptions = [
  { label: 'All', value: 'ALL' },
  { label: 'GK', value: 'GK' },
  { label: 'DEF', value: 'DEF' },
  { label: 'MID', value: 'MID' },
  { label: 'FWD', value: 'FWD' },
];

// Approximate total so UPagination can show a next page when we know there is one
const approxTotal = computed(() => {
  const currentCount = players.value.length;
  const currentOffset = (page.value - 1) * pageSize;

  if (hasNext.value) {
    // At least one more full page exists
    return currentOffset + pageSize * 2;
  }

  // Last page: currentOffset + count of this page
  return currentOffset + currentCount;
});

const columns: TableColumn<Player>[] = [
  {
    accessorKey: 'webName',
    header: 'Name',
    cell: ({ row }) => {
      const player = row.original as Player;
      return h('div', { class: 'flex flex-col' }, [
        h('span', { class: 'font-semibold text-gray-900' }, player.webName),
        player.fullName
          ? h('span', { class: 'text-xs text-gray-500' }, player.fullName)
          : null,
      ]);
    },
  },
  {
    accessorKey: 'position',
    header: 'Position',
  },
  {
    id: 'availability',
    header: 'Status',
    cell: ({ row }) => {
      const status = (row.original as Player).availability;
      const label =
        status === 'AVAILABLE'
          ? 'Available'
          : status === 'RISKY'
          ? 'Risky'
          : 'Unavailable';
      const color =
        status === 'AVAILABLE'
          ? 'text-green-500'
          : status === 'RISKY'
          ? 'text-amber-500'
          : 'text-red-500';
      return h('span', { class: `text-xs font-medium ${color}` }, label);
    },
  },
  {
    id: 'club',
    header: 'Club',
    accessorFn: (row) => row.club.shortName,
  },
  {
    id: 'price',
    header: 'Price',
    cell: ({ row }) => {
      const player = row.original as Player;
      const price = (player.nowCost / 10).toFixed(1);
      return `£${price}m`;
    },
    meta: {
      class: {
        td: 'whitespace-nowrap',
      },
    },
  },
  {
    id: 'minutes',
    header: 'Mins',
    accessorFn: (row) => row.minutes ?? '-',
  },
  {
    id: 'points',
    header: 'Pts',
    accessorFn: (row) => row.totalPoints ?? '-',
  },
  {
    id: 'ppg',
    header: 'Pts/G',
    accessorFn: (row) =>
      row.pointsPerGame !== null ? row.pointsPerGame.toFixed(2) : '-',
  },
  {
    id: 'pp90',
    header: 'Pts/90',
    accessorFn: (row) =>
      row.pointsPerNinety !== null ? row.pointsPerNinety.toFixed(2) : '-',
  },
  {
    id: 'ppm',
    header: 'Pts/mil',
    accessorFn: (row) =>
      row.pointsPerMillion !== null ? row.pointsPerMillion.toFixed(2) : '-',
  },
];

const fetchPlayers = async () => {
  loading.value = true;
  try {
    const offset = (page.value - 1) * pageSize;
    const params: Record<string, string | number> = {
      limit: pageSize,
      offset,
    };

    if (filters.position && filters.position !== 'ALL') {
      params.position = filters.position;
    }
    if (filters.search.trim()) {
      params.search = filters.search.trim();
    }
    if(filters.minMinutes && filters.minMinutes > 0) {
      params.minMinutes = filters.minMinutes;
    }

    params.sortKey = sortKey.value;
    params.sortDirection = sortDirection.value;

    const result = await get<Player[]>('/fpl/players', params);
    players.value = result;
    hasNext.value = result.length === pageSize;
  } catch (e) {
    console.error('fetchPlayers error:', e);
    players.value = [];
    hasNext.value = false;
  } finally {
    loading.value = false;
  }
};

const resetAndFetch = () => {
  page.value = 1;
  fetchPlayers();
};

const onPageChange = (newPage: number) => {
  if (newPage < 1 || loading.value) return;
  page.value = newPage;
  fetchPlayers();
};

// When filters or sortKey change, reset to page 1 and refetch
watch(
  () => [filters.position, filters.minMinutes, sortKey.value, sortDirection.value],
  () => {
    resetAndFetch();
  },
);



onMounted(() => {
  fetchPlayers();
});
</script>
