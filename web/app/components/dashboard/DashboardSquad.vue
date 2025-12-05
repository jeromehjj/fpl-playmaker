<template>
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

    <div v-if="loading" class="text-sm text-gray-500">
      Loading squad...
    </div>
    <div v-else-if="!squad && error" class="text-sm text-red-500">
      {{ error }}
    </div>
    <div v-else-if="!squad" class="text-sm text-gray-500">
      Squad not available.
    </div>
    <div v-else class="space-y-4">
      <div>
        <h3 class="text-sm font-semibold mb-2">Starting XI</h3>
        <div class="overflow-x-auto">
          <UTable
            :data="sortedStarting"
            :columns="startingColumns"
            class="min-w-full text-xs"
          />
        </div>
      </div>

      <div>
        <h3 class="text-sm font-semibold mb-2">Bench</h3>
        <div class="overflow-x-auto">
          <UTable
            :data="sortedBench"
            :columns="benchColumns"
            class="min-w-full text-xs"
          />
        </div>
      </div>
    </div>
  </UCard>
</template>

<script setup lang="ts">
import type { TableColumn } from '@nuxt/ui';
import { computed, h, resolveComponent } from 'vue';
import type { TickerFixture } from '../../types/fpl-common';
import type {
  Squad,
  SquadPlayer,
} from '../../types/fpl-dashboard';


const UBadge = resolveComponent('UBadge');

const {
  squad,
  loading,
  error,
  nextFixturesForClub,
  difficultyBadgeColor,
} = defineProps<{
  squad: Squad | null;
  loading: boolean;
  error: string | null;
  nextFixturesForClub: (
    clubExternalId: number,
    limit: number,
  ) => TickerFixture[];
  difficultyBadgeColor: (
    d: number,
  ) =>
    | 'error'
    | 'primary'
    | 'secondary'
    | 'success'
    | 'info'
    | 'warning'
    | 'neutral'
    | undefined;
}>();

const sortedStarting = computed(() =>
  squad
    ? [...squad.starting].sort((a, b) => a.pick.position - b.pick.position)
    : [],
);

const sortedBench = computed(() =>
  squad
    ? [...squad.bench].sort((a, b) => a.pick.position - b.pick.position)
    : [],
);

const startingColumns: TableColumn<SquadPlayer>[] = [
  {
    accessorKey: 'position',
    header: 'Pos',
  },
  {
    id: 'player',
    header: 'Player',
    cell: ({ row }) => {
      const p = row.original as SquadPlayer;

      let roleLabel: string | null = null;
      let roleClass = '';
      if (p.pick.isCaptain) {
        roleLabel = 'C';
        roleClass = 'text-amber-400';
      } else if (p.pick.isViceCaptain) {
        roleLabel = 'VC';
        roleClass = 'text-sky-400';
      }

      const roleBadge =
        roleLabel !== null
          ? h(
              'span',
              {
                class: `text-xs font-semibold mr-1 ${roleClass}`,
              },
              roleLabel,
            )
          : null;

      return h('span', [
        roleBadge,
        p.webName,
        p.fullName
          ? h(
              'span',
              { class: 'ml-1 text-[10px] text-gray-500' },
              `(${p.fullName})`,
            )
          : null,
      ]);
    },
  },
  {
    id: 'status',
    header: 'Status',
    cell: ({ row }) => {
      const p = row.original as SquadPlayer;
      const status = p.availability;
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
      const p = row.original as SquadPlayer;
      return `£${(p.nowCost / 10).toFixed(1)}m`;
    },
  },
  {
    id: 'fixtures',
    header: 'Next 3 fixtures',
    cell: ({ row }) => {
      const p = row.original as SquadPlayer;
      const fixtures = nextFixturesForClub(p.club.externalId, 3);
      if (!fixtures.length) {
        return h('span', { class: 'text-gray-400' }, '-');
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
  {
    id: 'gwPoints',
    header: 'GW pts',
    cell: ({ row }) => {
      const p = row.original as SquadPlayer;
      if (p.gwPoints === null) {
        return '-';
      }

      return `${p.pick.multiplier * p.gwPoints}`;
    },
  },
];


const benchColumns: TableColumn<SquadPlayer>[] = [
  {
    accessorKey: 'position',
    header: 'Pos',
  },
  {
    id: 'player',
    header: 'Player',
    cell: ({ row }) => {
      const p = row.original as SquadPlayer;
      return h('span', [
        p.webName,
        p.fullName
          ? h(
              'span',
              { class: 'ml-1 text-[10px] text-gray-500' },
              `(${p.fullName})`,
            )
          : null,
      ]);
    },
  },
  {
    id: 'status',
    header: 'Status',
    cell: ({ row }) => {
      const p = row.original as SquadPlayer;
      const status = p.availability;
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
      const p = row.original as SquadPlayer;
      return `£${(p.nowCost / 10).toFixed(1)}m`;
    },
  },
  {
    id: 'fixtures',
    header: 'Next 3 fixtures',
    cell: ({ row }) => {
      const p = row.original as SquadPlayer;
      const fixtures = nextFixturesForClub(p.club.externalId, 3);
      if (!fixtures.length) {
        return h('span', { class: 'text-gray-400' }, '-');
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
  {
    id: 'gwPoints',
    header: 'GW pts',
    cell: ({ row }) => {
      const p = row.original as SquadPlayer;
      if (p.gwPoints === null) {
        return '-';
      }

      return `${p.gwPoints}`;
    },
  },
];
</script>
