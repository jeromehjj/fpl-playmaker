<template>
  <UCard>
    <template #header>
      <div class="flex items-center justify-between">
        <h2 class="text-lg font-semibold">Leagues</h2>
        <p class="text-xs text-white">
          {{ leagues.length }} joined
        </p>
      </div>
    </template>

    <div class="space-y-4 overflow-x-auto">
      <section v-if="standardLeagues.length">
        <h3 class="mb-1 text-md font-semibold uppercase text-white">
          Standard
        </h3>
        <UTable
          :data="standardLeagues"
          :columns="columns"
          class="min-w-full text-xs"
        />
      </section>

      <section v-if="invitationalLeagues.length">
        <h3 class="mb-1 text-md font-semibold uppercase text-white">
          Invitational
        </h3>
        <UTable
          :data="invitationalLeagues"
          :columns="columns"
          class="min-w-full text-xs"
        />
      </section>

      <section v-if="cupLeagues.length">
        <h3 class="mb-1 text-md font-semibold uppercase text-white">
          Cup
        </h3>
        <UTable
          :data="cupLeagues"
          :columns="columns"
          class="min-w-full text-xs"
        />
      </section>

      <section v-if="otherLeagues.length">
        <h3 class="mb-1 text-md font-semibold uppercase text-white">
          Other
        </h3>
        <UTable
          :data="otherLeagues"
          :columns="columns"
          class="min-w-full text-xs"
        />
      </section>
    </div>
  </UCard>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { TableColumn } from '@nuxt/ui'
import type { League } from '../../types/fpl-dashboard'

const { leagues } = defineProps<{
  leagues: League[]
}>()

const columns: TableColumn<League>[] = [
  {
    accessorKey: 'name',
    header: 'Name',
    meta: {
      class: {
        td: 'w-2/5 whitespace-nowrap',
      },
    },
  },
  {
    id: 'scoring',
    header: 'Scoring',
    cell: ({ row }) =>
      row.original.scoring === 'classic' ? 'Classic' : 'Head to head',
    meta: {
      class: {
        td: 'w-1/5 whitespace-nowrap',
      },
    },
  },
  {
    id: 'rank',
    header: 'Rank',
    cell: ({ row }) => {
      const rank = row.original.entryRank
      return rank !== null ? `#${rank.toLocaleString()}` : '-'
    },
    meta: {
      class: {
        td: 'w-1/5 whitespace-nowrap',
      },
    },
  },
  {
    id: 'teams',
    header: 'Teams',
    cell: ({ row }) => {
      const count = row.original.rankCount
      return count !== null ? count.toLocaleString() : '-'
    },
    meta: {
      class: {
        td: 'w-1/5 whitespace-nowrap',
      },
    },
  },
]


const typeKey = (lg: League) =>
  lg.leagueType?.toLowerCase().trim() ?? ''

const standardLeagues = computed(() =>
  leagues.filter(lg => typeKey(lg) === 'standard'),
)

const invitationalLeagues = computed(() =>
  leagues.filter(lg => typeKey(lg) === 'invitation'),
)

const cupLeagues = computed(() =>
  leagues.filter(lg => typeKey(lg) === 'cup'),
)

const otherLeagues = computed(() =>
  leagues.filter(lg => {
    const t = typeKey(lg)
    return t && !['standard', 'invitation', 'cup'].includes(t)
  }),
)
</script>
