import { useRuntimeConfig } from '#app';
import { ofetch } from 'ofetch';

export const useApi = () => {
  const config = useRuntimeConfig();

  const get = async <T>(path: string) => {
    const url = `${config.public.apiBase}${path}`;
    return ofetch<T>(url);
  };

  return { get };
};
