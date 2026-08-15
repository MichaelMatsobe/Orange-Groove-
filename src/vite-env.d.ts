/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** Optional TURN relay URL (e.g. turn:host:3478) for cross-network parties */
  readonly VITE_TURN_URL?: string;
  readonly VITE_TURN_USERNAME?: string;
  readonly VITE_TURN_CREDENTIAL?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
