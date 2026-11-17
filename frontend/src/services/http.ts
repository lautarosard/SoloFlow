import axios from 'axios';

export const http = axios.create({ baseURL: '/api' });

/** Extracts the backend's error message (`data.message`) from any thrown value. */
export function getErrorMessage(err: unknown, fallback: string): string {
  if (axios.isAxiosError<{ data?: { message?: string }; message?: string }>(err)) {
    return err.response?.data?.data?.message ?? err.response?.data?.message ?? fallback;
  }
  return fallback;
}
