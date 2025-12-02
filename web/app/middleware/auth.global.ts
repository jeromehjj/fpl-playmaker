// web/middleware/auth.global.ts
import { useAuth } from '~/composables/useAuth';

export default defineNuxtRouteMiddleware(async (to, from) => {
  // Only run on client – SSR can't see browser cookies anyway
  if (import.meta.server) return;

  const { user, fetchUser } = useAuth();

  const publicPaths = ['/', '/register'];
  const isPublic = publicPaths.includes(to.path);

  // Always try to refresh user state on each navigation
  await fetchUser();

  // UX sugar: logged-in user hitting '/' or '/register' → go to dashboard
  if (isPublic && user.value && to.path === '/') {
    return navigateTo('/dashboard');
  }

  // We are NOT blocking protected routes here.
  // Backend JWT guards + page-level 401 handling (e.g. dashboard.vue) still protect things.
});
