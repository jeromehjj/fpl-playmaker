<template>
  <UCard>
    <div v-if="loading" class="py-4 text-center text-gray-500 text-sm">
      Loading fixtures...
    </div>

    <div v-else-if="error" class="py-4 text-center text-red-500 text-sm">
      {{ error }}
    </div>

    <div v-else>
      <UTable
        :sorting="sorting"
        :data="tickerRows"
        :columns="columns"
        class="min-w-full text-xs"
      />
    </div>
  </UCard>
</template>

<script setup lang="ts">
import { h, computed, onMounted, ref, resolveComponent } from 'vue'
import type { TableColumn } from '@nuxt/ui'
import { useApi } from '../../composables/useApi'
import type {
  FixtureTicker,
  TickerFixture,
  TickerRow,
} from '../../types/fpl-common'
import { difficultyBadgeColor } from '../../utils/fpl-ui'

const { get } = useApi()

const UBadge = resolveComponent('UBadge')
const UButton = resolveComponent('UButton')

const ticker = ref<FixtureTicker | null>(null)
const loading = ref(false)
const error = ref<string | null>(null)
const tickerRows = computed(() => ticker.value?.rows ?? [])

const sorting = ref<{ id: string; desc: boolean }[]>([])

const columns = computed<TableColumn<TickerRow>[]>(() => {
  if (!ticker.value) return []

  const teamColumn: TableColumn<TickerRow> = {
    accessorKey: 'clubShortName',
    enableSorting: true,
    header: ({ column }) => {
      const isSorted = column.getIsSorted()

      return h(UButton, {
        color: 'neutral',
        variant: 'ghost',
        label: 'Team',
        icon: isSorted
          ? isSorted === 'asc'
            ? 'i-lucide-arrow-up-narrow-wide'
            : 'i-lucide-arrow-down-wide-narrow'
          : 'i-lucide-arrow-up-down',
        class: ['-mx-2.5', isSorted ? 'text-emerald-500' : ''],
        onClick: () => column.toggleSorting(column.getIsSorted() === 'asc'),
      })
    },
    cell: ({ row }) => {
      const r = row.original as TickerRow
      return h('span', { class: 'font-medium' }, r.clubShortName)
    },
  }

  const gwColumns: TableColumn<TickerRow>[] = ticker.value.events.map(
    gw => ({
      id: `gw-${gw}`,
      accessorFn: row => {
        const r = row as TickerRow
        const fx = r.fixtures.find(f => f.event === gw) ?? null
        return fx ? fx.difficulty : Number.POSITIVE_INFINITY
      },
      enableSorting: true,
      header: ({ column }) => {
        const isSorted = column.getIsSorted()

        return h(UButton, {
          color: 'neutral',
          variant: 'ghost',
          label: `GW ${gw}`,
          icon: isSorted
            ? isSorted === 'asc'
              ? 'i-lucide-arrow-up-narrow-wide'
              : 'i-lucide-arrow-down-wide-narrow'
            : 'i-lucide-arrow-up-down',
          class: ['-mx-2.5', isSorted ? 'text-emerald-500' : ''],
          onClick: () => column.toggleSorting(column.getIsSorted() === 'asc'),
        })
      },
      cell: ({ row }) => {
        const r = row.original as TickerRow
        const fx = r.fixtures.find(f => f.event === gw) ?? null
        if (!fx) {
          return h('span', { class: 'text-gray-300' }, '-')
        }

        const label = `${fx.isHome ? 'H' : 'A'} ${
          fx.opponentShortName ?? ''
        } (${fx.difficulty})`

        return h(
          UBadge,
          {
            class: 'whitespace-nowrap',
            variant: 'subtle',
            color: difficultyBadgeColor(fx.difficulty),
          },
          () => label,
        )
      },
    }),
  )

  return [teamColumn, ...gwColumns]
})

const fetchTicker = async () => {
  loading.value = true
  error.value = null
  try {
    ticker.value = await get<FixtureTicker>('/fpl/fixture-ticker', {
      events: 5,
    })
  } catch (e: any) {
    console.error('fetchTicker error:', e)
    error.value = e?.data?.message ?? 'Failed to load fixtures.'
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  fetchTicker()
})
</script>

