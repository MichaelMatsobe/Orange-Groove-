/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** Optional TURN relay URL (e.g. turn:host:3478) for cross-network parties */
  readonly VITE_TURN_URL?: string;
  readonly VITE_TURN_USERNAME?: string;
  readonly VITE_TURN_CREDENTIAL?: string;
  /** Optional backend base URL (see server/index.ts) — unset = offline mode */
  readonly VITE_API_URL?: string;
  /** Static site base path (GitHub Pages project sites need '/Orange-Groove-/') */
  readonly VITE_BASE?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
