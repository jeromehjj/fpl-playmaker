export const useApi = () => {
  const config = useRuntimeConfig();
  const baseURL = config.public.apiBaseUrl as string;

  const get = async <T>(path: string) => {
    return $fetch<T>(path, {
      baseURL,
      credentials: 'include', // important: send cookies
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
