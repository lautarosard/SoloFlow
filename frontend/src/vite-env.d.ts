/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_DATA_SOURCE?: 'mock' | 'api';
  readonly VITE_MOCK_LATENCY?: string;
  readonly VITE_API_BASE_URL?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
