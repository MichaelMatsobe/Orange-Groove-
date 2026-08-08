export type RequestStatus = 'pending' | 'approved' | 'rejected';

export interface Song {
  id: string;
  title: string;
  artist: string;
  coverUrl: string;
  audioUrl: string;
  duration: number;
  isLocal?: boolean; // true when host uploaded a local file
}

export interface SongRequest {
  id: string;
  title: string;
  artist: string;
  requester: string;
  coverUrl: string;
  status: RequestStatus;
  timestamp: number;
  songId?: string; // link back to library song when possible
}

export interface ConnectedDevice {
  peerId: string;
  joinedAt: number;
  label?: string;
}
