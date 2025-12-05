<template>
  <UCard ref="cardRef">
    <div class="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
      <div class="flex flex-wrap gap-3 items-end">
        <UFormField label="Position" class="w-40">
          <USelect
            v-model="filters.position"
            :items="positionOptions"
            value-key="value"
            label-key="label"
            placeholder="All positions"
            size="sm"
            class="w-full"
          />
        </UFormField>

        <UFormField label="Status" class="w-40">
          <USelect
            v-model="filters.availability"
            :items="statusOptions"
            value-key="value"
            label-key="label"
            placeholder="All status"
            size="sm"
            class="w-full"
          />
        </UFormField>

        <UFormField label="Search" class="w-60">
          <UInput
            v-model="filters.search"
            placeholder="Search for player..."
            size="sm"
            class="w-full"
          />
        </UFormField>

        <UFormField label="Min. minutes" class="w-40">
          <UInputNumber
            v-model="filters.minMinutes"
            :min="0"
            placeholder="180"
            size="sm"
            class="w-full"
          />
        </UFormField>
      </div>

      <div class="flex gap-2 justify-end">
        <UButton size="sm" :loading="loading" @click="onPageChange(1)">
          Apply
        </UButton>

        <UButton
          size="sm"
          color="warning"
          :disabled="loading"
          @click="resetFilters"
        >
          Reset
        </UButton>
      </div>
    </div>

    <div class="mt-4">
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
        :data="pagedPlayers"
        :columns="columns"
        class="min-w-full text-sm"
      />

      <div class="mt-4 flex items-center justify-end">
        <UPagination
          :page="page"
          :items-per-page="pageSize"
          :total="totalItems"
          :disabled="loading"
          @update:page="onPageChange"
        />
      </div>

      <p v-if="error" class="mt-2 text-xs text-red-500">
        {{ error }}
      </p>
    </div>
  </UCard>
</template>

<script setup lang="ts">
import { h, onMounted, reactive, ref, computed, watch, resolveComponent } from 'vue'
import type { TableColumn } from '@nuxt/ui'
import { useApi } from '../../composables/useApi'
import { POSITION_OPTIONS, AVAILABILITY_OPTIONS } from '../../types/fpl-players'
import type {
  PlayerSortKey,
  PlayerListItem,
  PositionFilter,
  AvailabilityFilter,
} from '../../types/fpl-players'

const positionOptions = POSITION_OPTIONS
const statusOptions = AVAILABILITY_OPTIONS

const sortKey = ref<PlayerSortKey>('TOTAL_POINTS')
const sortDirection = ref<'DESC' | 'ASC'>('DESC')
const allPlayers = ref<PlayerListItem[]>([])
const loading = ref(false)
const page = ref(1)
const pageSize = 20
const error = ref<string | null>(null)
const cardRef = ref<any>(null)

const filters = reactive({
  position: 'ALL' as PositionFilter,
  availability: 'ALL' as AvailabilityFilter,
  search: '',
  minMinutes: 0,
})

const { get } = useApi()
const UButton = resolveComponent('UButton')

const players = computed<PlayerListItem[]>(() => {
  return allPlayers.value.filter((p) => {
    if (filters.position !== 'ALL' && p.position !== filters.position) {
      return false
    }

    if (
      filters.availability !== 'ALL' &&
      p.availability !== filters.availability
    ) {
      return false
    }

    if (filters.minMinutes && filters.minMinutes > 0) {
      const minutes = p.minutes ?? 0
      if (minutes < filters.minMinutes) {
        return false
      }
    }

    if (filters.search.trim()) {
      const q = filters.search.trim().toLowerCase()
      const nameMatch =
        p.webName.toLowerCase().includes(q) ||
        (p.fullName ?? '').toLowerCase().includes(q)
      const clubMatch = p.club.shortName.toLowerCase().includes(q)
      if (!nameMatch && !clubMatch) {
        return false
      }
    }

    return true
  })
})

const totalItems = computed(() => players.value.length)

const sortedPlayers = computed(() => {
  const list = [...players.value]
  const key = sortKey.value
  const dir = sortDirection.value === 'ASC' ? 1 : -1

  const getValue = (p: PlayerListItem): number => {
    switch (key) {
      case 'TOTAL_POINTS':
        return p.totalPoints ?? 0
      case 'POINTS_PER_GAME':
        return p.pointsPerGame ?? 0
      case 'POINTS_PER_90':
        return p.pointsPerNinety ?? 0
      case 'POINTS_PER_MILLION':
        return p.pointsPerMillion ?? 0
      case 'MINUTES':
        return p.minutes ?? 0
      case 'PRICE':
      default:
        return p.nowCost ?? 0
    }
  }

  return list.sort((a, b) => {
    const av = getValue(a)
    const bv = getValue(b)
    if (av === bv) return 0
    return av > bv ? dir : -dir
  })
})

const pagedPlayers = computed(() => {
  const start = (page.value - 1) * pageSize
  const end = start + pageSize
  return sortedPlayers.value.slice(start, end)
})

