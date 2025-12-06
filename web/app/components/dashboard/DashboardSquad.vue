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
      <UTabs
        v-model="viewMode"
        :items="tabItems"
        class="w-full"
        size="sm"
      />

      <!-- Pitch view -->
      <section v-show="viewMode === 'PITCH'">
        <h3 class="mb-2 text-sm font-semibold">Starting XI</h3>

       <div
          class="relative mx-auto w-full max-w-md md:max-w-lg rounded-2xl border border-emerald-600 bg-gradient-to-b from-emerald-700 via-emerald-600 to-emerald-900 px-3 py-4 text-xs text-emerald-50 shadow-inner"
        >

          <!-- Pitch lines -->
          <div
            class="pointer-events-none absolute inset-1 rounded-xl border border-white"
          />
          <div
            class="pointer-events-none absolute inset-x-2 top-1/2 h-px -translate-y-1/2 bg-white"
          />
          <div
            class="pointer-events-none absolute left-1/2 top-1/2 h-16 w-16 -translate-x-1/2 -translate-y-1/2 rounded-full border border-white"
          />
          <div
            class="pointer-events-none absolute left-1/2 top-2 h-16 w-36 -translate-x-1/2 rounded-b-xl border border-white"
          />
          <div
            class="pointer-events-none absolute bottom-2 left-1/2 h-16 w-36 -translate-x-1/2 rounded-t-xl border border-white"
          />

          <div class="relative space-y-5">
            <div
              v-for="line in startingLines"
              :key="line.key"
              class="flex justify-center"
            >
              <div class="flex justify-center gap-3 md:gap-4">
                <div
                  v-for="p in line.players"
                  :key="p.id"
                  class="flex flex-col items-center"
                >
                  <div
                    class="relative flex min-w-[80px] flex-col items-center rounded-md bg-emerald-700/80 px-2 py-1"
                  >
                    <!-- Captain / Vice-Captain badge -->
                    <div
                      v-if="p.pick.isCaptain"
                      class="absolute -top-2 -left-2 inline-flex h-5 w-5 items-center justify-center rounded-full bg-amber-400 text-[10px] font-bold text-black"
                    >
                      C
                    </div>
                    <div
                      v-else-if="p.pick.isViceCaptain"
                      class="absolute -top-2 -left-2 inline-flex h-5 w-5 items-center justify-center rounded-full bg-sky-400 text-[10px] font-bold text-black"
                    >
                      VC
                    </div>

                    <!-- Availability dot -->
                    <span
                      class="absolute -top-1 -right-1 inline-flex h-3 w-3 rounded-full border border-emerald-900"
                      :class="availabilityDotClass(p.availability)"
                    />

                    <!-- Club jersey or short name -->
                    <img
                      v-if="clubJersey(p)"
                      :src="clubJersey(p)"
                      :alt="p.club.shortName"
                      class="mb-1 h-10 w-10 object-contain drop-shadow"
                    />
                    <div
                      v-else
                      class="mb-1 text-[10px] font-semibold uppercase"
                    >
                      {{ p.club.shortName }}
                    </div>

                    <span class="text-[11px] font-semibold">
                      {{ p.webName }}
                    </span>
                    <span class="text-[10px] text-emerald-100/90">
                      {{ p.club.shortName }}
                    </span>

                    <span class="mt-1 text-[10px] font-semibold">
                      {{ gwPointsDisplay(p) }} pts
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Bench under pitch -->
        <h3 class="mt-4 mb-2 text-sm font-semibold">Bench</h3>
        <div class="flex flex-wrap justify-center gap-3">
          <div
            v-for="p in sortedBench"
            :key="p.id"
            class="flex flex-col items-center text-xs"
          >
            <div
              class="relative flex min-w-[80px] flex-col items-center rounded-md bg-slate-800 px-2 py-1 text-slate-50"
            >
              <span
                class="absolute -top-1 -right-1 inline-flex h-3 w-3 rounded-full border border-slate-900"
                :class="availabilityDotClass(p.availability)"
              />

              <img
                v-if="clubJersey(p)"
                :src="clubJersey(p)"
                :alt="p.club.shortName"
                class="mb-1 h-8 w-8 object-contain drop-shadow"
              />
              <div
                v-else
                class="mb-1 text-[10px] font-semibold uppercase"
              >
                {{ p.club.shortName }}
              </div>

              <span class="text-[11px] font-semibold">
                {{ p.webName }}
              </span>
              <span class="text-[10px] text-slate-200/90">
                {{ p.club.shortName }}
              </span>

              <span class="mt-1 text-[10px] font-semibold">
                {{ gwPointsDisplay(p) }} pts
              </span>
            </div>
          </div>
        </div>
      </section>

      <!-- List view (original tables) -->
      <section v-show="viewMode === 'LIST'" class="space-y-4">
        <div>
          <h3 class="mb-2 text-sm font-semibold">Starting XI</h3>
          <div class="overflow-x-auto">
            <UTable
              :data="sortedStarting"
              :columns="startingColumns"
              class="min-w-full text-xs"
            />
          </div>
        </div>

        <div>
          <h3 class="mb-2 text-sm font-semibold">Bench</h3>
          <div class="overflow-x-auto">
            <UTable
              :data="sortedBench"
              :columns="benchColumns"
              class="min-w-full text-xs"
            />
          </div>
        </div>
      </section>
    </div>
  </UCard>
