<template>
  <div class="min-h-screen bg-slate-900 flex flex-col">
    <!-- Top nav -->
    <header class="bg-slate-800 shadow-sm">
      <nav
        class="mx-auto max-w-8xl px-4 sm:px-6 lg:px-8 py-3 flex items-center justify-between"
      >
        <div class="flex items-center gap-3">
          <NuxtLink to="/dashboard" class="text-lg font-semibold">
            FPL Playmaker
          </NuxtLink>
        </div>

        <div class="flex items-center gap-4 text-sm">
          <!-- When logged in -->
          <template v-if="user">
            <NuxtLink
              to="/players"
              class="hover:text-emerald-600">
              Players
            </NuxtLink>

            <NuxtLink
              to="/fixtureticker"
              class="hover:text-emerald-600">
              Fixture Ticker
            </NuxtLink>

            <NuxtLink
              to="/dashboard"
              class="hover:text-emerald-600"
            >
              Dashboard
            </NuxtLink>

            <NuxtLink
              to="/profile"
              class="hover:text-emerald-600"
            >
              Profile
            </NuxtLink>

            <span class="hidden sm:inline text-blue-300">
              {{ user.email }}
            </span>

            <button
              class="text-red-600 hover:underline"
              @click="handleLogout"
            >
              Log out
            </button>
          </template>

          <!-- When logged out -->
          <template v-else>
            <NuxtLink to="/" class="hover:text-blue-600">
              Login
            </NuxtLink>
            <NuxtLink to="/register" class="hover:text-blue-600">
              Register
            </NuxtLink>
          </template>
        </div>
      </nav>
    </header>

    <!-- Page content -->
    <main class="flex-1">
      <slot />
    </main>
  </div>
</template>

<script setup lang="ts">
import { useAuth } from '../composables/useAuth';
import { useRouter } from 'vue-router';

const router = useRouter();
const { user, logout } = useAuth();

const handleLogout = async () => {
  await logout();
  await router.push('/');
};
</script>
