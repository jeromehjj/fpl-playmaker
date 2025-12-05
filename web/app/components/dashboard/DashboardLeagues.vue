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
            v-for="lg in leagues"
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
</template>

<script setup lang="ts">
import type { League } from '../../types/fpl-dashboard';

defineProps<{
  leagues: League[];
}>();
</script>
