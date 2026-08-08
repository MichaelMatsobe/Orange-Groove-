import { Song, SongRequest } from './types';

export const MOCK_LIBRARY: Song[] = [
  {
    id: '1',
    title: 'Midnight City',
    artist: 'M83',
    coverUrl: 'https://picsum.photos/seed/midnight/300/300',
    audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3',
    duration: 240
  },
  {
    id: '2',
    title: 'Get Lucky',
    artist: 'Daft Punk',
    coverUrl: 'https://picsum.photos/seed/daft/300/300',
    audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3',
    duration: 248
  },
  {
    id: '3',
    title: 'The Less I Know The Better',
    artist: 'Tame Impala',
    coverUrl: 'https://picsum.photos/seed/tame/300/300',
    audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3',
    duration: 216
  },
  {
    id: '4',
    title: 'Blinding Lights',
    artist: 'The Weeknd',
    coverUrl: 'https://picsum.photos/seed/weeknd/300/300',
    audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-4.mp3',
    duration: 200
  },
  {
    id: '5',
    title: 'Levitating',
    artist: 'Dua Lipa',
    coverUrl: 'https://picsum.photos/seed/dua/300/300',
    audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-5.mp3',
    duration: 203
  }
];

export const INITIAL_REQUESTS: SongRequest[] = [
  {
    id: '101',
    title: 'Bohemian Rhapsody',
    artist: 'Queen',
    requester: 'Guest',
    coverUrl: 'https://picsum.photos/seed/queen/300/300',
    status: 'pending',
    timestamp: Date.now() - 100000
  },
  {
    id: '102',
    title: 'Hotel California',
    artist: 'Eagles',
    requester: 'Host',
    coverUrl: 'https://picsum.photos/seed/eagles/300/300',
    status: 'approved',
    timestamp: Date.now() - 200000
  }
];
