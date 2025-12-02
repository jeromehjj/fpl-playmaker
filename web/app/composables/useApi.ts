export const useApi = () => {
  const config = useRuntimeConfig();
  const baseURL = config.public.apiBaseUrl as string;
  const cleanParams = (params?: Record<string, any>) =>
    params
      ? Object.fromEntries(
          Object.entries(params).filter(
            ([, v]) => v !== undefined && v !== null && v !== '',
          ),
        )
      : undefined;

  const get = async <T>(path: string, params?: Record<string, any>): Promise<T> => {
    return $fetch<T>(path, {
      baseURL,
      credentials: 'include', // important: send cookies
      params: cleanParams(params) // Accept req params
    });
  };

  const post = async <T>(
    path: string,
    body?: BodyInit | Record<string, any> | null,
  ) => {
    return $fetch<T>(path, {
      method: 'POST',
      baseURL,
      body,
      credentials: 'include',
    });
  };

  const put = async <T>(
    path: string,
    body?: BodyInit | Record<string, any> | null,
  ) => {
    return $fetch<T>(path, {
      method: 'PUT',
      baseURL,
      body,
      credentials: 'include',
    });
  };

  return { get, post, put };
};
