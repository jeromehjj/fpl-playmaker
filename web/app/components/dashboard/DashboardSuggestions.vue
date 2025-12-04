<template>
  <UCard>
    <template #header>
      <div class="flex items-center justify-between">
        <h2 class="text-lg font-semibold">Transfer Suggestions</h2>
        <p v-if="squad" class="text-xs text-white">
          Bank: £{{ (squad.bank / 10).toFixed(1) }}m
        </p>
      </div>
    </template>

    <div v-if="loading" class="text-sm text-gray-500">
      Calculating suggestions...
    </div>
    <div v-else-if="error" class="text-sm text-red-500">
      {{ error }}
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
</template>

<script setup lang="ts">
import { h, resolveComponent } from 'vue';
import type { TableColumn } from '@nuxt/ui';
import type {
  Squad,
  TransferSuggestion,
} from '../../types/fpl-dashboard';
import type { TickerFixture } from '../../types/fpl-common';

const UBadge = resolveComponent('UBadge');

const {
  squad,
  suggestions,
  loading,
  error,
  nextFixturesForClub,
  difficultyBadgeColor,
} = defineProps<{
  squad: Squad | null;
  suggestions: TransferSuggestion[];
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
</script>
