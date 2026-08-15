/**
 * Best-effort REST client for the optional Orange Groove presence backend
 * (server/index.ts).
 *
 * The Trystero/WebRTC room is the source of truth and works fully offline
 * (same Wi‑Fi / hotspot) — this API only adds optional conveniences when the
 * backend is deployed: party existence checks, host presence, and a registry
 * that survives host refreshes. Every call degrades gracefully when the
 * server is unreachable.
 */

export interface PartyState {
  isLive: boolean;
  currentSongIndex: number;
  deviceCount: number;
}

export interface PartyInfo {
  code: string;
  isLive: boolean;
  currentSongIndex: number;
  deviceCount: number;
  /** Whether a host has heartbeated within the last minute */
  hostOnline: boolean;
  createdAt: number;
}

export type ApiResult<T> =
  | { ok: true; data: T }
  /** Server responded with an HTTP error (e.g. 404 = party missing) */
  | { ok: false; status: number }
  /** Server unreachable — caller should fall back to offline behavior */
  | { ok: false; status: null };

/** Point at a deployed backend with VITE_API_URL (e.g. https://api.example.com). */
let apiBaseOverride: string | null = null;

export function apiBase(): string {
  return apiBaseOverride ?? (import.meta.env.VITE_API_URL ?? '').replace(/\/+$/, '');
}

/** @internal test hook — lets unit tests pin the base URL. */
export function __setApiBase(base: string | null): void {
  apiBaseOverride = base;
}

async function request<T>(path: string, init?: RequestInit): Promise<ApiResult<T>> {
  const base = apiBase();
  if (!base) {
    // No backend configured — treat as unreachable without wasting a fetch.
    return { ok: false, status: null };
  }
  try {
    const res = await fetch(`${base}${path}`, {
      headers: { 'Content-Type': 'application/json' },
      ...init,
    });
    if (!res.ok) return { ok: false, status: res.status };
    return { ok: true, data: (await res.json()) as T };
  } catch {
    return { ok: false, status: null };
  }
}

/** Host creates or re-claims its party after a refresh. */
export function claimParty(code: string): Promise<ApiResult<PartyInfo>> {
  return request<PartyInfo>(`/api/parties/${encodeURIComponent(code)}/claim`, {
    method: 'POST',
  });
}

/** Look up a party (guest validation / presence). */
export function getParty(code: string): Promise<ApiResult<PartyInfo>> {
  return request<PartyInfo>(`/api/parties/${encodeURIComponent(code)}`);
}

/** Host presence beacon so the registry knows the party is alive. */
export function heartbeat(
  code: string,
  state: PartyState
): Promise<ApiResult<PartyInfo>> {
  return request<PartyInfo>(`/api/parties/${encodeURIComponent(code)}/heartbeat`, {
    method: 'POST',
    body: JSON.stringify(state),
  });
}

/** Host ended the party — remove it from the registry. */
export function endParty(code: string): Promise<ApiResult<{ ok: true }>> {
  return request<{ ok: true }>(`/api/parties/${encodeURIComponent(code)}`, {
    method: 'DELETE',
  });
}
