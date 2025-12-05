<template>
  <main class="min-h-screen bg-gray-100 p-6">
    <section class="mx-auto space-y-6 lg:max-w-8xl">
      <header class="flex items-center justify-between">
        <div>
          <h1 class="text-2xl font-bold text-emerald-500">Fixture Ticker</h1>
          <p class="text-sm text-gray-600">
            Upcoming fixtures and difficulty by team
          </p>
        </div>
      </header>

      <FixturesTickerTable />
    </section>
  </main>
</template>