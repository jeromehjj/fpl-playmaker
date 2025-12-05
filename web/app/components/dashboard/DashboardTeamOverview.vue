<template>
  <UCard>
    <template #header>
      <div class="flex items-center justify-between gap-2">
        <div>
          <h2 class="text-lg font-semibold">
            {{ team.teamName }}
          </h2>
          <p class="text-sm text-white">
            Manager: {{ team.managerName }} · Region:
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
</template>

<script setup lang="ts">
import type { TeamOverview } from '../../types/fpl-dashboard';

defineProps<{
  team: TeamOverview;
}>();
</script>