</template>

<script setup lang="ts">
import { computed, h, ref, resolveComponent } from 'vue'
import type { TableColumn } from '@nuxt/ui'
import type { Availability, TickerFixture } from '../../types/fpl-common'
import type { Squad, SquadPlayer } from '../../types/fpl-dashboard'
import {
  getClubGoalkeeperJerseyUrl,
  getClubLogoUrl,
  getClubJerseyUrl,
} from '../../utils/fpl-logos'

const UBadge = resolveComponent('UBadge')

const {
  squad,
  loading,
  error,
  nextFixturesForClub,
  difficultyBadgeColor,
} = defineProps<{
  squad: Squad | null
  loading: boolean
  error: string | null
  nextFixturesForClub: (
    clubExternalId: number,
    limit: number,
  ) => TickerFixture[]
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
    | undefined
}>()

const viewMode = ref<'PITCH' | 'LIST'>('LIST')

const tabItems = [
  { label: 'List', value: 'LIST' as const },
  { label: 'Pitch', value: 'PITCH' as const },
]

const sortedStarting = computed(() =>
  squad
    ? [...squad.starting].sort((a, b) => a.pick.position - b.pick.position)
    : [],
)

const sortedBench = computed(() =>
  squad ? [...squad.bench].sort((a, b) => a.pick.position - b.pick.position) : [],
)

// Pitch grouping
const startingLines = computed(() => {
  const lines: Record<'GK' | 'DEF' | 'MID' | 'FWD', SquadPlayer[]> = {
    GK: [],
    DEF: [],
    MID: [],
    FWD: [],
  }

  for (const p of sortedStarting.value) {
    lines[p.position].push(p)
  }

  return [
    { key: 'GK', players: lines.GK },
    { key: 'DEF', players: lines.DEF },
    { key: 'MID', players: lines.MID },
    { key: 'FWD', players: lines.FWD },
  ]
})

