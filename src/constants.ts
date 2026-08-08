import { Song, SongRequest } from './types';

/** Free sample tracks (SoundHelix – open for demo use) */
export const DEFAULT_LIBRARY: Song[] = [
  {
    id: '1',
    title: 'Midnight Drive',
    artist: 'SoundHelix',
    coverUrl: 'https://picsum.photos/seed/midnight/300/300',
    audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3',
    duration: 372,
  },
  {
    id: '2',
    title: 'Electric Pulse',
    artist: 'SoundHelix',
    coverUrl: 'https://picsum.photos/seed/electric/300/300',
    audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3',
    duration: 421,
  },
  {
    id: '3',
    title: 'Neon Waves',
    artist: 'SoundHelix',
    coverUrl: 'https://picsum.photos/seed/neon/300/300',
    audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3',
    duration: 352,
  },
  {
    id: '4',
    title: 'Sunset Boulevard',
    artist: 'SoundHelix',
    coverUrl: 'https://picsum.photos/seed/sunset/300/300',
    audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-4.mp3',
    duration: 310,
  },
  {
    id: '5',
    title: 'City Lights',
    artist: 'SoundHelix',
    coverUrl: 'https://picsum.photos/seed/city/300/300',
    audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-5.mp3',
    duration: 348,
  },
  {
    id: '6',
    title: 'Deep Current',
    artist: 'SoundHelix',
    coverUrl: 'https://picsum.photos/seed/deep/300/300',
    audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-6.mp3',
    duration: 390,
  },
  {
    id: '7',
    title: 'Horizon Glow',
    artist: 'SoundHelix',
    coverUrl: 'https://picsum.photos/seed/horizon/300/300',
    audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-7.mp3',
    duration: 365,
  },
  {
    id: '8',
    title: 'Night Runner',
    artist: 'SoundHelix',
    coverUrl: 'https://picsum.photos/seed/runner/300/300',
    audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-8.mp3',
    duration: 401,
  },
];

export const INITIAL_REQUESTS: SongRequest[] = [];

/**
 * Secure-enough party code for local/nearby sharing.
 * 6 digits (~1M combinations) + unique appId in Trystero keeps rooms isolated.
 * Codes are short-lived (only while host is online) and never stored server-side by default.
 */
export function generatePartyCode(): string {
  // 6-digit numeric, avoids leading zeros looking odd by using 100000–999999
  return Math.floor(100000 + Math.random() * 900000).toString();
}

/** Unique Trystero app namespace — isolates Orange Groove rooms from other apps */
export const TRYSTERO_APP_ID = 'orange-groove-secure-v5';
