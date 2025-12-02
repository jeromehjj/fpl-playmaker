// web/composables/useAuth.ts
import { useApi } from './useApi';

export interface AuthUser {
  id: number;
  email: string;
  fplTeamId: string | null;
}

export function useAuth() {
  const user = useState<AuthUser | null>('auth-user', () => null);
  const loading = useState<boolean>('auth-loading', () => false);

  const { get, post } = useApi();

  const fetchUser = async () => {
    // Avoid overlapping requests, but allow re-fetch after login
    if (loading.value) return;

    loading.value = true;
    try {
      const me = await get<AuthUser>('/users/me');
      user.value = me;
    } catch (e) {
      // 401 or any error → treat as logged-out
      console.error('[useAuth] /users/me error:', e);
      user.value = null;
    } finally {
      loading.value = false;
    }
  };

  const logout = async () => {
    try {
      await post('/auth/logout');
    } catch (e) {
      console.error('Logout error', e);
    } finally {
      user.value = null;
    }
  };

  return {
    user,
    loading,
    fetchUser,
    logout,
  };
}
