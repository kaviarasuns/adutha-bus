/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** Where problem reports are posted: the deployed `worker/report-worker.ts`. */
  readonly VITE_REPORT_URL?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