// List view columns
  const startingColumns: TableColumn<SquadPlayer>[] = [
  {
    accessorKey: 'position',
    header: 'Pos',
  },
  {
    id: 'player',
    header: 'Player',
    cell: ({ row }) => {
      const p = row.original as SquadPlayer

      let roleLabel: string | null = null
      let roleClass = ''
      if (p.pick.isCaptain) {
        roleLabel = 'C'
        roleClass = 'text-amber-400'
      } else if (p.pick.isViceCaptain) {
        roleLabel = 'VC'
        roleClass = 'text-sky-400'
      }

      const roleBadge =
        roleLabel !== null
          ? h(
              'span',
              {
                class: `mr-1 text-xs font-semibold ${roleClass}`,
              },
              roleLabel,
            )
          : null

      const logo = clubLogo(p)

      const logoNode = logo
        ? h('img', {
            src: logo,
            alt: p.club.shortName,
            class: 'h-6 w-6 object-contain',
          })
        : h(
            'div',
            {
              class:
                'flex h-6 w-6 items-center justify-center rounded bg-gray-100 text-[10px] font-semibold text-gray-700',
            },
            p.club.shortName,
          )

      return h('div', { class: 'flex items-center gap-3' }, [
        logoNode,
          h('div', { class: 'flex flex-col leading-tight' }, [
            h('span', { class: 'text-xs font-semibold text-white' }, [
            roleBadge,
            p.webName,
          ]),
          h(
            'span',
            { class: 'text-[11px] text-gray-500' },
            p.club.name,
          ),
        ]),
      ])
    },
  },
  {
    id: 'status',
    header: 'Status',
    cell: ({ row }) => {
      const p = row.original as SquadPlayer
      const status = p.availability
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
    id: 'price',
    header: 'Price',
    cell: ({ row }) => {
      const p = row.original as SquadPlayer
      return `£${(p.nowCost / 10).toFixed(1)}m`
    },
  },
  {
    id: 'fixtures',
    header: 'Next 3 fixtures',
    cell: ({ row }) => {
      const p = row.original as SquadPlayer
      const fixtures = nextFixturesForClub(p.club.externalId, 3)
      if (!fixtures.length) {
        return h('span', { class: 'text-gray-400' }, '-')
      }

      return h(
        'div',
        { class: 'flex flex-wrap gap-1' },
        fixtures.map(fx =>
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
      )
    },
  },
  {
    id: 'gwPoints',
    header: 'GW pts',
    cell: ({ row }) => {
      const p = row.original as SquadPlayer
      if (p.gwPoints === null) {
        return '-'
      }

      return `${p.pick.multiplier * p.gwPoints}`
    },
  },
]

const benchColumns: TableColumn<SquadPlayer>[] = [
  {
    accessorKey: 'position',
    header: 'Pos',
  },
  {
    id: 'player',
    header: 'Player',
    cell: ({ row }) => {
      const p = row.original as SquadPlayer
      const logo = clubLogo(p)

      const logoNode = logo
        ? h('img', {
            src: logo,
            alt: p.club.shortName,
            class: 'h-6 w-6 object-contain',
          })
        : h(
            'div',
            {
              class:
                'flex h-6 w-6 items-center justify-center rounded bg-gray-100 text-[10px] font-semibold text-gray-700',
            },
            p.club.shortName,
          )

      return h('div', { class: 'flex items-center gap-3' }, [
        logoNode,
        h('div', { class: 'flex flex-col leading-tight' }, [
          h('span', { class: 'text-xs font-semibold text-white' }, p.webName),
          h(
            'span',
            { class: 'text-[11px] text-gray-500' },
            p.club.name,
          ),
        ]),
      ])
    },
  },
  {
    id: 'status',
    header: 'Status',
    cell: ({ row }) => {
      const p = row.original as SquadPlayer
      const status = p.availability
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
    id: 'price',
    header: 'Price',
    cell: ({ row }) => {
      const p = row.original as SquadPlayer
      return `£${(p.nowCost / 10).toFixed(1)}m`
    },
  },
  {
    id: 'fixtures',
    header: 'Next 3 fixtures',
    cell: ({ row }) => {
      const p = row.original as SquadPlayer
      const fixtures = nextFixturesForClub(p.club.externalId, 3)
      if (!fixtures.length) {
        return h('span', { class: 'text-gray-400' }, '-')
      }

      return h(
        'div',
        { class: 'flex flex-wrap gap-1' },
        fixtures.map(fx =>
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
      )
    },
  },
  {
    id: 'gwPoints',
    header: 'GW pts',
    cell: ({ row }) => {
      const p = row.original as SquadPlayer
      if (p.gwPoints === null) {
        return '-'
      }

      return `${p.gwPoints}`
    },
  },
]

const clubLogo = (p: SquadPlayer) => getClubLogoUrl(p.club.shortName)
const clubJersey = (p: SquadPlayer) => {
  const short = p.club.shortName

  if (p.position === 'GK') {
    return (
      getClubGoalkeeperJerseyUrl(short) ??
      getClubJerseyUrl(short) ??
      getClubLogoUrl(short)
    )
  }

  return getClubJerseyUrl(short) ?? getClubLogoUrl(short)
}

const availabilityDotClass = (availability: Availability) => {
  switch (availability) {
    case 'AVAILABLE':
      return 'bg-emerald-400'
    case 'RISKY':
      return 'bg-amber-400'
    case 'UNAVAILABLE':
      return 'bg-red-500'
    default:
      return 'bg-emerald-400'
  }
}

const gwPointsDisplay = (p: SquadPlayer) => {
  if (p.gwPoints === null) return '-'
  return p.pick.multiplier * p.gwPoints
}
</script>
