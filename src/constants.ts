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

/** 6-digit private party code */
export function generatePartyCode(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

/** Isolated Trystero namespace for Wi-Fi / local-network rooms */
export const TRYSTERO_APP_ID = 'orange-groove-wifi-v6';