const sortableHeader = (label: string, key: PlayerSortKey) => {
  return () => {
    const isActive = sortKey.value === key
    const icon = !isActive
      ? 'i-lucide-arrow-up-down'
      : sortDirection.value === 'ASC'
      ? 'i-lucide-arrow-up-narrow-wide'
      : 'i-lucide-arrow-down-wide-narrow'

    return h(UButton, {
      color: 'neutral',
      variant: 'ghost',
      label,
      icon,
      class: ['-mx-2.5', isActive ? 'text-emerald-500' : ''],
      onClick: () => {
        if (sortKey.value === key) {
          sortDirection.value = sortDirection.value === 'DESC' ? 'ASC' : 'DESC'
        } else {
          sortKey.value = key
          sortDirection.value = 'DESC'
        }
      },
    })
  }
}

const columns: TableColumn<PlayerListItem>[] = [
  {
    accessorKey: 'webName',
    header: 'Name',
    cell: ({ row }) => {
      const player = row.original
      return h('div', { class: 'flex flex-col' }, [
        h('span', { class: 'font-semibold text-gray-900' }, player.webName),
        player.fullName
          ? h('span', { class: 'text-xs text-gray-500' }, player.fullName)
          : null,
      ])
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
      const status = row.original.availability
      const label =
        status === 'AVAILABLE'
          ? 'Available'
          : status === 'RISKY'
          ? 'Risky'
          : 'Unavailable'
      const color =
        status === 'AVAILABLE'
          ? 'text-green-500'
          : status === 'RISKY'
          ? 'text-amber-500'
          : 'text-red-500'
      return h('span', { class: `text-xs font-medium ${color}` }, label)
    },
  },
  {
    id: 'club',
    header: 'Club',
    accessorFn: row => row.club.shortName,
  },
  {
    id: 'PRICE',
    header: sortableHeader('Price', 'PRICE'),
    cell: ({ row }) => {
      const price = (row.original.nowCost / 10).toFixed(1)
      return `£${price}m`
    },
    meta: {
      class: {
        td: 'whitespace-nowrap',
      },
    },
  },
  {
    id: 'MINUTES',
    header: sortableHeader('Mins', 'MINUTES'),
    accessorFn: row => row.minutes ?? '-',
  },
  {
    id: 'TOTAL_POINTS',
    header: sortableHeader('Pts', 'TOTAL_POINTS'),
    accessorFn: row => row.totalPoints ?? '-',
  },
  {
    id: 'POINTS_PER_GAME',
    header: sortableHeader('Pts/G', 'POINTS_PER_GAME'),
    accessorFn: row =>
      row.pointsPerGame != null ? row.pointsPerGame.toFixed(2) : '-',
  },
  {
    id: 'POINTS_PER_90',
    header: sortableHeader('Pts/90', 'POINTS_PER_90'),
    accessorFn: row =>
      row.pointsPerNinety != null ? row.pointsPerNinety.toFixed(2) : '-',
  },
  {
    id: 'POINTS_PER_MILLION',
    header: sortableHeader('Pts/mil', 'POINTS_PER_MILLION'),
    accessorFn: row =>
      row.pointsPerMillion != null ? row.pointsPerMillion.toFixed(2) : '-',
  },
]

const fetchPlayers = async () => {
  loading.value = true
  error.value = null

  try {
    const baseParams: Record<string, string | number> = {
      limit: 200,
    }

    if (filters.position && filters.position !== 'ALL') {
      baseParams.position = filters.position
    }
    if (filters.search.trim()) {
      baseParams.search = filters.search.trim()
    }
    if (filters.minMinutes && filters.minMinutes > 0) {
      baseParams.minMinutes = filters.minMinutes
    }

    const all: PlayerListItem[] = []
    const limit = 200
    let offset = 0

    while (true) {
      const params = { ...baseParams, offset }
      const batch = await get<PlayerListItem[]>('/fpl/players', params)
      all.push(...batch)

      if (batch.length < limit) {
        break
      }

      offset += limit
      if (offset > 2000) {
        break
      }
    }

    allPlayers.value = all
    page.value = 1
    } catch (e: any) {
      console.error('fetchPlayers error:', e)
      allPlayers.value = []
    error.value = e?.data?.message || e?.message || 'Failed to load players'
  } finally {
    loading.value = false
  }
}

const resetFilters = () => {
  filters.position = 'ALL'
  filters.availability = 'ALL'
  filters.search = ''
  filters.minMinutes = 0
  sortKey.value = 'TOTAL_POINTS'
  sortDirection.value = 'DESC'
  onPageChange(1)
}

const onPageChange = (newPage: number) => {
  if (newPage < 1 || loading.value) return
  page.value = newPage

  // Scroll the card into view when changing page (client-side only)
  if (typeof window !== 'undefined') {
    const el = (cardRef.value as any)?.$el ?? null
    if (el && typeof el.scrollIntoView === 'function') {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }
  }
}

onMounted(() => {
  fetchPlayers()
})
</script>
