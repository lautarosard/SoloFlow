/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly DATA_SOURCE?: 'mock' | 'api';
  readonly MOCK_LATENCY?: string;
  readonly API_BASE_URL?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
