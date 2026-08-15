/**
 * Lightweight localStorage persistence so a host refresh doesn't kill the
 * party. Only the host session is persisted (guests re-join with the party
 * code, and the Trystero room is re-entered automatically on restore).
 *
 * Blob URLs and File objects cannot survive a reload, so local tracks are
 * restored as "pending/unavailable" entries while demo tracks keep playing.
 */
import { Song, SongRequest } from '../types';

export interface SavedSession {
  version: 1;
  role: 'host';
  partyCode: string;
  library: Song[];
  requests: SongRequest[];
  currentSongIndex: number;
  isPlaying: boolean;
  isLive: boolean;
  savedAt: number;
}

const KEY = 'orange-groove-session-v1';
const MAX_AGE_MS = 12 * 60 * 60 * 1000; // 12 hours

export function loadSession(): SavedSession | null {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return null;
    const data = JSON.parse(raw) as SavedSession;
    if (data.version !== 1 || data.role !== 'host' || !data.partyCode) return null;
    if (Date.now() - data.savedAt > MAX_AGE_MS) {
      localStorage.removeItem(KEY);
      return null;
    }
    return data;
  } catch {
    return null;
  }
}

export function saveSession(session: Omit<SavedSession, 'version' | 'savedAt'>): void {
  try {
    const data: SavedSession = { version: 1, ...session, savedAt: Date.now() };
    localStorage.setItem(KEY, JSON.stringify(data));
  } catch {
    /* storage full / unavailable */
  }
}

export function clearSession(): void {
  try {
    localStorage.removeItem(KEY);
  } catch {
    /* ignore */
  }
}

/** Strip blob: URLs so the session is JSON-safe; mark local tracks unavailable. */
export function sanitizeLibraryForStorage(library: Song[]): Song[] {
  return library.map((s) => {
    if (s.isLocal || s.audioUrl.startsWith('blob:')) {
      return { ...s, audioUrl: '', isLocal: true, streaming: true };
    }
    return { ...s, streaming: false };
  });
}
