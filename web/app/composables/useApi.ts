// web/composables/useApi.ts
export const useApi = () => {
  const config = useRuntimeConfig();

  const baseURL = config.public.apiBaseUrl as string;

  const isClient = typeof window !== 'undefined';

  const withAuthHeader = (auth?: boolean): HeadersInit | undefined => {
    if (!auth) return undefined;
    if (!isClient) return undefined;

    const token = window.localStorage.getItem('auth_token');
    if (!token) return undefined;

    const headers: Record<string, string> = {
      Authorization: `Bearer ${token}`,
    };

    return headers;
  };

  const get = async <T>(path: string, opts: { auth?: boolean } = {}) => {
    return $fetch<T>(path, {
      baseURL,
      headers: withAuthHeader(opts.auth),
    });
  };

  const post = async <T>(
    path: string,
    body?: BodyInit | Record<string, any> | null,
    opts: { auth?: boolean } = {},
  ) => {
    return $fetch<T>(path, {
      method: 'POST',
      baseURL,
      body,
      headers: withAuthHeader(opts.auth),
    });
  };

  const put = async <T>(
    path: string,
    body?: BodyInit | Record<string, any> | null,
    opts: { auth?: boolean } = {},
  ) => {
    return $fetch<T>(path, {
      method: 'PUT',
      baseURL,
      body,
      headers: withAuthHeader(opts.auth),
    });
  };

  return { get, post, put };
};
