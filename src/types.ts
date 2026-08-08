export type RequestStatus = 'pending' | 'approved' | 'rejected';

export interface Song {
  id: string;
  title: string;
  artist: string;
  coverUrl: string;
  audioUrl: string;
  duration: number;
}

export interface SongRequest {
  id: string;
  title: string;
  artist: string;
  requester: string;
  coverUrl: string;
  status: RequestStatus;
  timestamp: number;
}

export interface ConnectedDevice {
  peerId: string;
  joinedAt: number;
  label?: string;
}
